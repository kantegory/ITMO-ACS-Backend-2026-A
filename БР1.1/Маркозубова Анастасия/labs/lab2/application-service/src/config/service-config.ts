import ApplicationController from '../controllers/application.controller';
import { Application } from '../models/application.entity';
export type ServiceName = 'application';
export function getServiceName(): ServiceName { return 'application'; }
export function getServiceConfig(_serviceName: ServiceName) {
    return { database: 'application_db', controllers: [ApplicationController], entities: [Application], subscribers: [] };
}
