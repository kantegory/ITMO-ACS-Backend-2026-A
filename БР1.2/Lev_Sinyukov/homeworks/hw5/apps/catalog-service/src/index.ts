import dotenv from "dotenv";
import express from "express";
import {
  buildHealth,
  connectRabbit,
  registerRpcHandler,
  Restaurant,
  RestaurantSearchRequest,
  RestaurantSearchResponse,
  TableValidationRequest,
  TableValidationResponse,
} from "@hw5/shared";

dotenv.config();

type RestaurantTable = {
  id: number;
  seats_count: number;
  is_active: boolean;
};

const restaurants: Array<Restaurant & { tables: RestaurantTable[] }> = [
  {
    id: 1,
    name: "Pasta House",
    city: "Saint Petersburg",
    cuisines: ["Italian"],
    price_range: 2,
    is_active: true,
    tables: [
      { id: 11, seats_count: 4, is_active: true },
      { id: 12, seats_count: 2, is_active: true },
    ],
  },
  {
    id: 2,
    name: "Tokyo Roll",
    city: "Moscow",
    cuisines: ["Japanese"],
    price_range: 3,
    is_active: true,
    tables: [
      { id: 21, seats_count: 4, is_active: true },
      { id: 22, seats_count: 8, is_active: true },
    ],
  },
  {
    id: 3,
    name: "BBQ Yard",
    city: "Kazan",
    cuisines: ["American"],
    price_range: 2,
    is_active: false,
    tables: [
      { id: 31, seats_count: 6, is_active: false },
    ],
  },
];

async function bootstrap() {
  const app = express();
  app.use(express.json());

  const port = Number(process.env.PORT ?? 8082);
  const serviceName = process.env.SERVICE_NAME ?? "catalog-service";
  const { connection, channel } = await connectRabbit(serviceName);

  await registerRpcHandler<RestaurantSearchRequest, RestaurantSearchResponse>(
    channel,
    "catalog.restaurants.search.queue",
    "catalog.restaurants.search.request",
    async ({ name, cuisine, city, min_price_range, max_price_range }: RestaurantSearchRequest) => {
      const filtered = restaurants.filter((restaurant) => {
        if (name && !restaurant.name.toLowerCase().includes(name.trim().toLowerCase())) {
          return false;
        }
        if (cuisine && !restaurant.cuisines.some((item: string) => item.toLowerCase() === cuisine.trim().toLowerCase())) {
          return false;
        }
        if (city && restaurant.city.toLowerCase() !== city.trim().toLowerCase()) {
          return false;
        }
        if (min_price_range !== undefined && restaurant.price_range < Number(min_price_range)) {
          return false;
        }
        if (max_price_range !== undefined && restaurant.price_range > Number(max_price_range)) {
          return false;
        }
        return true;
      }).map(({ tables, ...restaurant }) => restaurant);

      return {
        ok: true,
        items: filtered,
        pagination: {
          page: 1,
          limit: filtered.length || 20,
          total: filtered.length,
        },
      };
    },
  );

  await registerRpcHandler<TableValidationRequest, TableValidationResponse>(
    channel,
    "catalog.table.validate.queue",
    "catalog.table.validate.request",
    async ({ restaurant_id, table_id }: TableValidationRequest) => {
      const restaurant = restaurants.find((item) => item.id === Number(restaurant_id));
      const table = restaurant?.tables.find((item: RestaurantTable) => item.id === Number(table_id));

      return {
        ok: true,
        exists: Boolean(table && restaurant),
        is_active: Boolean(restaurant?.is_active && table?.is_active),
        seats_count: table?.seats_count ?? 0,
      };
    },
  );

  app.get("/health", (_req, res) => {
    res.json(buildHealth(serviceName));
  });

  process.on("SIGINT", async () => {
    await connection.close();
    process.exit(0);
  });

  app.listen(port, () => {
    console.log(`[${serviceName}] listening on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("[catalog-service] failed to start", error);
  process.exit(1);
});
