# Задача

Задокументировать микросервисное приложение с использованием Postman, OpenAPI/Swagger и MkDocs.

# Ход работы

Существующая Postman-коллекция из ЛР2–3 включена в репозиторий; прежде JSON-файлы исключались общим .gitignore. Добавлен environment semester2.postman_environment.json с loopback URL без сохранённых токенов. Основной сценарий включает регистрацию, вход, компанию, вакансию, резюме, отклик, приглашение и уведомления; коллекция содержит 65 запросов.

OpenAPI строится springdoc из текущих контроллеров и DTO каждого сервиса. Gateway агрегирует девять спецификаций в Swagger UI по /swagger-ui.html; runtime JSON доступен через /auth-docs/v3/api-docs и аналогичные routes. Статические схемы первого семестра сохранены как проектные артефакты.

Создан MkDocs-сайт из семи страниц: обзор, архитектура, запуск/обновление, API/Postman, мониторинг, облачная инфраструктура, нагрузка/SLO. Есть таблица сервисов и портов, схема владения БД, event topics, инструкции deploy/rollback/backup и ограничения readiness. Все ссылки в сайте относительные.

```bash
pip install -r infra/semester2/requirements.txt
mkdocs build --strict -f infra/semester2/mkdocs.yml
mkdocs serve -f infra/semester2/mkdocs.yml
```

# Проверка

MkDocs успешно собран с --strict. Проверки конфигурации включены в validate job. Результат фактического runtime Swagger и Postman фиксируется отдельно в ../../semester2-verification.md.

# Вывод

Документация объединяет исполняемый API-контракт, воспроизводимую Postman-коллекцию и руководство эксплуатации MkDocs. Подготовленные инструкции не подменяют результаты тестов.
