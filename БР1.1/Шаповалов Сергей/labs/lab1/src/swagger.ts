import { Express } from 'express';
import * as swaggerUi from 'swagger-ui-express';

export function useSwagger(app: Express): Express {
    const spec = {
        openapi: '3.0.0',
        info: {
            title: 'Restaurant Booking API',
            description: 'REST API для бронирования столиков в ресторанах',
            version: '1.0.0',
        },
        servers: [
            {
                url: 'http://localhost:8000',
                description: 'Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        email: { type: 'string' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        middleName: { type: 'string' },
                    },
                },
                Restaurant: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        address: { type: 'string' },
                        district: { type: 'string' },
                        priceRange: { type: 'number' },
                    },
                },
                Reservation: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        restaurantId: { type: 'number' },
                        userId: { type: 'number' },
                        startTime: { type: 'string', format: 'date-time' },
                        guestCount: { type: 'number' },
                        status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED'] },
                    },
                },
                Review: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        restaurantId: { type: 'number' },
                        userId: { type: 'number' },
                        rating: { type: 'number', minimum: 1, maximum: 5 },
                        comment: { type: 'string' },
                    },
                },
            },
        },
        paths: {
            '/api/auth/login': {
                post: {
                    tags: ['Аутентификация'],
                    summary: 'Вход',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        email: { type: 'string' },
                                        password: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Успешный вход',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            accessToken: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/api/auth/register': {
                post: {
                    tags: ['Аутентификация'],
                    summary: 'Регистрация',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        email: { type: 'string' },
                                        password: { type: 'string' },
                                        first_name: { type: 'string' },
                                        last_name: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Пользователь зарегистрирован' },
                    },
                },
            },
            '/api/restaurants': {
                get: {
                    tags: ['Рестораны'],
                    summary: 'Список ресторанов',
                    parameters: [
                        { name: 'price_range', in: 'query', schema: { type: 'number' } },
                        { name: 'district', in: 'query', schema: { type: 'string' } },
                        { name: 'cuisine', in: 'query', schema: { type: 'string' } },
                        { name: 'search', in: 'query', schema: { type: 'string' } },
                        { name: 'ordering', in: 'query', schema: { type: 'string' } },
                    ],
                    responses: {
                        200: {
                            description: 'Список ресторанов',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Restaurant' },
                                    },
                                },
                            },
                        },
                    },
                },
                post: {
                    tags: ['Рестораны'],
                    summary: 'Создать ресторан',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        description: { type: 'string' },
                                        address: { type: 'string' },
                                        price_range: { type: 'number' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Ресторан создан' },
                    },
                },
            },
            '/api/restaurants/{id}': {
                get: {
                    tags: ['Рестораны'],
                    summary: 'Получить ресторан',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
                    responses: {
                        200: {
                            description: 'Данные ресторана',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/Restaurant' },
                                },
                            },
                        },
                    },
                },
                patch: {
                    tags: ['Рестораны'],
                    summary: 'Обновить ресторан',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Restaurant' },
                            },
                        },
                    },
                    responses: { 200: { description: 'Ресторан обновлен' } },
                },
                delete: {
                    tags: ['Рестораны'],
                    summary: 'Удалить ресторан',
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
                    responses: { 204: { description: 'Ресторан удален' } },
                },
            },
            '/api/reservations': {
                get: {
                    tags: ['Бронирования'],
                    summary: 'Список бронирований',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Список бронирований',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Reservation' },
                                    },
                                },
                            },
                        },
                    },
                },
                post: {
                    tags: ['Бронирования'],
                    summary: 'Создать бронирование',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        restaurant: { type: 'number' },
                                        start_time: { type: 'string', format: 'date-time' },
                                        guest_count: { type: 'number' },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 201: { description: 'Бронирование создано' } },
                },
            },
            '/api/reservations/{id}': {
                get: {
                    tags: ['Бронирования'],
                    summary: 'Получить бронирование',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
                    responses: { 200: { description: 'Данные бронирования' } },
                },
                patch: {
                    tags: ['Бронирования'],
                    summary: 'Обновить бронирование',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
                    responses: { 200: { description: 'Бронирование обновлено' } },
                },
                delete: {
                    tags: ['Бронирования'],
                    summary: 'Удалить бронирование',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'number' } }],
                    responses: { 204: { description: 'Бронирование удалено' } },
                },
            },
            '/api/reviews': {
                get: {
                    tags: ['Отзывы'],
                    summary: 'Список отзывов',
                    responses: { 200: { description: 'Список отзывов' } },
                },
                post: {
                    tags: ['Отзывы'],
                    summary: 'Создать отзыв',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        restaurant: { type: 'number' },
                                        rating: { type: 'number', minimum: 1, maximum: 5 },
                                        comment: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    responses: { 201: { description: 'Отзыв создан' } },
                },
            },
            '/api/users/me': {
                get: {
                    tags: ['Профиль'],
                    summary: 'Личный кабинет',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'Данные пользователя' } },
                },
                patch: {
                    tags: ['Профиль'],
                    summary: 'Обновить профиль',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/User' },
                            },
                        },
                    },
                    responses: { 200: { description: 'Профиль обновлен' } },
                },
            },
        },
    };

    app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
    console.log('Swagger загружен успешно: http://localhost:8000/docs');

    return app;
}
