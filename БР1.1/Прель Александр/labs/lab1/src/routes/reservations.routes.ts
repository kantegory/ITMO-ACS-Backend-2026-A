import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Reservation, ReservationStatus, Restaurant, RestaurantTable } from "../entities";
import { badRequest, conflict, forbidden, notFound, ValidationErrorDetail } from "../errors";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/async-handler";
import { getPagination, paginate } from "../utils/pagination";
import { toReservationResponse } from "../utils/serializers";
import { asPositiveInt, asString, ensureValid, isDate, isTime, normalizeTime } from "../utils/validation";

export const reservationsRouter = Router();

reservationsRouter.use(requireAuth);

const reservationRelations = {
  user: true,
  table: {
    restaurant: true,
  },
} as const;

const findReservationForCurrentUser = async (reservationId: number, userId: number) => {
  const reservation = await AppDataSource.getRepository(Reservation).findOne({
    where: { reservationId },
    relations: reservationRelations,
  });

  if (!reservation) {
    throw notFound("Бронирование не найдено.");
  }

  if (reservation.user.userId !== userId) {
    throw forbidden("Нельзя просматривать или изменять чужое бронирование.");
  }

  return reservation;
};

const hasConflict = async (
  table: RestaurantTable,
  reservationDate: string,
  startTime: string,
  endTime: string,
) => {
  const count = await AppDataSource.getRepository(Reservation)
    .createQueryBuilder("reservation")
    .innerJoin("reservation.table", "table")
    .where("table.table_id = :tableId", { tableId: table.tableId })
    .andWhere("reservation.reservation_date = :reservationDate", { reservationDate })
    .andWhere("reservation.status IN (:...statuses)", { statuses: ["pending", "confirmed"] })
    .andWhere("NOT (reservation.end_time <= :startTime OR reservation.start_time >= :endTime)", {
      startTime,
      endTime,
    })
    .getCount();

  return count > 0;
};

reservationsRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const { page, limit } = getPagination(req.query);
    const status = asString(req.query.status) as ReservationStatus | undefined;

    if (status && !["pending", "confirmed", "cancelled", "completed"].includes(status)) {
      throw badRequest("Некорректный статус бронирования.");
    }

    const reservations = await AppDataSource.getRepository(Reservation).find({
      where: {
        user: { userId: req.user!.userId },
        ...(status ? { status } : {}),
      },
      relations: reservationRelations,
      order: { createdAt: "DESC" },
    });

    res.json(paginate(reservations.map(toReservationResponse), page, limit));
  }),
);

reservationsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const details: ValidationErrorDetail[] = [];
    const restaurantId = asPositiveInt(req.body.restaurantId);
    const reservationDate = asString(req.body.reservationDate);
    const startTimeRaw = asString(req.body.startTime);
    const endTimeRaw = asString(req.body.endTime);
    const guestsCount = asPositiveInt(req.body.guestsCount);

    if (!restaurantId) {
      details.push({ field: "restaurantId", message: "Идентификатор ресторана обязателен." });
    }
    if (!reservationDate || !isDate(reservationDate)) {
      details.push({ field: "reservationDate", message: "Дата должна быть в формате YYYY-MM-DD." });
    }
    if (!startTimeRaw || !isTime(startTimeRaw)) {
      details.push({ field: "startTime", message: "Время начала должно быть в формате HH:mm:ss." });
    }
    if (!endTimeRaw || !isTime(endTimeRaw)) {
      details.push({ field: "endTime", message: "Время окончания должно быть в формате HH:mm:ss." });
    }
    if (!guestsCount) {
      details.push({ field: "guestsCount", message: "Количество гостей должно быть больше 0." });
    }

    const startTime = startTimeRaw ? normalizeTime(startTimeRaw) : "";
    const endTime = endTimeRaw ? normalizeTime(endTimeRaw) : "";
    if (startTime && endTime && endTime <= startTime) {
      details.push({ field: "endTime", message: "Время окончания должно быть позже времени начала." });
    }
    ensureValid(details);

    const restaurant = await AppDataSource.getRepository(Restaurant).findOne({
      where: { restaurantId },
      relations: { tables: true },
    });

    if (!restaurant) {
      throw notFound("Ресторан не найден.");
    }

    const candidates = restaurant.tables
      .filter((table) => table.isActive && table.capacity >= guestsCount!)
      .sort((left, right) => left.capacity - right.capacity);

    for (const table of candidates) {
      if (!(await hasConflict(table, reservationDate!, startTime, endTime))) {
        const reservationRepository = AppDataSource.getRepository(Reservation);
        const reservation = await reservationRepository.save(
          reservationRepository.create({
            user: req.user!,
            table,
            reservationDate: reservationDate!,
            startTime,
            endTime,
            guestsCount: guestsCount!,
            status: "confirmed",
          }),
        );

        const savedReservation = await reservationRepository.findOneOrFail({
          where: { reservationId: reservation.reservationId },
          relations: reservationRelations,
        });

        res.status(201).json(toReservationResponse(savedReservation));
        return;
      }
    }

    throw conflict("Столик недоступен на выбранное время.");
  }),
);

reservationsRouter.get(
  "/:reservationId",
  asyncHandler(async (req, res) => {
    const reservationId = asPositiveInt(req.params.reservationId);
    if (!reservationId) {
      throw badRequest("Некорректный идентификатор бронирования.");
    }

    const reservation = await findReservationForCurrentUser(reservationId, req.user!.userId);
    res.json(toReservationResponse(reservation));
  }),
);

reservationsRouter.patch(
  "/:reservationId/cancel",
  asyncHandler(async (req, res) => {
    const reservationId = asPositiveInt(req.params.reservationId);
    if (!reservationId) {
      throw badRequest("Некорректный идентификатор бронирования.");
    }

    const reason = asString(req.body?.reason);
    if (reason && reason.length > 500) {
      throw badRequest("Причина отмены не должна быть длиннее 500 символов.");
    }

    const reservation = await findReservationForCurrentUser(reservationId, req.user!.userId);
    if (reservation.status === "cancelled") {
      throw conflict("Бронирование уже отменено.");
    }
    if (reservation.status === "completed") {
      throw conflict("Завершенное бронирование нельзя отменить.");
    }

    reservation.status = "cancelled";
    await AppDataSource.getRepository(Reservation).save(reservation);

    res.json(toReservationResponse(reservation));
  }),
);
