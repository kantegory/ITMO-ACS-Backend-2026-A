import org.jooq.meta.jaxb.ForcedType
import nu.studer.gradle.jooq.JooqGenerate
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    kotlin("jvm") version "1.9.25"
    kotlin("plugin.spring") version "1.9.25"
    kotlin("kapt") version "1.9.25"
    id("org.springframework.boot") version "3.4.4"
    id("io.spring.dependency-management") version "1.1.7"
    id("nu.studer.jooq") version "10.0"
}

group = property("group") as String
version = property("version") as String

val javaVersion = property("javaVersion").toString().toInt()
val jooqVersion = property("jooqVersion") as String
val liquibaseVersion = property("liquibaseVersion") as String
val mapstructVersion = property("mapstructVersion") as String
val datasourceUrl = property("datasourceUrl") as String
val datasourceSchema = property("datasourceSchema") as String
val datasourceUser = property("datasourceUser") as String
val datasourcePassword = property("datasourcePassword") as String
val jwtVersion = property("jwtVersion") as String

val liquibaseRuntime by configurations.creating

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(javaVersion))
    }
}

repositories {
    mavenCentral()
}

sourceSets {
    named("main") {
        java.srcDir("src/generated/jooq")
    }
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-jooq")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.6")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.liquibase:liquibase-core:$liquibaseVersion")
    implementation("org.postgresql:postgresql")
    implementation("org.mapstruct:mapstruct:$mapstructVersion")
    implementation("io.jsonwebtoken:jjwt-api:$jwtVersion")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:$jwtVersion")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:$jwtVersion")

    kapt("org.mapstruct:mapstruct-processor:$mapstructVersion")

    jooqGenerator("org.postgresql:postgresql")

    liquibaseRuntime("org.liquibase:liquibase-core:$liquibaseVersion")
    liquibaseRuntime("org.postgresql:postgresql")
    liquibaseRuntime("info.picocli:picocli:4.7.6")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}

tasks.withType<KotlinCompile>().configureEach {
    compilerOptions {
        jvmTarget.set(JvmTarget.fromTarget(javaVersion.toString()))
        freeCompilerArgs.add("-Xjsr305=strict")
    }
}

kapt {
    correctErrorTypes = true
}

tasks.register<JavaExec>("liquibaseUpdate") {
    group = "database"
    description = "Applies Liquibase XML changelog to the local PostgreSQL database."
    classpath = liquibaseRuntime
    mainClass.set("liquibase.integration.commandline.Main")
    workingDir = projectDir
    args(
        "--classpath=src/main/resources",
        "--changeLogFile=db/changelog/db.changelog-master.xml",
        "--url=$datasourceUrl",
        "--username=$datasourceUser",
        "--password=$datasourcePassword",
        "--defaultSchemaName=$datasourceSchema",
        "--liquibaseSchemaName=$datasourceSchema",
        "update"
    )
}

tasks.register<JavaExec>("liquibaseClearChecksums") {
    group = "database"
    description = "Clears Liquibase checksums in the local PostgreSQL database."
    classpath = liquibaseRuntime
    mainClass.set("liquibase.integration.commandline.Main")
    workingDir = projectDir
    args(
        "--classpath=src/main/resources",
        "--changeLogFile=db/changelog/db.changelog-master.xml",
        "--url=$datasourceUrl",
        "--username=$datasourceUser",
        "--password=$datasourcePassword",
        "--defaultSchemaName=$datasourceSchema",
        "--liquibaseSchemaName=$datasourceSchema",
        "clearCheckSums"
    )
}

tasks.withType<JooqGenerate>().configureEach {
    dependsOn("liquibaseUpdate")
}

tasks.named("compileKotlin") {
    dependsOn(tasks.withType<JooqGenerate>())
}

tasks.matching { it.name.startsWith("kaptGenerateStubs") }.configureEach {
    dependsOn(tasks.withType<JooqGenerate>())
}

tasks.named("clean") {
    doLast {
        delete("src/generated/jooq")
    }
}

jooq {
    version.set(jooqVersion)
    configurations {
        create("main") {
            generateSchemaSourceOnCompilation.set(false)
            jooqConfiguration.apply {
                jdbc.apply {
                    driver = "org.postgresql.Driver"
                    url = datasourceUrl
                    user = datasourceUser
                    password = datasourcePassword
                }
                generator.apply {
                    name = "org.jooq.codegen.JavaGenerator"
                    database.apply {
                        name = "org.jooq.meta.postgres.PostgresDatabase"
                        inputSchema = datasourceSchema
                        excludes = "databasechangelog|databasechangeloglock"
                        forcedTypes = listOf(
                            ForcedType()
                                .withUserType("ru.itmo.restaurantbooking.user.domain.UserRole")
                                .withEnumConverter(true)
                                .withIncludeExpression("storage\\.users\\.role"),
                            ForcedType()
                                .withUserType("ru.itmo.restaurantbooking.restaurant.domain.PriceSegment")
                                .withEnumConverter(true)
                                .withIncludeExpression("storage\\.restaurants\\.price_segment"),
                            ForcedType()
                                .withUserType("ru.itmo.restaurantbooking.booking.domain.BookingStatus")
                                .withEnumConverter(true)
                                .withIncludeExpression("storage\\.bookings\\.status")
                        )
                    }
                    generate.apply {
                        isDeprecated = false
                        isRecords = true
                        isPojos = true
                        isDaos = true
                        isFluentSetters = true
                        isJavaTimeTypes = true
                        isRelations = true
                    }
                    target.apply {
                        packageName = "ru.itmo.restaurantbooking.jooq"
                        directory = "src/generated/jooq"
                    }
                    strategy.name = "org.jooq.codegen.DefaultGeneratorStrategy"
                }
            }
        }
    }
}



