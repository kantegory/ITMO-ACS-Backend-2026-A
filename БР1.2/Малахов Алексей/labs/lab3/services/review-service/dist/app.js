"use strict";
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
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routing_controllers_1 = require("routing-controllers");
const settings_1 = __importDefault(require("./config/settings"));
const data_source_1 = __importDefault(require("./config/data-source"));
const consumer_1 = require("./messaging/consumer");
const review_controller_1 = __importDefault(require("./controllers/review.controller"));
const landlord_controller_1 = __importDefault(require("./controllers/landlord.controller"));
const internal_controller_1 = __importDefault(require("./controllers/internal.controller"));
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.app.use((0, cors_1.default)());
        this.app.use(express_1.default.json());
        (0, routing_controllers_1.useExpressServer)(this.app, {
            routePrefix: settings_1.default.APP_API_PREFIX,
            controllers: [review_controller_1.default, landlord_controller_1.default, internal_controller_1.default],
            validation: true,
            classTransformer: true,
            defaultErrorHandler: true,
        });
    }
    start() {
        data_source_1.default.initialize()
            .then(() => __awaiter(this, void 0, void 0, function* () {
            console.log('[review-service] DB connected');
            yield (0, consumer_1.startConsumer)();
        }))
            .catch(err => console.error('[review-service] DB error:', err));
        this.app.listen(settings_1.default.APP_PORT, settings_1.default.APP_HOST, () => {
            console.log(`[review-service] running on ${settings_1.default.APP_HOST}:${settings_1.default.APP_PORT}`);
        });
    }
}
new App().start();
