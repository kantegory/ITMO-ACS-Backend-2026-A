import 'reflect-metadata';
import { Request, RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import { asyncHandler, createServiceApp, errorHandler } from '../common/service-app';
import { unauthorized } from '../common/api-error';
import { SETTINGS } from '../common/settings';
import { serviceRequest, serviceRequestRaw } from '../common/http-client';
import { UserRole } from '../common/enums';

const app = createServiceApp('api-gateway');
const apiPrefix = '/api/v1';

type AuthContext = {
    userId: string;
    role: UserRole;
    email?: string;
};

interface GatewayRequest extends Request {
    auth?: AuthContext;
}

const requestIdOf = (request: Request) =>
    ((request as any).requestId as string) || randomUUID();

const queryString = (query: Request['query']) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (Array.isArray(value)) {
            value.forEach((item) => params.append(key, String(item)));
        } else if (value !== undefined) {
            params.append(key, String(value));
        }
    }
    const value = params.toString();
    return value ? `?${value}` : '';
};

const authHeaders = (request: GatewayRequest) => ({
    'x-user-id': request.auth?.userId || '',
    'x-user-role': request.auth?.role || '',
    ...(request.auth?.email ? { 'x-user-email': request.auth.email } : {}),
    ...(request.header('authorization') ? { authorization: request.header('authorization') as string } : {}),
});

const requireAuth: RequestHandler = asyncHandler(async (request: GatewayRequest, _response, next) => {
    const authorization = request.header('authorization');
    if (!authorization) {
        throw unauthorized('Authorization header is required');
    }

    const result = await serviceRequest<{ data: AuthContext }>(
        SETTINGS.IDENTITY_SERVICE_URL,
        '/internal/auth/introspect',
        {
            method: 'POST',
            requestId: requestIdOf(request),
            body: { token: authorization },
        },
    );

    request.auth = result.data;
    next();
});

const forward = (
    baseUrl: string,
    pathBuilder: (request: GatewayRequest) => string,
    options: { auth?: boolean; method?: string } = {},
) => {
    const handlers: RequestHandler[] = [];
    if (options.auth) {
        handlers.push(requireAuth);
    }
    handlers.push(asyncHandler(async (request: GatewayRequest, response) => {
        const result = await serviceRequestRaw<any>(
            baseUrl,
            pathBuilder(request),
            {
                method: options.method || request.method,
                body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
                requestId: requestIdOf(request),
                headers: options.auth ? authHeaders(request) : {},
            },
        );
        response.status(result.status).send(result.payload);
    }));
    return handlers;
};

app.post(`${apiPrefix}/auth/register`, ...forward(SETTINGS.IDENTITY_SERVICE_URL, () => '/auth/register', { method: 'POST' }));
app.post(`${apiPrefix}/auth/login`, ...forward(SETTINGS.IDENTITY_SERVICE_URL, () => '/auth/login', { method: 'POST' }));
app.post(`${apiPrefix}/auth/logout`, requireAuth, ...forward(SETTINGS.IDENTITY_SERVICE_URL, () => '/auth/logout', { method: 'POST' }));
app.get(`${apiPrefix}/users/me`, ...forward(SETTINGS.IDENTITY_SERVICE_URL, () => '/users/me', { auth: true }));
app.patch(`${apiPrefix}/users/me`, ...forward(SETTINGS.IDENTITY_SERVICE_URL, () => '/users/me', { auth: true }));

app.get(`${apiPrefix}/reference/cuisines`, ...forward(SETTINGS.CATALOG_SERVICE_URL, () => '/reference/cuisines'));
app.get(`${apiPrefix}/reference/locations`, ...forward(SETTINGS.CATALOG_SERVICE_URL, () => '/reference/locations'));
app.get(`${apiPrefix}/reference/price-categories`, ...forward(SETTINGS.CATALOG_SERVICE_URL, () => '/reference/price-categories'));
app.get(`${apiPrefix}/reference/reservation-statuses`, (_request, response) => {
    response.send({
        data: [
            { code: 'PENDING', label: 'Pending' },
            { code: 'CONFIRMED', label: 'Confirmed' },
            { code: 'CANCELLED', label: 'Cancelled' },
            { code: 'COMPLETED', label: 'Completed' },
        ],
    });
});
app.get(`${apiPrefix}/reference/roles`, (_request, response) => {
    response.send({
        data: [
            { code: 'ADMIN', label: 'Administrator' },
            { code: 'USER', label: 'User' },
        ],
    });
});

