import { Restaurant } from '../models';
import {
  getRabbitChannel,
  parseMessage,
  publishJson
} from '../../../shared/src/rabbitmq';
import {
  QUEUE_RESERVATIONS,
  QUEUE_RESERVATIONS_FAILED,
  QUEUE_RESERVATIONS_VALIDATED
} from '../../../shared/src/queues';
import type {
  ReservationFailedMessage,
  ReservationRequestMessage,
  ReservationValidatedMessage
} from '../../../shared/src/messaging/types';

export async function startRestaurantMessaging() {
  const channel = await getRabbitChannel();

  await channel.consume(QUEUE_RESERVATIONS, async (delivery) => {
    if (!delivery) return;
    try {
      const msg = parseMessage<ReservationRequestMessage>(delivery.content);
      if (msg.type !== 'reservation.request') {
        channel.ack(delivery);
        return;
      }

      const restaurant = await Restaurant.findByPk(msg.restaurantId, {
        attributes: ['id', 'name', 'city', 'cuisine', 'average_check']
      });

      if (!restaurant) {
        const failed: ReservationFailedMessage = {
          type: 'reservation.failed',
          correlationId: msg.correlationId,
          error: 'restaurant not found'
        };
        publishJson(QUEUE_RESERVATIONS_FAILED, failed);
        channel.ack(delivery);
        return;
      }

      const validated: ReservationValidatedMessage = {
        type: 'reservation.validated',
        correlationId: msg.correlationId,
        userId: msg.userId,
        restaurant: restaurant.toJSON() as ReservationValidatedMessage['restaurant'],
        guests_count: msg.guests_count,
        reservation_datetime: msg.reservation_datetime
      };
      publishJson(QUEUE_RESERVATIONS_VALIDATED, validated);
      console.log(
        `Restaurant service: validated reservation request for restaurant #${msg.restaurantId}`
      );
      channel.ack(delivery);
    } catch (err) {
      console.error('restaurant reservations consumer error:', err);
      channel.nack(delivery, false, false);
    }
  });

  console.log('Restaurant service: RabbitMQ consumer on queue "reservations" started');
}
