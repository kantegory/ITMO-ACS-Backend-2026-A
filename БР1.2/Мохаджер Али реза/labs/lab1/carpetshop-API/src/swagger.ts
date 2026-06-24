import fs from 'fs';
import path from 'path';
import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
import { Express } from 'express';
import {
    getMetadataArgsStorage,
    RoutingControllersOptions,
} from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import * as swaggerUi from 'swagger-ui-express';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { parse as parseYaml } from 'yaml';

export function useSwagger(
    app: Express,
    options: RoutingControllersOptions,
): Express {
    try {
        const schemas = validationMetadatasToSchemas({
            classTransformerMetadataStorage: defaultMetadataStorage,
            refPointerPrefix: '#/definitions/',
        });

        const storage = getMetadataArgsStorage();

        const spec = routingControllersToSpec(storage, options, {
            components: {
                schemas,
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
            info: {
                title: 'Boilerplate API documentation',
                description: 'API documentation for boilerplate',
                version: '1.0.0',
            },
        });

        app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

        return app;
    } catch (error) {
        console.error('Ошибка настройки Swagger (generated spec):', error);

        try {
            const openapiPath = path.resolve(process.cwd(), 'docs', 'openapi.yaml');
            const yamlText = fs.readFileSync(openapiPath, 'utf8');
            const spec = parseYaml(yamlText);

            app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
        } catch (fallbackError) {
            console.error('Ошибка настройки Swagger (fallback openapi.yaml):', fallbackError);
        }

        return app;
    }
}
