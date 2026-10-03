"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const setupSwagger = (app) => {
    try {
        const candidates = [
            path_1.default.resolve(__dirname, '../../../homeworks/hw2/openapi.yaml'),
            path_1.default.resolve(process.cwd(), '../../homeworks/hw2/openapi.yaml'),
            path_1.default.resolve(__dirname, '../../../../homeworks/hw2/openapi.yaml'),
        ];
        let openapiPath = candidates[0];
        for (const cand of candidates) {
            if (fs_1.default.existsSync(cand)) {
                openapiPath = cand;
                break;
            }
        }
        const swaggerDoc = yamljs_1.default.load(openapiPath);
        app.use('/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDoc));
        app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDoc));
        console.log('Swagger UI is available at /docs and /api/docs');
    }
    catch (err) {
        console.warn('Could not load openapi.yaml for Swagger UI:', err);
    }
};
exports.setupSwagger = setupSwagger;
