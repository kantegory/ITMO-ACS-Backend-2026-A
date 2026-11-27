# Restaurant Booking Microservices

Microservice version of the restaurant table booking backend from lab1.

## Stack

- Java 21
- Kotlin
- Spring Boot 3
- PostgreSQL
- Liquibase XML
- jOOQ with generated tables, records, POJOs and DAOs
- RabbitMQ for asynchronous review events
- Gradle multi-module project

## Services

| Service | Port | Responsibility | Database schema |
| --- | ---: | --- | --- |
| `identity-service` | `8081` | registration, login, user profile | `identity` |
| `catalog-service` | `8082` | restaurants, cuisines, menu, table metadata | `catalog` |
| `booking-service` | `8083` | availability, booking lifecycle | `booking` |
| `review-service` | `8084` | restaurant reviews | `review` |

For local development all schemas are placed in the same PostgreSQL database `storage_local`, but the services do not use cross-schema foreign keys. This keeps the lab easy to run while preserving the database-per-service boundary.

## Project layout

Each service is split into the same basic layers:

- `adapter/rest` - public and internal HTTP controllers;
- `adapter/rest/dto` - request and response models;
- `adapter/jooq` - jOOQ-based SQL access to the service-owned schema;
- `adapter/client` - REST clients for calls to other services;
- `service` - business logic and orchestration;
- `domain` - internal records/domain objects.

The main application class only starts the service. Controllers, repositories, DTO and clients are intentionally not kept in one large file.

Repositories use generated jOOQ table classes from each service schema, for example:

- `identity-service/src/generated/jooq/.../identity/jooq/tables/Users.java`;
- `catalog-service/src/generated/jooq/.../catalog/jooq/tables/Restaurants.java`;
- `booking-service/src/generated/jooq/.../booking/jooq/tables/Bookings.java`;
- `review-service/src/generated/jooq/.../review/jooq/tables/Reviews.java`.

## Database

- database: `storage_local`
- user: `storage`
- password: `storage`
- schemas: `identity`, `catalog`, `booking`, `review`

Liquibase creates the required schema and tables on each service startup.

Demo data is loaded by Liquibase when the services start.

Demo application users:

| Email | Password | Purpose |
| --- | --- | --- |
| `emily.carter.lab2@example.com` | `storageAdmin123` | main Swagger/manual testing user |
| `mark.taylor.lab2@example.com` | `storageAdmin123` | second user for ownership checks |

Important demo ids:

| Entity | Id | Notes |
| --- | ---: | --- |
| North Garden restaurant | `1` | European restaurant |
| Pasta Lane restaurant | `2` | Italian restaurant |
| Sakura Room restaurant | `3` | Japanese restaurant |
| North Garden table T-02 | `2` | free table for booking examples |
| Completed booking without review | `1001` | use it to create a review |
| Completed booking with existing review | `1002` | use it to show duplicate-review error |
| Future confirmed booking | `1003` | use it to cancel a booking |

Connection examples:

```powershell
psql -h localhost -p 5432 -U storage -d storage_local
```

Then switch schema inside `psql`:

```sql
set search_path to identity;
set search_path to catalog;
set search_path to booking;
set search_path to review;
```

JDBC URLs used by services:

- `jdbc:postgresql://localhost:5432/storage_local`

The runtime connection does not set `currentSchema`: Liquibase changelogs and generated jOOQ table classes use schema-qualified table names.

## RabbitMQ

Homework 5 adds asynchronous interservice communication through RabbitMQ.

Local broker can be started with:

```powershell
docker compose -f docker-compose.rabbitmq.yml up -d
```

RabbitMQ credentials:

- host: `localhost`
- AMQP port: `5672`
- management UI: `http://localhost:15672`
- username: `storage`
- password: `storage`

Used topology:

| Name | Type | Purpose |
| --- | --- | --- |
| `restaurant.review.events` | direct exchange | review domain events |
| `catalog.review-created` | durable queue | events consumed by catalog-service |
| `review.created` | routing key | ReviewCreated routing key |

Implemented asynchronous flow:

```text
client -> review-service: POST /api/v1/restaurants/{restaurantId}/reviews
review-service -> review database: save review and outbox row
review-service -> RabbitMQ: publish ReviewCreated from outbox
catalog-service <- RabbitMQ: consume ReviewCreated
catalog-service -> catalog database: update restaurant_rating_stats
```

