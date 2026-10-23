FROM gradle:8.11.1-jdk21 AS build
WORKDIR /workspace

COPY settings.gradle.kts build.gradle.kts gradle.properties gradlew ./
COPY gradle ./gradle
COPY openapi ./openapi
COPY shared ./shared
COPY booking-service ./booking-service

RUN chmod +x gradlew && ./gradlew :booking-service:installDist --no-daemon

FROM eclipse-temurin:21-jre
LABEL org.opencontainers.image.description="Booking service — table reservation creation and management"
WORKDIR /app
COPY --from=build /workspace/booking-service/build/install/booking-service /app
ENV SERVICE_NAME=booking-service
EXPOSE 8084
CMD ["/bin/sh", "-c", "exec /app/bin/booking-service"]
