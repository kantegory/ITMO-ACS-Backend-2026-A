import path from 'path';
import express from 'express';
import swaggerUi from 'swagger-ui-express';

const mountSwagger = (
    app: express.Application,
    docsPath: string,
    openApiPath: string,
    specUrl: string,
): void => {
    const resolvedOpenApiPath = path.resolve(__dirname, openApiPath);

    app.get(specUrl, (_request, response) => {
        response.sendFile(resolvedOpenApiPath);
    });

    app.use(
        docsPath,
        swaggerUi.serve,
        swaggerUi.setup(undefined, {
            swaggerOptions: {
                url: specUrl,
            },
        }),
    );
};

export const mountInternalSwagger = (app: express.Application): void => {
    mountSwagger(app, '/docs', '../../docs/internal-openapi.yaml', '/openapi/internal.yaml');
};

export const mountPublicSwagger = (app: express.Application): void => {
    mountSwagger(app, '/docs/public', '../../docs/public-openapi.yaml', '/openapi/public.yaml');
};
