import cors from "cors";
import express, { Request, Response } from "express";
import { error, ok } from "../../common/http";

const app = express();
const PORT = Number(process.env.PORT) || 4003;

const tables = [
  { id: 1, restaurant_id: 1, table_number: 1, capacity: 2, location_description: "у окна", is_active: true },
  { id: 2, restaurant_id: 1, table_number: 2, capacity: 4, location_description: "в центре зала", is_active: true },
  { id: 3, restaurant_id: 2, table_number: 1, capacity: 4, location_description: "у барной стойки", is_active: true }
];

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => ok(res, { service: "tables", status: "ok" }));

app.get("/restaurants/:restaurantId/tables", (req: Request, res: Response) => {
  return ok(res, tables.filter((item) => item.restaurant_id === Number(req.params.restaurantId)));
});

app.get("/internal/restaurants/:restaurantId/tables/:tableId", (req: Request, res: Response) => {
  const table = tables.find(
    (item) =>
      item.id === Number(req.params.tableId) &&
      item.restaurant_id === Number(req.params.restaurantId) &&
      item.is_active
  );

  return table ? ok(res, table) : error(res, 404, "Столик не найден");
});

app.listen(PORT, () => console.log(`Table Service started on ${PORT}`));
