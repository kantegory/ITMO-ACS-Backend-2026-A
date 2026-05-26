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
const service_auth_middleware_1 = __importDefault(require("../middlewares/service-auth.middleware"));
const data_source_1 = __importDefault(require("../config/data-source"));
const landlord_review_entity_1 = require("../models/landlord-review.entity");
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
let InternalReviewController = class InternalReviewController {
    getLandlordRating(landlordId, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const reviewRepo = data_source_1.default.getRepository(landlord_review_entity_1.LandlordReview);
            const agg = yield reviewRepo
                .createQueryBuilder('r')
                .select('COALESCE(AVG(r.rating), 0)', 'avg')
                .addSelect('COUNT(r.id)', 'count')
                .where('r.landlordId = :landlordId AND r.deletedAt IS NULL', { landlordId })
                .getRawOne();
            const count = parseInt(agg.count);
            return res.json({
                average_rating: count > 0 ? parseFloat(parseFloat(agg.avg).toFixed(2)) : null,
                review_count: count,
            });
        });
    }
    getLandlordReviews(id_1) {
        return __awaiter(this, arguments, void 0, function* (id, page = 1, pageSize = 20, res) {
            const reviewRepo = data_source_1.default.getRepository(landlord_review_entity_1.LandlordReview);
            const [items, total] = yield reviewRepo.findAndCount({
                where: { landlordId: id },
                order: { createdAt: 'DESC' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            });
            const agg = yield reviewRepo
                .createQueryBuilder('r')
                .select('COALESCE(AVG(r.rating), 0)', 'avg')
                .where('r.landlordId = :id AND r.deletedAt IS NULL', { id })
                .getRawOne();
            const avgRating = total > 0 ? parseFloat(parseFloat(agg.avg).toFixed(2)) : null;
            const reviewerIds = [...new Set(items.map((r) => r.reviewerId))];
            const reviewerMap = {};
            yield Promise.all(reviewerIds.map((uid) => __awaiter(this, void 0, void 0, function* () {
                const u = yield fetchUser(uid);
                if (u)
                    reviewerMap[uid] = u;
            })));
            return res.json({
                items: items.map((r) => {
                    var _a, _b;
                    const reviewer = reviewerMap[r.reviewerId];
                    return {
                        id: r.id,
                        reviewer: reviewer
                            ? { id: reviewer.id, first_name: reviewer.first_name, last_name: reviewer.last_name, avatar_url: (_a = reviewer.avatar_url) !== null && _a !== void 0 ? _a : null }
                            : { id: r.reviewerId },
                        rating: r.rating,
                        comment: (_b = r.comment) !== null && _b !== void 0 ? _b : null,
                        created_at: r.createdAt,
                    };
                }),
                average_rating: avgRating,
                total,
            });
        });
    }
};
__decorate([
    (0, routing_controllers_1.Get)('/landlord-rating/:landlordId'),
    (0, routing_controllers_1.UseBefore)(service_auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Средний рейтинг арендодателя (internal)' }),
    __param(0, (0, routing_controllers_1.Param)('landlordId')),
    __param(1, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], InternalReviewController.prototype, "getLandlordRating", null);
__decorate([
    (0, routing_controllers_1.Get)('/landlord/:id'),
    (0, routing_controllers_1.UseBefore)(service_auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Отзывы об арендодателе (internal)' }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.QueryParam)('page')),
    __param(2, (0, routing_controllers_1.QueryParam)('page_size')),
    __param(3, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], InternalReviewController.prototype, "getLandlordReviews", null);
InternalReviewController = __decorate([
    (0, routing_controllers_2.JsonController)('/internal/reviews')
], InternalReviewController);
exports.default = InternalReviewController;
