"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const settings_1 = require("./settings");
const user_entity_1 = require("../models/user.entity");
const restaurant_entity_1 = require("../models/restaurant.entity");
const table_entity_1 = require("../models/table.entity");
const reservation_entity_1 = require("../models/reservation.entity");
const menu_item_entity_1 = require("../models/menu-item.entity");
const review_entity_1 = require("../models/review.entity");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: settings_1.SETTINGS.DB_HOST,
    port: settings_1.SETTINGS.DB_PORT,
    username: settings_1.SETTINGS.DB_USER,
    password: settings_1.SETTINGS.DB_PASSWORD,
    database: settings_1.SETTINGS.DB_NAME,
    synchronize: true, // автоматически синхронизирует схемы в режиме dev
    logging: false,
    entities: [user_entity_1.User, restaurant_entity_1.Restaurant, table_entity_1.RestaurantTable, reservation_entity_1.Reservation, menu_item_entity_1.MenuItem, review_entity_1.Review]
});
