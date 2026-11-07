import { User } from "../entities/User";
import { Property } from "../entities/Property";
import { Location } from "../entities/Location";
import { PropertyPhoto } from "../entities/PropertyPhoto";
import { Amenity } from "../entities/Amenity";
import { Rental } from "../entities/Rental";
import { Message } from "../entities/Message";

export const toUser = (u: User) => ({
  id: Number(u.id),
  email: u.email,
  name: u.name,
  phone: u.phone ?? null,
  role: u.role,
  created_at: u.createdAt,
});

export const toLocation = (l: Location) => ({
  id: Number(l.id),
  city: l.city,
  district: l.district ?? null,
  address: l.address,
});

export const toAmenity = (a: Amenity) => ({ id: a.id, name: a.name });

export const toPhoto = (p: PropertyPhoto) => ({
  id: Number(p.id),
  url: p.url,
  sort_order: p.sortOrder,
});

export const toProperty = (p: Property) => ({
  id: Number(p.id),
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
  owner: p.owner ? toUser(p.owner) : null,
});

export const toRental = (r: Rental) => ({
  id: Number(r.id),
  property: r.property ? toProperty(r.property) : null,
  tenant: r.tenant ? toUser(r.tenant) : null,
  start_date: r.startDate,
  end_date: r.endDate ?? null,
  status: r.status,
  created_at: r.createdAt,
});

export const toMessage = (m: Message) => ({
  id: Number(m.id),
  sender: m.sender ? toUser(m.sender) : null,
  body: m.body,
  created_at: m.createdAt,
});
