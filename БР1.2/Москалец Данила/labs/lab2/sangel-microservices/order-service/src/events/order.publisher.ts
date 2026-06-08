import { publishEvent, Exchanges, RoutingKeys, setupExchanges } from '../../event-bus';
import { Request } from '../entities/request.entity';
import { Review } from '../entities/review.entity';

let exchangesSetup = false;

async function ensureExchanges(): Promise<void> {
  if (!exchangesSetup) {
    await setupExchanges();
    exchangesSetup = true;
  }
}

export async function publishRequestCreated(request: Request): Promise<void> {
  await ensureExchanges();
  await publishEvent(Exchanges.REQUEST, RoutingKeys.REQUEST_CREATED, {
    requestId: request.id,
    serviceId: request.service_id,
    userId: request.user_id,
    status: request.status,
  });
}

export async function publishRequestStatusChanged(
  requestId: number,
  oldStatus: string,
  newStatus: string,
  changedBy: number
): Promise<void> {
  await ensureExchanges();
  await publishEvent(Exchanges.REQUEST, RoutingKeys.REQUEST_STATUS_CHANGED, {
    requestId,
    oldStatus,
    newStatus,
    changedBy,
  });
}

export async function publishReviewCreated(review: Review): Promise<void> {
  await ensureExchanges();
  await publishEvent(Exchanges.REVIEW, RoutingKeys.REVIEW_CREATED, {
    reviewId: review.id,
    serviceId: review.service_id,
    userId: review.user_id,
    rating: review.rating,
    comment: review.comment || undefined,
  });
}