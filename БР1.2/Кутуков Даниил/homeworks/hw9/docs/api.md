# API и Postman

Публичная база REST действующего стенда — `https://backend.dev.ehrmann.assistant.metamentor.pro/api/v1`. На учебном Kubernetes-стенде API доступен под `/api/v1` на общем HTTPS-домене с frontend.

| Операция | Доступ | Ожидаемый ответ |
|---|---|---|
| `GET /health` | Общедоступно | `200 {"status":"ok"}` |
| `GET /auth/check_token` | ADFS Bearer + cookie `session_id` | `200` или `401` без сессии |
| `GET /chats/?offset=0&limit=10` | ADFS Bearer + cookie `session_id` | `200`, `result.data` и `result.has_next` |
| `GET /docs` и `GET /openapi.json` | Публичный REST-контракт | Swagger UI и OpenAPI 3.1 |
| `WS /ws/connect?token=…` | ADFS-токен и cookie `session_id` | События чата, подключения описаны в `GET /ws/ws-docs` |

Для входа браузер открывает `GET /auth/auth?redirect_to=...`. ADFS отправляет ответ на `POST /auth/callback`. После редиректа SPA меняет одноразовый идентификатор на токены через `GET /auth/tokens?auth_session_id=...`. Cookie `session_id` устанавливается c атрибутами HttpOnly и Secure.

Импортируйте [коллекцию Postman](assets/Ehrmann.postman_collection.json). Первые два запроса проверяют доступность и отказ без сессии. Для запроса чатов укажите `accessToken` и `sessionId` в локальном окружении Postman либо используйте cookie jar вместе с Bearer. Используйте тестовую учётную запись. Статус `429` означает достижение лимита на IP.

Доступны [снимок спецификации backend](assets/openapi.json) и [спецификация основных внутренних HTTP-маршрутов ML](assets/ml-core.openapi.yml). В снимке от 26.11.2026 примеры ошибок приведены к формату OpenAPI 3.1 и разведен дубликат идентификатора операций Grafana. Эти изменения также внесены в исходники backend.

Swagger для ML Core доступен по `/docs` из его частной сети. События WebSocket и RabbitMQ описаны в [архитектуре](architecture.md).
