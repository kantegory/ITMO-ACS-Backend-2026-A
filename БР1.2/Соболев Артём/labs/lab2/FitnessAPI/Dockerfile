FROM eclipse-temurin:21-jdk AS build

WORKDIR /workspace

COPY gradlew gradlew
COPY gradle gradle
RUN chmod +x ./gradlew && ./gradlew --version

ARG SERVICE
COPY . .
RUN chmod +x ./gradlew && ./gradlew ":${SERVICE}:bootJar"

FROM eclipse-temurin:21-jre

ARG SERVICE
ENV SERVICE=${SERVICE}
WORKDIR /app

COPY --from=build /workspace/${SERVICE}/build/libs/*.jar /app/app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
