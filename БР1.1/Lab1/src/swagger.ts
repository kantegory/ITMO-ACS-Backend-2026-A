import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
import { Express } from 'express';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import {
    getMetadataArgsStorage,
    RoutingControllersOptions,
} from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import * as swaggerUi from 'swagger-ui-express';

export function useSwagger(
    app: Express,
    options: RoutingControllersOptions,
): Express {
    try {
        const schemas = validationMetadatasToSchemas({
            classTransformerMetadataStorage: defaultMetadataStorage,
            refPointerPrefix: '#/components/schemas/',
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
                title: 'Recipe Sharing Service API',
                description:
                    'REST API для сервиса обмена рецептами и кулинарных блогов',
                version: '1.0.0',
            },
        });

        app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

        return app;
    } catch (error) {
        console.error('Swagger setup error:', error);
        return app;
    }
}
