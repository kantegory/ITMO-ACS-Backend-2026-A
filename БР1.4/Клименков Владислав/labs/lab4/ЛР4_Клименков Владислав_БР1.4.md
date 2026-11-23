# Лабораторная работа №4

## Развёртывание приложения RecipeHub на удалённом сервере

**Дисциплина:** Фронтэнд-разработка

**Выполнил:** Клименков Владислав Максимович

**Группа:** K3441

**Проверил:** Добряков Давид Ильич

Санкт-Петербург, 2026 г.

---

## 1. Цель работы и постановка задач

Цель ЛР4 — развернуть ранее разработанное серверное API‑приложение RecipeHub
на удалённом сервере и обеспечить доступ к нему извне через nginx в режиме
обратного прокси.

Согласно заданию требовалось выполнить три пункта:

1. провести предварительную настройку удалённого сервера (установка
   необходимых зависимостей);
2. провести развёртывание приложения на удалённом сервере;
3. настроить nginx в режиме обратного прокси для обеспечения доступа к
   приложению извне.

Приложение к моменту выполнения работы было уже готово (микросервисная
архитектура на Node.js + TypeScript), поэтому в отчёте его внутреннее
устройство не описывается — рассматривается только инфраструктурная часть:
подготовка сервера, развёртывание и организация внешнего доступа.

Вся конфигурация развёртывания хранится в репозитории в каталоге `deploy/`
по принципу **Infrastructure as Code (IaC)**: свежий сервер поднимается
скриптом, а обновление приложения сводится к одной команде.

---

## 2. Инфраструктура развёртывания

В качестве удалённого сервера арендован VPS у облачного провайдера Selectel.

| Параметр | Значение |
| --- | --- |
| ОС | Ubuntu 24.04.5 LTS (noble), ядро 6.8 |
| CPU | 2 vCPU |
| RAM | 2 ГБ |
| Диск | 40 ГБ SSD |
| Hostname | `recipehub` |
| IP-адрес | `139.100.225.216` |
| Доступ | root по SSH |

По итогу выполнения работы наружу открыты **только** порты `22` (SSH), `80` и `443` (HTTP/HTTPS).
Порты самого приложения, БД и брокера сообщений наружу не выставляются —
доступ к ним возможен только через `127.0.0.1` (см. разделы 3–5).

---

## 3. Предварительная настройка сервера

Пункт 1 задания. Для максимального упрощения и воспроизводимости подготовка
сервера целиком автоматизирована идемпотентным скриптом
`deploy/scripts/setup-server.sh`. Скрипт можно запускать повторно — повторный
запуск не ломает уже настроенный сервер.

На чистом сервере достаточно выполнить:

```bash
ssh root@139.100.225.216
apt update && apt install -y git
git clone https://github.com/KlimVladMaks/recipe-hub.git /opt/recipe-hub
bash /opt/recipe-hub/deploy/scripts/setup-server.sh
```

Скрипт выполняет восемь шагов, каждый из которых соответствует своему
требованию предварительной настройки.

### 3.1. Базовые утилиты

Обновляется список пакетов и устанавливается минимальный набор:
`ca-certificates`, `curl`, `gnupg`, `git`, `lsb-release`, `ufw`, `nginx`.

```bash
apt-get update -y
apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg git lsb-release ufw nginx
```

### 3.2. Swap-файл 2 ГБ

На сервере всего 2 ГБ оперативной памяти, и одной из самых ресурсоёмких
операций является сборка Docker-образов (`npm install` + генерация Prisma
Client). Чтобы сборка не падала по OOM (Out Of Memory - "недостаточно памяти"), скрипт создаёт swap-файл на 2 ГБ и
прописывает его в `/etc/fstab`, чтобы он подключался автоматически после
перезагрузки.

```bash
fallocate -l 2G /swapfile     # при неудаче — резервный вариант через dd
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

Факт наличия swap на сервере:

```text
$ swapon --show
NAME      TYPE SIZE USED PRIO
/swapfile file   2G 29.2M   -2

