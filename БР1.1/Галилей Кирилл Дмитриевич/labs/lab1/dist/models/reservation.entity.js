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
exports.Reservation = exports.ReservationStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const restaurant_entity_1 = require("./restaurant.entity");
const table_entity_1 = require("./table.entity");
var ReservationStatus;
(function (ReservationStatus) {
    ReservationStatus["PENDING"] = "pending";
    ReservationStatus["CONFIRMED"] = "confirmed";
    ReservationStatus["CANCELLED"] = "cancelled";
    ReservationStatus["COMPLETED"] = "completed";
})(ReservationStatus || (exports.ReservationStatus = ReservationStatus = {}));
let Reservation = class Reservation extends typeorm_1.BaseEntity {
    id;
    user_id;
    user;
    restaurant_id;
    restaurant;
    table_id;
    table;
    reservation_date;
    start_time;
    end_time;
    guests_count;
    status;
    special_requests;
    created_at;
    updated_at;
};
exports.Reservation = Reservation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Reservation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: false }),
    __metadata("design:type", String)
], Reservation.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (u) => u.reservations, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Reservation.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: false }),
    __metadata("design:type", String)
], Reservation.prototype, "restaurant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => restaurant_entity_1.Restaurant, (r) => r.reservations, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'restaurant_id' }),
    __metadata("design:type", restaurant_entity_1.Restaurant)
], Reservation.prototype, "restaurant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: false }),
    __metadata("design:type", String)
], Reservation.prototype, "table_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => table_entity_1.RestaurantTable, (t) => t.reservations, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'table_id' }),
    __metadata("design:type", table_entity_1.RestaurantTable)
], Reservation.prototype, "table", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: false }),
    __metadata("design:type", String)
], Reservation.prototype, "reservation_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', nullable: false }),
    __metadata("design:type", String)
], Reservation.prototype, "start_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', nullable: false }),
    __metadata("design:type", String)
], Reservation.prototype, "end_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: false, default: 2 }),
    __metadata("design:type", Number)
], Reservation.prototype, "guests_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ReservationStatus, default: ReservationStatus.PENDING }),
    __metadata("design:type", String)
], Reservation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Reservation.prototype, "special_requests", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Reservation.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Reservation.prototype, "updated_at", void 0);
exports.Reservation = Reservation = __decorate([
    (0, typeorm_1.Entity)('reservations')
], Reservation);
