FROM gradle:8.11.1-jdk21 AS build
WORKDIR /workspace

COPY settings.gradle.kts build.gradle.kts gradle.properties gradlew ./
COPY gradle ./gradle
COPY openapi ./openapi
COPY shared ./shared
COPY identity-service ./identity-service
COPY restaurant-service ./restaurant-service
COPY availability-service ./availability-service
COPY booking-service ./booking-service
COPY feedback-service ./feedback-service
COPY api-gateway ./api-gateway

RUN chmod +x gradlew && ./gradlew installDist --no-daemon

FROM eclipse-temurin:21-jre AS identity-service
WORKDIR /app
COPY --from=build /workspace/identity-service/build/install/identity-service /app
ENV SERVICE_NAME=identity-service
EXPOSE 8081
CMD ["/bin/sh", "-c", "exec /app/bin/identity-service"]

FROM eclipse-temurin:21-jre AS restaurant-service
WORKDIR /app
COPY --from=build /workspace/restaurant-service/build/install/restaurant-service /app
ENV SERVICE_NAME=restaurant-service
EXPOSE 8082
CMD ["/bin/sh", "-c", "exec /app/bin/restaurant-service"]

FROM eclipse-temurin:21-jre AS availability-service
WORKDIR /app
COPY --from=build /workspace/availability-service/build/install/availability-service /app
ENV SERVICE_NAME=availability-service
EXPOSE 8083
CMD ["/bin/sh", "-c", "exec /app/bin/availability-service"]

FROM eclipse-temurin:21-jre AS booking-service
WORKDIR /app
COPY --from=build /workspace/booking-service/build/install/booking-service /app
ENV SERVICE_NAME=booking-service
EXPOSE 8084
CMD ["/bin/sh", "-c", "exec /app/bin/booking-service"]

FROM eclipse-temurin:21-jre AS feedback-service
WORKDIR /app
COPY --from=build /workspace/feedback-service/build/install/feedback-service /app
ENV SERVICE_NAME=feedback-service
EXPOSE 8085
CMD ["/bin/sh", "-c", "exec /app/bin/feedback-service"]

FROM eclipse-temurin:21-jre AS api-gateway
WORKDIR /app
COPY --from=build /workspace/api-gateway/build/install/api-gateway /app
ENV SERVICE_NAME=api-gateway
EXPOSE 8080
CMD ["/bin/sh", "-c", "exec /app/bin/api-gateway"]
