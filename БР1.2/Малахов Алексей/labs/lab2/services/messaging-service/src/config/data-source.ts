import { DataSource } from 'typeorm';
import SETTINGS from './settings';
import { Conversation } from '../models/conversation.entity';
import { ConversationParticipant } from '../models/conversation-participant.entity';
import { Message } from '../models/message.entity';

const dataSource = new DataSource({
    type: 'postgres',
    host: SETTINGS.DB_HOST,
    port: SETTINGS.DB_PORT,
    username: SETTINGS.DB_USER,
    password: SETTINGS.DB_PASSWORD,
    database: SETTINGS.DB_NAME,
    entities: [Conversation, ConversationParticipant, Message],
    logging: false,
    synchronize: true,
});

export default dataSource;
