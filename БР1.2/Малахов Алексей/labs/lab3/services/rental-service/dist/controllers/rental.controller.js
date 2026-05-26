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
const publisher_1 = require("../messaging/publisher");
const rental_entity_1 = require("../models/rental.entity");
const enums_1 = require("../models/enums");
class CreateRentalDto {
}
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateRentalDto.prototype, "property_id", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateRentalDto.prototype, "agreed_price", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateRentalDto.prototype, "start_date", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateRentalDto.prototype, "end_date", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateRentalDto.prototype, "deposit_amount", void 0);
class UpdateRentalStatusDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.RentalStatus),
    __metadata("design:type", String)
], UpdateRentalStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateRentalStatusDto.prototype, "cancel_reason", void 0);
const VALID_TRANSITIONS = {
    [enums_1.RentalStatus.PENDING]: [enums_1.RentalStatus.ACTIVE, enums_1.RentalStatus.CANCELLED],
    [enums_1.RentalStatus.ACTIVE]: [enums_1.RentalStatus.COMPLETED, enums_1.RentalStatus.CANCELLED],
    [enums_1.RentalStatus.COMPLETED]: [],
    [enums_1.RentalStatus.CANCELLED]: [],
};
function fetchProperty(propertyId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch(`${settings_1.default.PROPERTY_SERVICE_URL}/internal/properties/${propertyId}`, {
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
function fetchUser(userId) {
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
let RentalController = class RentalController {
    list(req_1, status_1, role_1) {
        return __awaiter(this, arguments, void 0, function* (req, status, role, page = 1, pageSize = 20, res) {
            const repo = data_source_1.default.getRepository(rental_entity_1.Rental);
            const qb = repo.createQueryBuilder('r');
            if (role === 'landlord') {
                qb.where('r.ownerId = :uid', { uid: req.user.id });
            }
            else {
                qb.where('r.renterId = :uid', { uid: req.user.id });
            }
            if (status)
                qb.andWhere('r.status = :status', { status });
            qb.orderBy('r.createdAt', 'DESC').skip((page - 1) * pageSize).take(pageSize);
            const [items, total] = yield qb.getManyAndCount();
            return res.json({
                items: items.map((r) => {
                    var _a;
                    return ({
                        id: r.id, property_id: r.propertyId,
                        agreed_price: r.agreedPrice, currency: r.currency,
                        start_date: r.startDate, end_date: (_a = r.endDate) !== null && _a !== void 0 ? _a : null, status: r.status,
                    });
                }),
                total,
            });
        });
    }
    create(req, dto, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const property = yield fetchProperty(dto.property_id);
            if (!property)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Объект не найден' });
            if (property.owner_id === req.user.id)
                return res.status(400).json({ code: 'CANNOT_RENT_OWN_PROPERTY', message: 'Нельзя арендовать свой объект' });
            if (property.status === 'rented')
                return res.status(409).json({ code: 'PROPERTY_ALREADY_RENTED', message: 'Объект уже арендован' });
            if (property.status === 'archived')
                return res.status(409).json({ code: 'PROPERTY_NOT_AVAILABLE', message: 'Объект недоступен' });
            const repo = data_source_1.default.getRepository(rental_entity_1.Rental);
            const rental = repo.create({
                propertyId: dto.property_id, renterId: req.user.id, ownerId: property.owner_id,
                agreedPrice: dto.agreed_price, currency: property.currency,
                depositAmount: (_a = dto.deposit_amount) !== null && _a !== void 0 ? _a : null,
                startDate: dto.start_date, endDate: (_b = dto.end_date) !== null && _b !== void 0 ? _b : null,
                status: enums_1.RentalStatus.PENDING,
            });
            yield repo.save(rental);
            return res.status(201).json(yield this._buildDetail(rental.id));
        });
    }
    getById(id, req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const rental = yield data_source_1.default.getRepository(rental_entity_1.Rental).findOne({ where: { id }, relations: ['transactions'] });
            if (!rental)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Аренда не найдена' });
            if (rental.renterId !== req.user.id && rental.ownerId !== req.user.id) {
                return res.status(403).json({ code: 'FORBIDDEN', message: 'Нет доступа' });
            }
            return res.json(yield this._buildDetail(id));
        });
    }
    updateStatus(id, req, dto, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = data_source_1.default.getRepository(rental_entity_1.Rental);
            const rental = yield repo.findOneBy({ id });
            if (!rental)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Аренда не найдена' });
            if (rental.renterId !== req.user.id && rental.ownerId !== req.user.id) {
                return res.status(403).json({ code: 'FORBIDDEN', message: 'Нет доступа' });
            }
            const allowed = VALID_TRANSITIONS[rental.status];
            if (!allowed.includes(dto.status)) {
                return res.status(422).json({ code: 'INVALID_STATUS_TRANSITION', message: 'Недопустимый переход статуса' });
            }
            rental.status = dto.status;
            if (dto.cancel_reason)
                rental.cancelReason = dto.cancel_reason;
            if (dto.status === enums_1.RentalStatus.CANCELLED)
                rental.cancelledAt = new Date();
            yield repo.save(rental);
            if (dto.status === enums_1.RentalStatus.ACTIVE) {
                yield (0, publisher_1.publishRentalStatusChanged)(rental.id, rental.propertyId, 'rented');
            }
            else if (dto.status === enums_1.RentalStatus.COMPLETED || dto.status === enums_1.RentalStatus.CANCELLED) {
                yield (0, publisher_1.publishRentalStatusChanged)(rental.id, rental.propertyId, 'active');
            }
            return res.json(yield this._buildDetail(id));
        });
    }
    _buildDetail(rentalId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            const rental = yield data_source_1.default.getRepository(rental_entity_1.Rental).findOne({ where: { id: rentalId }, relations: ['transactions'] });
            if (!rental)
                return null;
            const [property, renter] = yield Promise.all([
                fetchProperty(rental.propertyId),
                fetchUser(rental.renterId),
            ]);
            return {
                id: rental.id,
                property: property ? {
                    id: property.id, title: property.title, type: property.type,
                    city: property.city, price_per_month: property.price_per_month,
                    currency: property.currency, status: property.status,
                } : { id: rental.propertyId },
                renter: renter ? {
                    id: renter.id, first_name: renter.first_name,
                    last_name: renter.last_name, avatar_url: (_a = renter.avatar_url) !== null && _a !== void 0 ? _a : null,
                } : { id: rental.renterId },
                agreed_price: rental.agreedPrice, currency: rental.currency,
                deposit_amount: (_b = rental.depositAmount) !== null && _b !== void 0 ? _b : null,
                deposit_status: (_c = rental.depositStatus) !== null && _c !== void 0 ? _c : null,
                start_date: rental.startDate, end_date: (_d = rental.endDate) !== null && _d !== void 0 ? _d : null,
                status: rental.status,
                transactions: ((_e = rental.transactions) !== null && _e !== void 0 ? _e : []).map((t) => {
                    var _a, _b, _c;
                    return ({
                        id: t.id, type: t.type, amount: t.amount, currency: t.currency,
                        status: t.status, payment_method: t.paymentMethod,
                        payment_date: (_a = t.paymentDate) !== null && _a !== void 0 ? _a : null,
                        period_start: (_b = t.periodStart) !== null && _b !== void 0 ? _b : null, period_end: (_c = t.periodEnd) !== null && _c !== void 0 ? _c : null,
                        created_at: t.createdAt,
                    });
                }),
                cancel_reason: (_f = rental.cancelReason) !== null && _f !== void 0 ? _f : null,
                created_at: rental.createdAt,
            };
        });
    }
};
__decorate([
    (0, routing_controllers_1.Get)(''),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Список аренд текущего пользователя', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Req)()),
    __param(1, (0, routing_controllers_1.QueryParam)('status')),
    __param(2, (0, routing_controllers_1.QueryParam)('role')),
    __param(3, (0, routing_controllers_1.QueryParam)('page')),
    __param(4, (0, routing_controllers_1.QueryParam)('page_size')),
    __param(5, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], RentalController.prototype, "list", null);
__decorate([
    (0, routing_controllers_1.Post)(''),
    (0, routing_controllers_1.HttpCode)(201),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Создать заявку на аренду', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Req)()),
    __param(1, (0, routing_controllers_1.Body)({ type: CreateRentalDto })),
    __param(2, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateRentalDto, Object]),
    __metadata("design:returntype", Promise)
], RentalController.prototype, "create", null);
__decorate([
    (0, routing_controllers_1.Get)('/:id'),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Детали аренды', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Req)()),
    __param(2, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], RentalController.prototype, "getById", null);
__decorate([
    (0, routing_controllers_1.Patch)('/:id/status'),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Изменить статус аренды', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Req)()),
    __param(2, (0, routing_controllers_1.Body)({ type: UpdateRentalStatusDto })),
    __param(3, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, UpdateRentalStatusDto, Object]),
    __metadata("design:returntype", Promise)
], RentalController.prototype, "updateStatus", null);
RentalController = __decorate([
    (0, routing_controllers_2.JsonController)('/rentals')
], RentalController);
exports.default = RentalController;
