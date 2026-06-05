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
const auth_middleware_1 = __importDefault(require("../middlewares/auth.middleware"));
const data_source_1 = __importDefault(require("../config/data-source"));
const user_entity_1 = require("../models/user.entity");
const user_role_entity_1 = require("../models/user-role.entity");
class UpdateProfileDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => String),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "first_name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => String),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "last_name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => String),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => String),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "avatar_url", void 0);
class AddRoleDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(user_role_entity_1.UserRole),
    __metadata("design:type", String)
], AddRoleDto.prototype, "role", void 0);
function buildProfile(user, roles) {
    var _a, _b;
    return {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        phone: (_a = user.phone) !== null && _a !== void 0 ? _a : null,
        avatar_url: (_b = user.avatarUrl) !== null && _b !== void 0 ? _b : null,
        roles: roles.map((r) => r.role),
        created_at: user.createdAt,
    };
}
let ProfileController = class ProfileController {
    getProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield data_source_1.default.getRepository(user_entity_1.User).findOneBy({ id: req.user.id });
            if (!user)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Пользователь не найден' });
            const roles = yield data_source_1.default.getRepository(user_role_entity_1.UserRoleEntity).findBy({ userId: user.id });
            return res.json(buildProfile(user, roles));
        });
    }
    updateProfile(req, dto, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = data_source_1.default.getRepository(user_entity_1.User);
            const user = yield repo.findOneBy({ id: req.user.id });
            if (!user)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Пользователь не найден' });
            if (dto.first_name !== undefined)
                user.firstName = dto.first_name;
            if (dto.last_name !== undefined)
                user.lastName = dto.last_name;
            if (dto.phone !== undefined)
                user.phone = dto.phone;
            if (dto.avatar_url !== undefined)
                user.avatarUrl = dto.avatar_url;
            yield repo.save(user);
            const roles = yield data_source_1.default.getRepository(user_role_entity_1.UserRoleEntity).findBy({ userId: user.id });
            return res.json(buildProfile(user, roles));
        });
    }
    addRole(req, dto, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const roleRepo = data_source_1.default.getRepository(user_role_entity_1.UserRoleEntity);
            const existing = yield roleRepo.findOneBy({ userId: req.user.id, role: dto.role });
            if (existing)
                return res.status(409).json({ code: 'ROLE_ALREADY_ASSIGNED', message: 'Роль уже назначена' });
            yield roleRepo.save(roleRepo.create({ userId: req.user.id, role: dto.role }));
            const user = yield data_source_1.default.getRepository(user_entity_1.User).findOneBy({ id: req.user.id });
            const roles = yield roleRepo.findBy({ userId: req.user.id });
            return res.status(201).json(buildProfile(user, roles));
        });
    }
};
__decorate([
    (0, routing_controllers_1.Get)(''),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Получить профиль текущего пользователя', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Req)()),
    __param(1, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "getProfile", null);
__decorate([
    (0, routing_controllers_1.Patch)(''),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Обновить профиль', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Req)()),
    __param(1, (0, routing_controllers_1.Body)({ type: UpdateProfileDto })),
    __param(2, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UpdateProfileDto, Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "updateProfile", null);
__decorate([
    (0, routing_controllers_1.Post)('/roles'),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Добавить роль пользователю', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Req)()),
    __param(1, (0, routing_controllers_1.Body)({ type: AddRoleDto })),
    __param(2, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, AddRoleDto, Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "addRole", null);
ProfileController = __decorate([
    (0, routing_controllers_2.JsonController)('/profile')
], ProfileController);
exports.default = ProfileController;
