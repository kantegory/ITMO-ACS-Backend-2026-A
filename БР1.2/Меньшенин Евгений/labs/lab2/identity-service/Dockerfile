FROM gradle:8.11.1-jdk21 AS build
WORKDIR /workspace

COPY settings.gradle.kts build.gradle.kts gradle.properties gradlew ./
COPY gradle ./gradle
COPY openapi ./openapi
COPY shared ./shared
COPY identity-service ./identity-service

RUN chmod +x gradlew && ./gradlew :identity-service:installDist --no-daemon

FROM eclipse-temurin:21-jre
LABEL org.opencontainers.image.description="Identity service — authentication and JWT issuance"
WORKDIR /app
COPY --from=build /workspace/identity-service/build/install/identity-service /app
ENV SERVICE_NAME=identity-service
EXPOSE 8081
CMD ["/bin/sh", "-c", "exec /app/bin/identity-service"]
