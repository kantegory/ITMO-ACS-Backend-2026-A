import dotenv from "dotenv";
import express from "express";
import {
  EXCHANGE_NAME,
  buildHealth,
  connectRabbit,
  createRpcClient,
  parseRpcResult,
  registerRpcHandler,
  ReservationAvailabilityRequest,
  ReservationAvailabilityResponse,
  Reservation,
  ReservationCreateResponse,
  TableValidationRequest,
  TableValidationResponse,
  UserValidationRequest,
  UserValidationResponse,
} from "@app/shared";

dotenv.config();

const reservations: Reservation[] = [];
let nextReservationId = 1;

async function bootstrap() {
  const app = express();
  app.use(express.json());

  const port = Number(process.env.PORT ?? 8083);
  const serviceName = process.env.SERVICE_NAME ?? "reservation-service";
  const { connection, channel } = await connectRabbit(serviceName);
  const rpcClient = await createRpcClient(channel, "reservation-service.rpc.responses");

  await channel.assertQueue("reservation.audit.queue", { durable: false });
  await channel.bindQueue("reservation.audit.queue", EXCHANGE_NAME, "reservation.audit.event");

  const publishAudit = (status: "accepted" | "rejected", reason: ReservationAvailabilityResponse["reason"], payload: Partial<ReservationAvailabilityRequest>) => {
    channel.publish(
      EXCHANGE_NAME,
      "reservation.audit.event",
      Buffer.from(
        JSON.stringify({
          event: "reservation.availability.checked",
          status,
          reason,
          payload,
          checked_at: new Date().toISOString(),
        }),
      ),
      { contentType: "application/json" },
    );
  };

  const checkAvailability = async (
    payload: Partial<ReservationAvailabilityRequest>,
  ): Promise<ReservationAvailabilityResponse> => {
    const { user_id, restaurant_id, table_id, reservation_start, reservation_end, guests_count } = payload;

    if (!user_id || !restaurant_id || !table_id || !reservation_start || !reservation_end || !guests_count) {
      throw new Error("Missing required reservation fields");
    }

    const start = new Date(reservation_start);
    const end = new Date(reservation_end);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf()) || start >= end) {
      publishAudit("rejected", "INVALID_TIME_RANGE", payload);
      return {
        ok: true,
        available: false,
        reason: "INVALID_TIME_RANGE",
      };
    }

    const user = parseRpcResult(
      await rpcClient.request<UserValidationRequest, UserValidationResponse>(
        "identity.user.validate.request",
        { user_id },
      ),
    );

    if (!user.exists) {
      publishAudit("rejected", "USER_NOT_FOUND", payload);
      return {
        ok: true,
        available: false,
        reason: "USER_NOT_FOUND",
      };
    }

    if (!user.is_active) {
      publishAudit("rejected", "USER_INACTIVE", payload);
      return {
        ok: true,
        available: false,
        reason: "USER_INACTIVE",
      };
    }

    const table = parseRpcResult(
      await rpcClient.request<TableValidationRequest, TableValidationResponse>(
        "catalog.table.validate.request",
        { restaurant_id, table_id, guests_count },
      ),
    );

    if (!table.exists) {
      publishAudit("rejected", "TABLE_NOT_FOUND", payload);
      return {
        ok: true,
        available: false,
        reason: "TABLE_NOT_FOUND",
      };
    }

    if (!table.is_active) {
      publishAudit("rejected", "TABLE_INACTIVE", payload);
      return {
        ok: true,
        available: false,
        reason: "TABLE_INACTIVE",
      };
    }

    if (Number(guests_count) > table.seats_count) {
      publishAudit("rejected", "CAPACITY_EXCEEDED", payload);
      return {
        ok: true,
        available: false,
        reason: "CAPACITY_EXCEEDED",
      };
    }

    const hasTimeConflict = reservations.some((reservation) => {
      if (reservation.restaurant_id !== restaurant_id || reservation.table_id !== table_id) {
        return false;
      }

      const existingStart = new Date(reservation.reservation_start);
      const existingEnd = new Date(reservation.reservation_end);
      return start < existingEnd && existingStart < end;
    });

    if (hasTimeConflict) {
      publishAudit("rejected", "TIME_CONFLICT", payload);
      return {
        ok: true,
        available: false,
        reason: "TIME_CONFLICT",
      };
    }

    publishAudit("accepted", "OK", payload);
    return {
      ok: true,
      available: true,
      reason: "OK",
    };
  };

  await registerRpcHandler<Partial<ReservationAvailabilityRequest>, ReservationAvailabilityResponse>(
    channel,
    "reservation.availability.queue",
    "reservation.availability.request",
    checkAvailability,
  );

  await registerRpcHandler<Partial<ReservationAvailabilityRequest>, ReservationCreateResponse>(
    channel,
    "reservation.create.queue",
    "reservation.create.request",
    async (payload) => {
      const availability = await checkAvailability(payload);
      if (!availability.available) {
        return {
          ok: true,
          created: false,
          reason: availability.reason,
        };
      }

      const reservation = {
        id: nextReservationId++,
        ...payload,
        created_at: new Date().toISOString(),
      } as Reservation;
      reservations.push(reservation);

      return {
        ok: true,
        created: true,
        reason: "OK",
        reservation,
      };
    },
  );

  app.get("/health", (_req, res) => {
    res.json(buildHealth(serviceName));
  });

  process.on("SIGINT", async () => {
    await connection.close();
    process.exit(0);
  });

  app.listen(port, () => {
    console.log(`[${serviceName}] listening on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("[reservation-service] failed to start", error);
  process.exit(1);
});
