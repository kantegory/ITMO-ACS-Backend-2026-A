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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const settings_1 = __importDefault(require("../config/settings"));
const auth_middleware_1 = __importDefault(require("../middlewares/auth.middleware"));
const data_source_1 = __importDefault(require("../config/data-source"));
const property_entity_1 = require("../models/property.entity");
const property_photo_entity_1 = require("../models/property-photo.entity");
const property_price_history_entity_1 = require("../models/property-price-history.entity");
const favorite_entity_1 = require("../models/favorite.entity");
const enums_1 = require("../models/enums");
class CreatePropertyDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.PropertyType),
    __metadata("design:type", String)
], CreatePropertyDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePropertyDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePropertyDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePropertyDto.prototype, "street", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePropertyDto.prototype, "building", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePropertyDto.prototype, "apartment", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePropertyDto.prototype, "postal_code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePropertyDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePropertyDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreatePropertyDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreatePropertyDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreatePropertyDto.prototype, "rooms", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreatePropertyDto.prototype, "area_sqm", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreatePropertyDto.prototype, "floor", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreatePropertyDto.prototype, "price_per_month", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.CurrencyType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePropertyDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePropertyDto.prototype, "rental_conditions", void 0);
class UpdatePropertyDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePropertyDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePropertyDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdatePropertyDto.prototype, "price_per_month", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePropertyDto.prototype, "rental_conditions", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.PropertyStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePropertyDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdatePropertyDto.prototype, "rooms", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdatePropertyDto.prototype, "area_sqm", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdatePropertyDto.prototype, "floor", void 0);
class AddPhotoDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddPhotoDto.prototype, "url", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], AddPhotoDto.prototype, "is_main", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], AddPhotoDto.prototype, "sort_order", void 0);
const VALID_STATUS_TRANSITIONS = {
    [enums_1.PropertyStatus.ACTIVE]: [enums_1.PropertyStatus.ARCHIVED],
    [enums_1.PropertyStatus.RENTED]: [enums_1.PropertyStatus.ARCHIVED],
    [enums_1.PropertyStatus.ARCHIVED]: [enums_1.PropertyStatus.ACTIVE],
};
function tryGetUserIdFromAuth(authHeader) {
    var _a, _b;
    if (!authHeader)
        return null;
    try {
        const [, token] = authHeader.split(' ');
        const payload = jsonwebtoken_1.default.verify(token, settings_1.default.JWT_SECRET_KEY);
        return (_b = (_a = payload === null || payload === void 0 ? void 0 : payload.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null;
    }
    catch (_c) {
        return null;
    }
}
function fetchOwnerInfo(ownerId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch(`${settings_1.default.USER_SERVICE_URL}/internal/users/${ownerId}`, {
                headers: { 'X-Service-Token': settings_1.default.SERVICE_TOKEN },
            });
            if (!res.ok)
                return null;
            return yield res.json();
        }
        catch (_a) {
            return null;
        }
    });
}
function fetchLandlordRating(landlordId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch(`${settings_1.default.REVIEW_SERVICE_URL}/internal/reviews/landlord-rating/${landlordId}`, {
                headers: { 'X-Service-Token': settings_1.default.SERVICE_TOKEN },
            });
            if (!res.ok)
                return { average_rating: null, reviews_count: 0 };
            return yield res.json();
        }
        catch (_a) {
            return { average_rating: null, reviews_count: 0 };
        }
    });
}
let PropertyController = class PropertyController {
    search(city_1, type_1, priceMin_1, priceMax_1, roomsMin_1, roomsMax_1, status_1) {
        return __awaiter(this, arguments, void 0, function* (city, type, priceMin, priceMax, roomsMin, roomsMax, status, page = 1, pageSize = 20, sortBy = 'created_at', req, res) {
            var _a, _b;
            const repo = data_source_1.default.getRepository(property_entity_1.Property);
            const qb = repo.createQueryBuilder('p')
                .leftJoinAndSelect('p.photos', 'photo', 'photo.isMain = true')
                .where('p.deletedAt IS NULL');
            if (city)
                qb.andWhere('p.city ILIKE :city', { city: `%${city}%` });
            if (type)
                qb.andWhere('p.type = :type', { type });
            if (status)
                qb.andWhere('p.status = :status', { status });
            else
                qb.andWhere('p.status = :status', { status: enums_1.PropertyStatus.ACTIVE });
            if (priceMin)
                qb.andWhere('p.pricePerMonth >= :priceMin', { priceMin });
            if (priceMax)
                qb.andWhere('p.pricePerMonth <= :priceMax', { priceMax });
            if (roomsMin)
                qb.andWhere('p.rooms >= :roomsMin', { roomsMin });
            if (roomsMax)
                qb.andWhere('p.rooms <= :roomsMax', { roomsMax });
            const sortMap = {
                created_at: ['p.createdAt', 'DESC'],
                price_asc: ['p.pricePerMonth', 'ASC'],
                price_desc: ['p.pricePerMonth', 'DESC'],
            };
            const [sortField, sortOrder] = (_a = sortMap[sortBy]) !== null && _a !== void 0 ? _a : sortMap.created_at;
            qb.orderBy(sortField, sortOrder).skip((page - 1) * pageSize).take(pageSize);
            const [items, total] = yield qb.getManyAndCount();
            let favSet = new Set();
            const userId = tryGetUserIdFromAuth((_b = req.headers) === null || _b === void 0 ? void 0 : _b.authorization);
            if (userId) {
                const favs = yield data_source_1.default.getRepository(favorite_entity_1.Favorite).findBy({ userId });
                favSet = new Set(favs.map((f) => f.propertyId));
            }
            return res.json({
                items: items.map((p) => {
                    var _a, _b, _c, _d, _e;
                    return ({
                        id: p.id,
                        title: p.title,
                        type: p.type,
                        city: p.city,
                        price_per_month: p.pricePerMonth,
                        currency: p.currency,
                        rooms: (_a = p.rooms) !== null && _a !== void 0 ? _a : null,
                        area_sqm: (_b = p.areaSqm) !== null && _b !== void 0 ? _b : null,
                        main_photo_url: (_e = (_d = (_c = p.photos) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.url) !== null && _e !== void 0 ? _e : null,
                        status: p.status,
                        is_favorited: favSet.has(p.id),
                    });
                }),
                total, page, page_size: pageSize,
                total_pages: Math.ceil(total / pageSize),
            });
        });
    }
    create(req, dto, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            const roles = req.user.roles || [];
            if (!roles.includes('landlord')) {
                return res.status(403).json({ code: 'ROLE_REQUIRED', message: 'Требуется роль landlord' });
            }
            const repo = data_source_1.default.getRepository(property_entity_1.Property);
            const property = repo.create({
                type: dto.type, title: dto.title, description: (_a = dto.description) !== null && _a !== void 0 ? _a : null,
                street: dto.street, building: dto.building, apartment: (_b = dto.apartment) !== null && _b !== void 0 ? _b : null,
                postalCode: (_c = dto.postal_code) !== null && _c !== void 0 ? _c : null, city: dto.city, country: dto.country,
                latitude: (_d = dto.latitude) !== null && _d !== void 0 ? _d : null, longitude: (_e = dto.longitude) !== null && _e !== void 0 ? _e : null,
                rooms: (_f = dto.rooms) !== null && _f !== void 0 ? _f : null, areaSqm: (_g = dto.area_sqm) !== null && _g !== void 0 ? _g : null, floor: (_h = dto.floor) !== null && _h !== void 0 ? _h : null,
                pricePerMonth: dto.price_per_month, currency: (_j = dto.currency) !== null && _j !== void 0 ? _j : enums_1.CurrencyType.RUB,
                rentalConditions: (_k = dto.rental_conditions) !== null && _k !== void 0 ? _k : null,
                ownerId: req.user.id, status: enums_1.PropertyStatus.ACTIVE,
            });
            yield repo.save(property);
            const histRepo = data_source_1.default.getRepository(property_price_history_entity_1.PropertyPriceHistory);
            yield histRepo.save(histRepo.create({ propertyId: property.id, pricePerMonth: property.pricePerMonth, currency: property.currency }));
            return res.status(201).json(yield this._buildDetail(property.id, req.user.id));
        });
    }
    getById(id, req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = tryGetUserIdFromAuth((_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization);
            const detail = yield this._buildDetail(id, userId !== null && userId !== void 0 ? userId : undefined);
            if (!detail)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Объект не найден' });
            return res.json(detail);
        });
    }
    update(id, req, dto, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const repo = data_source_1.default.getRepository(property_entity_1.Property);
            const property = yield repo.findOneBy({ id });
            if (!property)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Объект не найден' });
            if (property.ownerId !== req.user.id)
                return res.status(403).json({ code: 'FORBIDDEN', message: 'Нет доступа' });
            if (dto.status && dto.status !== property.status) {
                const allowed = (_a = VALID_STATUS_TRANSITIONS[property.status]) !== null && _a !== void 0 ? _a : [];
                if (!allowed.includes(dto.status)) {
                    return res.status(422).json({ code: 'INVALID_STATUS_TRANSITION', message: `Недопустимый переход ${property.status} → ${dto.status}` });
                }
            }
            const oldPrice = property.pricePerMonth;
            if (dto.title !== undefined)
                property.title = dto.title;
            if (dto.description !== undefined)
                property.description = dto.description;
            if (dto.price_per_month !== undefined)
                property.pricePerMonth = dto.price_per_month;
            if (dto.rental_conditions !== undefined)
                property.rentalConditions = dto.rental_conditions;
            if (dto.status !== undefined)
                property.status = dto.status;
            if (dto.rooms !== undefined)
                property.rooms = dto.rooms;
            if (dto.area_sqm !== undefined)
                property.areaSqm = dto.area_sqm;
            if (dto.floor !== undefined)
                property.floor = dto.floor;
            yield repo.save(property);
            if (dto.price_per_month !== undefined && Number(dto.price_per_month) !== Number(oldPrice)) {
                const histRepo = data_source_1.default.getRepository(property_price_history_entity_1.PropertyPriceHistory);
                yield histRepo.save(histRepo.create({ propertyId: property.id, pricePerMonth: property.pricePerMonth, currency: property.currency }));
            }
            return res.json(yield this._buildDetail(property.id, req.user.id));
        });
    }
    remove(id, req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = data_source_1.default.getRepository(property_entity_1.Property);
            const property = yield repo.findOneBy({ id });
            if (!property)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Объект не найден' });
            if (property.ownerId !== req.user.id)
                return res.status(403).json({ code: 'FORBIDDEN', message: 'Нет доступа' });
            yield repo.softDelete(id);
            return res.status(204).send();
        });
    }
    addPhoto(id, req, dto, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const property = yield data_source_1.default.getRepository(property_entity_1.Property).findOneBy({ id });
            if (!property)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Объект не найден' });
            if (property.ownerId !== req.user.id)
                return res.status(403).json({ code: 'FORBIDDEN', message: 'Нет доступа' });
            const photoRepo = data_source_1.default.getRepository(property_photo_entity_1.PropertyPhoto);
            const count = yield photoRepo.count({ where: { propertyId: id } });
            if (count >= 20)
                return res.status(400).json({ code: 'PHOTO_LIMIT_EXCEEDED', message: 'Превышен лимит фото (20)' });
            const photo = photoRepo.create({ propertyId: id, url: dto.url, isMain: (_a = dto.is_main) !== null && _a !== void 0 ? _a : false, sortOrder: (_b = dto.sort_order) !== null && _b !== void 0 ? _b : count + 1 });
            yield photoRepo.save(photo);
            return res.status(201).json({ id: photo.id, url: photo.url, is_main: photo.isMain, sort_order: photo.sortOrder });
        });
    }
    deletePhoto(propertyId, photoId, req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const property = yield data_source_1.default.getRepository(property_entity_1.Property).findOneBy({ id: propertyId });
            if (!property)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Объект не найден' });
            if (property.ownerId !== req.user.id)
                return res.status(403).json({ code: 'FORBIDDEN', message: 'Нет доступа' });
            const photoRepo = data_source_1.default.getRepository(property_photo_entity_1.PropertyPhoto);
            const photo = yield photoRepo.findOneBy({ id: photoId, propertyId });
            if (!photo)
                return res.status(404).json({ code: 'NOT_FOUND', message: 'Фото не найдено' });
            yield photoRepo.delete(photoId);
            return res.status(204).send();
        });
    }
    _buildDetail(propertyId, currentUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
            const property = yield data_source_1.default.getRepository(property_entity_1.Property).findOne({
                where: { id: propertyId },
                relations: ['photos', 'priceHistory'],
            });
            if (!property)
                return null;
            let isFavorited = false;
            if (currentUserId) {
                const fav = yield data_source_1.default.getRepository(favorite_entity_1.Favorite).findOneBy({ userId: currentUserId, propertyId });
                isFavorited = !!fav;
            }
            const [owner, ratingData] = yield Promise.all([
                fetchOwnerInfo(property.ownerId),
                fetchLandlordRating(property.ownerId),
            ]);
            return {
                id: property.id,
                title: property.title,
                type: property.type,
                description: (_a = property.description) !== null && _a !== void 0 ? _a : null,
                address: {
                    street: property.street, building: property.building,
                    apartment: (_b = property.apartment) !== null && _b !== void 0 ? _b : null, postal_code: (_c = property.postalCode) !== null && _c !== void 0 ? _c : null,
                    city: property.city, country: property.country,
                    latitude: (_d = property.latitude) !== null && _d !== void 0 ? _d : null, longitude: (_e = property.longitude) !== null && _e !== void 0 ? _e : null,
                },
                rooms: (_f = property.rooms) !== null && _f !== void 0 ? _f : null,
                area_sqm: (_g = property.areaSqm) !== null && _g !== void 0 ? _g : null,
                floor: (_h = property.floor) !== null && _h !== void 0 ? _h : null,
                price_per_month: property.pricePerMonth,
                currency: property.currency,
                rental_conditions: (_j = property.rentalConditions) !== null && _j !== void 0 ? _j : null,
                status: property.status,
                photos: property.photos.map((ph) => ({ id: ph.id, url: ph.url, is_main: ph.isMain, sort_order: ph.sortOrder })),
                owner: owner ? {
                    id: owner.id,
                    first_name: owner.first_name,
                    last_name: owner.last_name,
                    avatar_url: (_k = owner.avatar_url) !== null && _k !== void 0 ? _k : null,
                    rating: (_l = ratingData === null || ratingData === void 0 ? void 0 : ratingData.average_rating) !== null && _l !== void 0 ? _l : null,
                    reviews_count: (_m = ratingData === null || ratingData === void 0 ? void 0 : ratingData.reviews_count) !== null && _m !== void 0 ? _m : 0,
                } : { id: property.ownerId, first_name: null, last_name: null, avatar_url: null, rating: null, reviews_count: 0 },
                price_history: property.priceHistory.map((h) => ({ price_per_month: h.pricePerMonth, currency: h.currency, changed_at: h.changedAt })),
                average_rating: (_o = ratingData === null || ratingData === void 0 ? void 0 : ratingData.average_rating) !== null && _o !== void 0 ? _o : null,
                is_favorited: isFavorited,
                created_at: property.createdAt,
            };
        });
    }
};
__decorate([
    (0, routing_controllers_1.Get)(''),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Поиск недвижимости с фильтрацией' }),
    __param(0, (0, routing_controllers_1.QueryParam)('city')),
    __param(1, (0, routing_controllers_1.QueryParam)('type')),
    __param(2, (0, routing_controllers_1.QueryParam)('price_min')),
    __param(3, (0, routing_controllers_1.QueryParam)('price_max')),
    __param(4, (0, routing_controllers_1.QueryParam)('rooms_min')),
    __param(5, (0, routing_controllers_1.QueryParam)('rooms_max')),
    __param(6, (0, routing_controllers_1.QueryParam)('status')),
    __param(7, (0, routing_controllers_1.QueryParam)('page')),
    __param(8, (0, routing_controllers_1.QueryParam)('page_size')),
    __param(9, (0, routing_controllers_1.QueryParam)('sort_by')),
    __param(10, (0, routing_controllers_1.Req)()),
    __param(11, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number, Number, Number, String, Number, Number, String, Object, Object]),
    __metadata("design:returntype", Promise)
], PropertyController.prototype, "search", null);
__decorate([
    (0, routing_controllers_1.Post)(''),
    (0, routing_controllers_1.HttpCode)(201),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Создать объект недвижимости', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Req)()),
    __param(1, (0, routing_controllers_1.Body)({ type: CreatePropertyDto })),
    __param(2, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreatePropertyDto, Object]),
    __metadata("design:returntype", Promise)
], PropertyController.prototype, "create", null);
__decorate([
    (0, routing_controllers_1.Get)('/:id'),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Получить детали объекта' }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Req)()),
    __param(2, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], PropertyController.prototype, "getById", null);
__decorate([
    (0, routing_controllers_1.Patch)('/:id'),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Обновить объект', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Req)()),
    __param(2, (0, routing_controllers_1.Body)({ type: UpdatePropertyDto })),
    __param(3, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, UpdatePropertyDto, Object]),
    __metadata("design:returntype", Promise)
], PropertyController.prototype, "update", null);
__decorate([
    (0, routing_controllers_1.Delete)('/:id'),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Удалить объект (soft delete)', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Req)()),
    __param(2, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], PropertyController.prototype, "remove", null);
__decorate([
    (0, routing_controllers_1.Post)('/:id/photos'),
    (0, routing_controllers_1.HttpCode)(201),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Добавить фото объекта', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Param)('id')),
    __param(1, (0, routing_controllers_1.Req)()),
    __param(2, (0, routing_controllers_1.Body)({ type: AddPhotoDto })),
    __param(3, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, AddPhotoDto, Object]),
    __metadata("design:returntype", Promise)
], PropertyController.prototype, "addPhoto", null);
__decorate([
    (0, routing_controllers_1.Delete)('/:propertyId/photos/:photoId'),
    (0, routing_controllers_1.UseBefore)(auth_middleware_1.default),
    (0, routing_controllers_openapi_1.OpenAPI)({ summary: 'Удалить фото', security: [{ bearerAuth: [] }] }),
    __param(0, (0, routing_controllers_1.Param)('propertyId')),
    __param(1, (0, routing_controllers_1.Param)('photoId')),
    __param(2, (0, routing_controllers_1.Req)()),
    __param(3, (0, routing_controllers_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object, Object]),
    __metadata("design:returntype", Promise)
], PropertyController.prototype, "deletePhoto", null);
PropertyController = __decorate([
    (0, routing_controllers_2.JsonController)('/properties')
], PropertyController);
exports.default = PropertyController;
