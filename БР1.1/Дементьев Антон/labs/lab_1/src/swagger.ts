import 'reflect-metadata';
import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
import { Express } from 'express';
import {
    getMetadataArgsStorage,
    RoutingControllersOptions,
} from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import * as swaggerUi from 'swagger-ui-express';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';

// tsx (esbuild) не записывает типы параметров методов (design:paramtypes),
// а генератору документации они нужны. Дописываем недостающее вручную:
// параметры пути — строки, тела и query — типы, указанные явно через { type: ... }.
// На работу самого API это не влияет.
const fillParamTypes = () => {
    const storage = getMetadataArgsStorage();
    const seen = new Set<string>();

    storage.params.forEach((param) => {
        const target = param.object;
        const method = param.method;
        const key = `${target.constructor.name}.${method}`;
        if (seen.has(key)) return;
        seen.add(key);

        if (Reflect.getMetadata('design:paramtypes', target, method)) return;

        const same = storage.params.filter(
            (p) => p.object === target && p.method === method,
        );
        const types: any[] = new Array(
            Math.max(...same.map((p) => p.index)) + 1,
        ).fill(Object);
        same.forEach((p) => {
            types[p.index] = p.explicitType || (p.type === 'param' ? String : Object);
        });
        Reflect.defineMetadata('design:paramtypes', types, target, method);
    });
};

export function useSwagger(
    app: Express,
    options: RoutingControllersOptions,
): Express {
    try {
        fillParamTypes();

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
                title: 'Job Search API',
                description:
                    'REST API сайта для поиска работы (лабораторная работа 1). ' +
                    'Для запросов с замком нажмите Authorize и вставьте access-токен из POST /auth/login.',
                version: '1.0.0',
            },
        });

        app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
        // та же спецификация в виде JSON
        app.get('/docs.json', (_request, response) => {
            response.json(spec);
        });

        return app;
    } catch (error) {
        console.error('Ошибка настройки Swagger:', error);
        return app;
    }
}
