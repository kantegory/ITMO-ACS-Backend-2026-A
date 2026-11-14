import { DataSource } from 'typeorm';
import SETTINGS from './settings';
import { Conversation } from '../models/conversation.entity';
import { Message } from '../models/message.entity';
import { Payment } from '../models/payment.entity';
import { Review } from '../models/review.entity';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [Message, Payment, Review, Conversation],
    subscribers: [SETTINGS.DB_SUBSCRIBERS],
    logging: true,
    synchronize: true,
});

export default dataSource;
