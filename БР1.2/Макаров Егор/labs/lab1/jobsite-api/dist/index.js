"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
const data_source_1 = require("./data-source");
const env_1 = require("./config/env");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const app = (0, express_1.default)();
exports.app = app;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// health-check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
// Swagger UI
const openapiPath = path_1.default.join(__dirname, 'openapi.yaml');
const swaggerDoc = yamljs_1.default.load(openapiPath);
app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDoc));
// API
app.use('/api/v1', routes_1.default);
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
const start = async () => {
    await data_source_1.AppDataSource.initialize();
    // eslint-disable-next-line no-console
    console.log('Database connected');
    app.listen(env_1.env.port, () => {
        // eslint-disable-next-line no-console
        console.log(`Server running on http://localhost:${env_1.env.port}`);
        // eslint-disable-next-line no-console
        console.log(`Swagger UI: http://localhost:${env_1.env.port}/api/docs`);
    });
};
start().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start application:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map