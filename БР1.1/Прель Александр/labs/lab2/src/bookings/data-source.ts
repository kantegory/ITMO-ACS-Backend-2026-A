import { createDatabase } from "../shared/database";
import { Reservation } from "./entities/Reservation";
import { OutboxEvent } from "./entities/OutboxEvent";
import { messagingEnabled } from "../messaging/rabbit";
export const AppDataSource = createDatabase("BOOKINGS_DATABASE_PATH", [Reservation, ...(messagingEnabled() ? [OutboxEvent] : [])]);

export const installBookingGuards = async () => {
  // Enforce availability at the database write boundary, including concurrent requests.
  for (const operation of ["INSERT", "UPDATE"]) {
    await AppDataSource.query(`CREATE TRIGGER IF NOT EXISTS reservations_no_overlap_${operation.toLowerCase()}
      BEFORE ${operation} ON reservations
      WHEN NEW.status IN ('pending', 'confirmed') AND EXISTS (
        SELECT 1 FROM reservations AS r WHERE r.table_id = NEW.table_id
        AND r.reservation_date = NEW.reservation_date AND r.status IN ('pending', 'confirmed')
        AND r.reservation_id != NEW.reservation_id
        AND r.start_time < NEW.end_time AND r.end_time > NEW.start_time
      ) BEGIN SELECT RAISE(ABORT, 'BOOKING_OVERLAP'); END`);
  }
};
