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
const routing_controllers_2 = require("routing-controllers");
const service_auth_middleware_1 = __importDefault(require("../middlewares/service-auth.middleware"));
const data_source_1 = __importDefault(require("../config/data-source"));
const property_entity_1 = require("../models/property.entity");
const enums_1 = require("../models/enums");
const VALID_TRANSITIONS = {
    [enums_1.PropertyStatus.ACTIVE]: [enums_1.PropertyStatus.RENTED, enums_1.PropertyStatus.ARCHIVED],
    [enums_1.PropertyStatus.RENTED]: [enums_1.PropertyStatus.ACTIVE, enums_1.PropertyStatus.ARCHIVED],
    [enums_1.PropertyStatus.ARCHIVED]: [enums_1.PropertyStatus.ACTIVE],
};
class UpdateStatusDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.PropertyStatus),
    __metadata("design:type", String)
], UpdateStatusDto.prototype, "status", void 0);
let InternalPropertyController = class InternalPropertyController {
    getProperty(id, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const property = yield data_source_1.default.getRepository(property_entity_1.Property).findOneBy({ id });
            if (!property)
                return res.status(404).json({ code: 'NOT_FOUND', message: `Property with id ${id} not found` });
            return res.json({
                id: property.id, owner_id: property.ownerId, title: property.title,
                type: property.type, status: property.status,
                price_per_month: property.pricePerMonth, currency: property.currency,
                city: property.city,
            });
        });
    }
    updateStatus(id, dto, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const repo = data_source_1.default.getRepository(property_entity_1.Property);
            const property = yield repo.findOneBy({ id });
            if (!property)
                return res.status(404).json({ code: 'NOT_FOUND', message: `Property with id ${id} not found` });
            const allowed = (_a = VALID_TRANSITIONS[property.status]) !== null && _a !== void 0 ? _a : [];
            if (!allowed.includes(dto.status)) {
                return res.status(422).json({ code: 'UNPROCESSABLE_ENTITY', message: `Cannot transition from '${property.status}' to '${dto.status}'` });
            }
            property.status = dto.status;
            yield repo.save(property);
            return res.json({ id: property.id, status: property.status });
        });
    }
};
__decorate([
    (0, routing_controllers_1.Get)('/:id'),
    (0, routing_controllers_1.UseBefore)(service_auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Получить данные объекта (internal)' }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], InternalPropertyController.prototype, "getProperty", null);
__decorate([
    (0, routing_controllers_1.Patch)('/:id/status'),
    (0, routing_controllers_1.UseBefore)(service_auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Обновить статус объекта (internal)' }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Body)({ type: UpdateStatusDto })),
    __param(2, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, UpdateStatusDto, Object]),
    __metadata("design:returntype", Promise)
], InternalPropertyController.prototype, "updateStatus", null);
InternalPropertyController = __decorate([
    (0, routing_controllers_2.JsonController)('/internal/properties')
], InternalPropertyController);
exports.default = InternalPropertyController;
