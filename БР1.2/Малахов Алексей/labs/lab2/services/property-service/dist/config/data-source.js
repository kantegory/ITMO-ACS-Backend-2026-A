"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const settings_1 = __importDefault(require("./settings"));
const property_entity_1 = require("../models/property.entity");
const property_photo_entity_1 = require("../models/property-photo.entity");
const property_price_history_entity_1 = require("../models/property-price-history.entity");
const favorite_entity_1 = require("../models/favorite.entity");
const dataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: settings_1.default.DB_HOST,
    port: settings_1.default.DB_PORT,
    username: settings_1.default.DB_USER,
    password: settings_1.default.DB_PASSWORD,
    database: settings_1.default.DB_NAME,
    entities: [property_entity_1.Property, property_photo_entity_1.PropertyPhoto, property_price_history_entity_1.PropertyPriceHistory, favorite_entity_1.Favorite],
    logging: false,
    synchronize: true,
});
exports.default = dataSource;
