export const eventTypes = ["reservation.created", "reservation.cancelled"] as const;
export type EventType = typeof eventTypes[number];
export type ReservationEvent = {
  eventId: string;
  schemaVersion: 1;
  type: EventType;
  occurredAt: string;
  data: {
    reservationId: number; userId: number; restaurantId: number; restaurantName: string;
    tableId: number; tableNumber: string; reservationDate: string; startTime: string; endTime: string;
    guestsCount: number; status: "confirmed" | "cancelled";
  };
};

export class InvalidEvent extends Error {}

export const parseEvent = (body: Buffer): ReservationEvent => {
  if (body.length > 65536) throw new InvalidEvent("Event too large");
  let value: ReservationEvent;
  try { value = JSON.parse(body.toString("utf8")); } catch { throw new InvalidEvent("Invalid JSON"); }
  if (!value || typeof value !== "object" || value.schemaVersion !== 1 || !eventTypes.includes(value.type) ||
      typeof value.eventId !== "string" || !/^[a-f0-9]{32}$/.test(value.eventId) ||
      typeof value.occurredAt !== "string" || !Number.isFinite(Date.parse(value.occurredAt))) throw new InvalidEvent("Invalid envelope");
  const data = value.data;
  if (!data || typeof data !== "object") throw new InvalidEvent("Missing data");
  for (const key of ["reservationId", "userId", "restaurantId", "tableId", "guestsCount"] as const) {
    if (!Number.isSafeInteger(data[key]) || data[key] < 1) throw new InvalidEvent("Invalid ID or guest count");
  }
  for (const key of ["restaurantName", "tableNumber"] as const) {
    if (typeof data[key] !== "string" || data[key].length < 1 || data[key].length > 255) throw new InvalidEvent("Invalid name");
  }
  if (typeof data.reservationDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.reservationDate) ||
      !Number.isFinite(Date.parse(data.reservationDate)) || new Date(data.reservationDate).toISOString().slice(0, 10) !== data.reservationDate) throw new InvalidEvent("Invalid date");
  for (const key of ["startTime", "endTime"] as const) {
    if (typeof data[key] !== "string" || !/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(data[key])) throw new InvalidEvent("Invalid time");
  }
  if (data.startTime >= data.endTime || data.status !== (value.type === "reservation.created" ? "confirmed" : "cancelled")) throw new InvalidEvent("Inconsistent event");
  return value;
};
