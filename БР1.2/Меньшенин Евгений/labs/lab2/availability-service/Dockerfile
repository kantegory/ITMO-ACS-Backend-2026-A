FROM gradle:8.11.1-jdk21 AS build
WORKDIR /workspace

COPY settings.gradle.kts build.gradle.kts gradle.properties gradlew ./
COPY gradle ./gradle
COPY openapi ./openapi
COPY shared ./shared
COPY availability-service ./availability-service

RUN chmod +x gradlew && ./gradlew :availability-service:installDist --no-daemon

FROM eclipse-temurin:21-jre
LABEL org.opencontainers.image.description="Availability service — table slot availability and scheduling"
WORKDIR /app
COPY --from=build /workspace/availability-service/build/install/availability-service /app
ENV SERVICE_NAME=availability-service
EXPOSE 8083
CMD ["/bin/sh", "-c", "exec /app/bin/availability-service"]
