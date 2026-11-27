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
                title: 'MKYrii-ACS-Backend API documentation',
                description: 'API documentation for house rental laboratory project',
                version: '1.0.0',
            },
        });

        app.get('/docs-json', (req, res) => {
            res.json(spec);
        });

        app.use(
            '/docs',
            swaggerUi.serve,
            swaggerUi.setup(spec, {
                swaggerOptions: {
                    persistAuthorization: true,
                    requestInterceptor: (req: any) => {
                        try {
                            const token =
                                window?.localStorage?.getItem(
                                    'swagger_access_token',
                                ) || null;

                            if (token && !req.headers?.Authorization) {
                                req.headers = req.headers || {};
                                req.headers.Authorization = `Bearer ${token}`;
                            }
                        } catch (e) {
                            // ignore
                        }

                        return req;
                    },
                    responseInterceptor: (res: any) => {
                        try {
                            const url: string = res?.url || '';
                            if (
                                url.includes('/api/auth/login') &&
                                res?.status === 200 &&
                                typeof res?.body === 'string'
                            ) {
                                const parsed = JSON.parse(res.body);
                                const token = parsed?.token;
                                if (typeof token === 'string' && token.length) {
                                    window?.localStorage?.setItem(
                                        'swagger_access_token',
                                        token,
                                    );
                                    // If Swagger UI is available, preauthorize automatically
                                    (window as any)?.ui?.preauthorizeApiKey?.(
                                        'bearerAuth',
                                        token,
                                    );
                                }
                            }
                        } catch (e) {
                            // ignore
                        }
                        return res;
                    },
                },
            }),
        );

        return app;
    } catch (error) {
        console.error('Ошибка настройки Swagger:', error);
        return app;
    }
}
