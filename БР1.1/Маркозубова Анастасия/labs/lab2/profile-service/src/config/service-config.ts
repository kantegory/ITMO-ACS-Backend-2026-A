import SeekerController from '../controllers/seeker.controller';
import CompanyController from '../controllers/company.controller';
import { Seeker } from '../models/seeker.entity';
import { Company } from '../models/company.entity';
export type ServiceName = 'profile';
export function getServiceName(): ServiceName { return 'profile'; }
export function getServiceConfig(_serviceName: ServiceName) {
    return { database: 'profile_db', controllers: [SeekerController, CompanyController], entities: [Seeker, Company], subscribers: [] };
}
