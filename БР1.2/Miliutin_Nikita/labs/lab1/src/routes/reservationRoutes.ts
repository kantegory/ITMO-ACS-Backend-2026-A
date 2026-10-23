import { Router } from "express";
import {
  cancelReservation,
  createReservation,
  listMyReservations
} from "../controllers/reservationController";
import { authRequired } from "../middleware/auth";

export const reservationRoutes = Router();

reservationRoutes.post("/reservations", authRequired, createReservation);
reservationRoutes.get("/reservations/my", authRequired, listMyReservations);
reservationRoutes.delete("/reservations/:id", authRequired, cancelReservation);
