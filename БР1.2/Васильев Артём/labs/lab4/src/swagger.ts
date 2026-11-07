import fs from 'fs';
import path from 'path';

import { Express } from 'express';
import * as swaggerUi from 'swagger-ui-express';
import { RoutingControllersOptions } from 'routing-controllers';
import YAML from 'yaml';

export function useSwagger(
    app: Express,
    _options: RoutingControllersOptions,
): Express {
    try {
        const openApiPath = path.resolve(process.cwd(), 'docs', 'openapi.yaml');
        const openApiContent = fs.readFileSync(openApiPath, 'utf8');
        const spec = YAML.parse(openApiContent);

        app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
        app.get('/docs/openapi.yaml', (_request, response) => {
            response.type('text/yaml').send(openApiContent);
        });

        return app;
    } catch (error) {
        console.error('Swagger setup error:', error);
        return app;
    }
}
