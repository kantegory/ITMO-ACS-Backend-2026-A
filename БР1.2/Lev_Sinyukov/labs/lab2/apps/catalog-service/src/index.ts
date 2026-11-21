import express from "express";
import dotenv from "dotenv";
import { buildHealth } from "@app/shared";
import { AppDataSource } from "./data-source";

dotenv.config();

const app = express();
app.use(express.json());

const port = Number(process.env.PORT ?? 8082);
const serviceName = process.env.SERVICE_NAME ?? "catalog-service";

type CatalogRestaurant = {
  id: number;
  name: string;
  city: string;
  cuisines: string[];
  price_range: number;
  is_active: boolean;
};

const restaurants: CatalogRestaurant[] = [
  { id: 1, name: "Pasta House", city: "Saint Petersburg", cuisines: ["Italian"], price_range: 2, is_active: true },
  { id: 2, name: "Tokyo Roll", city: "Moscow", cuisines: ["Japanese"], price_range: 3, is_active: true },
  { id: 3, name: "BBQ Yard", city: "Kazan", cuisines: ["American"], price_range: 2, is_active: false },
];

app.get("/health", (_req, res) => {
  res.json(buildHealth(serviceName));
});

app.get("/internal/restaurants", (req, res) => {
  const name = (req.query.name as string | undefined)?.trim().toLowerCase();
  const cuisine = (req.query.cuisine as string | undefined)?.trim().toLowerCase();
  const city = (req.query.city as string | undefined)?.trim().toLowerCase();
  const minPrice = req.query.min_price_range ? Number(req.query.min_price_range) : undefined;
  const maxPrice = req.query.max_price_range ? Number(req.query.max_price_range) : undefined;

  const filtered = restaurants.filter((restaurant) => {
    if (name && !restaurant.name.toLowerCase().includes(name)) return false;
    if (cuisine && !restaurant.cuisines.some((item) => item.toLowerCase() === cuisine)) return false;
    if (city && restaurant.city.toLowerCase() !== city) return false;
    if (minPrice !== undefined && restaurant.price_range < minPrice) return false;
    if (maxPrice !== undefined && restaurant.price_range > maxPrice) return false;
    return true;
  });

  return res.json({
    items: filtered,
    pagination: {
      page: 1,
      limit: filtered.length || 20,
      total: filtered.length,
    },
  });
});

app.get("/internal/restaurants/:restaurantId/exists", (req, res) => {
  const restaurantId = Number(req.params.restaurantId);
  const exists = Number.isInteger(restaurantId) && restaurantId > 0;

  res.json({
    exists,
    is_active: exists,
  });
});

app.get("/internal/restaurants/:restaurantId/tables/:tableId/exists", (req, res) => {
  const restaurantId = Number(req.params.restaurantId);
  const tableId = Number(req.params.tableId);
  const exists = Number.isInteger(restaurantId) && restaurantId > 0 && Number.isInteger(tableId) && tableId > 0;

  res.json({
    exists,
    is_active: exists,
    seats_count: exists ? 4 : 0,
  });
});

app.listen(port, async () => {
  try {
    await AppDataSource.initialize();
    console.log(`[${serviceName}] DB connection initialized`);
  } catch (error) {
    console.warn(`[${serviceName}] DB connection skipped:`, error);
  }

  console.log(`[${serviceName}] listening on port ${port}`);
});