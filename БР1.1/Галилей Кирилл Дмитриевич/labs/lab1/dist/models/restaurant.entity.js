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
exports.Restaurant = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const table_entity_1 = require("./table.entity");
const menu_item_entity_1 = require("./menu-item.entity");
const reservation_entity_1 = require("./reservation.entity");
const review_entity_1 = require("./review.entity");
let Restaurant = class Restaurant extends typeorm_1.BaseEntity {
    id;
    name;
    description;
    cuisine_type;
    price_range;
    address;
    city;
    phone;
    opening_time;
    closing_time;
    photo_url;
    rating;
    manager_id;
    manager;
    created_at;
    updated_at;
    tables;
    menu_items;
    reservations;
    reviews;
};
exports.Restaurant = Restaurant;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Restaurant.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: false }),
    __metadata("design:type", String)
], Restaurant.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Restaurant.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: false }),
    __metadata("design:type", String)
], Restaurant.prototype, "cuisine_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 2 }),
    __metadata("design:type", Number)
], Restaurant.prototype, "price_range", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: false }),
    __metadata("design:type", String)
], Restaurant.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: false }),
    __metadata("design:type", String)
], Restaurant.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, nullable: false }),
    __metadata("design:type", String)
], Restaurant.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', nullable: false, default: '10:00:00' }),
    __metadata("design:type", String)
], Restaurant.prototype, "opening_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', nullable: false, default: '23:00:00' }),
    __metadata("design:type", String)
], Restaurant.prototype, "closing_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 1000, nullable: true }),
    __metadata("design:type", String)
], Restaurant.prototype, "photo_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 3, scale: 2, default: 0.0 }),
    __metadata("design:type", Number)
], Restaurant.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Restaurant.prototype, "manager_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (u) => u.managed_restaurants, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'manager_id' }),
    __metadata("design:type", user_entity_1.User)
], Restaurant.prototype, "manager", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Restaurant.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Restaurant.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => table_entity_1.RestaurantTable, (t) => t.restaurant),
    __metadata("design:type", Array)
], Restaurant.prototype, "tables", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => menu_item_entity_1.MenuItem, (m) => m.restaurant),
    __metadata("design:type", Array)
], Restaurant.prototype, "menu_items", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => reservation_entity_1.Reservation, (r) => r.restaurant),
    __metadata("design:type", Array)
], Restaurant.prototype, "reservations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => review_entity_1.Review, (rev) => rev.restaurant),
    __metadata("design:type", Array)
], Restaurant.prototype, "reviews", void 0);
exports.Restaurant = Restaurant = __decorate([
    (0, typeorm_1.Entity)('restaurants')
], Restaurant);
