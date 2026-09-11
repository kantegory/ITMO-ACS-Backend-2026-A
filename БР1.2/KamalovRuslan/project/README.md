# FitFlow — проект по backend-разработке

Я разработал FitFlow как учебный backend фитнес-платформы для курса ITMO ACS Backend 2026. В проекте сохранены обе стадии реализации: монолит для первой лабораторной и микросервисы для второй части курса.

## Состав проекта

- `apps/monolith` — монолитный REST API;
- `services/auth` — регистрация, вход и профиль;
- `services/workout` — каталог тренировок и личные планы;
- `services/progress` — история и статистика выполнения;
- `services/content` — статьи;
- `packages/shared` — JWT, валидация и общий формат ошибок;
- `docs` — ERD, требования, OpenAPI, архитектура и исходники отчётов;
- `postman` — комплексный сценарий из 19 запросов;
- `docker-compose.yml` — монолитный и микросервисный профили;
- `deploy` — Nginx, Dockerfile и инструкция сервера;
- `.github/workflows` — CI и автоматический деплой ветки `main`.

## Локальная проверка

```sh
npm ci
npm run build
npm test
docker-compose --profile monolith config --quiet
docker-compose --profile microservices config --quiet
```

Для запуска монолита:

```sh
cp .env.example .env
docker-compose --profile monolith up --build
```

Для запуска микросервисов:

```sh
cp deploy/.env.example .env
docker-compose --profile microservices up --build
```

После запуска API доступен через Nginx по адресу `http://localhost:8080`, Swagger монолита — по `/api-docs`. Для демонстрации создаётся локальный администратор `admin@fitflow.local`; пароль и создание тестовых данных управляются переменными окружения.

## Данные студента

Камалов Руслан Олегович, ИСУ 408732, группа БР1.2. Отчёты размещены в соседних каталогах `../homeworks` и `../labs`. Результаты фактического серверного запуска добавляются после проверки.

Подробное соответствие заданиям приведено в `docs/SUBMISSION.md`.
