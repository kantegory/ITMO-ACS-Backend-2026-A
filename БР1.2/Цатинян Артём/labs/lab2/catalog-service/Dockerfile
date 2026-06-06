FROM public.ecr.aws/docker/library/eclipse-temurin:21-jdk AS build

WORKDIR /workspace
COPY . .
RUN chmod +x ./gradlew \
    && ./gradlew --console=plain :catalog-service:bootJar -x liquibaseUpdate -x generateJooq --no-daemon

FROM public.ecr.aws/docker/library/eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build /workspace/catalog-service/build/libs/catalog-service.jar app.jar

EXPOSE 8082
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
