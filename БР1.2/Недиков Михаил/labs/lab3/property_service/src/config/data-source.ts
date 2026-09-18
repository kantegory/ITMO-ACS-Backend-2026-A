import { DataSource } from 'typeorm';
import SETTINGS from './settings';
import { Property } from '../models/property.entity';
import { PropertyAttributes } from '../models/property-attributes.entity';
import { PropertyImage } from '../models/property-image.entity';
import { PropertyLocation } from '../models/property-location.entity';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [PropertyLocation, Property, PropertyImage, PropertyAttributes],
    subscribers: [SETTINGS.DB_SUBSCRIBERS],
    logging: true,
    synchronize: true,
});

export default dataSource;
