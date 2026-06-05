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
const landlord_review_entity_1 = require("../models/landlord-review.entity");
class CreateReviewDto {
}
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateReviewDto.prototype, "rental_id", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateReviewDto.prototype, "rating", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateReviewDto.prototype, "comment", void 0);
function fetchRental(rentalId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch(`${settings_1.default.RENTAL_SERVICE_URL}/internal/rentals/${rentalId}`, {
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
let ReviewController = class ReviewController {
    create(req, dto, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const rental = yield fetchRental(dto.rental_id);
            if (!rental)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Аренда не найдена' });
            if (rental.renter_id !== req.user.id) {
                return res.status(403).json({ code: 'FORBIDDEN', message: 'Нет доступа' });
            }
            if (rental.status !== 'completed') {
                return res.status(422).json({ code: 'RENTAL_NOT_COMPLETED', message: 'Аренда не завершена' });
            }
            const reviewRepo = data_source_1.default.getRepository(landlord_review_entity_1.LandlordReview);
            const existing = yield reviewRepo.findOneBy({ rentalId: dto.rental_id, reviewerId: req.user.id });
            if (existing)
                return res.status(409).json({ code: 'REVIEW_ALREADY_EXISTS', message: 'Отзыв уже существует' });
            const landlordId = rental.owner_id;
            const review = reviewRepo.create({
                landlordId,
                reviewerId: req.user.id,
                rentalId: dto.rental_id,
                rating: dto.rating,
                comment: (_a = dto.comment) !== null && _a !== void 0 ? _a : null,
            });
            yield reviewRepo.save(review);
            const reviewer = yield fetchUser(req.user.id);
            return res.status(201).json({
                id: review.id,
                reviewer: reviewer
                    ? { id: reviewer.id, first_name: reviewer.first_name, last_name: reviewer.last_name, avatar_url: (_b = reviewer.avatar_url) !== null && _b !== void 0 ? _b : null }
                    : { id: req.user.id },
                rating: review.rating,
                comment: (_c = review.comment) !== null && _c !== void 0 ? _c : null,
                created_at: review.createdAt,
            });
        });
    }
};
__decorate([
    (0, routing_controllers_1.Post)(''),
    (0, routing_controllers_1.HttpCode)(201),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Оставить отзыв об арендодателе', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Req)()),
    __param(1, (0, routing_controllers_1.Body)({ type: CreateReviewDto })),
    __param(2, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateReviewDto, Object]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "create", null);
ReviewController = __decorate([
    (0, routing_controllers_2.JsonController)('/reviews')
], ReviewController);
exports.default = ReviewController;
