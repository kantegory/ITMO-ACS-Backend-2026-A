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
const transaction_entity_1 = require("../models/transaction.entity");
const rental_entity_1 = require("../models/rental.entity");
const enums_1 = require("../models/enums");
class CreateTransactionDto {
}
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateTransactionDto.prototype, "rental_id", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.TransactionType),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateTransactionDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.CurrencyType),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.PaymentMethod),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "payment_method", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "period_start", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "period_end", void 0);
let TransactionController = class TransactionController {
    list(req_1, rentalId_1, type_1, status_1) {
        return __awaiter(this, arguments, void 0, function* (req, rentalId, type, status, page = 1, pageSize = 20, res) {
            const qb = data_source_1.default.getRepository(transaction_entity_1.Transaction).createQueryBuilder('t')
                .innerJoin('t.rental', 'r')
                .where('r.renterId = :uid', { uid: req.user.id });
            if (rentalId)
                qb.andWhere('t.rentalId = :rentalId', { rentalId });
            if (type)
                qb.andWhere('t.type = :type', { type });
            if (status)
                qb.andWhere('t.status = :status', { status });
            qb.orderBy('t.createdAt', 'DESC').skip((page - 1) * pageSize).take(pageSize);
            const [items, total] = yield qb.getManyAndCount();
            return res.json({
                items: items.map((t) => {
                    var _a, _b, _c;
                    return ({
                        id: t.id, type: t.type, amount: t.amount, currency: t.currency,
                        status: t.status, payment_method: t.paymentMethod,
                        payment_date: (_a = t.paymentDate) !== null && _a !== void 0 ? _a : null,
                        period_start: (_b = t.periodStart) !== null && _b !== void 0 ? _b : null, period_end: (_c = t.periodEnd) !== null && _c !== void 0 ? _c : null,
                        created_at: t.createdAt,
                    });
                }),
                total,
            });
        });
    }
    create(req, dto, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            const rental = yield data_source_1.default.getRepository(rental_entity_1.Rental).findOneBy({ id: dto.rental_id });
            if (!rental)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Аренда не найдена' });
            if (rental.renterId !== req.user.id)
                return res.status(403).json({ code: 'FORBIDDEN', message: 'Нет доступа' });
            const repo = data_source_1.default.getRepository(transaction_entity_1.Transaction);
            const transaction = repo.create({
                rentalId: dto.rental_id, type: dto.type, amount: dto.amount,
                currency: dto.currency, paymentMethod: dto.payment_method,
                periodStart: (_a = dto.period_start) !== null && _a !== void 0 ? _a : null, periodEnd: (_b = dto.period_end) !== null && _b !== void 0 ? _b : null,
                status: enums_1.TransactionStatus.PENDING,
            });
            yield repo.save(transaction);
            return res.status(201).json({
                id: transaction.id, type: transaction.type, amount: transaction.amount,
                currency: transaction.currency, status: transaction.status,
                payment_method: transaction.paymentMethod,
                payment_date: (_c = transaction.paymentDate) !== null && _c !== void 0 ? _c : null,
                period_start: (_d = transaction.periodStart) !== null && _d !== void 0 ? _d : null,
                period_end: (_e = transaction.periodEnd) !== null && _e !== void 0 ? _e : null,
                created_at: transaction.createdAt,
            });
        });
    }
};
__decorate([
    (0, routing_controllers_1.Get)(''),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'История транзакций пользователя', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Req)()),
    __param(1, (0, routing_controllers_1.QueryParam)('rental_id')),
    __param(2, (0, routing_controllers_1.QueryParam)('type')),
    __param(3, (0, routing_controllers_1.QueryParam)('status')),
    __param(4, (0, routing_controllers_1.QueryParam)('page')),
    __param(5, (0, routing_controllers_1.QueryParam)('page_size')),
    __param(6, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, String, String, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], TransactionController.prototype, "list", null);
__decorate([
    (0, routing_controllers_1.Post)(''),
    (0, routing_controllers_1.HttpCode)(201),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Создать транзакцию', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Req)()),
    __param(1, (0, routing_controllers_1.Body)({ type: CreateTransactionDto })),
    __param(2, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateTransactionDto, Object]),
    __metadata("design:returntype", Promise)
], TransactionController.prototype, "create", null);
TransactionController = __decorate([
    (0, routing_controllers_2.JsonController)('/transactions')
], TransactionController);
exports.default = TransactionController;
