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
const routing_controllers_2 = require("routing-controllers");
const service_auth_middleware_1 = __importDefault(require("../middlewares/service-auth.middleware"));
const data_source_1 = __importDefault(require("../config/data-source"));
const rental_entity_1 = require("../models/rental.entity");
const enums_1 = require("../models/enums");
let InternalRentalController = class InternalRentalController {
    check(renterId, ownerId, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!renterId || !ownerId) {
                return res.status(400).json({ code: 'BAD_REQUEST', message: "Query params 'renter_id' and 'owner_id' are required" });
            }
            const rental = yield data_source_1.default.getRepository(rental_entity_1.Rental).findOneBy({
                renterId,
                ownerId,
                status: enums_1.RentalStatus.COMPLETED,
            });
            return res.json({ has_completed_rental: !!rental, rental_id: (_a = rental === null || rental === void 0 ? void 0 : rental.id) !== null && _a !== void 0 ? _a : null });
        });
    }
    getRental(id, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const rental = yield data_source_1.default.getRepository(rental_entity_1.Rental).findOneBy({ id });
            if (!rental)
                return res.status(404).json({ code: 'NOT_FOUND', message: `Rental with id ${id} not found` });
            return res.json({
                id: rental.id, property_id: rental.propertyId,
                renter_id: rental.renterId, owner_id: rental.ownerId,
                status: rental.status, start_date: rental.startDate, end_date: (_a = rental.endDate) !== null && _a !== void 0 ? _a : null,
            });
        });
    }
};
__decorate([
    (0, routing_controllers_1.Get)('/check'),
    (0, routing_controllers_1.UseBefore)(service_auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Проверить наличие завершённой аренды (internal)' }),
    __param(0, (0, routing_controllers_1.QueryParam)('renter_id')),
    __param(1, (0, routing_controllers_1.QueryParam)('owner_id')),
    __param(2, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], InternalRentalController.prototype, "check", null);
__decorate([
    (0, routing_controllers_1.Get)('/:id'),
    (0, routing_controllers_1.UseBefore)(service_auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Получить данные аренды (internal)' }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], InternalRentalController.prototype, "getRental", null);
InternalRentalController = __decorate([
    (0, routing_controllers_2.JsonController)('/internal/rentals')
], InternalRentalController);
exports.default = InternalRentalController;
