import cors from "cors";
import express, { Request, Response } from "express";
import { error, ok } from "../../common/http";
import { RestaurantTable } from "../../common/types";

const app = express();
const PORT = Number(process.env.TABLE_PORT) || 4003;

const tables: RestaurantTable[] = [
  {
    id: 1,
    restaurant_id: 1,
    table_number: 1,
    capacity: 2,
    location_description: "у окна",
    is_active: true
  },
  {
    id: 2,
    restaurant_id: 1,
    table_number: 2,
    capacity: 4,
    location_description: "в центре зала",
    is_active: true
  },
  {
    id: 3,
    restaurant_id: 2,
    table_number: 1,
    capacity: 4,
    location_description: "у барной стойки",
    is_active: true
  }
];

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => ok(res, { service: "tables", status: "ok" }));

app.get("/restaurants/:restaurantId/tables", (req: Request, res: Response) => {
  return ok(
    res,
    tables.filter((table) => table.restaurant_id === Number(req.params.restaurantId))
  );
});

app.get("/internal/restaurants/:restaurantId/tables/:tableId", (req: Request, res: Response) => {
  const table = tables.find(
    (item) =>
      item.restaurant_id === Number(req.params.restaurantId) &&
      item.id === Number(req.params.tableId) &&
      item.is_active
  );

  if (!table) {
    return error(res, 404, "Столик не найден");
  }

  return ok(res, table);
});

app.listen(PORT, () => console.log(`Table Service started on http://localhost:${PORT}`));
