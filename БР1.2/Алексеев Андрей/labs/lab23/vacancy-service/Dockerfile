FROM eclipse-temurin:17-jdk AS builder
WORKDIR /workspace
COPY gradlew build.gradle.kts settings.gradle.kts ./
COPY gradle gradle
COPY src src
RUN chmod +x gradlew && GRADLE_OPTS="-Dorg.gradle.internal.http.connectionTimeout=60000 -Dorg.gradle.internal.http.socketTimeout=60000" ./gradlew bootJar --no-daemon -Dorg.gradle.jvmargs="-Xms128m -Xmx256m -XX:MaxMetaspaceSize=192m"

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /workspace/build/libs/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-Xms32m", "-Xmx128m", "-XX:MaxMetaspaceSize=96m", "-jar", "/app/app.jar"]
