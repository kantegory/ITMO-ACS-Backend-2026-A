# 05. Sentry: отслеживание ошибок приложения

## Что Sentry делает, а Prometheus + Loki — нет

Prometheus скажет «API возвращает 500». Loki покажет лог, где что-то пошло не так. Но ни тот, ни другой не группируют одинаковые ошибки в issues, не показывают стектрейс и не уведомляют о новом типе ошибки. Sentry решает эту проблему.

DSN (Data Source Name) — это URL, который указывает, куда отправлять события. Выдаётся при создании проекта в Sentry. SDK собирает event: тип (error или transaction), стектрейс, контекст (версия приложения, environment, tags), breadcrumbs — последовательность действий, которые привели к ошибке, и данные пользователя.

Sentry автоматически группирует схожие стектрейсы в issue. Уведомления приходят при появлении нового типа ошибки, а не при каждом повторении — иначе почтовый ящик заполняется однотипными событиями.

## Подключение в Node.js

Актуальная версия SDK на ноябрь 2026 — `@sentry/node` v11. Установка:

```bash
npm i @sentry/node
```

Инициализация должна быть до любого другого импорта в приложении — иначе авто-инструментация (HTTP, Express, pg, RabbitMQ) не сработает:

```js
// instrument.js — импортируйте этот файл первым в точке входа
import * as Sentry from '@sentry/node';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.npm_config_version,
    tracesSampleRate: 0.2,
});
```

В точке входа приложения:

```js
import './instrument.js';  // первая строка
import express from 'express';
const app = express();
```

По умолчанию SDK ловит все непойманные исключения и ошибки из Promise, инструментирует Express-запросы. Если вы обработали ошибку сами и не хотите терять её, есть `Sentry.captureException(err)`.

Чтобы не отправлять шум (404, ошибки авторизации), используйте `beforeSend`:

```js
Sentry.init({
    // ...
    beforeSend(event) {
        if (event.exception?.values?.[0]?.value?.includes('Cannot find')) return null;
        return event;
    },
});
```

## Self-hosted или облако

Для доп. задания ЛР6 оба варианта дают баллы, разница в количестве баллов и сложности:

| | Self-hosted | Облачный sentry.io |
|---|---|---|
| Баллы | +4 | +2 |
| Развёртывание | Docker compose, ~50 контейнеров | Регистрация, создание проекта |
| Требования | 4 CPU, 16 GB RAM + 16 GB swap, 20 GB disk | — |
| Бесплатный лимит | Ограничен только железом вашей машины | Developer-план: 1 пользователь, 5k ошибок/мес, 30 дней lookback; интеграций (Slack) и API на нём нет — только почта |
| Обслуживание | Ежемесячные релизы, есть hard stops для апгрейда | — |

Self-hosted Sentry — это отдельный тяжёлый стек: Sentry, Snuba, ClickHouse, Kafka, PostgreSQL, Valkey, nginx и ещё около 20 сервисов. Он требует отдельную виртуальную машину, чтобы не конкурировать за ресурсы со стеком мониторинга.

Для ограниченных ресурсов есть профиль `errors-only`, который отключает всё лишнее (profiling, replay, uptime):

```bash
COMPOSE_PROFILES=errors-only docker compose up -d --wait
```

Установка self-hosted:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/getsentry/self-hosted/releases/latest | sed 's|.*/||')
git clone https://github.com/getsentry/self-hosted.git
cd self-hosted && git checkout ${VERSION}
./install.sh
docker compose up -d --wait
```

UI открывается на порту 9000. Создаёте организацию и проект, копируете DSN.

## Проверка

После настройки DSN в `.env` микросервисов и запуска создайте тестовый эндпоинт, который намеренно бросает исключение. Запросите его несколько раз — в Sentry должен появиться issue со стектрейсом, версией приложения и environment.

Частые ошибки: DSN хардкодится в коде (всегда через переменную окружения), `Sentry.init` импортируется после других модулей (авто-инструментация не работает корректно), не задан `release` (ошибки разных версий приложения группируются вместе). DSN — конфиденциальные данные, он не должен попасть в публичный репозиторий.
