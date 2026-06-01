import { Request, Response } from "express";
import {
  listOwnerActiveDealsByProperty,
  listOwnerProperties,
  listUserDealsForHistory,
  listUserMessagesForHistory,
} from "../../../packages/shared/src/clients";

export async function history(req: Request, res: Response) {
  const uid = req.authUser!.id;
  const [messages, deals] = await Promise.all([
    listUserMessagesForHistory(uid),
    listUserDealsForHistory(uid),
  ]);
  res.json({
    messages: messages.items,
    deals: deals.items,
  });
}

export async function owning(req: Request, res: Response) {
  const uid = req.authUser!.id;
  const [properties, active] = await Promise.all([
    listOwnerProperties(uid),
    listOwnerActiveDealsByProperty(uid),
  ]);
  const items = properties.map((property) => ({
    property,
    active_deals: active.by_property[property.id] || [],
  }));
  res.json({ items, total: items.length });
}
