import IndustryController from '../controllers/industry.controller';
import SpecializationController from '../controllers/specialization.controller';
import { Industry } from '../models/industry.entity';
import { Specialization } from '../models/specialization.entity';
export type ServiceName = 'reference';
export function getServiceName(): ServiceName { return 'reference'; }
export function getServiceConfig(_serviceName: ServiceName) {
    return { database: 'reference_db', controllers: [IndustryController, SpecializationController], entities: [Industry, Specialization], subscribers: [] };
}
