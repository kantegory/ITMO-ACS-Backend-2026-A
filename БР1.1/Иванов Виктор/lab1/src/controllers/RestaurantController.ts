import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Restaurant } from "../entities/Restaurant";
import { Table } from "../entities/Table";
import { Booking } from "../entities/Booking";

type SortKey = "rating_desc" | "rating_asc" | "name_asc" | "name_desc" | "price_asc" | "price_desc";

const SORT_MAP: Record<SortKey, [string, "ASC" | "DESC"]> = {
  rating_desc: ["restaurant.rating", "DESC"],
  rating_asc: ["restaurant.rating", "ASC"],
  name_asc: ["restaurant.name", "ASC"],
  name_desc: ["restaurant.name", "DESC"],
  price_asc: ["restaurant.price_range", "ASC"],
  price_desc: ["restaurant.price_range", "DESC"],
};

export class RestaurantController {
  static async list(req: Request, res: Response): Promise<Response> {
    try {
      const {
        search,
        cuisine_type,
        price_range,
        min_rating,
        page = "1",
        page_size = "20",
        sort = "rating_desc",
      } = req.query as Record<string, string>;

      const restaurantRepo = AppDataSource.getRepository(Restaurant);
      let query = restaurantRepo.createQueryBuilder("restaurant");

      if (search) {
        query = query.andWhere("restaurant.name LIKE :search", { search: `%${search}%` });
      }
      if (cuisine_type) {
        query = query.andWhere("restaurant.cuisine_type = :cuisine_type", { cuisine_type });
      }
      if (price_range) {
        query = query.andWhere("restaurant.price_range = :price_range", {
          price_range: Number(price_range),
        });
      }
      if (min_rating) {
        query = query.andWhere("restaurant.rating >= :min_rating", {
          min_rating: Number(min_rating),
        });
      }

      const [orderBy, orderDir] = SORT_MAP[sort as SortKey] || SORT_MAP.rating_desc;
      query = query.orderBy(orderBy, orderDir);

      const pageNum = Math.max(1, Number(page));
      const pageSizeNum = Math.min(100, Math.max(1, Number(page_size)));

      const total = await query.getCount();
      const items = await query
        .skip((pageNum - 1) * pageSizeNum)
        .take(pageSizeNum)
        .getMany();

      return res.status(200).json({
        items,
        pagination: {
          page: pageNum,
          page_size: pageSizeNum,
          total_items: total,
          total_pages: Math.ceil(total / pageSizeNum),
        },
      });
    } catch (error) {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { restaurantId } = req.params;
      const restaurantRepo = AppDataSource.getRepository(Restaurant);

      const restaurant = await restaurantRepo.findOne({
        where: { id: restaurantId },
        relations: ["reviews", "tables"],
      });

      if (!restaurant) {
        return res.status(404).json({ error: { code: "not_found", message: "ресторан не найден" } });
      }

      const { reviews, tables, ...restaurantBase } = restaurant;

      return res.status(200).json({
        ...restaurantBase,
        reviews_count: reviews?.length || 0,
        photos_count: 0,
        menu_items_count: 0,
      });
    } catch (error) {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  }

  static async getTables(req: Request, res: Response): Promise<Response> {
    try {
      const { restaurantId } = req.params;
      const restaurantRepo = AppDataSource.getRepository(Restaurant);
      const restaurant = await restaurantRepo.findOneBy({ id: restaurantId });

      if (!restaurant) {
        return res.status(404).json({ error: { code: "not_found", message: "ресторан не найден" } });
      }

      const tableRepo = AppDataSource.getRepository(Table);
      const tables = await tableRepo.findBy({ restaurant_id: restaurantId });

      return res.status(200).json({ items: tables });
    } catch (error) {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  }

  static async checkAvailability(req: Request, res: Response): Promise<Response> {
    try {
      const { restaurantId } = req.params;
      const { date, time, guests } = req.query as Record<string, string>;

      if (!date || !time || !guests) {
        return res.status(400).json({
          error: { code: "bad_request", message: "дата, время и количество гостей обязательны" },
        });
      }

      const restaurantRepo = AppDataSource.getRepository(Restaurant);
      const restaurant = await restaurantRepo.findOneBy({ id: restaurantId });

      if (!restaurant) {
        return res.status(404).json({ error: { code: "not_found", message: "ресторан не найден" } });
      }

      const tableRepo = AppDataSource.getRepository(Table);
      const bookingRepo = AppDataSource.getRepository(Booking);

      const allTables = await tableRepo
        .createQueryBuilder("table")
        .where("table.restaurant_id = :restaurantId", { restaurantId })
        .andWhere("table.capacity >= :guests", { guests: Number(guests) })
        .getMany();

      const bookedBookings = await bookingRepo
        .createQueryBuilder("booking")
        .where("booking.restaurant_id = :restaurantId", { restaurantId })
        .andWhere("booking.booking_date = :date", { date })
        .andWhere("booking.booking_time = :time", { time })
        .andWhere("booking.status != :cancelled", { cancelled: "cancelled" })
        .getMany();

      const bookedTableIds = new Set(bookedBookings.map((b) => b.table_id));
      const availableTables = allTables.filter((t) => !bookedTableIds.has(t.id));

      return res.status(200).json({
        available: availableTables.length > 0,
        tables: availableTables,
      });
    } catch (error) {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  }
}
