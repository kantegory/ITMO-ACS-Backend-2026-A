import { DataSource } from 'typeorm';
import { SETTINGS } from '../../common/settings';
import { Reservation, RestaurantTable } from './entities';

export const reservationDataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.RESERVATION_DB_NAME,
    entities: [RestaurantTable, Reservation],
    logging: false,
    synchronize: true,
});
