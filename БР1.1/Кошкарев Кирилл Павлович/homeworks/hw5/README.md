# ДЗ5 — межсервисное взаимодействие через очереди сообщений

Брокер: RabbitMQ, topic-exchange `recipes.events`, две очереди потребителей и
dead-letter-контур. Контракт событий описан в `../hw4/events.yaml`.

| Файл | Содержимое |
|---|---|
| `ДЗ5_Кошкарев Кирилл Павлович_БР1.1.pdf` | отчёт |
| `events-smoke.mjs` | проверка полного цикла событий (22 проверки) |

Код шины: `labs/lab2/*/src/messaging/` — `bus.ts` (подключение, публикация, подписка,
dead-letter, переподключение), `publisher.ts` (исходящие события), `consumer.ts`
(обработчики с журналом `processed_events` для идемпотентности).

Запуск проверки (контур поднят через ЛР3):

```bash
cd ../../labs/lab3 && docker compose up -d --build
docker compose exec user-service   node dist/seed.js
docker compose exec recipe-service node dist/seed.js
cd ../../homeworks/hw5 && node events-smoke.mjs
```
