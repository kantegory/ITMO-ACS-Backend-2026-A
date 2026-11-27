import { DataSource } from 'typeorm';
import SETTINGS from './settings';
import { Booking } from '../models/booking.entity';
import { BookingRequest } from '../models/booking-request.entity';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [Booking, BookingRequest],
    subscribers: [SETTINGS.DB_SUBSCRIBERS],
    logging: true,
    synchronize: true,
});

export default dataSource;
