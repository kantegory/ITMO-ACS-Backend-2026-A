"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const routing_controllers_1 = require("routing-controllers");
const routing_controllers_openapi_1 = require("routing-controllers-openapi");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const routing_controllers_2 = require("routing-controllers");
const settings_1 = __importDefault(require("../config/settings"));
const auth_middleware_1 = __importDefault(require("../middlewares/auth.middleware"));
const data_source_1 = __importDefault(require("../config/data-source"));
const conversation_entity_1 = require("../models/conversation.entity");
const conversation_participant_entity_1 = require("../models/conversation-participant.entity");
const message_entity_1 = require("../models/message.entity");
class StartConversationDto {
}
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], StartConversationDto.prototype, "recipient_id", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], StartConversationDto.prototype, "property_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], StartConversationDto.prototype, "content", void 0);
class SendMessageDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], SendMessageDto.prototype, "content", void 0);
function fetchUserInfo(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch(`${settings_1.default.USER_SERVICE_URL}/internal/users/${userId}`, {
                headers: { 'X-Service-Token': settings_1.default.SERVICE_TOKEN },
            });
            if (!res.ok)
                return null;
            return res.json();
        }
        catch (_a) {
            return null;
        }
    });
}
let ConversationController = class ConversationController {
    list(req_1) {
        return __awaiter(this, arguments, void 0, function* (req, page = 1, pageSize = 20, res) {
            const uid = req.user.id;
            const qb = data_source_1.default.getRepository(conversation_entity_1.Conversation).createQueryBuilder('c')
                .where('c.userOneId = :uid OR c.userTwoId = :uid', { uid })
                .orderBy('c.updatedAt', 'DESC')
                .skip((page - 1) * pageSize)
                .take(pageSize);
            const [convs, total] = yield qb.getManyAndCount();
            const result = yield Promise.all(convs.map((c) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d;
                const companionId = c.userOneId === uid ? c.userTwoId : c.userOneId;
                const companion = yield fetchUserInfo(companionId);
                const lastMsg = yield data_source_1.default.getRepository(message_entity_1.Message).findOne({
                    where: { conversationId: c.id },
                    order: { createdAt: 'DESC' },
                });
                const unread = yield data_source_1.default.getRepository(message_entity_1.Message).count({
                    where: { conversationId: c.id, isRead: false, senderId: companionId },
                });
                return {
                    id: c.id,
                    companion: companion
                        ? { id: companion.id, first_name: companion.first_name, last_name: companion.last_name, avatar_url: (_a = companion.avatar_url) !== null && _a !== void 0 ? _a : null }
                        : { id: companionId },
                    property_id: (_b = c.propertyId) !== null && _b !== void 0 ? _b : null,
                    last_message: (_c = lastMsg === null || lastMsg === void 0 ? void 0 : lastMsg.content) !== null && _c !== void 0 ? _c : null,
                    last_message_at: (_d = lastMsg === null || lastMsg === void 0 ? void 0 : lastMsg.createdAt) !== null && _d !== void 0 ? _d : null,
                    unread_count: unread,
                };
            })));
            return res.json({ items: result, total });
        });
    }
    start(req, dto, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const uid = req.user.id;
            const recipientId = dto.recipient_id;
            if (recipientId === uid)
                return res.status(400).json({ code: 'INVALID_RECIPIENT', message: 'Нельзя начать диалог с самим собой' });
            const recipient = yield fetchUserInfo(recipientId);
            if (!recipient)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Получатель не найден' });
            const userOneId = Math.min(uid, recipientId);
            const userTwoId = Math.max(uid, recipientId);
            const propertyId = (_a = dto.property_id) !== null && _a !== void 0 ? _a : null;
            const convRepo = data_source_1.default.getRepository(conversation_entity_1.Conversation);
            const existing = yield convRepo.findOneBy(Object.assign({ userOneId, userTwoId }, (propertyId ? { propertyId } : {})));
            if (existing)
                return res.status(409).json({ code: 'CONVERSATION_EXISTS', message: 'Диалог уже существует' });
            const conv = convRepo.create({ userOneId, userTwoId, propertyId });
            yield convRepo.save(conv);
            const partRepo = data_source_1.default.getRepository(conversation_participant_entity_1.ConversationParticipant);
            yield partRepo.save([
                partRepo.create({ conversationId: conv.id, userId: userOneId }),
                partRepo.create({ conversationId: conv.id, userId: userTwoId }),
            ]);
            const msgRepo = data_source_1.default.getRepository(message_entity_1.Message);
            yield msgRepo.save(msgRepo.create({ conversationId: conv.id, senderId: uid, content: dto.content }));
            yield this._touchConversation(conv.id);
            return res.status(201).json(yield this._buildDetail(conv.id, uid, 1, 20));
        });
    }
    getById(id_1, req_1) {
        return __awaiter(this, arguments, void 0, function* (id, req, page = 1, pageSize = 20, res) {
            const conv = yield data_source_1.default.getRepository(conversation_entity_1.Conversation).findOneBy({ id });
            if (!conv)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Диалог не найден' });
            const uid = req.user.id;
            if (conv.userOneId !== uid && conv.userTwoId !== uid)
                return res.status(403).json({ code: 'FORBIDDEN', message: 'Нет доступа' });
            return res.json(yield this._buildDetail(id, uid, page, pageSize));
        });
    }
    sendMessage(id, req, dto, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const conv = yield data_source_1.default.getRepository(conversation_entity_1.Conversation).findOneBy({ id });
            if (!conv)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Диалог не найден' });
            const uid = req.user.id;
            if (conv.userOneId !== uid && conv.userTwoId !== uid)
                return res.status(403).json({ code: 'FORBIDDEN', message: 'Нет доступа' });
            const msgRepo = data_source_1.default.getRepository(message_entity_1.Message);
            const msg = msgRepo.create({ conversationId: id, senderId: uid, content: dto.content });
            yield msgRepo.save(msg);
            yield this._touchConversation(id);
            return res.status(201).json({ id: msg.id, sender_id: msg.senderId, content: msg.content, is_read: msg.isRead, created_at: msg.createdAt });
        });
    }
    markRead(id, req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const conv = yield data_source_1.default.getRepository(conversation_entity_1.Conversation).findOneBy({ id });
            if (!conv)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Диалог не найден' });
            const uid = req.user.id;
            if (conv.userOneId !== uid && conv.userTwoId !== uid)
                return res.status(403).json({ code: 'FORBIDDEN', message: 'Нет доступа' });
            yield data_source_1.default.getRepository(message_entity_1.Message).createQueryBuilder()
                .update(message_entity_1.Message).set({ isRead: true })
                .where('conversationId = :id', { id })
                .andWhere('isRead = false')
                .andWhere('senderId != :uid', { uid })
                .execute();
            return res.json({ message: 'Прочитано' });
        });
    }
    _touchConversation(convId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield data_source_1.default.getRepository(conversation_entity_1.Conversation).createQueryBuilder()
                .update(conversation_entity_1.Conversation).set({ updatedAt: () => 'CURRENT_TIMESTAMP' })
                .where('id = :id', { id: convId }).execute();
        });
    }
    _buildDetail(convId, currentUserId, page, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const conv = yield data_source_1.default.getRepository(conversation_entity_1.Conversation).findOneBy({ id: convId });
            const companionId = conv.userOneId === currentUserId ? conv.userTwoId : conv.userOneId;
            const companion = yield fetchUserInfo(companionId);
            const [messages, totalMessages] = yield data_source_1.default.getRepository(message_entity_1.Message).findAndCount({
                where: { conversationId: convId },
                order: { createdAt: 'DESC' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            });
            return {
                id: conv.id,
                companion: companion
                    ? { id: companion.id, first_name: companion.first_name, last_name: companion.last_name, avatar_url: (_a = companion.avatar_url) !== null && _a !== void 0 ? _a : null }
                    : { id: companionId },
                property_id: (_b = conv.propertyId) !== null && _b !== void 0 ? _b : null,
                messages: messages.map((m) => ({ id: m.id, sender_id: m.senderId, content: m.content, is_read: m.isRead, created_at: m.createdAt })),
                total_messages: totalMessages, page, page_size: pageSize,
            };
        });
    }
};
__decorate([
    (0, routing_controllers_1.Get)(''),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Список диалогов', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Req)()),
    __param(1, (0, routing_controllers_1.QueryParam)('page')),
    __param(2, (0, routing_controllers_1.QueryParam)('page_size')),
    __param(3, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "list", null);
__decorate([
    (0, routing_controllers_1.Post)(''),
    (0, routing_controllers_1.HttpCode)(201),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Начать новый диалог', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Req)()),
    __param(1, (0, routing_controllers_1.Body)({ type: StartConversationDto })),
    __param(2, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, StartConversationDto, Object]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "start", null);
__decorate([
    (0, routing_controllers_1.Get)('/:id'),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Получить диалог с сообщениями', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Req)()),
    __param(2, (0, routing_controllers_1.QueryParam)('page')),
    __param(3, (0, routing_controllers_1.QueryParam)('page_size')),
    __param(4, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "getById", null);
__decorate([
    (0, routing_controllers_1.Post)('/:id/messages'),
    (0, routing_controllers_1.HttpCode)(201),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Отправить сообщение', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Req)()),
    __param(2, (0, routing_controllers_1.Body)({ type: SendMessageDto })),
    __param(3, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, SendMessageDto, Object]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "sendMessage", null);
__decorate([
    (0, routing_controllers_1.Post)('/:id/read'),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Отметить сообщения как прочитанные', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Req)()),
    __param(2, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], ConversationController.prototype, "markRead", null);
ConversationController = __decorate([
    (0, routing_controllers_2.JsonController)('/conversations')
], ConversationController);
exports.default = ConversationController;
