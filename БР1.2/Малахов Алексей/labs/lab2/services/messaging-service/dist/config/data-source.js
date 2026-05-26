"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const settings_1 = __importDefault(require("./settings"));
const conversation_entity_1 = require("../models/conversation.entity");
const conversation_participant_entity_1 = require("../models/conversation-participant.entity");
const message_entity_1 = require("../models/message.entity");
const dataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: settings_1.default.DB_HOST,
    port: settings_1.default.DB_PORT,
    username: settings_1.default.DB_USER,
    password: settings_1.default.DB_PASSWORD,
    database: settings_1.default.DB_NAME,
    entities: [conversation_entity_1.Conversation, conversation_participant_entity_1.ConversationParticipant, message_entity_1.Message],
    logging: false,
    synchronize: true,
});
exports.default = dataSource;
