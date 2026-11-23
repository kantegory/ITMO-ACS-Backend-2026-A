# OpenAPI / Swagger

У каждого сервиса плагин `@elysiajs/openapi`. UI и JSON-спека:

| Сервис | Swagger UI | JSON |
|--------|------------|------|
| auth | `http://127.0.0.1:3001/openapi` | `/openapi/json` |
| catalog | `http://127.0.0.1:3002/openapi` | `/openapi/json` |
| jobseeker | `http://127.0.0.1:3003/openapi` | `/openapi/json` |
| employer | `http://127.0.0.1:3004/openapi` | `/openapi/json` |
| application | `http://127.0.0.1:3005/openapi` | `/openapi/json` |

Описание схем в коде: `services/<name>/src/openapi.ts`.

Через gateway OpenAPI сервисов не проксируется: смотреть напрямую на порты сервисов (локально или `kubectl port-forward`).

Авторизация в UI: scheme `bearerAuth`, access token из `POST /api/v1/auth/login`.