The catalog consumer stores processed event ids in `catalog.processed_review_events`, so repeated delivery of the same RabbitMQ message does not update rating statistics twice.

## Build

```powershell
$env:GRADLE_USER_HOME=(Join-Path (Get-Location) '.gradle-home')
.\gradlew.bat --console=plain assemble
```

The build applies Liquibase migrations and runs jOOQ code generation for every service before Kotlin compilation. PostgreSQL must be running for `assemble`, because jOOQ reads table metadata from the local database.

Useful database/codegen commands:

```powershell
.\gradlew.bat --console=plain :identity-service:liquibaseUpdate :identity-service:generateJooq
.\gradlew.bat --console=plain :catalog-service:liquibaseUpdate :catalog-service:generateJooq
.\gradlew.bat --console=plain :booking-service:liquibaseUpdate :booking-service:generateJooq
.\gradlew.bat --console=plain :review-service:liquibaseUpdate :review-service:generateJooq
```

## Docker Compose

Lab 3 adds Dockerfiles for all services and a single `docker-compose.yml` for the whole application.

Start the full stack:

```powershell
docker compose up --build
```

If the Docker Compose plugin is not installed, use the standalone command:

```powershell
docker-compose up --build
```

Run in the background:

```powershell
docker compose up --build -d
```

Stop the stack:

```powershell
docker compose down
```

Stop the stack and remove PostgreSQL data:

```powershell
docker compose down -v
```

The compose stack starts:

| Container service | External port | Internal name used by services |
| --- | ---: | --- |
| `postgres` | `5432` | `postgres:5432` |
| `rabbitmq` | `5672`, `15672` | `rabbitmq:5672` |
| `identity-service` | `8081` | `identity-service:8081` |
| `catalog-service` | `8082` | `catalog-service:8082` |
| `booking-service` | `8083` | `booking-service:8083` |
| `review-service` | `8084` | `review-service:8084` |

The service containers override local `localhost` settings through environment variables:

- `SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/storage_local`
- `SPRING_RABBITMQ_HOST=rabbitmq`
- `SERVICES_IDENTITY_BASE_URL=http://identity-service:8081`
- `SERVICES_CATALOG_BASE_URL=http://catalog-service:8082`
- `SERVICES_BOOKING_BASE_URL=http://booking-service:8083`

Docker images build application jars inside container build stages. The Dockerfiles use already generated jOOQ sources and skip `liquibaseUpdate`/`generateJooq` during image build, because migrations are applied when each service starts inside the compose network.

## Run

Start PostgreSQL first, then run the services in separate terminals:

```powershell
.\gradlew.bat --console=plain :catalog-service:bootRun
.\gradlew.bat --console=plain :identity-service:bootRun
.\gradlew.bat --console=plain :booking-service:bootRun
.\gradlew.bat --console=plain :review-service:bootRun
```

Recommended startup order is catalog, identity, booking, review, because booking calls catalog and review calls booking.

## Swagger UI

Open the Swagger UI of each running service:

- identity-service: `http://localhost:8081/swagger-ui/index.html`
- catalog-service: `http://localhost:8082/swagger-ui/index.html`
- booking-service: `http://localhost:8083/swagger-ui/index.html`
- review-service: `http://localhost:8084/swagger-ui/index.html`

Raw OpenAPI JSON:

- identity-service: `http://localhost:8081/v3/api-docs`
- catalog-service: `http://localhost:8082/v3/api-docs`
- booking-service: `http://localhost:8083/v3/api-docs`
- review-service: `http://localhost:8084/v3/api-docs`

## Public API

Identity:

- `POST http://localhost:8081/api/v1/auth/register`
- `POST http://localhost:8081/api/v1/auth/login`
- `GET http://localhost:8081/api/v1/users/me`
- `PATCH http://localhost:8081/api/v1/users/me`

Catalog:

- `GET http://localhost:8082/api/v1/cuisines`
- `GET http://localhost:8082/api/v1/restaurants`
- `GET http://localhost:8082/api/v1/restaurants/{restaurantId}`
- `GET http://localhost:8082/api/v1/restaurants/{restaurantId}/menu`

Booking:

- `GET http://localhost:8083/api/v1/restaurants/{restaurantId}/availability`
- `POST http://localhost:8083/api/v1/bookings`
- `GET http://localhost:8083/api/v1/bookings/me`
- `GET http://localhost:8083/api/v1/bookings/{bookingId}`
- `PATCH http://localhost:8083/api/v1/bookings/{bookingId}/cancel`

