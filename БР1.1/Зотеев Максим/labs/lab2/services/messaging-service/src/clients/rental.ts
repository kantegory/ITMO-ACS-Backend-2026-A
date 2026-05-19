import { internalCall } from "./http";
import { config } from "../config";

export interface RentalParticipants {
  rental_id: string;
  tenant_id: string;
  owner_id: string;
  status: "active" | "completed" | "cancelled";
}

export const getRentalParticipants = (rentalId: string) =>
  internalCall<RentalParticipants>(
    `${config.rentalServiceUrl}/api/v1/internal/rentals/${rentalId}/participants`
  );
