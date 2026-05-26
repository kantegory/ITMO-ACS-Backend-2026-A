"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routing_controllers_1 = require("routing-controllers");
const settings_1 = __importDefault(require("./config/settings"));
const data_source_1 = __importDefault(require("./config/data-source"));
const publisher_1 = require("./messaging/publisher");
const rental_controller_1 = __importDefault(require("./controllers/rental.controller"));
const transaction_controller_1 = __importDefault(require("./controllers/transaction.controller"));
const internal_controller_1 = __importDefault(require("./controllers/internal.controller"));
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.app.use((0, cors_1.default)());
        this.app.use(express_1.default.json());
        (0, routing_controllers_1.useExpressServer)(this.app, {
            routePrefix: settings_1.default.APP_API_PREFIX,
            controllers: [rental_controller_1.default, transaction_controller_1.default, internal_controller_1.default],
            validation: true,
            classTransformer: true,
            defaultErrorHandler: true,
        });
    }
    start() {
        data_source_1.default.initialize()
            .then(() => console.log('[rental-service] DB connected'))
            .catch(err => console.error('[rental-service] DB error:', err));
        (0, publisher_1.connectPublisher)();
        this.app.listen(settings_1.default.APP_PORT, settings_1.default.APP_HOST, () => {
            console.log(`[rental-service] running on ${settings_1.default.APP_HOST}:${settings_1.default.APP_PORT}`);
        });
    }
}
new App().start();
