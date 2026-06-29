const { Notification } = require('../models');
const { startConsumer } = require('../utils/rabbit');

const buildNotification = (event, routingKey) => {
  const payload = event.payload || {};
  const userId = payload.user_id || null;

  const messages = {
    'booking.created': {
      title: 'Создано бронирование',
      message: `Бронирование #${payload.id} создано со статусом ${payload.status}`
    },
    'booking.cancelled': {
      title: 'Бронирование отменено',
      message: `Бронирование #${payload.id} отменено`
    },
    'booking.status_changed': {
      title: 'Статус бронирования изменён',
      message: `Бронирование #${payload.id}: ${payload.previous_status} → ${payload.status}`
    },
    'review.created': {
      title: 'Создан отзыв',
      message: `Отзыв #${payload.id} создан с оценкой ${payload.rating}`
    },
    'review.updated': {
      title: 'Отзыв изменён',
      message: `Отзыв #${payload.id}: оценка ${payload.previous_rating} → ${payload.rating}`
    },
    'review.deleted': {
      title: 'Отзыв удалён',
      message: `Отзыв #${payload.id} удалён`
    }
  };

  return {
    event_id: event.event_id,
    event_type: event.event_type,
    routing_key: routingKey,
    user_id: userId,
    title: messages[routingKey]?.title || event.event_type,
    message: messages[routingKey]?.message || `Получено событие ${routingKey}`,
    payload: JSON.stringify(payload)
  };
};

const handleEvent = async (event, routingKey) => {
  const existing = await Notification.findOne({ where: { event_id: event.event_id } });

  if (existing) {
    return;
  }

  const notification = buildNotification(event, routingKey);
  await Notification.create(notification);

  console.log(`Notification Service stored event: ${routingKey}`);
};

const startDomainEventsConsumer = async () => startConsumer({
  queue: 'notification-service.domain-events',
  bindings: ['booking.*', 'review.*'],
  handler: handleEvent
});

module.exports = { startDomainEventsConsumer };
