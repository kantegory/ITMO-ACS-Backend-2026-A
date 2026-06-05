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
const service_auth_middleware_1 = __importDefault(require("../middlewares/service-auth.middleware"));
const data_source_1 = __importDefault(require("../config/data-source"));
const user_entity_1 = require("../models/user.entity");
const user_role_entity_1 = require("../models/user-role.entity");
class CreateUserDto {
}
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateUserDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Type)(() => String),
    __metadata("design:type", String)
], CreateUserDto.prototype, "first_name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Type)(() => String),
    __metadata("design:type", String)
], CreateUserDto.prototype, "last_name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => String),
    __metadata("design:type", String)
], CreateUserDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(user_role_entity_1.UserRole),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "role", void 0);
function buildUserProfile(user, roles) {
    var _a, _b;
    return {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        phone: (_a = user.phone) !== null && _a !== void 0 ? _a : null,
        avatar_url: (_b = user.avatarUrl) !== null && _b !== void 0 ? _b : null,
        roles: roles.map((r) => r.role),
    };
}
let InternalUserController = class InternalUserController {
    createUser(dto, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const repo = data_source_1.default.getRepository(user_entity_1.User);
            const existing = yield repo.findOneBy({ id: dto.id });
            if (existing)
                return res.status(409).json({ code: 'USER_ALREADY_EXISTS', message: 'User already exists' });
            const user = repo.create({ id: dto.id, firstName: dto.first_name, lastName: dto.last_name, phone: (_a = dto.phone) !== null && _a !== void 0 ? _a : null });
            yield repo.save(user);
            if (dto.role) {
                const roleRepo = data_source_1.default.getRepository(user_role_entity_1.UserRoleEntity);
                yield roleRepo.save(roleRepo.create({ userId: user.id, role: dto.role }));
            }
            const roles = yield data_source_1.default.getRepository(user_role_entity_1.UserRoleEntity).findBy({ userId: user.id });
            return res.status(201).json(buildUserProfile(user, roles));
        });
    }
    getUsers(ids, res) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ids)
                return res.status(400).json({ code: 'BAD_REQUEST', message: "Query param 'ids' is required" });
            const idList = ids.split(',').map((s) => parseInt(s.trim())).filter((n) => !isNaN(n));
            if (!idList.length)
                return res.status(400).json({ code: 'BAD_REQUEST', message: 'No valid IDs provided' });
            const users = yield data_source_1.default.getRepository(user_entity_1.User).findByIds(idList);
            const allRoles = yield data_source_1.default.getRepository(user_role_entity_1.UserRoleEntity).find({
                where: idList.map((id) => ({ userId: id })),
            });
            const roleMap = {};
            allRoles.forEach((r) => { var _a; (roleMap[_a = r.userId] || (roleMap[_a] = [])).push(r); });
            return res.json({ users: users.map((u) => buildUserProfile(u, roleMap[u.id] || [])) });
        });
    }
    getUser(id, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield data_source_1.default.getRepository(user_entity_1.User).findOneBy({ id });
            if (!user)
                return res.status(404).json({ code: 'NOT_FOUND', message: `User with id ${id} not found` });
            const roles = yield data_source_1.default.getRepository(user_role_entity_1.UserRoleEntity).findBy({ userId: id });
            return res.json(buildUserProfile(user, roles));
        });
    }
};
__decorate([
    (0, routing_controllers_1.Post)(''),
    (0, routing_controllers_1.UseBefore)(service_auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Создать профиль пользователя (internal)' }),
    __param(0, (0, routing_controllers_1.Body)({ type: CreateUserDto })),
    __param(1, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateUserDto, Object]),
    __metadata("design:returntype", Promise)
], InternalUserController.prototype, "createUser", null);
__decorate([
    (0, routing_controllers_1.Get)(''),
    (0, routing_controllers_1.UseBefore)(service_auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Пакетное получение профилей (internal)' }),
    __param(0, (0, routing_controllers_1.QueryParam)('ids')),
    __param(1, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InternalUserController.prototype, "getUsers", null);
__decorate([
    (0, routing_controllers_1.Get)('/:id'),
    (0, routing_controllers_1.UseBefore)(service_auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Получить профиль пользователя по ID (internal)' }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], InternalUserController.prototype, "getUser", null);
InternalUserController = __decorate([
    (0, routing_controllers_2.JsonController)('/internal/users')
], InternalUserController);
exports.default = InternalUserController;
