# Отчёт: ДЗ5 — межсервисное взаимодействие через очереди сообщений

**Дисциплина:** Бэк-энд разработка  
**Выполнил:** Губанов Егор, группа БР1.2  
**Основа:** микросервисы из `labs/lab2` (ЛР2, ДЗ4)

---

## 1. Цель

Добавить асинхронный обмен между микросервисами на **RabbitMQ** вместо синхронного HTTP там, где допустима отложенная обработка (уведомления).

Синхронные internal-вызовы (проверка property, user) остаются по HTTP — как в ДЗ4.

---

## 2. Инфраструктура

| Компонент | Назначение |
|-----------|------------|
| **RabbitMQ 3** (`rabbitmq:3-management-alpine`) | брокер сообщений |
| Порт **5672** | AMQP |
| Порт **15672** | веб-UI (guest/guest) |
| Очередь **`rent.deal.events`** | durable, события по сделкам |

Переменная окружения: `RABBITMQ_URL` (в Docker: `amqp://guest:guest@rabbitmq:5672`).

---

## 3. Схема взаимодействия

```mermaid
sequenceDiagram
  participant Client
  participant GW as gateway
  participant Deals as deals
  participant RMQ as RabbitMQ
  participant Msg as messaging

  Client->>GW: POST /deals
  GW->>Deals: HTTP
  Deals->>Deals: сохранить сделку PENDING
  Deals->>RMQ: deal.created
  Deals-->>Client: 200 + сделка
  RMQ->>Msg: consume deal.created
  Msg->>Msg: INSERT message (арендатор → владелец)
```

При смене статуса сделки (`PATCH /deals/{id}`) сервис **deals** публикует `deal.status_changed`; **messaging** создаёт сообщение владельца арендатору.

---

## 4. Формат событий

Общий модуль: `labs/lab2/packages/shared/src/mq.ts`.

**deal.created** — после создания заявки:

- `deal_id`, `property_id`, `tenant_id`, `owner_id`
- `start_date`, `end_date`, `total_price`

**deal.status_changed** — после `PATCH` статуса:

- `deal_id`, `property_id`, `tenant_id`, `owner_id`
- `status`, `previous_status`

---

## 5. Изменения в коде

| Сервис | Роль |
|--------|------|
| **deals** | publisher: `publishDealEvent()` после create/patch |
| **messaging** | consumer: `dealEventsConsumer.ts`, автосообщения в БД |
| **docker-compose** | сервис `rabbitmq`, `RABBITMQ_URL` у deals и messaging |

Если RabbitMQ недоступен при создании сделки, HTTP-ответ всё равно успешен (ошибка публикации логируется).

---

## 6. Проверка

1. `cd labs/lab2 && docker compose up --build`
2. Postman (ДЗ3): регистрация владельца и арендатора → объект → `POST /deals`
3. `GET /messages` у владельца — появилось автоуведомление о заявке
4. Владелец: `PATCH /deals/{id}` → `ACTIVE` — у арендатора новое сообщение
5. UI RabbitMQ: http://localhost:15672 — очередь `rent.deal.events`

---

## 7. Вывод

Настроен RabbitMQ, реализован обмен **deals → messaging** через очередь `rent.deal.events`. Критичная бизнес-логика (создание сделки, проверки) — синхронно; уведомления — асинхронно.