Review:

- `GET http://localhost:8084/api/v1/restaurants/{restaurantId}/reviews`
- `POST http://localhost:8084/api/v1/restaurants/{restaurantId}/reviews`

Protected endpoints use a Bearer token issued by `identity-service`.

There are two ways to authenticate in Swagger.

Recommended Swagger flow:

1. Open any service Swagger UI.
2. Click `Authorize`.
3. Choose the OAuth2 password flow.
4. Enter the user email as `username` and the password as `password`.
5. Swagger sends the credentials to `identity-service` at `http://localhost:8081/api/v1/auth/token`, receives a JWT and automatically attaches it to protected requests.

Manual flow:

Login or register through `identity-service`, copy the `accessToken`, then call protected endpoints with:

```http
Authorization: Bearer <accessToken>
```

`identity-service` signs the token and exposes an internal validation endpoint. `booking-service` and `review-service` validate incoming Bearer tokens by calling `identity-service`, so they no longer trust a user id supplied directly by the client.

## Manual Check Scenarios

Run all services first. In Swagger, click `Authorize` and log in with:

- username: `emily.carter.lab2@example.com`
- password: `storageAdmin123`

Scenario 1 - browse catalog:

1. `GET http://localhost:8082/api/v1/cuisines?search=Italian`
2. `GET http://localhost:8082/api/v1/restaurants?city=Saint%20Petersburg&cuisine=European&priceSegment=MEDIUM&page=1&size=10`
3. `GET http://localhost:8082/api/v1/restaurants/1`
4. `GET http://localhost:8082/api/v1/restaurants/1/menu?category=Main%20Courses&search=Duck`

Scenario 2 - create and read a booking:

1. `GET http://localhost:8083/api/v1/restaurants/1/availability?date=2026-06-12&guestsCount=4`
2. `POST http://localhost:8083/api/v1/bookings`

```json
{
  "restaurantId": 1,
  "tableId": 2,
  "startsAt": "2026-06-12T19:00:00",
  "endsAt": "2026-06-12T21:00:00",
  "guestsCount": 4,
  "specialRequests": "Window table if available"
}
```

3. `GET http://localhost:8083/api/v1/bookings/me?page=1&size=10`
4. `GET http://localhost:8083/api/v1/bookings/{bookingId}` with the id returned by create.

Scenario 3 - cancel prepared future booking:

1. `GET http://localhost:8083/api/v1/bookings/1003`
2. `PATCH http://localhost:8083/api/v1/bookings/1003/cancel`

Scenario 4 - reviews:

1. `GET http://localhost:8084/api/v1/restaurants/2/reviews?page=1&size=10`
2. `POST http://localhost:8084/api/v1/restaurants/1/reviews`

```json
{
  "bookingId": 1001,
  "rating": 5,
  "comment": "Great dinner, fast service and a very comfortable table."
}
```

3. Repeat the same request and expect `409 Conflict`, because a booking can have only one review.

After a successful review creation, wait a few seconds and call:

```text
GET http://localhost:8082/api/v1/restaurants/1
```

The restaurant `rating` and `reviewCount` are updated by `catalog-service` after it consumes the `ReviewCreated` message from RabbitMQ.

Scenario 5 - ownership/authentication check:

1. Open `Authorize`, log out, then log in as `mark.taylor.lab2@example.com`.
2. `GET http://localhost:8083/api/v1/bookings/1003`
3. Expected result: `404 Not Found`, because booking `1003` belongs to Emily.

## Internal API

The services communicate through internal REST endpoints:

- booking-service and review-service call identity-service to validate Bearer tokens and resolve the current user;
- booking-service calls catalog-service for restaurant, table and working-hours context;
- review-service calls booking-service to verify that the user has a completed booking before creating a review;
- identity-service exposes a user summary endpoint for future enrichment.

Internal endpoints are under `/internal/v1/...` and are not intended for frontend usage.

Typical request chain for creating a booking:

```text
client -> identity-service: login/register
client -> booking-service: POST /api/v1/bookings with Bearer token
booking-service -> identity-service: validate token
booking-service -> catalog-service: get restaurant/table booking context
booking-service -> booking database: create booking
```

Typical request chain for creating a review:

```text
client -> review-service: POST /api/v1/restaurants/{id}/reviews with Bearer token
review-service -> identity-service: validate token and get author name
review-service -> booking-service: check completed booking
review-service -> review database: create review
```
