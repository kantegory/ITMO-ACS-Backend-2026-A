import express from "express";
import { RestaurantDataSource } from "./dataSource";
import { Restaurant } from "./entity/Restaurant";
import { Table } from "./entity/Table";
import { requireInternalToken } from "../lib/internalAuth";

export function createRestaurantApp() {
  const app = express();
  app.use(express.json());

  app.get("/restaurants", async (_req, res) => {
    try {
      const repo = RestaurantDataSource.getRepository(Restaurant);
      const items = await repo.find({ order: { name: "ASC" } });
      return res.status(200).json({ items });
    } catch {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  });

  app.get("/restaurants/:id", async (req, res) => {
    try {
      const repo = RestaurantDataSource.getRepository(Restaurant);
      const r = await repo.findOne({ where: { id: req.params.id }, relations: ["tables"] });
      if (!r) {
        return res.status(404).json({ error: { code: "not_found", message: "ресторан не найден" } });
      }
      return res.status(200).json(r);
    } catch {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  });

  app.get("/internal/tables/:tableId", requireInternalToken, async (req, res) => {
    try {
      const restaurantId = req.query.restaurant_id as string | undefined;
      if (!restaurantId) {
        return res.status(400).json({
          error: { code: "bad_request", message: "параметр restaurant_id обязателен" },
        });
      }
      const tableRepo = RestaurantDataSource.getRepository(Table);
      const table = await tableRepo.findOne({
        where: { id: req.params.tableId, restaurant_id: restaurantId },
        relations: ["restaurant"],
      });
      if (!table) {
        return res.status(404).json({ error: { code: "not_found", message: "столик не найден" } });
      }
      return res.status(200).json({
        id: table.id,
        restaurant_id: table.restaurant_id,
        table_number: table.table_number,
        capacity: table.capacity,
      });
    } catch {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  });

  return app;
}
