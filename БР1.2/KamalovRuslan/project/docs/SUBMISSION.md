# Комплект сдачи FitFlow

Студент: **Камалов Руслан Олегович**, ИСУ **408732**, группа **БР1.2**.

## Соответствие работ артефактам

| Работа | Основной артефакт | Отчёт |
|---|---|---|
| ДЗ 1 | `docs/erd.mmd`, `docs/homework-1-database.md` | `docs/reports/HW1.md` |
| ДЗ 2 | `docs/homework-2-requirements.md`, `docs/openapi.yaml` | `docs/reports/HW2.md` |
| ЛР 1 | `apps/monolith` | `docs/reports/LAB1.md` |
| ДЗ 3 | `postman/` | `docs/reports/HW3.md` |
| ДЗ 4 | `docs/homework-4-microservices.md` | `docs/reports/HW4.md` |
| ЛР 2 | `services/*` | `docs/reports/LAB2.md` |
| ДЗ 5 | RabbitMQ publisher/consumer в сервисах | `docs/reports/HW5.md` |
| ЛР 3 | Dockerfiles и `docker-compose.yml` | `docs/reports/LAB3.md` |
| ЛР 4 | `deploy/`, конфигурация Nginx | `docs/reports/LAB4.md` |
| ДЗ 6 | CI/CD workflow | `docs/reports/HW6.md` |

## Локальная приёмка

1. Проверить ФИО, группу БР1.2 и ИСУ во всех отчётах.
2. Выполнить typecheck и тесты; вставить реальный вывод в отчёты.
3. Запустить локальный стек и проверить `/health`, `/api-docs` и все контейнеры.
4. Запустить `postman/FitFlow.postman_collection.json` с локальным environment; сохранить результат Runner.
5. Отрендерить Mermaid-диаграммы и вставить изображения в отчёты.
6. Сделать собственные скриншоты Swagger, PostgreSQL, RabbitMQ и Docker.
7. Экспортировать Markdown-отчёты в формат, который требует преподавательский шаблон.

## Внешние действия

Публикация исходников выполняется отдельно от запуска deploy. Сервер с Docker и каталогом `/opt/fitflow` подготовлен; успешное развёртывание приложения и полный CI/CD ещё не подтверждены. Секреты настраиваются вне репозитория. Перед push main необходимо учитывать автоматический триггер Deploy.
