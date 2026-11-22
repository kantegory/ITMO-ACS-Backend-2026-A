import {
  getRabbitChannel,
  parseMessage
} from '../../../shared/src/rabbitmq';
import { QUEUE_RESERVATIONS_COMPLETED } from '../../../shared/src/queues';
import type { ReservationCompletedMessage } from '../../../shared/src/messaging/types';

export async function startAuthMessaging() {
  const channel = await getRabbitChannel();

  await channel.consume(QUEUE_RESERVATIONS_COMPLETED, async (delivery) => {
    if (!delivery) return;
    try {
      const msg = parseMessage<ReservationCompletedMessage>(delivery.content);
      if (msg.type !== 'reservation.completed') {
        channel.ack(delivery);
        return;
      }
      console.log(
        `[auth audit] user #${msg.userId} booked "${msg.restaurant_name}" (reservation #${msg.reservationId})`
      );
      channel.ack(delivery);
    } catch (err) {
      console.error('auth reservations audit consumer error:', err);
      channel.nack(delivery, false, false);
    }
  });

  console.log('Auth service: RabbitMQ consumer on queue "reservations.completed" started');
}
