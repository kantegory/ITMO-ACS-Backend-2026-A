# Restaurant Booking API

Spring Boot REST API for the "restaurant table booking" project.

## Stack

- Java 21
- Spring Boot 3
- PostgreSQL
- Liquibase
- jOOQ
- Gradle

## Database

- database: `storage_local`
- schema: `storage`
- user: `storage`
- password: `storage`

## Run

1. Make sure PostgreSQL is running and the database/schema exist.
2. Run `gradlew.bat bootRun`
3. API base URL: `http://localhost:8080/api/v1`

## Build

- Generate jOOQ and build jar: `gradlew.bat bootJar`
- Result jar: `build/libs/restaurant-booking-api-0.0.1-SNAPSHOT.jar`

## Main endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `GET /api/v1/cuisines`
- `GET /api/v1/restaurants`
- `GET /api/v1/restaurants/{restaurantId}`
- `GET /api/v1/restaurants/{restaurantId}/availability`
- `GET /api/v1/restaurants/{restaurantId}/menu`
- `GET /api/v1/restaurants/{restaurantId}/reviews`
- `POST /api/v1/restaurants/{restaurantId}/reviews`
- `POST /api/v1/bookings`
- `GET /api/v1/bookings/me`
- `GET /api/v1/bookings/{bookingId}`
- `PATCH /api/v1/bookings/{bookingId}/cancel`

## Seed data

Liquibase creates:

- demo restaurant `La Piazza`
- cuisines
- working hours
- restaurant tables
- photos
- menu categories
- menu items

On application startup a default admin is also created if there is no admin yet:

- email: `admin@restaurant-booking.local`
- password: `storageAdmin123`

## Verified scenario

The API was smoke-tested with the following flow:

1. Get cuisines
2. Get restaurants
3. Register a new user
4. Read current user's bookings
5. Request restaurant availability
6. Create a booking
