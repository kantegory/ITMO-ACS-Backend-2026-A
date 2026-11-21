import {
  getPropertySnapshot,
  listOwnerProperties,
  PropertySnapshot,
} from "../../../packages/shared/src/clients";

export async function enrichDeal(
  d: import("./entities/Deal").Deal
): Promise<PropertySnapshot | undefined> {
  const snap = await getPropertySnapshot(d.propertyId);
  return snap || undefined;
}

export async function ownerPropertyIds(ownerId: string) {
  const items = await listOwnerProperties(ownerId);
  return items.map((p) => p.id);
}
