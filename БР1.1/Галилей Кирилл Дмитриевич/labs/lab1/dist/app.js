"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const settings_1 = require("./config/settings");
const data_source_1 = require("./config/data-source");
const swagger_1 = require("./swagger");
const auth_controller_1 = __importDefault(require("./controllers/auth.controller"));
const restaurant_controller_1 = __importDefault(require("./controllers/restaurant.controller"));
const table_controller_1 = __importDefault(require("./controllers/table.controller"));
const menu_controller_1 = __importDefault(require("./controllers/menu.controller"));
const reservation_controller_1 = __importDefault(require("./controllers/reservation.controller"));
const review_controller_1 = __importDefault(require("./controllers/review.controller"));
class Server {
    app;
    constructor() {
        this.app = (0, express_1.default)();
        this.configureMiddlewares();
        this.configureRoutes();
    }
    configureMiddlewares() {
        this.app.use((0, cors_1.default)());
        this.app.use(express_1.default.json());
        (0, swagger_1.setupSwagger)(this.app);
    }
    configureRoutes() {
        const api = express_1.default.Router();
        api.use('/auth', auth_controller_1.default);
        api.use('/restaurants', restaurant_controller_1.default);
        api.use('/restaurants/:restaurantId/tables', table_controller_1.default);
        api.use('/restaurants/:restaurantId/menu', menu_controller_1.default);
        api.use('/restaurants/:restaurantId/reviews', review_controller_1.default);
        api.use('/reservations', reservation_controller_1.default);
        this.app.use('/api/v1', api);
        this.app.get('/health', (req, res) => {
            res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
        });
    }
    async start() {
        try {
            if (!data_source_1.AppDataSource.isInitialized) {
                await data_source_1.AppDataSource.initialize();
                console.log('Database connected successfully!');
            }
            this.app.listen(settings_1.SETTINGS.PORT, settings_1.SETTINGS.HOST, () => {
                console.log(`Server running at http://${settings_1.SETTINGS.HOST}:${settings_1.SETTINGS.PORT}`);
                console.log(`Swagger documentation: http://${settings_1.SETTINGS.HOST}:${settings_1.SETTINGS.PORT}/docs`);
            });
        }
        catch (err) {
            console.error('Failed to start server:', err);
        }
    }
    getApp() {
        return this.app;
    }
}
const server = new Server();
if (process.env.NODE_ENV !== 'test') {
    server.start();
}
exports.default = server.getApp();
