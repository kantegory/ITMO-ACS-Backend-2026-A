import { DataSource } from 'typeorm';
import SETTINGS from './settings';
import { Property } from '../models/property.entity';
import { PropertyPhoto } from '../models/property-photo.entity';
import { PropertyPriceHistory } from '../models/property-price-history.entity';
import { Favorite } from '../models/favorite.entity';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [Property, PropertyPhoto, PropertyPriceHistory, Favorite],
    logging: false,
    synchronize: true,
});

export default dataSource;
