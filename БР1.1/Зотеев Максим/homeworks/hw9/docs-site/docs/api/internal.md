# Межсервисный API (Internal Contracts)

Внутренние маршруты `/api/v1/internal/*` используются исключительно для синхронных HTTP-вызовов между микросервисами внутри кластера Kubernetes (`ClusterIP`).

!!! warning "Безопасность внутренних маршрутов"
    1. `api-gateway` блокирует любые внешние запросы к `/api/v1/internal/*` (возвращает `404`).
    2. Каждый вызов требует заголовок `X-Internal-Service-Token`, передаваемый через Kubernetes Secret `auth`.
    3. Политики `NetworkPolicy` разрешают доступ к каждому сервису только от конкретных сервисов-потребителей.

- Спецификация OpenAPI 3.0.3: [internal-api.yaml](specs/internal-api.yaml)

## Матрица вызовов

| Вызывающий сервис | Целевой сервис | Метод и путь | Назначение |
|---|---|---|---|
| `rental-service` | `property-service` | `GET /api/v1/internal/properties/{id}/rental-context` | Получение данных объекта для проверки и снапшота |
| `rental-service` | `property-service` | `PUT /api/v1/internal/properties/{id}/availability` | Оптимистическое резервирование / освобождение (`expected_available`) |
| `rental-service` | `identity-service` | `POST /api/v1/internal/users/batch-get` | Обогащение карточки сделки данными арендатора и владельца |
| `messaging-service` | `rental-service` | `GET /api/v1/internal/rentals/{id}/participants` | Авторизация доступа к чату сделки |
| `messaging-service` | `identity-service` | `POST /api/v1/internal/users/batch-get` | Подстановка профилей отправителей в историю переписки |

## Интерактивный Swagger UI (Internal API)

<div style="border: 1px solid #d0d7de; border-radius: 6px; overflow: hidden;">
  <iframe src="../swagger-internal.html" style="width: 100%; height: 740px; border: 0;" title="Swagger UI — Internal API"></iframe>
</div>
