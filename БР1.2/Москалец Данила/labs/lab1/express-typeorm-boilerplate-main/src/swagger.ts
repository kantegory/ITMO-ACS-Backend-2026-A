import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
import { Express } from 'express';
import {
    getMetadataArgsStorage,
    RoutingControllersOptions,
} from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import * as swaggerUi from 'swagger-ui-express';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';

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
                title: 'Sangel API',
                description: 'Маркетплейс охранных услуг',
                version: '1.0.0',
            },
            servers: [
                {
                    url: 'https://api.sangel.ru/v1',
                    description: 'Production server',
                },
                {
                    url: 'http://localhost:8000/v1',
                    description: 'Development server',
                },
            ],
        });

        app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

        return app;
    } catch (error) {
        console.error('Ошибка настройки Swagger:', error);
        return app;
    }
}
