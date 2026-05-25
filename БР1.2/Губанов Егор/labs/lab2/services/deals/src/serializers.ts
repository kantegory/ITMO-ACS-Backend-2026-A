import { Deal } from "./entities/Deal";
import { PropertySnapshot } from "../../../packages/shared/src/clients";

export function propertyShortFromSnapshot(s: PropertySnapshot) {
  return {
    id: s.id,
    owner_id: s.owner_id,
    type_id: s.type_id,
    title: s.title,
    city: s.city,
    address: s.address,
    price: s.price,
    is_published: s.is_published,
    created_at: s.created_at || new Date().toISOString(),
    updated_at: s.updated_at || new Date().toISOString(),
  };
}

export function dealOut(d: Deal, property?: PropertySnapshot) {
  const base = {
    id: d.id,
    property_id: d.propertyId,
    tenant_id: d.tenantId,
    status: d.status,
    start_date: d.startDate.toISOString(),
    end_date: d.endDate.toISOString(),
    total_price: parseFloat(d.totalPrice),
    created_at: d.createdAt.toISOString(),
    updated_at: d.updatedAt.toISOString(),
  };
  if (property) {
    return { ...base, property: propertyShortFromSnapshot(property) };
  }
  return base;
}
