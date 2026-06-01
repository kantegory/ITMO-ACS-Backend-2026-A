import { Response } from "express";
import { AppDataSource } from "../data-source";
import { Booking, BookingStatus } from "../entities/Booking";
import { Restaurant } from "../entities/Restaurant";
import { Table } from "../entities/Table";
import { AuthRequest } from "../middleware/authMiddleware";

export class BookingController {
  static async list(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { status, page = "1", page_size = "20" } = req.query as Record<string, string>;

      const bookingRepo = AppDataSource.getRepository(Booking);
      let query = bookingRepo
        .createQueryBuilder("booking")
        .leftJoinAndSelect("booking.restaurant", "restaurant")
        .leftJoinAndSelect("booking.table", "table")
        .where("booking.user_id = :userId", { userId: req.user!.id });

      if (status) {
        query = query.andWhere("booking.status = :status", { status });
      }

      const pageNum = Math.max(1, Number(page));
      const pageSizeNum = Math.min(100, Math.max(1, Number(page_size)));

      const total = await query.getCount();
      const items = await query
        .skip((pageNum - 1) * pageSizeNum)
        .take(pageSizeNum)
        .orderBy("booking.created_at", "DESC")
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

  static async create(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { restaurant_id, table_id, booking_date, booking_time, guests_count } = req.body;

      if (!restaurant_id || !table_id || !booking_date || !booking_time || !guests_count) {
        return res.status(400).json({
          error: { code: "bad_request", message: "все поля обязательны" },
        });
      }

      const restaurantRepo = AppDataSource.getRepository(Restaurant);
      const restaurant = await restaurantRepo.findOneBy({ id: restaurant_id });

      if (!restaurant) {
        return res.status(404).json({ error: { code: "not_found", message: "ресторан не найден" } });
      }

      const tableRepo = AppDataSource.getRepository(Table);
      const table = await tableRepo.findOne({
        where: { id: table_id, restaurant_id },
      });

      if (!table) {
        return res.status(404).json({ error: { code: "not_found", message: "столик не найден" } });
      }

      const bookingRepo = AppDataSource.getRepository(Booking);
      const conflicting = await bookingRepo.findOne({
        where: {
          table_id,
          booking_date,
          booking_time,
        },
      });

      if (conflicting && conflicting.status !== BookingStatus.CANCELLED) {
        return res.status(409).json({
          error: {
            code: "table_not_available",
            message: `столик №${table.table_number} недоступен на ${booking_date} в ${booking_time}`,
          },
        });
      }

      const booking = bookingRepo.create({
        user_id: req.user!.id,
        restaurant_id,
        table_id,
        booking_date,
        booking_time,
        guests_count: Number(guests_count),
        status: BookingStatus.CONFIRMED,
      });

      await bookingRepo.save(booking);

      const saved = await bookingRepo.findOne({
        where: { id: booking.id },
        relations: ["restaurant", "table"],
      });

      return res.status(201).json(saved);
    } catch (error) {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  }

  static async getById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { bookingId } = req.params;
      const bookingRepo = AppDataSource.getRepository(Booking);

      const booking = await bookingRepo.findOne({
        where: { id: bookingId },
        relations: ["restaurant", "table"],
      });

      if (!booking) {
        return res.status(404).json({ error: { code: "not_found", message: "бронирование не найдено" } });
      }

      if (booking.user_id !== req.user!.id) {
        return res.status(403).json({
          error: { code: "forbidden", message: "нет доступа к этому бронированию" },
        });
      }

      return res.status(200).json(booking);
    } catch (error) {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  }

  static async cancel(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { bookingId } = req.params;
      const bookingRepo = AppDataSource.getRepository(Booking);

      const booking = await bookingRepo.findOneBy({ id: bookingId });

      if (!booking) {
        return res.status(404).json({ error: { code: "not_found", message: "бронирование не найдено" } });
      }

      if (booking.user_id !== req.user!.id) {
        return res.status(403).json({
          error: { code: "forbidden", message: "нет доступа к этому бронированию" },
        });
      }

      if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
        return res.status(409).json({
          error: {
            code: "cannot_cancel_booking",
            message: `нельзя отменить бронирование со статусом '${booking.status}'`,
          },
        });
      }

      booking.status = BookingStatus.CANCELLED;
      await bookingRepo.save(booking);

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  }
}
