import express from "express";
import { Response } from "express";
import { BookingDataSource } from "./dataSource";
import { Booking, BookingStatus } from "./entity/Booking";
import { authMiddleware, AuthRequest } from "../lib/authMiddleware";
import { fetchTableInternal, fetchUserInternal } from "./serviceClients";
import { publishBookingCreated } from "./amqpPublish";

export function createBookingApp() {
  const app = express();
  app.use(express.json());

  app.get("/bookings", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { status, page = "1", page_size = "20" } = req.query as Record<string, string>;
      const bookingRepo = BookingDataSource.getRepository(Booking);
      let qb = bookingRepo.createQueryBuilder("b").where("b.user_id = :userId", { userId: req.user!.id });
      if (status) {
        qb = qb.andWhere("b.status = :status", { status });
      }
      const pageNum = Math.max(1, Number(page));
      const pageSizeNum = Math.min(100, Math.max(1, Number(page_size)));
      const total = await qb.getCount();
      const items = await qb
        .orderBy("b.created_at", "DESC")
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
    } catch {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  });

  app.post("/bookings", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { restaurant_id, table_id, booking_date, booking_time, guests_count } = req.body;

      if (!restaurant_id || !table_id || !booking_date || !booking_time || !guests_count) {
        return res.status(400).json({
          error: { code: "bad_request", message: "все поля обязательны" },
        });
      }

      const userCheck = await fetchUserInternal(req.user!.id);
      if (!userCheck.ok) {
        if (userCheck.status === 404) {
          return res.status(404).json({ error: { code: "not_found", message: "пользователь не найден" } });
        }
        return res.status(502).json({
          error: { code: "upstream_error", message: "сервис пользователей недоступен" },
        });
      }

      const tableCheck = await fetchTableInternal(table_id, restaurant_id);
      if (!tableCheck.ok) {
        if (tableCheck.status === 404) {
          return res.status(404).json({ error: { code: "not_found", message: "столик не найден" } });
        }
        return res.status(502).json({
          error: { code: "upstream_error", message: "сервис ресторанов недоступен" },
        });
      }

      const capacity = Number((tableCheck.body as { capacity?: number }).capacity);
      const guests = Number(guests_count);
      if (Number.isFinite(capacity) && guests > capacity) {
        return res.status(422).json({
          error: {
            code: "validation_error",
            message: `число гостей (${guests}) превышает вместимость столика (${capacity})`,
          },
        });
      }

      const bookingRepo = BookingDataSource.getRepository(Booking);
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
            message: `столик недоступен на ${booking_date} в ${booking_time}`,
          },
        });
      }

      const booking = bookingRepo.create({
        user_id: req.user!.id,
        restaurant_id,
        table_id,
        booking_date,
        booking_time,
        guests_count: guests,
        status: BookingStatus.CONFIRMED,
      });
      await bookingRepo.save(booking);

      await publishBookingCreated({
        event: "booking.created",
        booking_id: booking.id,
        user_id: booking.user_id,
        restaurant_id: booking.restaurant_id,
        table_id: booking.table_id,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        guests_count: booking.guests_count,
        status: booking.status,
        created_at: booking.created_at.toISOString(),
      });

      return res.status(201).json(booking);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  });

  app.get("/bookings/:bookingId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const bookingRepo = BookingDataSource.getRepository(Booking);
      const booking = await bookingRepo.findOneBy({ id: req.params.bookingId });
      if (!booking) {
        return res.status(404).json({ error: { code: "not_found", message: "бронирование не найдено" } });
      }
      if (booking.user_id !== req.user!.id) {
        return res.status(403).json({
          error: { code: "forbidden", message: "нет доступа к этому бронированию" },
        });
      }
      return res.status(200).json(booking);
    } catch {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  });

  app.delete("/bookings/:bookingId", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const bookingRepo = BookingDataSource.getRepository(Booking);
      const booking = await bookingRepo.findOneBy({ id: req.params.bookingId });
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
    } catch {
      return res.status(500).json({ error: { code: "server_error", message: "внутренняя ошибка сервера" } });
    }
  });

  return app;
}
