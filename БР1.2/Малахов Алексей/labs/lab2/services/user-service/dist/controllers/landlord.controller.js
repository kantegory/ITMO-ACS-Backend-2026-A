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
const settings_1 = __importDefault(require("../config/settings"));
const data_source_1 = __importDefault(require("../config/data-source"));
const user_entity_1 = require("../models/user.entity");
let LandlordController = class LandlordController {
    getReviews(id_1) {
        return __awaiter(this, arguments, void 0, function* (id, page = 1, pageSize = 20, res) {
            const landlord = yield data_source_1.default.getRepository(user_entity_1.User).findOneBy({ id });
            if (!landlord)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Арендодатель не найден' });
            // Получаем отзывы из review-service
            try {
                const reviewRes = yield fetch(`${settings_1.default.REVIEW_SERVICE_URL}/internal/reviews/landlord/${id}?page=${page}&page_size=${pageSize}`, { headers: { 'X-Service-Token': settings_1.default.SERVICE_TOKEN } });
                const data = yield reviewRes.json();
                return res.json(data);
            }
            catch (_a) {
                return res.status(502).json({ code: 'SERVICE_UNAVAILABLE', message: 'Review service unavailable' });
            }
        });
    }
};
__decorate([
    (0, routing_controllers_1.Get)('/:id/reviews'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Отзывы об арендодателе' }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.QueryParam)('page')),
    __param(2, (0, routing_controllers_1.QueryParam)('page_size')),
    __param(3, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], LandlordController.prototype, "getReviews", null);
LandlordController = __decorate([
    (0, routing_controllers_2.JsonController)('/landlords')
], LandlordController);
exports.default = LandlordController;
