import { internalCall } from "./http";
import { config } from "../config";

export interface PropertyRentalContext {
  id: string;
  owner_id: string;
  title: string;
  city: string;
  district: string | null;
  address: string;
  property_type: string;
  price_per_month: number;
  is_available: boolean;
}

export const getRentalContext = (propertyId: string) =>
  internalCall<PropertyRentalContext>(
    `${config.propertyServiceUrl}/api/v1/internal/properties/${propertyId}/rental-context`
  );

export interface UpdateAvailabilityRequest {
  is_available: boolean;
  expected_available: boolean;
  reason: "rental_created" | "rental_completed" | "rental_cancelled" | "manual_update";
  rental_id?: string;
}

export interface AvailabilityResponse {
  property_id: string;
  is_available: boolean;
  updated_at: string;
}

export const updateAvailability = (propertyId: string, payload: UpdateAvailabilityRequest) =>
  internalCall<AvailabilityResponse>(
    `${config.propertyServiceUrl}/api/v1/internal/properties/${propertyId}/availability`,
    { method: "PUT", body: payload, passthroughErrors: true }
  );
