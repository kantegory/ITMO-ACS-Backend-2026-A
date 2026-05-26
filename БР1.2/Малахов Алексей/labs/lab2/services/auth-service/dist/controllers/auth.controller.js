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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const routing_controllers_2 = require("routing-controllers");
const settings_1 = __importDefault(require("../config/settings"));
const auth_user_entity_1 = require("../models/auth-user.entity");
const check_password_1 = __importDefault(require("../utils/check-password"));
const hash_password_1 = __importDefault(require("../utils/hash-password"));
const data_source_1 = __importDefault(require("../config/data-source"));
const service_auth_middleware_1 = __importDefault(require("../middlewares/service-auth.middleware"));
var UserRole;
(function (UserRole) {
    UserRole["LANDLORD"] = "landlord";
    UserRole["RENTER"] = "renter";
})(UserRole || (UserRole = {}));
class RegisterDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Type)(() => String),
    __metadata("design:type", String)
], RegisterDto.prototype, "first_name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Type)(() => String),
    __metadata("design:type", String)
], RegisterDto.prototype, "last_name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_transformer_1.Type)(() => String),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    (0, class_transformer_1.Type)(() => String),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => String),
    __metadata("design:type", String)
], RegisterDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(UserRole),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "role", void 0);
class LoginDto {
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_transformer_1.Type)(() => String),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Type)(() => String),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class RefreshDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Type)(() => String),
    __metadata("design:type", String)
], RefreshDto.prototype, "refresh_token", void 0);
class ValidateDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Type)(() => String),
    __metadata("design:type", String)
], ValidateDto.prototype, "token", void 0);
function signTokens(userId, roles) {
    const payload = { user: { id: userId, roles } };
    const accessToken = jsonwebtoken_1.default.sign(payload, settings_1.default.JWT_SECRET_KEY, { expiresIn: settings_1.default.JWT_ACCESS_TOKEN_LIFETIME });
    const refreshToken = jsonwebtoken_1.default.sign(Object.assign(Object.assign({}, payload), { type: 'refresh' }), settings_1.default.JWT_SECRET_KEY, { expiresIn: settings_1.default.JWT_REFRESH_TOKEN_LIFETIME });
    return { accessToken, refreshToken };
}
function createUserProfile(user, first_name, last_name, phone, role) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = { id: user.id, first_name, last_name };
            if (phone)
                body.phone = phone;
            if (role)
                body.role = role;
            const res = yield fetch(`${settings_1.default.USER_SERVICE_URL}/internal/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Service-Token': settings_1.default.SERVICE_TOKEN },
                body: JSON.stringify(body),
            });
            const data = yield res.json();
            return { roles: data.roles || (role ? [role] : []) };
        }
        catch (_a) {
            return { roles: role ? [role] : [] };
        }
    });
}
function fetchUserRoles(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch(`${settings_1.default.USER_SERVICE_URL}/internal/users/${userId}`, {
                headers: { 'X-Service-Token': settings_1.default.SERVICE_TOKEN },
            });
            if (!res.ok)
                return [];
            const data = yield res.json();
            return data.roles || [];
        }
        catch (_a) {
            return [];
        }
    });
}
let AuthController = class AuthController {
    register(dto, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = data_source_1.default.getRepository(auth_user_entity_1.AuthUser);
            const existing = yield repo.findOneBy({ email: dto.email });
            if (existing) {
                return res.status(409).json({ code: 'EMAIL_ALREADY_EXISTS', message: 'Email уже зарегистрирован' });
            }
            const user = repo.create({ email: dto.email, passwordHash: (0, hash_password_1.default)(dto.password) });
            yield repo.save(user);
            const { roles } = yield createUserProfile(user, dto.first_name, dto.last_name, dto.phone, dto.role);
            const tokens = signTokens(user.id, roles);
            return res.status(201).json({
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
                user: { id: user.id, email: user.email, roles },
            });
        });
    }
    login(dto, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = data_source_1.default.getRepository(auth_user_entity_1.AuthUser);
            const user = yield repo.findOneBy({ email: dto.email });
            if (!user || !(0, check_password_1.default)(user.passwordHash, dto.password)) {
                return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Неверные учётные данные' });
            }
            const roles = yield fetchUserRoles(user.id);
            const tokens = signTokens(user.id, roles);
            return res.json({
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
                user: { id: user.id, email: user.email, roles },
            });
        });
    }
    refresh(dto, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = jsonwebtoken_1.default.verify(dto.refresh_token, settings_1.default.JWT_SECRET_KEY);
                if (payload.type !== 'refresh') {
                    return res.status(401).json({ code: 'INVALID_REFRESH_TOKEN', message: 'Невалидный refresh token' });
                }
                const user = yield data_source_1.default.getRepository(auth_user_entity_1.AuthUser).findOneBy({ id: payload.user.id });
                if (!user)
                    return res.status(401).json({ code: 'INVALID_REFRESH_TOKEN', message: 'Пользователь не найден' });
                const roles = yield fetchUserRoles(user.id);
                const tokens = signTokens(user.id, roles);
                return res.json({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken, user: { id: user.id, email: user.email, roles } });
            }
            catch (_a) {
                return res.status(401).json({ code: 'INVALID_REFRESH_TOKEN', message: 'Невалидный refresh token' });
            }
        });
    }
    logout(res) {
        return __awaiter(this, void 0, void 0, function* () {
            return res.status(200).json({ message: 'Выход выполнен' });
        });
    }
    validate(dto, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = jsonwebtoken_1.default.verify(dto.token, settings_1.default.JWT_SECRET_KEY);
                return res.json({ user_id: payload.user.id, roles: payload.user.roles || [], is_active: true });
            }
            catch (_a) {
                return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Token is invalid or expired' });
            }
        });
    }
};
__decorate([
    (0, routing_controllers_1.Post)('/register'),
    (0, routing_controllers_1.HttpCode)(201),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Регистрация нового пользователя' }),
    __param(0, (0, routing_controllers_1.Body)({ type: RegisterDto })),
    __param(1, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, routing_controllers_1.Post)('/login'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Вход в систему' }),
    __param(0, (0, routing_controllers_1.Body)({ type: LoginDto })),
    __param(1, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, routing_controllers_1.Post)('/refresh'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Обновление токена' }),
    __param(0, (0, routing_controllers_1.Body)({ type: RefreshDto })),
    __param(1, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RefreshDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, routing_controllers_1.Post)('/logout'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Выход из системы' }),
    __param(0, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, routing_controllers_1.Post)('/internal/validate'),
    (0, routing_controllers_1.UseBefore)(service_auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Валидация JWT (internal)' }),
    __param(0, (0, routing_controllers_1.Body)({ type: ValidateDto })),
    __param(1, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ValidateDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "validate", null);
AuthController = __decorate([
    (0, routing_controllers_2.JsonController)('/auth')
], AuthController);
exports.default = AuthController;
