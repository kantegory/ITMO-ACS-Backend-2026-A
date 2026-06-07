# ДЗ5 — Межсервисное взаимодействие через Kafka

Цель: подготовить проект к асинхронной интеграции микросервисов через Kafka.  
Реализация кода и контейнеров выполняется в `ЛР3`.

---

## 1. Зачем Kafka в этом проекте

Kafka нужна для событий, где не требуется мгновенный синхронный ответ:

- публикация вакансии
- изменение профиля компании
- регистрация пользователя

Это уменьшает связанность сервисов и повышает устойчивость при временной недоступности одного из них.

---

## 2. Топики и события

## 2.1 Топики

- `auth.user.created.v1`
- `vacancy.published.v1`
- `vacancy.updated.v1`

## 2.2 Формат события (единый envelope)

```json
{
  "event_id": "uuid",
  "event_type": "vacancy.published",
  "event_version": 1,
  "occurred_at": "2026-06-03T12:00:00Z",
  "producer": "vacancy-service",
  "payload": {}
}
```

## 2.3 Payload примеры

### `auth.user.created`

```json
{
  "user_id": "uuid",
  "email": "user@mail.com",
  "role": "candidate"
}
```

### `vacancy.published`

```json
{
  "vacancy_id": "uuid",
  "employer_user_id": "uuid",
  "title": "Go Backend Developer",
  "industry_id": "uuid",
  "experience_level_id": "uuid",
  "published_at": "2026-06-03T12:05:00Z"
}
```

---

## 3. Какие сервисы публикуют и кто подписывается

| Топик | Producer | Consumers |
|------|----------|-----------|
| `auth.user.created.v1` | Auth Service | Profile Service |
| `vacancy.published.v1` | Vacancy Service | Profile Service, Notification Service (опционально) |
| `vacancy.updated.v1` | Vacancy Service | Profile Service |

---

## 4. Гарантии доставки и обработка ошибок

- Семантика: **at-least-once**.
- Consumer должен быть идемпотентным (по `event_id`).
- При ошибке обработки:
  - логируем событие,
  - не коммитим offset,
  - повторяем чтение.
- Для "ядовитых" сообщений в будущем добавляется DLQ-топик:
  - `*.dlq`.

---

## 5. Контракт ошибок producer/consumer

## Producer

- если Kafka недоступна: вернуть ошибку и оставить бизнес-операцию завершенной (или откатить — в зависимости от критичности события);
- в данном проекте для `vacancy.published` событие логируем и повторяем отправку (retry с backoff).

## Consumer

- ошибка парсинга JSON -> лог + skip/маркировка (не падать всем сервисом)
- временная ошибка БД -> retry

---

## 6. Требования к конфигурации

Переменные окружения:

- `KAFKA_BROKERS` (пример: `kafka:9092`)
- `KAFKA_CLIENT_ID`
- `KAFKA_GROUP_ID`
- `KAFKA_TOPIC_USER_CREATED`
- `KAFKA_TOPIC_VACANCY_PUBLISHED`
- `KAFKA_TOPIC_VACANCY_UPDATED`

---


