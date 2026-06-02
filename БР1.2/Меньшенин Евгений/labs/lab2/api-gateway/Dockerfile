FROM gradle:8.11.1-jdk21 AS build
WORKDIR /workspace

COPY settings.gradle.kts build.gradle.kts gradle.properties gradlew ./
COPY gradle ./gradle
COPY openapi ./openapi
COPY shared ./shared
COPY api-gateway ./api-gateway

RUN chmod +x gradlew && ./gradlew :api-gateway:installDist --no-daemon

FROM eclipse-temurin:21-jre
LABEL org.opencontainers.image.description="API Gateway — single entry point and request routing"
WORKDIR /app
COPY --from=build /workspace/api-gateway/build/install/api-gateway /app
ENV SERVICE_NAME=api-gateway
EXPOSE 8080
CMD ["/bin/sh", "-c", "exec /app/bin/api-gateway"]
