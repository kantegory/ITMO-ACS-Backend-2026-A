import { Router } from "express";
import { In } from "typeorm";
import { asyncHandler } from "../shared/async-handler";
import { requireAuth } from "../shared/auth";
import { serviceUrl } from "../shared/config";
import { internalRequest } from "../shared/http";
import { badRequest, conflict, forbidden, notFound, ValidationErrorDetail } from "../shared/errors";
import { asPositiveInt, asString, ensureValid, isDate, isTime, normalizeTime } from "../shared/validation";
import { getPagination, paginate } from "../shared/pagination";
import { AppDataSource } from "./data-source";
import { Reservation, ReservationStatus } from "./entities/Reservation";

type BookingContext = {
  restaurantId: number; restaurantName: string; openingTime: string; closingTime: string;
  tables: { tableId: number; tableNumber: string; capacity: number }[];
};
const repository = () => AppDataSource.getRepository(Reservation);
const toResponse = (reservation: Reservation) => ({ ...reservation, createdAt: reservation.createdAt.toISOString() });
const ownReservation = async (id: unknown, userId: number) => {
  const reservationId = asPositiveInt(id);
  if (!reservationId) throw badRequest("Некорректный идентификатор бронирования.");
  const reservation = await repository().findOneBy({ reservationId });
  if (!reservation) throw notFound("Бронирование не найдено.");
  if (reservation.userId !== userId) throw forbidden("Нельзя просматривать или изменять чужое бронирование.");
  return reservation;
};

export const reservationsRouter = Router();
reservationsRouter.use(requireAuth);
reservationsRouter.get("/me", asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req.query);
  const status = asString(req.query.status) as ReservationStatus | undefined;
  if (status && !["pending", "confirmed", "cancelled", "completed"].includes(status)) throw badRequest("Некорректный статус бронирования.");
  const items = await repository().find({ where: { userId: req.user!.userId, ...(status ? { status } : {}) }, order: { createdAt: "DESC", reservationId: "DESC" } });
  res.json(paginate(items.map(toResponse), page, limit));
}));

reservationsRouter.post("/", asyncHandler(async (req, res) => {
  const details: ValidationErrorDetail[] = [];
  const restaurantId = asPositiveInt(req.body.restaurantId);
  const reservationDate = asString(req.body.reservationDate);
  const startRaw = asString(req.body.startTime);
  const endRaw = asString(req.body.endTime);
  const guestsCount = asPositiveInt(req.body.guestsCount);
  if (!restaurantId) details.push({ field: "restaurantId", message: "Идентификатор ресторана обязателен." });
  if (!reservationDate || !isDate(reservationDate)) details.push({ field: "reservationDate", message: "Ожидается существующая дата YYYY-MM-DD." });
  if (!startRaw || !isTime(startRaw)) details.push({ field: "startTime", message: "Ожидается время HH:mm:ss." });
  if (!endRaw || !isTime(endRaw)) details.push({ field: "endTime", message: "Ожидается время HH:mm:ss." });
  if (!guestsCount) details.push({ field: "guestsCount", message: "Количество гостей должно быть положительным целым числом." });
  const startTime = startRaw ? normalizeTime(startRaw) : "";
  const endTime = endRaw ? normalizeTime(endRaw) : "";
  if (startTime && endTime && endTime <= startTime) details.push({ field: "endTime", message: "Конец должен быть позже начала в пределах одного дня." });
  ensureValid(details);

  const context = await internalRequest<BookingContext>(`${serviceUrl("CATALOG")}/internal/restaurants/${restaurantId}/booking-context`);
  for (const table of context.tables.filter(table => table.capacity >= guestsCount!)) {
    try {
      const reservation = await repository().save(repository().create({
        userId: req.user!.userId, restaurantId: context.restaurantId, restaurantName: context.restaurantName,
        tableId: table.tableId, tableNumber: table.tableNumber, reservationDate: reservationDate!,
        startTime, endTime, guestsCount: guestsCount!, status: "confirmed",
      }), { transaction: false });
      res.status(201).json(toResponse(reservation));
      return;
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("BOOKING_OVERLAP")) throw error;
    }
  }
  throw conflict("Столик недоступен на выбранное время.");
}));

reservationsRouter.get("/:reservationId", asyncHandler(async (req, res) => {
  res.json(toResponse(await ownReservation(req.params.reservationId, req.user!.userId)));
}));

reservationsRouter.patch("/:reservationId/cancel", asyncHandler(async (req, res) => {
  const reason = asString(req.body.reason);
  if (reason && reason.length > 500) throw badRequest("Причина отмены не должна быть длиннее 500 символов.");
  const reservation = await ownReservation(req.params.reservationId, req.user!.userId);
  const result = await repository().update({ reservationId: reservation.reservationId, userId: req.user!.userId,
    status: In(["pending", "confirmed"]) }, { status: "cancelled" });
  if (!result.affected) throw conflict("Бронирование уже отменено или завершено.");
  res.json(toResponse({ ...reservation, status: "cancelled" }));
}));
