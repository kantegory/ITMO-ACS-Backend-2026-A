import { Message } from "./entities/Message";

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
