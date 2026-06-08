// src/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sangel API - Маркетплейс охранных услуг',
      version: '1.0.0',
      description: `
API для маркетплейса охранных услуг.

## Основные возможности:
- Регистрация и авторизация пользователей
- Управление охранными компаниями
- Каталог услуг с фильтрацией
- Создание заявок на услуги
- Отзывы и рейтинги
- Избранное
- Административные отчёты

## Роли:
- **USER** - обычный пользователь
- **OWNER** - владелец компании
- **ADMIN** - администратор системы

## Машина состояний заявки:
- \`PENDING\` → \`ACCEPTED\` (OWNER)
- \`PENDING\` → \`REJECTED\` (OWNER)
- \`PENDING\` → \`CANCELLED\` (автор)
      `,
      contact: {
        name: 'Москалец Данила Алексеевич',
      },
    },
    servers: [
      {
        url: 'http://localhost:8000/api/v1',
        description: 'Development server',
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
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Номер страницы (начиная с 1)',
          schema: { type: 'integer', minimum: 1, default: 1 },
        },
        PageSizeParam: {
          name: 'page_size',
          in: 'query',
          description: 'Количество элементов на странице',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
        SortOrderParam: {
          name: 'sort_order',
          in: 'query',
          schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
      },
      schemas: {
        // Общие
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'integer' },
                message: { type: 'string' },
                details: { type: 'object' },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            page_size: { type: 'integer' },
            total_pages: { type: 'integer' },
          },
        },
        
        // Auth & User
        UserResponse: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'USER', 'OWNER'] },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            middle_name: { type: 'string', nullable: true },
            is_verified: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        TokenPairResponse: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            refresh_token: { type: 'string' },
            expires_in: { type: 'integer' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/UserResponse' },
            tokens: { $ref: '#/components/schemas/TokenPairResponse' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'first_name', 'last_name'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 4 },
            first_name: { type: 'string', maxLength: 64 },
            last_name: { type: 'string', maxLength: 64 },
            middle_name: { type: 'string', maxLength: 64, nullable: true },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refresh_token'],
          properties: { refresh_token: { type: 'string' } },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            first_name: { type: 'string', maxLength: 64 },
            last_name: { type: 'string', maxLength: 64 },
            middle_name: { type: 'string', maxLength: 64, nullable: true },
          },
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['old_password', 'new_password'],
          properties: {
            old_password: { type: 'string' },
            new_password: { type: 'string', minLength: 4 },
          },
        },
        
        // Category
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            is_published: { type: 'boolean' },
          },
        },
        CreateCategoryRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', maxLength: 128 },
            is_published: { type: 'boolean', default: true },
          },
        },
        UpdateCategoryRequest: {
          type: 'object',
          properties: {
            title: { type: 'string', maxLength: 128 },
            is_published: { type: 'boolean' },
          },
        },
        
        // Company
        Company: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            logo_url: { type: 'string', nullable: true },
            website: { type: 'string', nullable: true },
            avg_rating: { type: 'number', nullable: true },
            total_reviews: { type: 'integer' },
            total_services: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        CompanyDetail: {
          allOf: [
            { $ref: '#/components/schemas/Company' },
            {
              type: 'object',
              properties: {
                owner: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    first_name: { type: 'string' },
                    last_name: { type: 'string' },
                  },
                },
                services_preview: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ServiceSummary' },
                },
              },
            },
          ],
        },
        CreateCompanyRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', maxLength: 256 },
            description: { type: 'string', maxLength: 4096, nullable: true },
            logo_url: { type: 'string', format: 'uri', nullable: true },
            website: { type: 'string', format: 'uri', nullable: true },
          },
        },
        UpdateCompanyRequest: {
          type: 'object',
          properties: {
            title: { type: 'string', maxLength: 256 },
            description: { type: 'string', maxLength: 4096, nullable: true },
            logo_url: { type: 'string', format: 'uri', nullable: true },
            website: { type: 'string', format: 'uri', nullable: true },
          },
        },
        
        // Service
        ServiceSummary: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            price: { type: 'number' },
            final_price: { type: 'number' },
            discount_percentage: { type: 'integer', nullable: true },
            is_published: { type: 'boolean' },
            categories: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
            avg_rating: { type: 'number', nullable: true },
            total_reviews: { type: 'integer' },
          },
        },
        Service: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            company_id: { type: 'integer' },
            company_title: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            price: { type: 'number' },
            final_price: { type: 'number' },
            discount: { type: 'object', nullable: true },
            is_published: { type: 'boolean' },
            categories: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
            avg_rating: { type: 'number', nullable: true },
            total_reviews: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateServiceRequest: {
          type: 'object',
          required: ['name', 'price'],
          properties: {
            name: { type: 'string', maxLength: 256 },
            description: { type: 'string', maxLength: 4096, nullable: true },
            price: { type: 'number', minimum: 0 },
            is_published: { type: 'boolean', default: true },
            category_ids: { type: 'array', items: { type: 'integer' } },
          },
        },
        UpdateServiceRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', maxLength: 256 },
            description: { type: 'string', maxLength: 4096, nullable: true },
            price: { type: 'number', minimum: 0 },
            is_published: { type: 'boolean' },
            category_ids: { type: 'array', items: { type: 'integer' } },
          },
        },
        
        // Discount
        Discount: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            service_id: { type: 'integer' },
            percentage: { type: 'integer', minimum: 1, maximum: 99 },
            start_at: { type: 'string', format: 'date-time' },
            end_at: { type: 'string', format: 'date-time' },
            is_active: { type: 'boolean' },
          },
        },
        CreateDiscountRequest: {
          type: 'object',
          required: ['percentage', 'start_at', 'end_at'],
          properties: {
            percentage: { type: 'integer', minimum: 1, maximum: 99 },
            start_at: { type: 'string', format: 'date-time' },
            end_at: { type: 'string', format: 'date-time' },
          },
        },
        
        // Request
        ServiceRequest: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            service: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                company: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    title: { type: 'string' },
                  },
                },
              },
            },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                first_name: { type: 'string' },
                last_name: { type: 'string' },
              },
            },
            status: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'] },
            description: { type: 'string', nullable: true },
            reply: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateServiceRequestBody: {
          type: 'object',
          properties: {
            description: { type: 'string', maxLength: 2048 },
          },
        },
        UpdateRequestStatusBody: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['ACCEPTED', 'REJECTED'] },
            reply: { type: 'string', maxLength: 2048 },
          },
        },
        
        // Review
        Review: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            service_id: { type: 'integer' },
            service_name: { type: 'string' },
            company_id: { type: 'integer' },
            company_title: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                first_name: { type: 'string' },
                last_name: { type: 'string' },
              },
            },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            comment: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateReviewRequest: {
          type: 'object',
          required: ['rating'],
          properties: {
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            comment: { type: 'string', maxLength: 4096 },
          },
        },
        
        // Favorite
        Favorite: {
          type: 'object',
          properties: {
            service_id: { type: 'integer' },
            name: { type: 'string' },
            company: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                title: { type: 'string' },
              },
            },
            price: { type: 'number' },
            final_price: { type: 'number' },
            avg_rating: { type: 'number', nullable: true },
            added_at: { type: 'string', format: 'date-time' },
          },
        },
        
        // Reports
        ActivityReport: {
          type: 'object',
          properties: {
            period: {
              type: 'object',
              properties: {
                from: { type: 'string', format: 'date' },
                to: { type: 'string', format: 'date' },
              },
            },
            totals: {
              type: 'object',
              properties: {
                users: { type: 'integer' },
                companies: { type: 'integer' },
                services: { type: 'integer' },
                requests: { type: 'integer' },
                reviews: { type: 'integer' },
              },
            },
            requests_by_status: {
              type: 'object',
              properties: {
                pending: { type: 'integer' },
                accepted: { type: 'integer' },
                rejected: { type: 'integer' },
                cancelled: { type: 'integer' },
              },
            },
            top_companies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  title: { type: 'string' },
                  requests_accepted: { type: 'integer' },
                  avg_rating: { type: 'number', nullable: true },
                },
              },
            },
            new_users_dynamics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date' },
                  count: { type: 'integer' },
                },
              },
            },
          },
        },
        CompanyReport: {
          type: 'object',
          properties: {
            company_id: { type: 'integer' },
            period: {
              type: 'object',
              properties: {
                from: { type: 'string', format: 'date' },
                to: { type: 'string', format: 'date' },
              },
            },
            requests_total: { type: 'integer' },
            requests_by_status: {
              type: 'object',
              properties: {
                pending: { type: 'integer' },
                accepted: { type: 'integer' },
                rejected: { type: 'integer' },
                cancelled: { type: 'integer' },
              },
            },
            top_services: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  service_id: { type: 'integer' },
                  name: { type: 'string' },
                  requests_count: { type: 'integer' },
                  avg_rating: { type: 'number', nullable: true },
                },
              },
            },
            avg_rating: { type: 'number', nullable: true },
            total_reviews: { type: 'integer' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      // ==================== AUTH ====================
      '/auth/register': {
        post: {
          summary: 'Регистрация нового пользователя',
          tags: ['Auth'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterRequest' },
              },
            },
          },
          responses: {
            '201': { description: 'Пользователь зарегистрирован' },
            '400': { description: 'Ошибка валидации' },
            '409': { description: 'Пользователь уже существует' },
          },
        },
      },
      '/auth/login': {
        post: {
          summary: 'Вход в систему',
          tags: ['Auth'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            '200': { description: 'Успешный вход' },
            '401': { description: 'Неверный email или пароль' },
          },
        },
      },
      '/auth/refresh': {
        post: {
          summary: 'Обновление токенов',
          tags: ['Auth'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
              },
            },
          },
          responses: {
            '200': { description: 'Новая пара токенов' },
            '401': { description: 'Невалидный refresh токен' },
          },
        },
      },
      '/auth/logout': {
        post: {
          summary: 'Выход из системы',
          tags: ['Auth'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
              },
            },
          },
          responses: { '204': { description: 'Успешный выход' } },
        },
      },
      '/auth/me': {
        get: {
          summary: 'Текущий пользователь',
          tags: ['Auth'],
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Информация о пользователе' } },
        },
      },
      
      // ==================== PROFILE ====================
      '/users/profile': {
        get: {
          summary: 'Получить профиль',
          tags: ['Profile'],
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Профиль пользователя' } },
        },
        put: {
          summary: 'Обновить профиль',
          tags: ['Profile'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
              },
            },
          },
          responses: { '200': { description: 'Профиль обновлен' } },
        },
      },
      '/users/profile/password': {
        put: {
          summary: 'Сменить пароль',
          tags: ['Profile'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ChangePasswordRequest' },
              },
            },
          },
          responses: { '204': { description: 'Пароль изменен' } },
        },
      },
      
      // ==================== ME ====================
      '/me/company': {
        get: {
          summary: 'Моя компания',
          tags: ['Me'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Компания текущего пользователя' },
            '404': { description: 'Компания не найдена' },
          },
        },
      },
      '/me/requests': {
        get: {
          summary: 'Мои заявки',
          tags: ['Me'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/PageSizeParam' },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'] } },
          ],
          responses: { '200': { description: 'Список заявок' } },
        },
      },
      '/me/reviews': {
        get: {
          summary: 'Мои отзывы',
          tags: ['Me'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/PageSizeParam' },
          ],
          responses: { '200': { description: 'Список отзывов' } },
        },
      },
      '/me/favorites': {
        get: {
          summary: 'Избранное',
          tags: ['Me'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/PageSizeParam' },
          ],
          responses: { '200': { description: 'Список избранных услуг' } },
        },
      },
      
      // ==================== CATEGORIES ====================
      '/categories': {
        get: {
          summary: 'Список категорий',
          tags: ['Categories'],
          security: [],
          responses: { '200': { description: 'Список категорий' } },
        },
        post: {
          summary: 'Создать категорию',
          tags: ['Categories'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateCategoryRequest' },
              },
            },
          },
          responses: {
            '201': { description: 'Категория создана' },
            '403': { description: 'Доступ запрещен (требуется ADMIN)' },
          },
        },
      },
      '/categories/{category_id}': {
        put: {
          summary: 'Обновить категорию',
          tags: ['Categories'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'category_id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateCategoryRequest' },
              },
            },
          },
          responses: { '200': { description: 'Категория обновлена' } },
        },
        delete: {
          summary: 'Удалить категорию',
          tags: ['Categories'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'category_id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '204': { description: 'Категория удалена' } },
        },
      },
      
      // ==================== COMPANIES ====================
      '/companies': {
        get: {
          summary: 'Список компаний',
          tags: ['Companies'],
          security: [],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/PageSizeParam' },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'sort_by', in: 'query', schema: { type: 'string', enum: ['created_at', 'title'] } },
            { $ref: '#/components/parameters/SortOrderParam' },
          ],
          responses: { '200': { description: 'Список компаний' } },
        },
        post: {
          summary: 'Создать компанию',
          tags: ['Companies'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateCompanyRequest' },
              },
            },
          },
          responses: {
            '201': { description: 'Компания создана' },
            '403': { description: 'Пользователь уже владеет компанией' },
          },
        },
      },
      '/companies/{company_id}': {
        get: {
          summary: 'Детали компании',
          tags: ['Companies'],
          security: [],
          parameters: [{ name: 'company_id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'Детальная информация' } },
        },
        put: {
          summary: 'Обновить компанию',
          tags: ['Companies'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'company_id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateCompanyRequest' },
              },
            },
          },
          responses: { '200': { description: 'Компания обновлена' } },
        },
        delete: {
          summary: 'Удалить компанию',
          tags: ['Companies'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'company_id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '204': { description: 'Компания удалена' } },
        },
      },
      '/companies/{company_id}/services': {
        get: {
          summary: 'Услуги компании',
          tags: ['Services'],
          security: [],
          parameters: [
            { name: 'company_id', in: 'path', required: true, schema: { type: 'integer' } },
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/PageSizeParam' },
            { name: 'category_id', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { '200': { description: 'Список услуг' } },
        },
        post: {
          summary: 'Создать услугу',
          tags: ['Services'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'company_id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateServiceRequest' },
              },
            },
          },
          responses: { '201': { description: 'Услуга создана' } },
        },
      },
      '/companies/{company_id}/requests': {
        get: {
          summary: 'Заявки компании',
          tags: ['Companies'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'company_id', in: 'path', required: true, schema: { type: 'integer' } },
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/PageSizeParam' },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'] } },
          ],
          responses: { '200': { description: 'Список заявок' } },
        },
      },
      '/companies/{company_id}/reviews': {
        get: {
          summary: 'Отзывы о компании',
          tags: ['Companies'],
          security: [],
          parameters: [
            { name: 'company_id', in: 'path', required: true, schema: { type: 'integer' } },
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/PageSizeParam' },
          ],
          responses: { '200': { description: 'Список отзывов' } },
        },
      },
      '/companies/{company_id}/report': {
        get: {
          summary: 'Отчет по компании',
          tags: ['Companies'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'company_id', in: 'path', required: true, schema: { type: 'integer' } },
            { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
          ],
          responses: { '200': { description: 'Отчет по компании' } },
        },
      },
      
      // ==================== SERVICES ====================
      '/services': {
        get: {
          summary: 'Каталог услуг',
          tags: ['Services'],
          security: [],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/PageSizeParam' },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'company_id', in: 'query', schema: { type: 'integer' } },
            { name: 'category_id', in: 'query', schema: { type: 'integer' } },
            { name: 'price_min', in: 'query', schema: { type: 'number' } },
            { name: 'price_max', in: 'query', schema: { type: 'number' } },
            { name: 'with_discount', in: 'query', schema: { type: 'boolean' } },
            { name: 'sort_by', in: 'query', schema: { type: 'string', enum: ['created_at', 'price', 'final_price', 'rating'] } },
            { $ref: '#/components/parameters/SortOrderParam' },
          ],
          responses: { '200': { description: 'Список услуг' } },
        },
      },
      '/services/{service_id}': {
        get: {
          summary: 'Детали услуги',
          tags: ['Services'],
          security: [],
          parameters: [{ name: 'service_id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'Детальная информация' } },
        },
        put: {
          summary: 'Обновить услугу',
          tags: ['Services'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'service_id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateServiceRequest' },
              },
            },
          },
          responses: { '200': { description: 'Услуга обновлена' } },
        },
        delete: {
          summary: 'Удалить услугу',
          tags: ['Services'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'service_id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '204': { description: 'Услуга удалена' } },
        },
      },
      '/services/{service_id}/discount': {
        get: {
          summary: 'Скидка услуги',
          tags: ['Discounts'],
          security: [],
          parameters: [{ name: 'service_id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'Информация о скидке' } },
        },
        post: {
          summary: 'Создать скидку',
          tags: ['Discounts'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'service_id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateDiscountRequest' },
              },
            },
          },
          responses: { '201': { description: 'Скидка создана' } },
        },
        put: {
          summary: 'Обновить скидку',
          tags: ['Discounts'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'service_id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateDiscountRequest' },
              },
            },
          },
          responses: { '200': { description: 'Скидка обновлена' } },
        },
        delete: {
          summary: 'Удалить скидку',
          tags: ['Discounts'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'service_id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '204': { description: 'Скидка удалена' } },
        },
      },
      '/services/{service_id}/requests': {
        post: {
          summary: 'Создать заявку',
          tags: ['Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'service_id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateServiceRequestBody' },
              },
            },
          },
          responses: { '201': { description: 'Заявка создана' } },
        },
      },
      '/services/{service_id}/reviews': {
        get: {
          summary: 'Отзывы об услуге',
          tags: ['Reviews'],
          security: [],
          parameters: [
            { name: 'service_id', in: 'path', required: true, schema: { type: 'integer' } },
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/PageSizeParam' },
          ],
          responses: { '200': { description: 'Список отзывов' } },
        },
        post: {
          summary: 'Оставить отзыв',
          tags: ['Reviews'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'service_id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateReviewRequest' },
              },
            },
          },
          responses: { '201': { description: 'Отзыв оставлен' } },
        },
      },
      
      // ==================== REQUESTS ====================
      '/requests/{request_id}': {
        get: {
          summary: 'Детали заявки',
          tags: ['Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'request_id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'Детальная информация' } },
        },
      },
      '/requests/{request_id}/status': {
        put: {
          summary: 'Изменить статус заявки',
          tags: ['Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'request_id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateRequestStatusBody' },
              },
            },
          },
          responses: { '200': { description: 'Статус изменен' } },
        },
      },
      '/requests/{request_id}/cancel': {
        put: {
          summary: 'Отменить заявку',
          tags: ['Requests'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'request_id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'Заявка отменена' } },
        },
      },
      
      // ==================== FAVORITES ====================
      '/favorites/{service_id}': {
        post: {
          summary: 'Добавить в избранное',
          tags: ['Favorites'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'service_id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '201': { description: 'Добавлено' } },
        },
        delete: {
          summary: 'Удалить из избранного',
          tags: ['Favorites'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'service_id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '204': { description: 'Удалено' } },
        },
      },
      
      // ==================== ADMIN ====================
      '/admin/users': {
        get: {
          summary: 'Список пользователей',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/PageSizeParam' },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'role', in: 'query', schema: { type: 'string', enum: ['ADMIN', 'USER', 'OWNER'] } },
          ],
          responses: { '200': { description: 'Список пользователей' } },
        },
      },
      '/admin/users/{user_id}': {
        get: {
          summary: 'Детали пользователя',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'user_id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'Информация о пользователе' } },
        },
        delete: {
          summary: 'Удалить пользователя',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'user_id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '204': { description: 'Пользователь удален' } },
        },
      },
      '/admin/companies': {
        get: {
          summary: 'Список компаний',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/PageSizeParam' },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Список компаний' } },
        },
      },
      '/admin/requests': {
        get: {
          summary: 'Все заявки',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/PageSizeParam' },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'] } },
            { name: 'company_id', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { '200': { description: 'Список заявок' } },
        },
      },
      '/admin/reports/activity': {
        get: {
          summary: 'Отчет по активности',
          tags: ['Admin'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'period', in: 'query', schema: { type: 'string', enum: ['day', 'week', 'month'], default: 'month' } },
            { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
          ],
          responses: { '200': { description: 'Отчет по активности' } },
        },
      },
    },
  },
  apis: ['./src/modules/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);