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
exports.RestaurantTable = exports.TableZone = void 0;
const typeorm_1 = require("typeorm");
const restaurant_entity_1 = require("./restaurant.entity");
const reservation_entity_1 = require("./reservation.entity");
var TableZone;
(function (TableZone) {
    TableZone["MAIN_HALL"] = "main_hall";
    TableZone["TERRACE"] = "terrace";
    TableZone["VIP"] = "vip";
    TableZone["WINDOW"] = "window";
})(TableZone || (exports.TableZone = TableZone = {}));
let RestaurantTable = class RestaurantTable extends typeorm_1.BaseEntity {
    id;
    restaurant_id;
    restaurant;
    table_number;
    capacity;
    location_zone;
    is_active;
    reservations;
};
exports.RestaurantTable = RestaurantTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RestaurantTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: false }),
    __metadata("design:type", String)
], RestaurantTable.prototype, "restaurant_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => restaurant_entity_1.Restaurant, (r) => r.tables, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'restaurant_id' }),
    __metadata("design:type", restaurant_entity_1.Restaurant)
], RestaurantTable.prototype, "restaurant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: false }),
    __metadata("design:type", Number)
], RestaurantTable.prototype, "table_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: false, default: 4 }),
    __metadata("design:type", Number)
], RestaurantTable.prototype, "capacity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: TableZone, default: TableZone.MAIN_HALL }),
    __metadata("design:type", String)
], RestaurantTable.prototype, "location_zone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], RestaurantTable.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => reservation_entity_1.Reservation, (res) => res.table),
    __metadata("design:type", Array)
], RestaurantTable.prototype, "reservations", void 0);
exports.RestaurantTable = RestaurantTable = __decorate([
    (0, typeorm_1.Entity)('restaurant_tables')
], RestaurantTable);