$ grep swap /etc/fstab
/swapfile none swap sw 0 0
```

### 3.3. Docker Engine и docker compose

Основной зависимостью приложения является Docker. Скрипт добавляет
официальный репозиторий Docker, ставит `docker-ce`, `docker-ce-cli`,
`containerd.io`, `docker-buildx-plugin` и `docker-compose-plugin`, после чего
включает демон в автозапуск (`systemctl enable --now docker`).

Установленные версии:

```text
$ docker --version
Docker version 29.8.2, build 7fc2dff

$ docker compose version
Docker Compose version v5.6.0
```

Дополнительно настраивается ротация логов Docker на уровне демона в
`/etc/docker/daemon.json` — чтобы за время эксплуатации логи контейнеров не
забили 40-гигабайтный диск:

```json
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
```

### 3.4. Файрвол UFW

Настраивается межсетевой экран: входящие соединения по умолчанию
запрещаются, разрешаются только SSH и веб-порты.

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

Результат:

```text
$ ufw status verbose
Status: active
Default: deny (incoming), allow (outgoing), deny (routed)

To                         Action      From
--                         ------      ----
22/tcp (OpenSSH)           ALLOW IN    Anywhere
80/tcp                     ALLOW IN    Anywhere
443/tcp                    ALLOW IN    Anywhere
```

### 3.5. Репозиторий и переменные окружения

Скрипт клонирует репозиторий в `/opt/recipe-hub` (если его ещё нет) и
генерирует рабочие файлы окружения `services/*/.env` из шаблонов
`.env.example`. Секретов в git нет — хранятся только шаблоны, а уже
существующий `.env` повторным запуском не перезаписывается, чтобы ручные
прод-правки сохранялись.

```bash
for svc in user recipe api-gateway; do
    [ -f "$APP_DIR/services/$svc/.env" ] || \
        cp "$APP_DIR/services/$svc/.env.example" "$APP_DIR/services/$svc/.env"
done
```

После первой настройки на сервере присутствуют все три файла `.env`:

```text
/opt/recipe-hub/services/api-gateway/.env
/opt/recipe-hub/services/recipe/.env
/opt/recipe-hub/services/user/.env
```

### 3.6. nginx

nginx устанавливается как системный пакет; его настройка как обратного
прокси описана отдельно в разделе 5.

---

## 4. Развёртывание приложения

Пункт 2 задания. Приложение разворачивается через Docker Compose по двум
файлам: базовому `docker-compose.yml` (общий для локальной разработки) и
прод-оверрайду `deploy/docker-compose.prod.yml`.

### 4.1. Прод-оверрайд

Оверрайд меняет поведение стека только в продакшене, не затрагивая локальный
compose-файл. Его ключевые отличия:

* **Все публикуемые порты привязываются к `127.0.0.1`.** Наружу смотрит
  только nginx; API-шлюз (`3000`), обе базы (`5433`, `5434`) и RabbitMQ
  (`5672`, `15672`) доступны только локально, например через SSH-туннель.
* **Используется тег `!override`.** Без него Docker Compose объединил бы
  списки `ports` из базового файла и оверрайда и оставил бы публикацию на
  `0.0.0.0`, то есть порт остался бы доступен из интернета.

  ```yaml
  api-gateway:
    ports: !override
      - "127.0.0.1:3000:3000"
  ```

* **Политика перезапуска `unless-stopped`** — контейнеры поднимаются
  автоматически после перезагрузки сервера.
* **Ротация логов** на уровне каждого сервиса (`max-size: 10m`,
  `max-file: 3`) как дополнительная страховка к настройке демона.

### 4.2. Запуск стека

Сборка и запуск выполняется командой:

```bash
cd /opt/recipe-hub
docker compose -f docker-compose.yml -f deploy/docker-compose.prod.yml up -d --build
```

При старте сервисов миграции базы данных применяются автоматически
(`prisma migrate deploy` в команде запуска контейнера), поэтому отдельного
шага инициализации БД не требуется.

### 4.3. Состояние развёрнутого стека

Все контейнеры успешно подняты и здоровы (health-check проходит):

```text
$ docker compose -f docker-compose.yml -f deploy/docker-compose.prod.yml ps
NAME                          SERVICE          STATUS                  PORTS
recipe-db                     recipe-db        Up 43 hours (healthy)   127.0.0.1:5434->5432/tcp
user-db                       user-db          Up 43 hours (healthy)   127.0.0.1:5433->5432/tcp
recipe-hub-api-gateway-1      api-gateway      Up 43 hours (healthy)   127.0.0.1:3000->3000/tcp
recipe-hub-user-service-1     user-service     Up 43 hours (healthy)   3001/tcp
recipe-hub-recipe-service-1   recipe-service   Up 43 hours (healthy)   3002/tcp
recipe-hub-rabbitmq           rabbitmq         Up 43 hours (healthy)   127.0.0.1:5672->5672/tcp, 127.0.0.1:15672->15672/tcp
```

Задеплоенный коммит:

```text
$ git -C /opt/recipe-hub log -1 --format="%h %ci %s"
aa2694f 2026-10-02 13:25:39 +0300 Подготовка сервиса к автоматическому развёртыванию на VPS по принципу "инфраструктура как код"
```

Схема развёртывания после запуска:

```text
                    Интернет
                       │ :80 (и :443 при наличии TLS)
                       ▼
              ┌──────────────────┐
              │      nginx       │  /api/internal/ → 403
              │ (reverse proxy)  │
              └────────┬─────────┘
                       │ 127.0.0.1:3000
                       ▼
              ┌──────────────────┐
              │   api-gateway    │
              └────────┬─────────┘
                       │ docker-сеть
          ┌────────────┴────────────┐
          ▼                         ▼
   user-service :3001        recipe-service :3002
   user-db (127.0.0.1:5433)  recipe-db (127.0.0.1:5434)
          └──────── RabbitMQ :5672 ────────┘
```

Итог: снаружи доступен единственный вход — nginx на порту 80; все остальные
порты привязаны к localhost и из интернета недоступны.

---

## 5. Настройка nginx как обратного прокси

Пункт 3 задания. Конфигурация nginx также хранится в репозитории
(`deploy/nginx/recipe-hub.conf`) и копируется на сервер скриптом настройки.

nginx принимает запросы на порту 80 и проксирует их на API-шлюз, слушающий
`127.0.0.1:3000`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name _;                # «любой Host»: и по IP, и по домену

    location /api/internal/ {
        return 403;               # внутренние маршруты снаружи запрещены
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_connect_timeout 60s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;
    }

    client_max_body_size 20m;
}
```

Что здесь важно:

* **`proxy_pass http://127.0.0.1:3000`** — nginx проксирует все запросы на
  API-шлюз, который является единственной точкой входа в приложение.
* **Заголовки `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`**
  передают исходный хост, IP клиента и схему. Это нужно, чтобы в приложении
  корректно формировались ссылки и логировались реальные адреса клиентов,
  а не адрес nginx.
* **`location /api/internal/ { return 403; }`** — важная мера безопасности:
  внутренние service-to-service маршруты (`/api/internal/*`) недоступны из
  интернета. Внутри docker-сети сервисы общаются напрямую, минуя nginx,
  поэтому блокировка снаружи безопасна.
* **WebSocket-заголовки** (`Upgrade`/`Connection`) добавлены на будущее.
* **`client_max_body_size 20m`** — запас под загрузку медиа (например, фото
  рецептов).
* В конце файла закомментирован **TLS-блок** с инструкцией по выпуску
  сертификата через `certbot --nginx` — включается при появлении домена.

Скрипт настройки копирует конфиг в `sites-available`, включает его симлинком
в `sites-enabled`, удаляет дефолтный сайт и перезагружает nginx:

```bash
cp deploy/nginx/recipe-hub.conf /etc/nginx/sites-available/recipe-hub
ln -sf /etc/nginx/sites-available/recipe-hub /etc/nginx/sites-enabled/recipe-hub
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx
```

Результат проверки конфигурации и активный сайт:

```text
$ nginx -t
nginx: configuration file /etc/nginx/nginx.conf test is successful

$ ls -l /etc/nginx/sites-enabled/
recipe-hub -> /etc/nginx/sites-available/recipe-hub
```

---

## 6. Проверка работоспособности

Все проверки выполнялись снаружи — с локальной машины по реальному IP
сервера, то есть ровно так, как это сделал бы внешний пользователь.

**1. Health-эндпоинт через nginx:**

```text
$ curl -i http://139.100.225.216/api/api-gateway-health
HTTP/1.1 200 OK
Server: nginx/1.24.0 (Ubuntu)
Content-Type: application/json; charset=utf-8

{"status":"api-gateway OK","timestamp":"2026-10-04T12:49:03.484Z","uptime":156442.04755019}
```

Ответ `200` и заголовок `Server: nginx` подтверждают, что запрос дошёл до
API-шлюза именно через обратный прокси.

**2. Swagger UI доступен снаружи:**

```text
$ curl -o /dev/null -w "%{http_code}" http://139.100.225.216/api-docs
301
```

**3. Внутренние маршруты снаружи заблокированы:**

```text
$ curl -o /dev/null -w "%{http_code}" http://139.100.225.216/api/internal/users
403
```

**4. Порт API-шлюза напрямую из интернета недоступен:**

```text
$ curl http://139.100.225.216:3000/api/api-gateway-health
curl: (28) Connection timed out     # порт привязан к 127.0.0.1
```

Таким образом, выполнены все три требования: сервер настроен, приложение
развёрнуто и работает, а доступ извне обеспечивается только через nginx.

---

## 7. Обновление и восстановление

Для сопровождения развёрнутого приложения предусмотрен отдельный
идемпотентный скрипт `deploy/scripts/deploy.sh`. Он делает `git pull`,
пересобирает образы, перезапускает стек, удаляет неиспользуемые образы и
проверяет health-эндпоинт:

```bash
bash /opt/recipe-hub/deploy/scripts/deploy.sh
```

Скрипт неинтерактивен и рассчитан на запуск как вручную, так и из CI по SSH
(что будет использовано в следующих работах для автодеплоя).

Благодаря принципу «инфраструктура как код» восстановление на новом сервере
не требует ручных действий: достаточно взять чистый VPS и повторить раздел 3
(«Быстрый старт») — все скрипты, конфиги и шаблоны окружения лежат в
репозитории.

---

## 8. Выводы

В ходе ЛР4 выполнены все три поставленных пункта:

1. **Предварительная настройка сервера** — идемпотентным скриптом
   `setup-server.sh` установлены базовые утилиты, Docker Engine и compose,
   создан swap-файл, настроены UFW и ротация логов.
2. **Развёртывание приложения** — репозиторий склонирован в `/opt/recipe-hub`,
   из шаблонов сгенерированы `.env`, стек из шести контейнеров собран и
   запущен через прод-оверрайд `docker-compose.prod.yml`; все контейнеры
   находятся в состоянии `healthy`.
3. **Настройка nginx** — nginx работает как обратный прокси на порту 80,
   проксирует запросы на API-шлюз, блокирует внутренние маршруты и имеет
   заготовку под TLS.

Доступ к приложению извне обеспечен, при этом наружу выставляется только
nginx, а все остальные порты привязаны к `127.0.0.1`. Вся конфигурация
развёртывания хранится в репозитории, что делает развёртывание
воспроизводимым и упрощает обновление и восстановление.
