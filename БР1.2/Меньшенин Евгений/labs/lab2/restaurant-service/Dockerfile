FROM gradle:8.11.1-jdk21 AS build
WORKDIR /workspace

COPY settings.gradle.kts build.gradle.kts gradle.properties gradlew ./
COPY gradle ./gradle
COPY openapi ./openapi
COPY shared ./shared
COPY restaurant-service ./restaurant-service

RUN chmod +x gradlew && ./gradlew :restaurant-service:installDist --no-daemon

FROM eclipse-temurin:21-jre
LABEL org.opencontainers.image.description="Restaurant service — restaurant and menu management"
WORKDIR /app
COPY --from=build /workspace/restaurant-service/build/install/restaurant-service /app
ENV SERVICE_NAME=restaurant-service
EXPOSE 8082
CMD ["/bin/sh", "-c", "exec /app/bin/restaurant-service"]