app.get(`${apiPrefix}/restaurants`, asyncHandler(async (request, response) => {
    const catalogResponse = await serviceRequest<any>(
        SETTINGS.CATALOG_SERVICE_URL,
        `/restaurants${queryString(request.query)}`,
        { requestId: requestIdOf(request) },
    );

    if (request.query.reservationDate && request.query.reservationTime && request.query.guestsCount) {
        const availability = await serviceRequest<any>(
            SETTINGS.RESERVATION_SERVICE_URL,
            '/internal/availability/search',
            {
                method: 'POST',
                requestId: requestIdOf(request),
                body: {
                    restaurantIds: catalogResponse.data.map((restaurant: any) => restaurant.id),
                    reservationDate: request.query.reservationDate,
                    reservationTime: request.query.reservationTime,
                    guestsCount: Number(request.query.guestsCount),
                },
            },
        );
        const availableIds = new Set(
            availability.data
                .filter((item: any) => item.hasAvailableTables)
                .map((item: any) => item.restaurantId),
        );
        catalogResponse.data = catalogResponse.data.filter((restaurant: any) => availableIds.has(restaurant.id));
    }

    response.send(catalogResponse);
}));

app.get(`${apiPrefix}/restaurants/:restaurantId`, asyncHandler(async (request, response) => {
    const restaurantId = request.params.restaurantId;
    const [restaurant, menu, tables, rating] = await Promise.all([
        serviceRequest<any>(SETTINGS.CATALOG_SERVICE_URL, `/restaurants/${restaurantId}`, { requestId: requestIdOf(request) }),
        serviceRequest<any>(SETTINGS.MENU_SERVICE_URL, `/internal/restaurants/${restaurantId}/menu-summary`, { requestId: requestIdOf(request) }),
        serviceRequest<any>(SETTINGS.RESERVATION_SERVICE_URL, `/restaurants/${restaurantId}/tables`, { requestId: requestIdOf(request) }),
        serviceRequest<any>(SETTINGS.REVIEW_SERVICE_URL, `/internal/restaurants/${restaurantId}/rating-summary`, { requestId: requestIdOf(request) }),
    ]);

    response.send({
        data: {
            ...restaurant.data,
            menu: menu.data,
            tables: tables.data,
            reviewsSummary: {
                totalReviews: rating.data.reviewsCount,
                avgRating: rating.data.avgRating,
            },
        },
    });
}));

app.get(`${apiPrefix}/restaurants/:restaurantId/menu`, ...forward(SETTINGS.MENU_SERVICE_URL, (request) => `/restaurants/${request.params.restaurantId}/menu`));
app.get(`${apiPrefix}/restaurants/:restaurantId/photos`, ...forward(SETTINGS.CATALOG_SERVICE_URL, (request) => `/restaurants/${request.params.restaurantId}/photos`));
app.get(`${apiPrefix}/restaurants/:restaurantId/reviews`, ...forward(SETTINGS.REVIEW_SERVICE_URL, (request) => `/restaurants/${request.params.restaurantId}/reviews${queryString(request.query)}`));
app.post(`${apiPrefix}/restaurants/:restaurantId/reviews`, ...forward(SETTINGS.REVIEW_SERVICE_URL, (request) => `/restaurants/${request.params.restaurantId}/reviews`, { auth: true }));
app.patch(`${apiPrefix}/restaurants/:restaurantId/reviews/:reviewId`, ...forward(SETTINGS.REVIEW_SERVICE_URL, (request) => `/restaurants/${request.params.restaurantId}/reviews/${request.params.reviewId}`, { auth: true }));
app.get(`${apiPrefix}/restaurants/:restaurantId/availability`, ...forward(SETTINGS.RESERVATION_SERVICE_URL, (request) => `/restaurants/${request.params.restaurantId}/tables/available${queryString(request.query)}`));

