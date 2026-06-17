import Reservation from '../models/Reservation';
import {
  getRabbitChannel,
  parseMessage,
  publishJson
} from '../../../shared/src/rabbitmq';
import {
  QUEUE_RESERVATIONS_COMPLETED,
  QUEUE_RESERVATIONS_FAILED,
  QUEUE_RESERVATIONS_VALIDATED
} from '../../../shared/src/queues';
import type {
  ReservationCompletedMessage,
  ReservationFailedMessage,
  ReservationValidatedMessage
} from '../../../shared/src/messaging/types';
import { rejectCorrelation, resolveCorrelation } from './pending';

async function onValidated(content: Buffer) {
  const msg = parseMessage<ReservationValidatedMessage>(content);
  if (msg.type !== 'reservation.validated') return;

  const reservation = await Reservation.create({
    UserId: msg.userId,
    RestaurantId: msg.restaurant.id,
    restaurant_name: msg.restaurant.name,
    restaurant_city: msg.restaurant.city,
    restaurant_cuisine: msg.restaurant.cuisine,
    restaurant_average_check: msg.restaurant.average_check,
    guests_count: msg.guests_count,
    reservation_datetime: msg.reservation_datetime
  });

  const completed: ReservationCompletedMessage = {
    type: 'reservation.completed',
    reservationId: reservation.id,
    userId: msg.userId,
    restaurantId: msg.restaurant.id,
    restaurant_name: msg.restaurant.name,
    guests_count: msg.guests_count,
    reservation_datetime: msg.reservation_datetime
  };
  publishJson(QUEUE_RESERVATIONS_COMPLETED, completed);
  resolveCorrelation(msg.correlationId, reservation.toJSON());
}

async function onFailed(content: Buffer) {
  const msg = parseMessage<ReservationFailedMessage>(content);
  if (msg.type !== 'reservation.failed') return;
  rejectCorrelation(msg.correlationId, msg.error);
}

export async function startReservationMessaging() {
  const channel = await getRabbitChannel();

  await channel.consume(QUEUE_RESERVATIONS_VALIDATED, async (delivery) => {
    if (!delivery) return;
    try {
      await onValidated(delivery.content);
      channel.ack(delivery);
    } catch (err) {
      console.error('reservation validated handler error:', err);
      channel.nack(delivery, false, false);
    }
  });

  await channel.consume(QUEUE_RESERVATIONS_FAILED, async (delivery) => {
    if (!delivery) return;
    try {
      await onFailed(delivery.content);
      channel.ack(delivery);
    } catch (err) {
      console.error('reservation failed handler error:', err);
      channel.nack(delivery, false, false);
    }
  });

  console.log('Reservation service: RabbitMQ consumers started');
}
