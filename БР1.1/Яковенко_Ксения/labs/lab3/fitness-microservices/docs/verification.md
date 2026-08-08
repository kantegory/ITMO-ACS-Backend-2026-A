# Проверка проекта

При подготовке выполнены проверки, не требующие запущенного Docker daemon:

- TypeScript: `tsc --noEmit` - ошибок нет;
- `package.json` и Postman collection корректно парсятся как JSON;
- OpenAPI и Docker Compose корректно парсятся как YAML;
- проверено отсутствие `.env`, `node_modules` и `dist` в выдаваемом архиве;
- проверено, что доменные сервисы не используют TypeORM-сущности чужих баз.

Полный интеграционный запуск RabbitMQ/PostgreSQL/Docker Compose должен быть выполнен на машине с Docker Desktop:

```powershell
docker compose up --build -d
docker compose --profile tools run --rm seed
docker compose ps
```

Основные проверки:

```text
http://localhost:3000/health/services
http://localhost:15672
http://localhost:3003/health/rabbitmq
http://localhost:3007/health/rabbitmq
```

После запуска нужно выполнить Postman-сценарий `Login user -> Enroll user -> Notifications` и убедиться, что событие проходит через RabbitMQ.
