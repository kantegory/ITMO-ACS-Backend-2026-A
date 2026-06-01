# ЛР3. Контейнеризация с Docker

**Выполнил:** Шафиков Максим  
**Группа:** БР1.2  
**Дата:** 22.05.2026  
**Проект:** [Edulytica](https://github.com/aimclub/Edulytica)

---

## 1. Цель работы

Контейнеризировать микросервисное приложение Edulytica с помощью Docker и Docker Compose для обеспечения воспроизводимости окружения, упрощения развёртывания и изоляции сервисов.

---

## 2. Общая архитектура Docker-окружения

Проект использует **Docker Compose v3.9** и содержит **15 сервисов**, объединённых в единую Docker-сеть.

```
┌────────────────────────────────────────────────────────────────┐
│                    Docker Host                                 │
│                                                                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │  edulytica_db  │  │ edulytica_redis│  │   zookeeper    │    │
│  │  PostgreSQL 16 │  │   Redis 7      │  │  Confluent ZK  │    │
│  │   :5432        │  │   :6379        │  │   :2181        │    │
│  └───────┬────────┘  └──────┬─────────┘  └───────┬────────┘    │
│          │                  │                    │             │
│          └────────┬─────────┴─────────┬──────────┘             │
│                   ▼                   ▼                        │
│          ┌────────────────┐  ┌────────────────┐                │
│          │     kafka      │  │   kafka_ui     │                │
│          │  Confluent CP  │  │  Kafka UI      │                │
│          │   :9092        │  │  :8080         │                │
│          └────────────────┘  └────────────────┘                │
│                                                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐        │
│  │edulytica_  │  │edulytica_  │  │edulytica_          │        │
│  │chromadb    │  │gateway     │  │orchestration       │        │
│  │Chroma 1.0  │  │Nginx 1.27  │  │FastAPI + Kafka     │        │
│  │ :8000      │  │ :GATEWAY   │  │ :ORCHESTRATOR_PORT │        │
│  └─────┬──────┘  └────────────┘  └────────────────────┘        │
│        │                                                       │
│        ▼                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │ edulytica_rag  │  │  edulytica_api │  │ edulytica_auth │    │
│  │  FastAPI +     │  │  FastAPI +     │  │  FastAPI +     │    │
│  │  ChromaDB      │  │  SQLAlchemy    │  │  JWT Auth      │    │
│  │  :RAG_PORT     │  │  :API_PORT     │  │  :AUTH_PORT    │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │edulytica_llm_  │  │edulytica_llm_  │  │edulytica_      │    │
│  │qwen            │  │vikhr           │  │backup          │    │
│  │GPU 0 + Qwen    │  │GPU 1 + Vikhr   │  │Бекап БД        │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               edulytica_frontend                         │  │
│  │               React App (Nginx)                          │  │
│  │               :FRONTEND_PORT                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  Network: edulytica_network (bridge)                           │
│  Volumes: postgres_data, api_files, models_hf_cache,           │
│           rag_hf_cache                                         │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Dockerfile'ы микросервисов

### 3.1. Базовые Python-микросервисы (Auth, API, RAG, Orchestration)

Все Python-сервисы следуют похожему шаблону Dockerfile:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Установка Python-зависимостей
COPY requirements.txt .
COPY src/common/requirements_common.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копирование исходного кода
COPY src/ /app/src/

# Healthcheck
HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=5 \
    CMD curl --fail http://localhost:${PORT}/health || exit 1

EXPOSE ${PORT}
CMD ["python", "src/<service>/app.py"]
```

### 3.2. LLM-сервисы (Qwen, Vikhr)

LLM-сервисы требуют GPU и используют модель из аргументов сборки:

```dockerfile
ARG MODEL_TYPE=qwen

FROM nvidia/cuda:12.1-runtime

WORKDIR /app

# Установка Python и зависимостей
RUN apt-get update && ... 

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/models/ /app/src/models/

# Сигнальный файл готовности
HEALTHCHECK --interval=60s --timeout=5s --start-period=60s --retries=45 \
    CMD test -f /app/ready.txt

CMD ["python", "src/models/run.py"]
```

### 3.3. Gateway (Nginx)

```dockerfile
FROM nginx:1.27.4-alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf.template /etc/nginx/templates/default.conf.template

# ENV-переменные подставляются в шаблон при запуске
CMD ["/bin/sh", "-c", "envsubst < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]

HEALTHCHECK --interval=60s --timeout=5s --retries=3 \
    CMD pgrep nginx || exit 1
```

### 3.4. Frontend (React)

```dockerfile
FROM node:18 AS build

WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
ARG REACT_APP_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

Используется **multi-stage build**: на первом этапе собирается React-приложение, на втором — лёгкий nginx-образ для статики.

---

## 4. Docker Compose — полная конфигурация

### 4.1. Запуск одной командой

```bash
docker-compose up --build
```

### 4.2. Ключевые настройки

**Сеть:**
```yaml
networks:
  edulytica_network:
    driver: bridge
```
Все 15 сервисов подключены к одной bridge-сети, что обеспечивает:
- Изоляцию от внешних сетей
- DNS-резолвинг по имени сервиса (например, `kafka:9092`)
- Безопасное межсервисное взаимодействие

**Тома (volumes):**
| Том | Назначение | Тип |
|-----|-----------|-----|
| `postgres_data` | Постоянное хранение БД | Named volume |
| `api_files` | Файлы пользователей | Named volume |
| `models_hf_cache` | Кэш HuggingFace моделей | Named volume |
| `rag_hf_cache` | Кэш RAG-моделей | Named volume |
| `./chromadb:/chroma/chroma` | Данные векторной БД | Bind mount |
| `./src:/app/src` | Исходный код (для разработки) | Bind mount |

**Зависимости (depends_on + healthcheck):**
```yaml
edulytica_api:
  depends_on:
    edulytica_db:
      condition: service_healthy

edulytica_gateway:
  depends_on:
    edulytica_api:
      condition: service_healthy
    edulytica_auth:
      condition: service_healthy

edulytica_orchestration:
  depends_on:
    kafka:
      condition: service_healthy
    edulytica_rag:
      condition: service_healthy
```

### 4.3. Healthcheck'и

| Сервис | Команда | Интервал | Start period | Ретраи |
|--------|---------|----------|-------------|--------|
| `edulytica_db` | `pg_isready` | 5s | — | 5 |
| `edulytica_redis` | `redis-cli ping` | 5s | — | 5 |
| `kafka` | `nc -z localhost 9092` | 5s | — | 5 |
| `edulytica_api` | `curl /health` | 5s | 10s | 5 |
| `edulytica_auth` | `curl /health` | 5s | 10s | 5 |
| `edulytica_rag` | `curl /health` | 60s | 180s | 5 |
| `edulytica_llm_qwen` | `test -f /app/ready.txt` | 60s | 60s | 45 |
| `edulytica_gateway` | `pgrep nginx` | 60s | — | 3 |

---

## 5. GPU-поддержка

LLM-сервисы используют GPU через `deploy.resources`:

```yaml
edulytica_llm_qwen:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            device_ids: ['0']
            capabilities: [gpu]

edulytica_llm_vikhr:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            device_ids: ['1']
            capabilities: [gpu]
```

- **Qwen** использует GPU 0
- **Vikhr** использует GPU 1
- Каждый LLM-сервис имеет длительный healthcheck (до 45 ретраев с интервалом 60s) из-за времени загрузки моделей

---

## 6. Переменные окружения

Конфигурация вынесена в `.env` файл и включает:

| Группа | Переменные | Назначение |
|--------|-----------|-----------|
| **PostgreSQL** | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_IP`, `POSTGRES_PORT` | Подключение к БД |
| **JWT** | `JWT_SECRET_KEY`, `JWT_REFRESH_SECRET_KEY`, `ALGORITHM` | Токены |
| **Порты** | `API_PORT`, `AUTH_PORT`, `RAG_PORT`, `GATEWAY_PORT`, `FRONTEND_PORT` | Публикация сервисов |
| **Kafka** | `KAFKA_BOOTSTRAP_SERVERS`, `KAFKA_GROUP_ID` | Очередь сообщений |
| **SMTP** | `SENDER_EMAIL`, `SENDER_PASSWORD`, `SMTP_SERVER`, `SMTP_PORT` | Email-уведомления |
| **ChromaDB** | `CHROMA_PORT` | Векторная БД |
| **Redis** | `REDIS_PORT` | Кэш |
| **Безопасность** | `INTERNAL_API_SECRET`, `TICKET_TTL_SEC` | Межсервисная аутентификация |
| **Telegram** | `BOT_TOKEN`, `CHAT_ID` | Telegram-бот |

---

## 7. Docker Compose Override для разработки

Проект поддерживает `docker-compose.override.yml` (не коммитится в репозиторий) для локальной разработки с переопределениями:
- Bind mount исходного кода для hot-reload
- Debug-режим (uvicorn --reload)
- Локальные volume'ы

---

## 8. Преимущества используемого подхода

| Аспект | Реализация в Edulytica |
|--------|----------------------|
| **Изоляция** | Каждый сервис в своём контейнере с отдельным Dockerfile |
| **Сеть** | Bridge-сеть с DNS-резолвингом по именам сервисов |
| **Персистентность** | Named volumes для БД, файлов, HF-кэша |
| **Healthchecks** | Каждый сервис проверяет готовность перед запуском зависимых |
| **GPU** | NVIDIA runtime с привязкой к конкретным устройствам |
| **Зависимости** | Каскадные depends_on с condition: service_healthy |
| **Конфигурация** | Все параметры через .env, ни одного хардкода |
| **Шаблонизация** | Nginx conf через envsubst |

---

## 9. Команды для управления

```bash
# Сборка и запуск всех сервисов
docker-compose up --build

# Запуск в фоне
docker-compose up -d

# Просмотр логов
docker-compose logs -f <service_name>

# Перезапуск сервиса
docker-compose restart <service_name>

# Остановка всех сервисов
docker-compose down

# Остановка с удалением томов (полная переустановка)
docker-compose down -v
```

---

## 10. Выводы

В результате контейнеризации:
1. **15 сервисов** упакованы в Docker-образы с reproducible окружением
2. **Docker Compose** обеспечивает оркестрацию — порядок запуска, сеть, тома
3. **Healthcheck'и** гарантируют, что сервисы запускаются только после готовности зависимостей
4. **GPU-поддержка** позволяет запускать LLM-модели в контейнерах
5. **Переменные окружения** исключают хардкод конфигурации
6. **Одна команда** (`docker-compose up --build`) запускает всё приложение целиком
