import cors from 'cors';
import express from 'express';

import { asyncHandler } from '../shared/async-handler';
import { errorHandler, notFoundHandler, serviceUnavailable } from '../shared/errors';
import SETTINGS from '../shared/settings';
import { mountInternalSwagger } from '../shared/swagger';

const app = express();

app.use(cors());
app.use(express.json());

mountInternalSwagger(app);

const proxyTo =
    (baseUrl: string) =>
    asyncHandler(async (request, response) => {
        const targetUrl = new URL(request.originalUrl, `${baseUrl}/`);
        const headers: Record<string, string> = {};

        for (const [key, value] of Object.entries(request.headers)) {
            if (typeof value !== 'string') {
                continue;
            }

            if (['host', 'content-length', 'connection'].includes(key.toLowerCase())) {
                continue;
            }

            headers[key] = value;
        }

        let body: string | undefined;

        if (!['GET', 'HEAD'].includes(request.method.toUpperCase()) && request.body !== undefined) {
            body = JSON.stringify(request.body);
            headers['content-type'] = 'application/json';
        }

        let upstreamResponse: Response;

        try {
            upstreamResponse = await fetch(targetUrl.toString(), {
                method: request.method,
                headers,
                body,
            });
        } catch (_error) {
            throw serviceUnavailable('Target service is temporarily unavailable');
        }

        upstreamResponse.headers.forEach((value, key) => {
            if (!['transfer-encoding', 'content-encoding'].includes(key.toLowerCase())) {
                response.setHeader(key, value);
            }
        });

        response.status(upstreamResponse.status);

        if (upstreamResponse.status === 204) {
            response.send();
            return;
        }

        const buffer = Buffer.from(await upstreamResponse.arrayBuffer());
        response.send(buffer);
    });

app.get('/health', (_request, response) => {
    response.json({ service: 'api-gateway', status: 'ok' });
});

app.use(`${SETTINGS.APP_API_PREFIX}/auth`, proxyTo(SETTINGS.AUTH_SERVICE_URL));
app.use(`${SETTINGS.APP_API_PREFIX}/users`, proxyTo(SETTINGS.AUTH_SERVICE_URL));
app.use(
    `${SETTINGS.APP_API_PREFIX}/recipes/:recipeId/comments`,
    proxyTo(SETTINGS.INTERACTION_SERVICE_URL),
);
app.use(
    `${SETTINGS.APP_API_PREFIX}/recipes/:recipeId/like`,
    proxyTo(SETTINGS.INTERACTION_SERVICE_URL),
);
app.use(
    `${SETTINGS.APP_API_PREFIX}/recipes/:recipeId/favorite`,
    proxyTo(SETTINGS.INTERACTION_SERVICE_URL),
);
app.use(`${SETTINGS.APP_API_PREFIX}/recipes`, proxyTo(SETTINGS.RECIPE_SERVICE_URL));
app.use(`${SETTINGS.APP_API_PREFIX}/reference-data`, proxyTo(SETTINGS.RECIPE_SERVICE_URL));

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(SETTINGS.GATEWAY_PORT, SETTINGS.APP_HOST, () => {
    console.log(
        `api-gateway listening on ${SETTINGS.APP_PROTOCOL}://${SETTINGS.APP_HOST}:${SETTINGS.GATEWAY_PORT}`,
    );
});

export default app;
