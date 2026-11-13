import { User } from "./entities/User";
import { Property } from "./entities/Property";
import { PropertyType } from "./entities/PropertyType";
import { Photo } from "./entities/Photo";
import { RentalCondition } from "./entities/RentalCondition";
import { Deal } from "./entities/Deal";
import { Message } from "./entities/Message";

export function userPublic(u: User) {
  return {
    id: u.id,
    role: u.role,
    first_name: u.firstName,
    last_name: u.lastName,
    email: u.email,
    is_verified: u.isVerified,
    created_at: u.createdAt.toISOString(),
    updated_at: u.updatedAt.toISOString(),
  };
}

export function ownerShort(u: User) {
  return {
    id: u.id,
    first_name: u.firstName,
    last_name: u.lastName,
  };
}

export function propertyTypeOut(t: PropertyType) {
  return {
    id: t.id,
    title: t.title,
    is_published: t.isPublished,
    created_at: t.createdAt.toISOString(),
    updated_at: t.updatedAt.toISOString(),
  };
}

export function propertyShort(p: Property) {
  return {
    id: p.id,
    owner_id: p.ownerId,
    type_id: p.typeId,
    title: p.title,
    city: p.city,
    address: p.address,
    price: parseFloat(p.price),
    is_published: p.isPublished,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  };
}

export function photoOut(p: Photo) {
  return {
    id: p.id,
    property_id: p.propertyId,
    photo_url: p.photoUrl,
    is_main: p.isMain,
    created_at: p.createdAt.toISOString(),
  };
}

export function conditionOut(c: RentalCondition) {
  return {
    id: c.id,
    property_id: c.propertyId,
    text: c.text,
    sort_order: c.sortOrder,
    created_at: c.createdAt.toISOString(),
  };
}

export function propertyDetail(p: Property) {
  const photos = (p.photos || []).slice().sort((a, b) => {
    if (a.isMain && !b.isMain) return -1;
    if (!a.isMain && b.isMain) return 1;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
  const conds = (p.conditions || [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime());
  return {
    id: p.id,
    owner_id: p.ownerId,
    type_id: p.typeId,
    title: p.title,
    city: p.city,
    address: p.address,
    description: p.description,
    price: parseFloat(p.price),
    is_published: p.isPublished,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
    photos: photos.map(photoOut),
    conditions: conds.map(conditionOut),
    owner: ownerShort(p.owner),
  };
}

export function dealOut(d: Deal, withProperty?: Property) {
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
  if (withProperty) {
    return { ...base, property: propertyShort(withProperty) };
  }
  return base;
}

export function messageOut(m: Message) {
  return {
    id: m.id,
    sender_id: m.senderId,
    receiver_id: m.receiverId,
    property_id: m.propertyId,
    content: m.content,
    is_read: m.isRead,
    created_at: m.createdAt.toISOString(),
  };
}
