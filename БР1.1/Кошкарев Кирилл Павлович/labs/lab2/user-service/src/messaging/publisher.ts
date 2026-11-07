import { EventBus } from './bus';
import { env } from '../config/env';
import { User } from '../models';

export const bus = new EventBus({
  url: env.rabbit.url,
  exchange: env.rabbit.exchange,
  producer: env.service,
  enabled: env.rabbit.enabled,
});

const profilePayload = (user: User) => ({
  userId: Number(user.id),
  username: user.username,
  fullName: user.fullName ?? null,
  avatarUrl: user.avatarUrl ?? null,
});

/** События, которые user-service отдаёт наружу (см. hw4/events.yaml). */
export const userEvents = {
  registered: (user: User) => bus.publish('user.registered', profilePayload(user)),
  updated: (user: User) => bus.publish('user.updated', profilePayload(user)),
};
