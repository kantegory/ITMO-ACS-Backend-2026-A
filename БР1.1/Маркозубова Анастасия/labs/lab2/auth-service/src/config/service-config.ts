import AuthController from '../controllers/auth.controller';
import { User } from '../models/user.entity';
import { UserSubscriber } from '../models/user.subscriber';
export type ServiceName = 'auth';
export function getServiceName(): ServiceName { return 'auth'; }
export function getServiceConfig(_serviceName: ServiceName) {
    return { database: 'auth_db', controllers: [AuthController], entities: [User], subscribers: [UserSubscriber] };
}
