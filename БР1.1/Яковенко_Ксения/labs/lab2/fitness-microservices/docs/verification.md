# Проверка проекта

В среде подготовки выполнены проверки:

- `npm install` — успешно;
- `npm run build` — успешно, TypeScript ошибок не выдал;
- `npm audit --omit=dev` — 0 уязвимостей;
- JSON Postman collection — корректно парсится;
- YAML OpenAPI — корректно парсится;
- API Gateway запускается, `GET /health` возвращает `status: ok`;
- статическая проверка не обнаружила импортов TypeORM-сущностей между доменными сервисами.

Полный интеграционный запуск семи PostgreSQL-баз в среде подготовки не выполнялся, потому что Docker/PostgreSQL в ней недоступны. Для локальной проверки подготовлены `docker-compose.databases.yml`, init-скрипт, seed и пошаговая инструкция в README.
