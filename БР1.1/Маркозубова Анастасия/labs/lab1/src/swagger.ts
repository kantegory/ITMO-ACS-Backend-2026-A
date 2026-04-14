import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
import { Express } from 'express';
import {
    getMetadataArgsStorage,
    RoutingControllersOptions,
} from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import * as swaggerUi from 'swagger-ui-express';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import authMiddleware from './middlewares/auth.middleware';
import './common/api-error-response';
import SETTINGS from './config/settings';

function toSpecPathPart(path = ''): string {
    return path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

function joinSpecPath(...parts: string[]): string {
    const normalized = parts
        .filter((part) => part !== undefined && part !== null)
        .map((part) => toSpecPathPart(part))
        .join('/');

    const path = normalized.replace(/\/+/g, '/');

    if (!path || path === '/') {
        return '/';
    }

    return path.startsWith('/') ? path : `/${path}`;
}

function createErrorResponse(description: string) {
    return {
        description,
        content: {
            'application/json': {
                schema: {
                    $ref: '#/components/schemas/ApiErrorResponseDto',
                },
            },
        },
    };
}

function enrichSpecWithSecurityAndErrors(spec: any, options: RoutingControllersOptions) {
    const storage = getMetadataArgsStorage();
    const controllerRouteByTarget = new Map(
        storage.controllers.map((controller) => [controller.target, controller.route]),
    );

    for (const action of storage.actions) {
        const controllerRoute = controllerRouteByTarget.get(action.target) || '';
        const fullPath = joinSpecPath(
            options.routePrefix || '',
            controllerRoute,
            typeof action.route === 'string' ? action.route : '',
        );
        const method = String(action.type).toLowerCase();
        const operation = spec?.paths?.[fullPath]?.[method];

        if (!operation) {
            continue;
        }

        const uses = storage.filterUsesWithTargetAndMethod(action.target, action.method);
        const isProtected = uses.some(
            (use) =>
                use.middleware === authMiddleware ||
                use.middleware?.name === authMiddleware.name,
        );

        operation.responses = operation.responses || {};
        operation.responses['500'] =
            operation.responses['500'] || createErrorResponse('Internal server error');

        if (fullPath.includes('{')) {
            operation.responses['404'] =
                operation.responses['404'] || createErrorResponse('Resource not found');
        }

        if (isProtected) {
            operation.security = [{ bearerAuth: [] }];
            operation.responses['401'] =
                operation.responses['401'] || createErrorResponse('Unauthorized');
            operation.responses['403'] =
                operation.responses['403'] || createErrorResponse('Forbidden');
        }
    }

    return spec;
}

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
                title: 'Job Search API',
                description: 'API для сайта поиска работы',
                version: '1.0.0',
            },
            servers: [
                {
                    url: `${SETTINGS.APP_PROTOCOL}://${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}`,
                },
            ],
            tags: [
                {
                    name: 'auth',
                    description: 'Регистрация и вход',
                },
                {
                    name: 'seekers',
                    description: 'Профили соискателей',
                },
                {
                    name: 'companies',
                    description: 'Профили компаний',
                },
                {
                    name: 'resumes',
                    description: 'Резюме и связанные сущности',
                },
                {
                    name: 'vacancies',
                    description: 'Вакансии',
                },
                {
                    name: 'applications',
                    description: 'Отклики на вакансии',
                },
                {
                    name: 'references',
                    description: 'Справочники',
                },
            ],
        });
        enrichSpecWithSecurityAndErrors(spec, options);

        app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

        return app;
    } catch (error) {
        console.error('Ошибка настройки Swagger:', error);
        return app;
    }
}
