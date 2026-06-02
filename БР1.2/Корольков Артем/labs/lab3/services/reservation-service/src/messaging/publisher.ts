import { randomUUID } from 'crypto';
import {
  getRabbitChannel,
  publishJson
} from '../../../shared/src/rabbitmq';
import {
  QUEUE_RESERVATIONS
} from '../../../shared/src/queues';
import type { ReservationRequestMessage } from '../../../shared/src/messaging/types';
import { waitForCorrelation } from './pending';

export async function createReservationViaQueue(
  userId: number,
  restaurantId: number,
  guests_count: unknown,
  reservation_datetime: unknown
) {
  await getRabbitChannel();
  const correlationId = randomUUID();

  const message: ReservationRequestMessage = {
    type: 'reservation.request',
    correlationId,
    userId,
    restaurantId,
    guests_count,
    reservation_datetime
  };

  const resultPromise = waitForCorrelation<Record<string, unknown>>(correlationId);
  publishJson(QUEUE_RESERVATIONS, message);
  return resultPromise;
}
