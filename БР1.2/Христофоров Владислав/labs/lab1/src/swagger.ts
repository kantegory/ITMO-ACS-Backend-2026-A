import * as swaggerUi from 'swagger-ui-express';
import * as YAML from 'yamljs';
import path from 'path';
import { Express } from 'express';
import { RoutingControllersOptions } from 'routing-controllers';

export function useSwagger(
    app: Express,
    options?: RoutingControllersOptions,
): Express {
    try {
        const swaggerDocument = YAML.load(
            path.join(__dirname, './docs/openapi.yaml'),
        );
        app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
        return app;
    } catch (error) {
        console.error('Ошибка настройки Swagger:', error);
        return app;
    }
}