app.get(`${apiPrefix}/reservations`, ...forward(SETTINGS.RESERVATION_SERVICE_URL, (request) => `/reservations${queryString(request.query)}`, { auth: true }));
app.post(`${apiPrefix}/reservations`, ...forward(SETTINGS.RESERVATION_SERVICE_URL, () => '/reservations', { auth: true }));
app.get(`${apiPrefix}/reservations/:reservationId`, ...forward(SETTINGS.RESERVATION_SERVICE_URL, (request) => `/reservations/${request.params.reservationId}`, { auth: true }));
app.patch(`${apiPrefix}/reservations/:reservationId`, ...forward(SETTINGS.RESERVATION_SERVICE_URL, (request) => `/reservations/${request.params.reservationId}`, { auth: true }));
app.post(`${apiPrefix}/reservations/:reservationId/cancel`, ...forward(SETTINGS.RESERVATION_SERVICE_URL, (request) => `/reservations/${request.params.reservationId}/cancel`, { auth: true }));

app.post(`${apiPrefix}/admin/locations`, ...forward(SETTINGS.CATALOG_SERVICE_URL, () => '/admin/locations', { auth: true }));
app.patch(`${apiPrefix}/admin/locations/:locationId`, ...forward(SETTINGS.CATALOG_SERVICE_URL, (request) => `/admin/locations/${request.params.locationId}`, { auth: true }));
app.post(`${apiPrefix}/admin/restaurants`, ...forward(SETTINGS.CATALOG_SERVICE_URL, () => '/admin/restaurants', { auth: true }));
app.patch(`${apiPrefix}/admin/restaurants/:restaurantId`, ...forward(SETTINGS.CATALOG_SERVICE_URL, (request) => `/admin/restaurants/${request.params.restaurantId}`, { auth: true }));
app.patch(`${apiPrefix}/admin/restaurants/:restaurantId/publication`, ...forward(SETTINGS.CATALOG_SERVICE_URL, (request) => `/admin/restaurants/${request.params.restaurantId}/publication`, { auth: true }));
app.post(`${apiPrefix}/admin/restaurants/:restaurantId/photos`, ...forward(SETTINGS.CATALOG_SERVICE_URL, (request) => `/admin/restaurants/${request.params.restaurantId}/photos`, { auth: true }));
app.patch(`${apiPrefix}/admin/photos/:photoId`, ...forward(SETTINGS.CATALOG_SERVICE_URL, (request) => `/admin/photos/${request.params.photoId}`, { auth: true }));

app.post(`${apiPrefix}/admin/restaurants/:restaurantId/tables`, ...forward(SETTINGS.RESERVATION_SERVICE_URL, (request) => `/admin/restaurants/${request.params.restaurantId}/tables`, { auth: true }));
app.patch(`${apiPrefix}/admin/tables/:tableId`, ...forward(SETTINGS.RESERVATION_SERVICE_URL, (request) => `/admin/tables/${request.params.tableId}`, { auth: true }));
app.patch(`${apiPrefix}/admin/reservations/:reservationId/status`, ...forward(SETTINGS.RESERVATION_SERVICE_URL, (request) => `/admin/reservations/${request.params.reservationId}/status`, { auth: true }));

app.post(`${apiPrefix}/admin/restaurants/:restaurantId/menu-categories`, ...forward(SETTINGS.MENU_SERVICE_URL, (request) => `/admin/restaurants/${request.params.restaurantId}/menu-categories`, { auth: true }));
app.patch(`${apiPrefix}/admin/menu-categories/:menuCategoryId`, ...forward(SETTINGS.MENU_SERVICE_URL, (request) => `/admin/menu-categories/${request.params.menuCategoryId}`, { auth: true }));
app.post(`${apiPrefix}/admin/menu-categories/:menuCategoryId/items`, ...forward(SETTINGS.MENU_SERVICE_URL, (request) => `/admin/menu-categories/${request.params.menuCategoryId}/items`, { auth: true }));
app.patch(`${apiPrefix}/admin/menu-items/:menuItemId`, ...forward(SETTINGS.MENU_SERVICE_URL, (request) => `/admin/menu-items/${request.params.menuItemId}`, { auth: true }));

app.use(errorHandler);

app.listen(SETTINGS.GATEWAY_PORT, SETTINGS.GATEWAY_HOST, () => {
    console.log(`api-gateway listening at http://${SETTINGS.GATEWAY_HOST}:${SETTINGS.GATEWAY_PORT}`);
});
