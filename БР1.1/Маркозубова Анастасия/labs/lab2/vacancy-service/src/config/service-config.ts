import VacancyController from '../controllers/vacancy.controller';
import { Vacancy } from '../models/vacancy.entity';
export type ServiceName = 'vacancy';
export function getServiceName(): ServiceName { return 'vacancy'; }
export function getServiceConfig(_serviceName: ServiceName) {
    return { database: 'vacancy_db', controllers: [VacancyController], entities: [Vacancy], subscribers: [] };
}
