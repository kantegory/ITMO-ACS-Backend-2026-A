const notificationView = (notification) => {
  if (!notification) return null;

  return {
    id: notification.id,
    event_id: notification.event_id,
    event_type: notification.event_type,
    routing_key: notification.routing_key,
    user_id: notification.user_id,
    title: notification.title,
    message: notification.message,
    payload: JSON.parse(notification.payload),
    is_read: notification.is_read,
    created_at: notification.created_at || notification.createdAt,
    updated_at: notification.updated_at || notification.updatedAt
  };
};

module.exports = { notificationView };
