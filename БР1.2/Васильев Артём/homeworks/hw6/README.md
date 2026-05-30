# HW6 Job Platform

HW6 is based on the HW5 microservice backend. The project contains the root TypeScript backend sources, service-specific TypeScript applications, Dockerfiles, Docker Compose configuration, OpenAPI docs, and package manifests.

## Structure

- `src/` - root Express/TypeORM application sources.
- `services/auth-user-service` - authentication and users.
- `services/company-service` - companies and employer profiles.
- `services/dictionary-service` - dictionaries.
- `services/vacancy-service` - vacancies.
- `services/resume-service` - resumes.
- `services/application-service` - vacancy applications and RabbitMQ publishing.
- `services/interaction-service` - favorites, views, and RabbitMQ consumers.
- `docker-compose.yml` - local infrastructure and all microservices.

## Local Start

```bash
cp .env.example .env
docker compose up -d --build
```

The compose project is named `job-platform-hw6`, so Docker resources are separated from HW5.

External service ports:

| Service | URL |
|---|---|
| auth-user-service | `http://localhost:3101/api/v1` |
| company-service | `http://localhost:3102/api/v1` |
| dictionary-service | `http://localhost:3103/api/v1` |
| vacancy-service | `http://localhost:3104/api/v1` |
| resume-service | `http://localhost:3105/api/v1` |
| application-service | `http://localhost:3106/api/v1` |
| interaction-service | `http://localhost:3107/api/v1` |
| RabbitMQ management | `http://localhost:16672` |

PostgreSQL databases are exposed on `16433-16439`. RabbitMQ AMQP is exposed on `6672`.

## Useful Commands

Run from the `hw6` directory:

```bash
npm install
npm run build
```

Run a command for an individual service:

```bash
cd services/auth-user-service
npm install
npm run build
npm run migrate
```

Stop the stack:

```bash
docker compose down
```
