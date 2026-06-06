# ДЗ5. Межсервисное взаимодействие через очереди сообщений

**Вариант:** сайт поиска работы  
**Брокер:** RabbitMQ  
**Реализация:** `services/auth/`, `services/profile/`, `services/vacancy/`  
**Срок:** по заданию курса

## Задача

Подключить RabbitMQ и реализовать межсервисное взаимодействие посредством очередей сообщений.

## Ход работы

### 1. Инфраструктура

RabbitMQ в [`docker-compose.yml`](../docker-compose.yml):

```yaml
rabbitmq:
  image: rabbitmq:3-management-alpine
  ports:
    - "5672:5672"
    - "15672:15672"
  environment:
    RABBITMQ_DEFAULT_USER: vacancies
    RABBITMQ_DEFAULT_PASS: vacancies
```

Management UI: http://localhost:15672 (логин/пароль `vacancies`).

### 2. Топология

```text
Exchange: vacancies.events (topic, durable)

Routing keys:
  user.registered    → queue: profile.user-registered
  vacancy.published  → (future consumers)
```

### 3. Publisher: Auth Service

Файл: `services/auth/src/messaging/publisher.ts`

При регистрации пользователя Auth Service публикует `user.registered`:

```json
{
  "event": "user.registered",
  "timestamp": "2026-06-05T12:00:00Z",
  "payload": {
    "user_id": "...",
    "role": "candidate",
    "full_name": "Иван",
    "email": "user@example.com"
  }
}
```

Вызывается из `AuthService.register()` после сохранения пользователя в БД.

### 4. Consumer: Profile Service

Файл: `services/profile/src/messaging/consumer.ts`

Подписка на очередь `profile.user-registered`, binding `user.registered`.

При `role=candidate` вызывается `ProfileService.ensureProfile(user_id)` — создаётся пустая запись в `candidate_profiles`.

Consumer стартует в `services/profile/src/server.ts` после миграций.

### 5. Publisher: Vacancy Service

Файл: `services/vacancy/src/messaging/publisher.ts`

При создании или обновлении вакансии, если статус становится `published`, публикуется `vacancy.published`:

```json
{
  "event": "vacancy.published",
  "payload": {
    "vacancy_id": "...",
    "company_id": "...",
    "title": "Go Developer",
    "industry": "IT",
    "status": "published"
  }
}
```

Логика в `VacancyService.createVacancy()` и `VacancyService.updateVacancy()`.

### 6. Переменные окружения

```env
RABBITMQ_URL=amqp://vacancies:vacancies@rabbitmq:5672
```

Задано для auth, profile и vacancy сервисов в docker-compose.

### 7. Обработка ошибок

| Ситуация | Поведение |
|----------|-----------|
| Consumer error | `nack` без requeue |
| Duplicate `user.registered` | idempotent `ensureProfile` (find or create) |

## Вывод

RabbitMQ интегрирован в микросервисную архитектуру. Auth Service публикует `user.registered`, Profile Service потребляет и создаёт профиль кандидата. Vacancy Service публикует `vacancy.published` при публикации вакансии. Синхронная валидация пользователей остаётся через internal REST API Auth Service.
