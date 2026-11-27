FROM public.ecr.aws/docker/library/eclipse-temurin:21-jdk AS build

WORKDIR /workspace
COPY . .
RUN chmod +x ./gradlew \
    && ./gradlew --console=plain :identity-service:bootJar -x liquibaseUpdate -x generateJooq --no-daemon

FROM public.ecr.aws/docker/library/eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build /workspace/identity-service/build/libs/identity-service.jar app.jar

EXPOSE 8081
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
