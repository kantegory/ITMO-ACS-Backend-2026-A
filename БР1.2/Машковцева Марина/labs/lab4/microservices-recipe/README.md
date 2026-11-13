# ЛР4 — развёртывание Recipe API

Версия микросервисного проекта из ЛР3, подготовленная для Ubuntu-сервера. Содержит User, Recipe, Social, API Gateway и RabbitMQ.

## На сервере

1. Установить Docker Engine с Compose plugin и Nginx.
2. Скопировать проект на сервер (например, через git clone).
3. Перейти в каталог `microservices-recipe`.
4. Создать файл `.env`: `cp .env.example .env`, заменить JWT_SECRET на длинную случайную строку (`openssl rand -hex 32`). Не коммитить `.env`.
5. Проверить конфигурацию: `docker compose config`.
6. Запустить: `docker compose up -d --build`.
7. Проверить: `docker compose ps` и `curl -i http://127.0.0.1:3000/api/recipes`.
8. Установить конфигурацию Nginx: `sudo cp nginx/recipe-api.conf /etc/nginx/sites-available/recipe-api`, затем включить её через ссылку в `sites-enabled`, отключить default при необходимости, выполнить `sudo nginx -t && sudo systemctl reload nginx`.
9. Открыть TCP 80 в правилах облака и брандмауэре. Проверить `http://SERVER_IP/api/recipes`.

Порты сервисов и RabbitMQ не публикуются наружу. Gateway доступен только на 127.0.0.1:3000, а внешний HTTP-трафик проходит через Nginx. Для публичного использования с реальными пользователями необходим HTTPS.

Базы SQLite сохраняются в Docker volumes. **Не выполняйте** `docker compose down -v`, если хотите сохранить данные. Существующие SQLite-файлы из старых работ не копируются: новая установка начинает с пустых баз.

## Проверка

Приложение развёрнуто на сервере Ubuntu с помощью Docker Compose. Nginx перенаправляет HTTP-запросы к API Gateway. Запросы GET /health и GET /api/recipes возвращают HTTP 200 OK. Автоматическое развёртывание настроено через GitHub Actions. При ошибках запуска смотрите `docker compose logs --tail=100`.
