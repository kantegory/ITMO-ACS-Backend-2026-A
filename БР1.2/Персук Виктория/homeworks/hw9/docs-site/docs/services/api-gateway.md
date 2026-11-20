# api-gateway

Единая точка входа: проксирует внешние запросы в бизнес-сервисы.


**Порт:** 3000

API Gateway — единая точка входа для всех клиентских запросов. Не содержит бизнес-логики — только проксирует запросы к нужному сервису, сохраняя исходный путь и заголовки.

## Маршрутизация

| Путь запроса | Проксируется в |
|--------------|----------------|
| `/api/v1/auth/**` | auth-service:3001 |
| `/api/v1/users/**` | auth-service:3001 |
| `/api/v1/restaurants/**` | restaurant-service:3002 |
| `/api/v1/cuisines/**` | restaurant-service:3002 |
| `/api/v1/photos/**` | restaurant-service:3002 |
| `/api/v1/tables/**` | reservation-service:3003 |
| `/api/v1/reservations/**` | reservation-service:3003 |
| `/api/v1/menus/**` | menu-service:3004 |
| `/api/v1/menu-items/**` | menu-service:3004 |
| `/api/v1/reviews/**` | review-service:3005 |
| `GET /health` | отвечает сам (`{ status: "ok" }`) |

Реализовано с помощью `http-proxy-middleware`:

```typescript
const proxy = (target: string) =>
    createProxyMiddleware({ target, changeOrigin: true });

app.use('/api/v1/auth', proxy(AUTH_SERVICE_URL));
```

Внутренние маршруты (`/internal/**`) **не проксируются** через gateway и доступны только внутри Docker-сети.



