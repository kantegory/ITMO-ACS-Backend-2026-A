import { Message } from "../entities/Message";
import { InternalUser } from "../clients/identity";

export const toMessage = (m: Message, users?: Map<string, InternalUser>) => ({
  id: String(m.id),
  rental_id: String(m.rentalId),
  kind: m.kind,
  sender: m.senderId && users ? users.get(String(m.senderId)) ?? { id: String(m.senderId) } : null,
  body: m.body,
  created_at: m.createdAt,
});
