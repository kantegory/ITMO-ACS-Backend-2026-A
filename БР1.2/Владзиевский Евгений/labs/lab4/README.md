# ЛР4 — Развёртывание приложения на удалённом сервере

Развёртывание микросервисного приложения «Сервис для аренды недвижимости»
(исходники — `../lab2`) на удалённом сервере Ubuntu 24.04 с доступом извне
через nginx в режиме обратного прокси.

## Состав каталога

| Файл | Назначение |
|---|---|
| `deploy/server-setup.sh` | Шаг 1: предварительная настройка сервера — Docker Engine, Docker Compose plugin, nginx, каталог приложения |
| `deploy/deploy.sh` | Шаги 2–3: копирование исходников, генерация `.env`, сборка и запуск стека, подключение конфига nginx |
| `deploy/docker-compose.prod.yml` | Production-конфигурация стека (порты наружу не публикуются, `restart: unless-stopped`, секреты из `.env`) |
| `deploy/.env.example` | Шаблон файла окружения; реальный `.env` создаётся на сервере и в git не попадает |
| `deploy/nginx/rental-api.conf` | Конфигурация nginx: обратный прокси `:80 → 127.0.0.1:8080` |

## Целевой сервер

| Параметр | Значение |
|---|---|
| Адрес | `192.168.1.245` |
| ОС | Ubuntu 24.04.5 LTS (x86_64, KVM) |
| Пользователь | `ubuntu` (в группе `sudo`) |
| Каталог приложения | `/opt/rental-app` |
| Точка входа | `http://192.168.1.245/` (nginx :80) |

## Порядок развёртывания

```bash
# 1. Предварительная настройка сервера (один раз)
ssh ubuntu@192.168.1.245 'bash -s' < deploy/server-setup.sh

# 2-3. Развёртывание приложения и настройка nginx
cd deploy && ./deploy.sh ubuntu@192.168.1.245
```

Повторный запуск `deploy.sh` выполняет обновление: синхронизирует исходники,
пересобирает изменившиеся образы и перезапускает контейнеры. Файл `.env`
с секретами при этом сохраняется.

## Схема развёртывания

```
                    ┌──────────────────────── 192.168.1.245 (Ubuntu 24.04) ────────────────────────┐
                    │                                                                              │
Клиент  ──:80──►    │  nginx (reverse proxy)  ──►  127.0.0.1:8080  api-gateway (docker)            │
                    │                                      │                                       │
                    │                                      ├─► auth-service:8081     ─► auth-db    │
                    │                                      ├─► property-service:8082  ─► property-db│
                    │                                      ├─► booking-service:8083   ─► booking-db │
                    │                                      ├─► payment-service:8084   ─► payment-db │
                    │                                      └─► messaging-service:8085 ─► messaging-db│
                    │                                                                              │
                    │                      kafka + zookeeper (асинхронные события)                 │
                    └──────────────────────────────────────────────────────────────────────────────┘
```

Снаружи доступен только порт 80 (nginx). Порт API Gateway опубликован на
loopback-интерфейсе (`127.0.0.1:8080`), порты баз данных и Kafka наружу не
публикуются вовсе — сервисы общаются по внутренней docker-сети.

## Проверка

```bash
curl http://192.168.1.245/health
curl -X POST http://192.168.1.245/api/v1/auth/register \
     -H 'Content-Type: application/json' \
     -d '{"email":"user@example.com","password":"Passw0rd!","full_name":"Иван Иванов","role":"tenant"}'
```

## Эксплуатация

```bash
cd /opt/rental-app
sudo docker compose -f docker-compose.prod.yml --env-file .env ps        # статус
sudo docker compose -f docker-compose.prod.yml --env-file .env logs -f   # логи
sudo docker compose -f docker-compose.prod.yml --env-file .env restart   # перезапуск
sudo tail -f /var/log/nginx/rental-api.access.log                        # запросы через прокси
```
