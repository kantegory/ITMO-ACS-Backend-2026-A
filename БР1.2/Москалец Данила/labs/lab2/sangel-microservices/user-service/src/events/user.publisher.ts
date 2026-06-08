import { publishEvent, Exchanges, RoutingKeys, setupExchanges } from '../../event-bus';
import { UserResponse } from '../modules/auth/auth.dto';

let exchangesSetup = false;

async function ensureExchanges(): Promise<void> {
  if (!exchangesSetup) {
    await setupExchanges();
    exchangesSetup = true;
  }
}

export async function publishUserRegistered(user: UserResponse): Promise<void> {
  await ensureExchanges();
  await publishEvent(Exchanges.USER, RoutingKeys.USER_REGISTERED, {
    userId: user.id,
    email: user.email,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name,
  });
}

export async function publishUserRoleUpdated(userId: number, oldRole: string, newRole: string): Promise<void> {
  await ensureExchanges();
  await publishEvent(Exchanges.USER, RoutingKeys.USER_ROLE_UPDATED, {
    userId,
    oldRole,
    newRole,
  });
}