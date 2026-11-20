# Swagger UI сервисов

Кроме единой спецификации, каждый сервис сам генерирует OpenAPI-описание из кода. Маршруты описываются декораторами `routing-controllers`, а схемы запросов и ответов строятся из DTO с аннотациями `class-validator`. Поэтому эта документация всегда совпадает с тем, что реально реализовано в коде.

Генерацию выполняет файл `src/swagger.ts` каждого сервиса с помощью библиотек `routing-controllers-openapi` и `class-validator-jsonschema`, а отображение берёт на себя `swagger-ui-express`.

Swagger UI доступен на портах каждого сервиса:

| Сервис | URL |
|--------|-----|
| auth-service | http://localhost:3001/api/docs |
| restaurant-service | http://localhost:3002/api/docs |
| reservation-service | http://localhost:3003/api/docs |
| menu-service | http://localhost:3004/api/docs |
| review-service | http://localhost:3005/api/docs |

Для защищённых маршрутов нужно:
1. Выполнить `POST /auth/login` → скопировать `accessToken`
2. Нажать кнопку **Authorize** в Swagger UI
3. Ввести токен в поле `bearerAuth` (без слова `Bearer`)

## Чем отличаются два вида документации

| | Единая спецификация `openapi.yaml` | Swagger UI сервиса |
|---|---|---|
| Как создаётся | Пишется вручную | Генерируется из кода при запуске сервиса |
| Что описывает | Все сервисы, включая внутренние эндпоинты | Только один сервис |
| Где смотреть | Раздел [Спецификация OpenAPI](openapi.md) | `http://localhost:<порт>/api/docs` |
| Для кого | Клиенты API и проектирование | Разработчик конкретного сервиса |
