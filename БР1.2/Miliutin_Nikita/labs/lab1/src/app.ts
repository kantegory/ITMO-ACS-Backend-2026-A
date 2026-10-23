import cors from "cors";
import express, { Request, Response } from "express";
import { authRoutes } from "./routes/authRoutes";
import { reservationRoutes } from "./routes/reservationRoutes";
import { restaurantRoutes } from "./routes/restaurantRoutes";
import { userRoutes } from "./routes/userRoutes";
import { error } from "./views/apiView";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Restaurant Booking API is running",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      restaurants: "/api/restaurants",
      reservations: "/api/reservations"
    }
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", restaurantRoutes);
app.use("/api", reservationRoutes);

app.use((_req: Request, res: Response) => error(res, 404, "Маршрут не найден"));
