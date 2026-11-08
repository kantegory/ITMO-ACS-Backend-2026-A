FROM gradle:8.11.1-jdk21 AS build
WORKDIR /workspace

COPY settings.gradle.kts build.gradle.kts gradle.properties gradlew ./
COPY gradle ./gradle
COPY openapi ./openapi
COPY shared ./shared
COPY feedback-service ./feedback-service

RUN chmod +x gradlew && ./gradlew :feedback-service:installDist --no-daemon

FROM eclipse-temurin:21-jre
LABEL org.opencontainers.image.description="Feedback service — restaurant reviews and ratings"
WORKDIR /app
COPY --from=build /workspace/feedback-service/build/install/feedback-service /app
ENV SERVICE_NAME=feedback-service
EXPOSE 8085
CMD ["/bin/sh", "-c", "exec /app/bin/feedback-service"]
