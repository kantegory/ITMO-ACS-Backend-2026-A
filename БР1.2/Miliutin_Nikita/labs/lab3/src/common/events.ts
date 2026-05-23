export const EXCHANGE_NAME = "restaurant-booking.events";

export type ReservationEventType = "reservation.created" | "reservation.cancelled";

export interface ReservationPayload {
  reservation_id: number;
  user_id: number;
  restaurant_id?: number;
  table_id?: number;
  reservation_datetime?: string;
  guest_count?: number;
  status: "confirmed" | "cancelled";
}

export interface DomainEvent<TPayload> {
  event_id: string;
  event_type: ReservationEventType;
  occurred_at: string;
  payload: TPayload;
}

export const createEvent = (
  eventType: ReservationEventType,
  payload: ReservationPayload
): DomainEvent<ReservationPayload> => ({
  event_id: `evt_${Date.now()}_${Math.round(Math.random() * 100000)}`,
  event_type: eventType,
  occurred_at: new Date().toISOString(),
  payload
});
