import { Property } from "../entities/Property";
import { Location } from "../entities/Location";
import { PropertyPhoto } from "../entities/PropertyPhoto";
import { Amenity } from "../entities/Amenity";

export const toLocation = (l: Location) => ({
  id: String(l.id),
  city: l.city,
  district: l.district ?? null,
  address: l.address,
});

export const toAmenity = (a: Amenity) => ({ id: a.id, name: a.name });

export const toPhoto = (p: PropertyPhoto) => ({
  id: String(p.id),
  url: p.url,
  sort_order: p.sortOrder,
});

export const toProperty = (p: Property) => ({
  id: String(p.id),
  owner_id: String(p.ownerId),
  title: p.title,
  description: p.description,
  property_type: p.propertyType ? { id: p.propertyType.id, name: p.propertyType.name } : null,
  price_per_month: Number(p.pricePerMonth),
  area_sqm: p.areaSqm != null ? Number(p.areaSqm) : null,
  rooms: p.rooms ?? null,
  is_available: p.isAvailable,
  location: p.location ? toLocation(p.location) : null,
  amenities: (p.amenities ?? []).map(toAmenity),
  created_at: p.createdAt,
});

export const toPropertyDetail = (p: Property) => ({
  ...toProperty(p),
  rental_conditions: p.rentalConditions ?? null,
  photos: (p.photos ?? []).map(toPhoto),
});
