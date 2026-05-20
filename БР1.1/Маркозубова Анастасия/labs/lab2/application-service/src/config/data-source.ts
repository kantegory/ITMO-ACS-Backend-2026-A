import { DataSource } from 'typeorm';
import SETTINGS from './settings';
import { getServiceConfig, ServiceName } from './service-config';

const currentService = getServiceConfig(SETTINGS.SERVICE_NAME as ServiceName);

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: currentService.entities,
    subscribers: currentService.subscribers,
    logging: true,
    synchronize: true,
});

export default dataSource;
