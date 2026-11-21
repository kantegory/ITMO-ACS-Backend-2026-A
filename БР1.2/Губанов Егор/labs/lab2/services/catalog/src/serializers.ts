import { Property } from "./entities/Property";
import { PropertyType } from "./entities/PropertyType";
import { Photo } from "./entities/Photo";
import { RentalCondition } from "./entities/RentalCondition";
import { UserBrief } from "../../../packages/shared/src/clients";

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

export function propertySnapshot(p: Property) {
  return {
    id: p.id,
    owner_id: p.ownerId,
    type_id: p.typeId,
    title: p.title,
    city: p.city,
    address: p.address,
    price: parseFloat(p.price),
    is_published: p.isPublished,
    type_is_published: p.type.isPublished,
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

export function propertyDetail(p: Property, owner: UserBrief) {
  const photos = (p.photos || []).slice().sort((a, b) => {
    if (a.isMain && !b.isMain) return -1;
    if (!a.isMain && b.isMain) return 1;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
  const conds = (p.conditions || [])
    .slice()
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        a.createdAt.getTime() - b.createdAt.getTime()
    );
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
    owner: {
      id: owner.id,
      first_name: owner.first_name,
      last_name: owner.last_name,
    },
  };
}
