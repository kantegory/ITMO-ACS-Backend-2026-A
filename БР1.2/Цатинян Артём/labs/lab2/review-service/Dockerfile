FROM public.ecr.aws/docker/library/eclipse-temurin:21-jdk AS build

WORKDIR /workspace
COPY . .
RUN chmod +x ./gradlew \
    && ./gradlew --console=plain :review-service:bootJar -x liquibaseUpdate -x generateJooq --no-daemon

FROM public.ecr.aws/docker/library/eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build /workspace/review-service/build/libs/review-service.jar app.jar

EXPOSE 8084
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
