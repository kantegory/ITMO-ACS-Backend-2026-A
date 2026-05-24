import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
import { Express } from 'express';
import { getMetadataArgsStorage, RoutingControllersOptions } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import * as swaggerUi from 'swagger-ui-express';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';

export function useSwagger(app: Express, options: RoutingControllersOptions): Express {
    const schemas = validationMetadatasToSchemas({
        classTransformerMetadataStorage: defaultMetadataStorage,
        refPointerPrefix: '#/definitions/',
    });

    const storage = getMetadataArgsStorage();
    const spec = routingControllersToSpec(storage, options, {
        components: {
            schemas,
            securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
        },
        info: { title: 'Menu Service API', description: 'Menu microservice', version: '1.0.0' },
    });

    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
    return app;
}
