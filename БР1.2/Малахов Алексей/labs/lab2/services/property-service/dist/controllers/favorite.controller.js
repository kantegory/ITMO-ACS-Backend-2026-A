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
const auth_middleware_1 = __importDefault(require("../middlewares/auth.middleware"));
const data_source_1 = __importDefault(require("../config/data-source"));
const favorite_entity_1 = require("../models/favorite.entity");
const property_entity_1 = require("../models/property.entity");
const property_photo_entity_1 = require("../models/property-photo.entity");
let FavoriteController = class FavoriteController {
    list(req_1) {
        return __awaiter(this, arguments, void 0, function* (req, page = 1, pageSize = 20, res) {
            const repo = data_source_1.default.getRepository(favorite_entity_1.Favorite);
            const [items, total] = yield repo.findAndCount({
                where: { userId: req.user.id },
                relations: ['property'],
                skip: (page - 1) * pageSize,
                take: pageSize,
                order: { createdAt: 'DESC' },
            });
            const propertyIds = items.map((f) => f.propertyId);
            const photos = {};
            if (propertyIds.length) {
                const mainPhotos = yield data_source_1.default.getRepository(property_photo_entity_1.PropertyPhoto).find({
                    where: propertyIds.map((id) => ({ propertyId: id, isMain: true })),
                });
                mainPhotos.forEach((ph) => { photos[ph.propertyId] = ph.url; });
            }
            return res.json({
                items: items.map((f) => {
                    var _a, _b, _c;
                    return ({
                        id: f.property.id, title: f.property.title, type: f.property.type,
                        city: f.property.city, price_per_month: f.property.pricePerMonth,
                        currency: f.property.currency, rooms: (_a = f.property.rooms) !== null && _a !== void 0 ? _a : null,
                        area_sqm: (_b = f.property.areaSqm) !== null && _b !== void 0 ? _b : null,
                        main_photo_url: (_c = photos[f.propertyId]) !== null && _c !== void 0 ? _c : null,
                        status: f.property.status, is_favorited: true,
                    });
                }),
                total,
            });
        });
    }
    add(propertyId, req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const property = yield data_source_1.default.getRepository(property_entity_1.Property).findOneBy({ id: propertyId });
            if (!property)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Объект не найден' });
            const repo = data_source_1.default.getRepository(favorite_entity_1.Favorite);
            const existing = yield repo.findOneBy({ userId: req.user.id, propertyId });
            if (existing)
                return res.status(409).json({ code: 'ALREADY_FAVORITED', message: 'Уже в избранном' });
            yield repo.save(repo.create({ userId: req.user.id, propertyId }));
            return res.status(201).json({ message: 'Добавлено в избранное' });
        });
    }
    remove(propertyId, req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = data_source_1.default.getRepository(favorite_entity_1.Favorite);
            const fav = yield repo.findOneBy({ userId: req.user.id, propertyId });
            if (!fav)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Не в избранном' });
            yield repo.delete(fav.id);
            return res.status(204).send();
        });
    }
};
__decorate([
    (0, routing_controllers_1.Get)(''),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Список избранных объектов', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Req)()),
    __param(1, (0, routing_controllers_1.QueryParam)('page')),
    __param(2, (0, routing_controllers_1.QueryParam)('page_size')),
    __param(3, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], FavoriteController.prototype, "list", null);
__decorate([
    (0, routing_controllers_1.Post)('/:propertyId'),
    (0, routing_controllers_1.HttpCode)(201),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Добавить в избранное', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Param)('propertyId')),
    __param(1, (0, routing_controllers_1.Req)()),
    __param(2, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], FavoriteController.prototype, "add", null);
__decorate([
    (0, routing_controllers_1.Delete)('/:propertyId'),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Удалить из избранного', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Param)('propertyId')),
    __param(1, (0, routing_controllers_1.Req)()),
    __param(2, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], FavoriteController.prototype, "remove", null);
FavoriteController = __decorate([
    (0, routing_controllers_2.JsonController)('/favorites')
], FavoriteController);
exports.default = FavoriteController;
