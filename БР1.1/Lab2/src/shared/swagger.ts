import path from 'path';
import express from 'express';
import swaggerUi from 'swagger-ui-express';

export const mountInternalSwagger = (app: express.Application): void => {
    const openApiPath = path.resolve(__dirname, '../../docs/internal-openapi.yaml');

    app.get('/openapi/internal.yaml', (_request, response) => {
        response.sendFile(openApiPath);
    });

    app.use(
        '/docs',
        swaggerUi.serve,
        swaggerUi.setup(undefined, {
            swaggerOptions: {
                url: '/openapi/internal.yaml',
            },
        }),
    );
};
