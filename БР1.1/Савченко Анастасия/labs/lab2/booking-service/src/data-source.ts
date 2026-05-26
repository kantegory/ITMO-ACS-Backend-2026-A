import "reflect-metadata"
import { DataSource } from "typeorm"
import { Booking } from "./models/booking.entity"
import { Review } from "./models/review.entity"

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost", port: 5432,
  username: "postgres", password: "postgres",
  database: "booking_db",
  synchronize: true,
  entities: [Booking, Review]
})