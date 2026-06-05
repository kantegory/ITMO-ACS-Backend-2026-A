import { Rental } from "../entities/Rental";
import { InternalUser } from "../clients/identity";

export const toRental = (r: Rental, users?: Map<string, InternalUser>) => ({
  id: String(r.id),
  property_id: String(r.propertyId),
  tenant_id: String(r.tenantId),
  owner_id: String(r.ownerId),
  property_title_snapshot: r.propertyTitleSnapshot,
  property_city_snapshot: r.propertyCitySnapshot,
  price_per_month_snapshot: Number(r.pricePerMonthSnapshot),
  start_date: r.startDate,
  end_date: r.endDate ?? null,
  status: r.status,
  created_at: r.createdAt,
  tenant: users?.get(String(r.tenantId)) ?? null,
  owner: users?.get(String(r.ownerId)) ?? null,
});

export const toInternalRental = (r: Rental) => ({
  id: String(r.id),
  property_id: String(r.propertyId),
  tenant_id: String(r.tenantId),
  owner_id: String(r.ownerId),
  property_title_snapshot: r.propertyTitleSnapshot,
  property_city_snapshot: r.propertyCitySnapshot,
  price_per_month_snapshot: Number(r.pricePerMonthSnapshot),
  status: r.status,
  start_date: r.startDate,
  end_date: r.endDate ?? null,
  created_at: r.createdAt,
});

export const toRentalParticipants = (r: Rental) => ({
  rental_id: String(r.id),
  tenant_id: String(r.tenantId),
  owner_id: String(r.ownerId),
  status: r.status,
});
