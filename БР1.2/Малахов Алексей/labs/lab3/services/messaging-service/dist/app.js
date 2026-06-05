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
const conversation_controller_1 = __importDefault(require("./controllers/conversation.controller"));
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.app.use((0, cors_1.default)());
        this.app.use(express_1.default.json());
        (0, routing_controllers_1.useExpressServer)(this.app, {
            routePrefix: settings_1.default.APP_API_PREFIX,
            controllers: [conversation_controller_1.default],
            validation: true,
            classTransformer: true,
            defaultErrorHandler: true,
        });
    }
    start() {
        data_source_1.default.initialize()
            .then(() => console.log('[messaging-service] DB connected'))
            .catch(err => console.error('[messaging-service] DB error:', err));
        this.app.listen(settings_1.default.APP_PORT, settings_1.default.APP_HOST, () => {
            console.log(`[messaging-service] running on ${settings_1.default.APP_HOST}:${settings_1.default.APP_PORT}`);
        });
    }
}
new App().start();
