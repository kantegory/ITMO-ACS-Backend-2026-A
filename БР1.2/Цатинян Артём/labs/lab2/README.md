# Restaurant Booking Microservices

Microservice version of the restaurant table booking backend from lab1.

## Stack

- Java 21
- Kotlin
- Spring Boot 3
- PostgreSQL
- Liquibase XML
- jOOQ with generated tables, records, POJOs and DAOs
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

- `jdbc:postgresql://localhost:5432/storage_local?currentSchema=identity`
- `jdbc:postgresql://localhost:5432/storage_local?currentSchema=catalog`
- `jdbc:postgresql://localhost:5432/storage_local?currentSchema=booking`
- `jdbc:postgresql://localhost:5432/storage_local?currentSchema=review`

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

Protected endpoints use the `X-User-Id` header in this lab version. The login endpoint still returns an `accessToken` field, but service-to-service and protected request checks are intentionally kept simple until an API Gateway or shared authorization component is introduced.

## Internal API

The services communicate through internal REST endpoints:

- booking-service calls catalog-service for restaurant, table and working-hours context;
- review-service calls booking-service to verify that the user has a completed booking before creating a review;
- identity-service exposes a user summary endpoint for future enrichment.

Internal endpoints are under `/internal/v1/...` and are not intended for frontend usage.
