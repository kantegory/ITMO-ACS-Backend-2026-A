# Отчет по ЛР3

## Цель

Реализовать контейнеризацию микросервисной Job Platform: подготовить Dockerfile для каждого сервиса, общий `docker-compose.yml`, отдельные PostgreSQL контейнеры и сетевое взаимодействие между сервисами.

## Ход работы

1. За основу взята готовая микросервисная реализация из `labs/lab2`.
2. Код перенесен в отдельную папку `labs/lab3`.
3. Для каждого backend-сервиса проверен Dockerfile.
4. Для каждого backend-сервиса добавлен `.dockerignore`.
5. Подготовлен общий `docker-compose.yml` с семью сервисами и семью отдельными БД.
6. Добавлена общая Docker-сеть `job-platform-network`.
7. Для PostgreSQL добавлены healthcheck и named volumes.
8. Описаны команды сборки, запуска, миграций и проверки Swagger.
9. Перенесены правки ЛР2 по internal API: batch-получение сущностей, отсутствие internal endpoints у справочников, удаление internal endpoint количества откликов.

## Dockerfile

Каждый сервис имеет собственный Dockerfile. Общая структура:

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
COPY docs ./docs

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start"]
```

Порт `EXPOSE` отличается для каждого сервиса:

| Сервис | EXPOSE |
| --- | ---: |
| `auth-user-service` | `3001` |
| `company-service` | `3002` |
| `dictionary-service` | `3003` |
| `vacancy-service` | `3004` |
| `resume-service` | `3005` |
| `application-service` | `3006` |
| `interaction-service` | `3007` |

`.dockerignore` исключает локальные файлы:

```text
node_modules
dist
npm-debug.log
.env
```

## docker-compose.yml

Compose-файл содержит:

- 7 backend-сервисов;
- 7 отдельных PostgreSQL контейнеров;
- переменные `APP_PORT`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`;
- URL зависимых сервисов через docker service name;
- `depends_on` для БД и сервисных зависимостей;
- healthcheck для каждого PostgreSQL;
- named volumes для хранения данных;
- общую сеть `job-platform-network`.

Пример настройки сервиса:

```yaml
application-service:
  build: ./services/application-service
  ports:
    - 3006:3006
  environment:
    APP_PORT: 3006
    DB_HOST: applications-db
    DB_NAME: applications_db
  depends_on:
    applications-db:
      condition: service_healthy
    vacancy-service:
      condition: service_started
  networks:
    - job-platform-network
```

## Сеть между сервисами

Все контейнеры подключены к одной bridge-сети:

```yaml
networks:
  job-platform-network:
    driver: bridge
```

Сервисы общаются по DNS-именам Docker Compose:

```text
http://auth-user-service:3001/api/v1
http://company-service:3002/api/v1
http://dictionary-service:3003/api/v1
http://vacancy-service:3004/api/v1
http://resume-service:3005/api/v1
http://application-service:3006/api/v1
http://interaction-service:3007/api/v1
```

## Internal API

Межсервисные проверки сущностей выполняются через batch endpoints:

```text
POST /internal/v1/users/batch
POST /internal/v1/companies/batch
POST /internal/v1/employer-profiles/batch
POST /internal/v1/vacancies/batch
POST /internal/v1/resumes/batch
POST /internal/v1/applications/batch
```

Справочники не имеют internal API и читаются через публичные endpoints `GET /industries/:id` и `GET /experience-levels/:id`. Internal endpoint количества откликов удален.

## Запуск

Проверка compose:

```powershell
docker compose config --quiet
```

Сборка:

```powershell
docker compose build
```

Запуск:

```powershell
docker compose up -d
```

Миграции:

```powershell
docker compose exec auth-user-service npm run migrate
docker compose exec company-service npm run migrate
docker compose exec dictionary-service npm run migrate
docker compose exec vacancy-service npm run migrate
docker compose exec resume-service npm run migrate
docker compose exec application-service npm run migrate
docker compose exec interaction-service npm run migrate
```

## Проверка

Swagger UI:

```text
http://localhost:3001/docs
http://localhost:3002/docs
http://localhost:3003/docs
http://localhost:3004/docs
http://localhost:3005/docs
http://localhost:3006/docs
http://localhost:3007/docs
```

Команды проверки:

```powershell
docker compose ps
docker compose logs auth-user-service
curl http://localhost:3003/api/v1/industries
curl http://localhost:3004/api/v1/vacancies
```

## Вывод

В ЛР3 микросервисная Job Platform подготовлена к запуску в Docker. Каждый сервис имеет собственный Dockerfile, общий compose-файл поднимает все backend-сервисы и отдельные PostgreSQL БД, а взаимодействие между сервисами настроено через общую Docker-сеть и service-name URL.
