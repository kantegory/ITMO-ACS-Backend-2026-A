# API

Машиночитаемая схема: [openapi/openapi.yaml](../openapi/openapi.yaml).

Внутренние методы, которые не торчат наружу: [openapi/openapi-internal.yaml](../openapi/openapi-internal.yaml).

Живой Swagger поднимается вместе с gateway и монолитом по пути `/docs`.

Ошибки приходят в одном виде:

```json
{ "error": { "code": "TABLE_BUSY", "message": "Стол уже занят в этот интервал", "details": null } }
```

Списки возвращают `data` и `meta` с полями `page`, `limit`, `total`.

Авторизация: заголовок `Authorization: Bearer <jwt>`. Токен живёт 7 дней и содержит `id`, `role`, `email`.
