import { DataSource } from 'typeorm';
import SETTINGS from './settings';

import { User } from '../models/user.entity';
import { UserRoleEntity } from '../models/user-role.entity';
import { Property } from '../models/property.entity';
import { PropertyPhoto } from '../models/property-photo.entity';
import { PropertyPriceHistory } from '../models/property-price-history.entity';
import { Favorite } from '../models/favorite.entity';
import { Rental } from '../models/rental.entity';
import { Transaction } from '../models/transaction.entity';
import { LandlordReview } from '../models/landlord-review.entity';
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
    entities: [
        User,
        UserRoleEntity,
        Property,
        PropertyPhoto,
        PropertyPriceHistory,
        Favorite,
        Rental,
        Transaction,
        LandlordReview,
        Conversation,
        ConversationParticipant,
        Message,
    ],
    subscribers: [],
    logging: true,
    synchronize: true,
});

export default dataSource;
