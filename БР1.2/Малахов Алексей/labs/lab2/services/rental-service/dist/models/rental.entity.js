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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rental = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("./enums");
const transaction_entity_1 = require("./transaction.entity");
const decimal_transformer_1 = require("../utils/decimal-transformer");
let Rental = class Rental extends typeorm_1.BaseEntity {
};
exports.Rental = Rental;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Rental.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", Number)
], Rental.prototype, "propertyId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", Number)
], Rental.prototype, "renterId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", Number)
], Rental.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: false, transformer: decimal_transformer_1.decimalTransformer }),
    __metadata("design:type", Number)
], Rental.prototype, "agreedPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.CurrencyType, nullable: false, default: enums_1.CurrencyType.RUB }),
    __metadata("design:type", String)
], Rental.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: true, transformer: decimal_transformer_1.decimalTransformer }),
    __metadata("design:type", Number)
], Rental.prototype, "depositAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.DepositStatus, nullable: true }),
    __metadata("design:type", String)
], Rental.prototype, "depositStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Rental.prototype, "depositReturnedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: false }),
    __metadata("design:type", String)
], Rental.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", String)
], Rental.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.RentalStatus, nullable: false, default: enums_1.RentalStatus.PENDING }),
    __metadata("design:type", String)
], Rental.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Rental.prototype, "cancelledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Rental.prototype, "cancelReason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Rental.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Rental.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => transaction_entity_1.Transaction, (t) => t.rental),
    __metadata("design:type", Array)
], Rental.prototype, "transactions", void 0);
exports.Rental = Rental = __decorate([
    (0, typeorm_1.Entity)('rentals'),
    (0, typeorm_1.Index)(['propertyId', 'status'])
], Rental);
