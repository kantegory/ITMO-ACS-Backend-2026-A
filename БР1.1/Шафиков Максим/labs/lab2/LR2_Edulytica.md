# ЛР2. Реализация микросервисной архитектуры

**Выполнил:** Шафиков Максим  
**Группа:** БР1.2  
**Дата:** 22.05.2026  
**Проект:** [Edulytica](https://github.com/aimclub/Edulytica) (PR #196: E-170 / E-171)

---

## 1. Цель работы

Реализовать переход от монолитного FastAPI-приложения к микросервисной архитектуре на основе технического дизайна (ДЗ4). Выделить отдельные сервисы, настроить их взаимодействие через API Gateway и обеспечить тестовое покрытие.

---

## 2. Выполненные работы

Работа выполнялась в рамках **PR #196** (ветка `E-170` → `development`), который включал две задачи:
- **E-170**: Рефакторинг микросервисной архитектуры
- **E-171**: Покрытие backend-части тестами

### 2.1. Разделение монолита

#### Исходная структура (монолит)
До рефакторинга все endpoint'ы находились в одном FastAPI-приложении `src/edulytica_api/`. Код аутентификации был перемешан с бизнес-логикой.

#### Новая структура

После рефакторинга проект имеет следующую структуру:

```
src/
├── auth/                          # Микросервис Auth
│   ├── api/v1/
│   │   └── auth.py                # Route'ы аутентификации
│   ├── Dockerfile                 # Контейнеризация
│   ├── app.py                     # FastAPI приложение (отдельный процесс)
│   └── requirements.txt
├── common/                        # Общая библиотека (shared kernel)
│   ├── auth/
│   │   ├── helpers/
│   │   │   ├── deps.py            # Dependency injection (get_current_user)
│   │   │   └── utils.py           # Хеширование паролей, валидация email
│   │   └── schemas.py             # Pydantic схемы JWT
│   ├── database/
│   │   ├── crud/                  # CRUD-операции (AccountCrud, EventCrud и др.)
│   │   ├── models/                # SQLAlchemy модели
│   │   └── schemas/               # Pydantic схемы БД (system_schemas)
│   ├── utils/
│   │   ├── request.py             # HTTP-утилиты
│   │   └── split_csv.py           # Парсинг CSV из env
│   └── config.py                  # Общая конфигурация (env vars)
├── edulytica_api/                 # Микросервис API
│   ├── api/v1/
│   │   ├── account.py             # Route'ы аккаунтов
│   │   ├── actions.py             # Route'ы действий
│   │   ├── events.py              # Route'ы событий
│   │   ├── files.py               # Route'ы файлов
│   │   ├── tickets.py             # Route'ы тикетов
│   │   └── ...                    # Другие endpoint'ы
│   ├── schemas/
│   │   └── account_schemas.py     # Pydantic схемы аккаунтов
│   ├── alembic/                   # Миграции БД (общие)
│   ├── Dockerfile
│   └── app.py
├── gateway/                       # API Gateway
│   ├── default.conf.template      # Nginx конфигурация (динамическая)
│   └── nginx.conf                 # Nginx конфигурация (статическая)
├── orchestration/                 # Микросервис Orchestration
│   ├── api/v1/                    # API эндпоинты оркестратора
│   ├── clients/
│   │   ├── kafka_producer.py      # Kafka producer
│   │   ├── rag_client.py          # HTTP-клиент для RAG
│   │   └── state_manager.py       # Менеджер состояния пайплайнов
│   ├── prompts/                   # Шаблоны промптов для LLM
│   ├── orchestrator.py            # Ядро оркестрации
│   ├── Dockerfile
│   └── app.py
├── rag/                           # Микросервис RAG
│   ├── core/
│   │   ├── chroma_db/             # Работа с ChromaDB
│   │   ├── embedder/              # Создание эмбеддингов
│   │   ├── prompt_enricher/       # Обогащение промптов
│   │   └── ...
│   ├── Dockerfile
│   └── app.py
├── models/                        # LLM инференс
│   ├── qwen/                      # Модель Qwen
│   └── vikhr/                     # Модель Vikhr
├── front_end/                     # React-приложение
└── backup/                        # Сервис бекапа
```

---

## 3. API Gateway (Nginx)

Сервис **edulytica_gateway** реализован на Nginx и выступает единой точкой входа. Конфигурация использует `default.conf.template` с динамическими переменными окружения.

**Правила маршрутизации:**

| URL-префикс | Целевой сервис | Пример |
|-------------|---------------|--------|
| `/auth/*` | Auth Service | `/auth/login` → `/api/auth/v1/login` |
| `/account/*` | API Service | `/account/profile` → `/api/account/v1/profile` |
| `/feedback/*` | API Service | `/feedback/create` → `/api/feedback/v1/create` |
| `/tickets/*` | API Service | `/tickets/list` → `/api/tickets/v1/list` |
| `/events/*` | API Service | `/events/all` → `/api/events/v1/all` |
| `/files/*` | API Service | `/files/upload` → `/api/files/v1/upload` |

---

## 4. Auth Service

Выделен в отдельный микросервис со своим FastAPI-приложением (`auth/app.py`), слушающим порт `AUTH_PORT`.

**Endpoint'ы:**
- `POST /api/auth/v1/register` — регистрация с email-верификацией
- `POST /api/auth/v1/login` — аутентификация, выдача JWT (access + refresh)
- `POST /api/auth/v1/refresh` — обновление access-токена
- `POST /api/auth/v1/verify_email` — подтверждение email по коду
- `POST /api/auth/v1/change_password` — смена пароля
- `POST /api/auth/v1/check_code` — проверка кода восстановления

**Изменения (PR #196):**
- Выделена бизнес-логика в `routers/auth.py`
- Добавлены Pydantic-схемы вместо inline Body-параметров
- Исправлен порядок валидации при смене пароля (проверка совпадения new_password1 и new_password2 вынесена в начало)
- Добавлены тесты (модульные + интеграционные) — `test/api/auth/`

---

## 5. Edulytica API Service

Основной бизнес-логический сервис. Выделен из монолита.

**Endpoint'ы:**
- `GET/PUT /api/account/v1/profile` — получение/обновление профиля
- `POST /api/actions/v1/*` — управление действиями
- `POST/GET /api/events/v1/*` — управление конференциями
- `POST/GET /api/events/v1/custom/*` — кастомные события
- `POST/GET /api/files/v1/upload` — загрузка файлов
- `POST/GET /api/tickets/v1/*` — управление тикетами
- `POST /api/internal/v1/upload_report` — внутренний endpoint для оркестратора

**Изменения (PR #196):**
- Инициализированы новые endpoint'ы: `/account`, `/actions`
- Выделена маршрутизация в `routers/` и схемы в `schemas/`
- RAG-эндпоинты разделены (подготовка к выносу в отдельный сервис)
- Добавлены тесты для модулей `common.auth`, `common.utils`

---

## 6. Общий модуль (Common / Shared Kernel)

`src/common` — библиотека общего кода, используемая всеми сервисами:

| Подмодуль | Назначение |
|-----------|-----------|
| `common.auth.helpers.deps` | Dependency injection (`get_current_user`, `get_current_user_optional`) |
| `common.auth.helpers.utils` | Хеширование паролей (bcrypt), валидация email |
| `common.auth.schemas` | Pydantic-схемы токенов и пользователей |
| `common.database.models` | SQLAlchemy ORM-модели (Account, Event, Ticket, File и др.) |
| `common.database.crud` | CRUD-операции (AccountCrud, EventCrud, CustomEventCrud, CheckCodeCrud) |
| `common.database.schemas` | Pydantic-схемы данных БД (`system_schemas.py`) |
| `common.config` | Централизованная конфигурация из переменных окружения |
| `common.utils` | Вспомогательные функции |

---

## 7. Тестирование (E-171)

В рамках PR были написаны тесты для покрытия backend-части:

### Модульные тесты
| Файл | Покрытие | Статус |
|------|----------|--------|
| `tests/common/auth/` | helpers, validation | ✅ 97.82% |
| `tests/common/utils/` | утилиты | ✅ 100% |
| `tests/api/auth/` | auth endpoint'ы | ✅ 100% |
| `tests/api/edulytica_api/` | API endpoint'ы | ✅ ~95% |

### Интеграционные тесты
- Добавлен PostgreSQL-контейнер в CI/CD для интеграционных тестов
- Auth-модуль: полный сценарий регистрация → логин → refresh → смена пароля

### Результаты
- **Patch coverage**: 95.96% (8 пропущенных строк в `actions.py`)
- **Project coverage**: увеличилась с **66.58% до 73.02%**
- **Изменено файлов**: 43 (+1154 строки)

---

## 8. CI/CD Pipeline

В `build-test.yml` добавлены:
- PostgreSQL-сервис для интеграционных тестов
- Запуск миграций перед тестами
- Автоматическая проверка PEP8 (`/fix-pep8`)
- Codecov для отслеживания покрытия

---

## 9. Выводы

В результате работы:
1. **Монолит разделён на 8 микросервисов** с чёткими границами ответственности
2. **Реализован API Gateway** на Nginx, маршрутизирующий запросы к нужным сервисам
3. **Выделен Auth-сервис** с собственной базой URL и тестами
4. **Общий код вынесен в shared kernel** (src/common), используемый всеми сервисами
5. **Тестовое покрытие увеличено** с 66.58% до 73.02%
6. **CI/CD адаптирован** для микросервисной архитектуры

PR #196 был одобрен двумя ревьюерами и смерджен в `development`.
