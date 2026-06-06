FROM public.ecr.aws/docker/library/eclipse-temurin:21-jdk AS build

WORKDIR /workspace
COPY . .
RUN chmod +x ./gradlew \
    && ./gradlew --console=plain :booking-service:bootJar -x liquibaseUpdate -x generateJooq --no-daemon

FROM public.ecr.aws/docker/library/eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build /workspace/booking-service/build/libs/booking-service.jar app.jar

EXPOSE 8083
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
