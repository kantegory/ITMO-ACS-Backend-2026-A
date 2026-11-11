# Внутренний API сервисов

Межсервисные эндпоинты (`/internal/*`) доступны только внутри сети стенда (docker-сеть или пространство имён Kubernetes с NetworkPolicy) и требуют заголовок `X-Internal-Key`. Спецификация — `homeworks/hw4/openapi-internal.yaml`.

| Кто вызывает | Эндпоинт | Зачем |
|---|---|---|
| reservation → catalog | `GET /internal/tables/{id}`, `GET /internal/restaurants/{id}` | проверить столик при брони, обогатить ответ |
| catalog → reservation | `POST /internal/reservations/availability-batch` | статус столиков на дату и время |
| catalog → review | `POST /internal/ratings/batch` | средний рейтинг и число отзывов |
| review → catalog | `GET /internal/restaurants/{id}` | проверить ресторан при отзыве |
| review → auth | `POST /internal/users/batch` | имена авторов отзывов |

<swagger-ui src="openapi-internal.yaml"/>
