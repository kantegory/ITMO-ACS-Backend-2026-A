import { createDataSource } from '../../shared/data-source-factory';
import { Conversation } from './models/conversation.entity';
import { Message } from './models/message.entity';

const dataSource = createDataSource('messaging', [Conversation, Message]);

export default dataSource;
