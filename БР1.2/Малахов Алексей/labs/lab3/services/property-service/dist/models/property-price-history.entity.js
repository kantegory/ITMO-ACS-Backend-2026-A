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
exports.PropertyPriceHistory = void 0;
const typeorm_1 = require("typeorm");
const property_entity_1 = require("./property.entity");
const enums_1 = require("./enums");
const decimal_transformer_1 = require("../utils/decimal-transformer");
let PropertyPriceHistory = class PropertyPriceHistory extends typeorm_1.BaseEntity {
};
exports.PropertyPriceHistory = PropertyPriceHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PropertyPriceHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", Number)
], PropertyPriceHistory.prototype, "propertyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, nullable: false, transformer: decimal_transformer_1.decimalTransformer }),
    __metadata("design:type", Number)
], PropertyPriceHistory.prototype, "pricePerMonth", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: enums_1.CurrencyType, nullable: false }),
    __metadata("design:type", String)
], PropertyPriceHistory.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PropertyPriceHistory.prototype, "changedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => property_entity_1.Property, (p) => p.priceHistory, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'propertyId' }),
    __metadata("design:type", property_entity_1.Property)
], PropertyPriceHistory.prototype, "property", void 0);
exports.PropertyPriceHistory = PropertyPriceHistory = __decorate([
    (0, typeorm_1.Entity)('property_price_history')
], PropertyPriceHistory);
