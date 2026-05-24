import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import org.springframework.boot.gradle.tasks.bundling.BootJar
import nu.studer.gradle.jooq.JooqGenerate
import org.gradle.api.tasks.SourceSetContainer

plugins {
    kotlin("jvm") version "1.9.25" apply false
    kotlin("plugin.spring") version "1.9.25" apply false
    id("org.springframework.boot") version "3.4.4" apply false
    id("io.spring.dependency-management") version "1.1.7" apply false
    id("nu.studer.jooq") version "10.0" apply false
}

val javaVersion = property("javaVersion").toString()
val datasourceUrl = property("datasourceUrl").toString()
val datasourceUser = property("datasourceUser").toString()
val datasourcePassword = property("datasourcePassword").toString()

val serviceSchemas = mapOf(
    "identity-service" to "identity",
    "catalog-service" to "catalog",
    "booking-service" to "booking",
    "review-service" to "review"
)

subprojects {
    group = rootProject.property("group") as String
    version = rootProject.property("version") as String

    repositories {
        mavenCentral()
    }

    apply(plugin = "org.jetbrains.kotlin.jvm")
    apply(plugin = "org.jetbrains.kotlin.plugin.spring")
    apply(plugin = "io.spring.dependency-management")

    extensions.configure<io.spring.gradle.dependencymanagement.dsl.DependencyManagementExtension> {
        imports {
            mavenBom("org.springframework.boot:spring-boot-dependencies:${rootProject.property("springBootVersion")}")
        }
    }

    dependencies {
        add("implementation", "org.jetbrains.kotlin:kotlin-reflect")
        add("testImplementation", "org.springframework.boot:spring-boot-starter-test")
    }

    tasks.withType<KotlinCompile>().configureEach {
        compilerOptions {
            jvmTarget.set(JvmTarget.fromTarget(javaVersion))
            freeCompilerArgs.add("-Xjsr305=strict")
        }
    }

    tasks.withType<Test>().configureEach {
        useJUnitPlatform()
    }
}

project(":common") {
    dependencies {
        add("implementation", "org.springframework.boot:spring-boot-starter-web")
        add("implementation", "org.springdoc:springdoc-openapi-starter-webmvc-ui:${rootProject.property("springdocVersion")}")
    }

    tasks.withType<Jar>().configureEach {
        enabled = true
    }
}

configure(subprojects.filter { it.name != "common" }) {
    apply(plugin = "org.springframework.boot")
    apply(plugin = "nu.studer.jooq")

    val liquibaseRuntime by configurations.creating

    dependencies {
        add("implementation", project(":common"))
        add("implementation", "org.springframework.boot:spring-boot-starter-web")
        add("implementation", "org.springframework.boot:spring-boot-starter-validation")
        add("implementation", "org.springframework.boot:spring-boot-starter-jooq")
        add("implementation", "com.fasterxml.jackson.module:jackson-module-kotlin")
        add("implementation", "org.springdoc:springdoc-openapi-starter-webmvc-ui:${rootProject.property("springdocVersion")}")
        add("implementation", "org.liquibase:liquibase-core:${rootProject.property("liquibaseVersion")}")
        add("runtimeOnly", "org.postgresql:postgresql")
        add("jooqGenerator", "org.postgresql:postgresql")
        add("liquibaseRuntime", "org.liquibase:liquibase-core:${rootProject.property("liquibaseVersion")}")
        add("liquibaseRuntime", "org.postgresql:postgresql")
        add("liquibaseRuntime", "info.picocli:picocli:4.7.6")
    }

    extensions.configure<SourceSetContainer> {
        named("main") {
            java.srcDir("src/generated/jooq")
        }
    }

    val serviceSchema = serviceSchemas.getValue(project.name)
    val generatedPackage = "ru.itmo.restaurantbooking.lab2.${project.name.removeSuffix("-service").replace("-", "")}.jooq"

    tasks.register<JavaExec>("liquibaseUpdate") {
        group = "database"
        description = "Applies Liquibase XML changelog for ${project.name}."
        classpath = liquibaseRuntime
        mainClass.set("liquibase.integration.commandline.Main")
        workingDir = projectDir
        args(
            "--classpath=src/main/resources",
            "--changeLogFile=db/changelog/db.changelog-master.xml",
            "--url=$datasourceUrl",
            "--username=$datasourceUser",
            "--password=$datasourcePassword",
            "update"
        )
    }

    tasks.withType<JooqGenerate>().configureEach {
        dependsOn("liquibaseUpdate")
    }

    tasks.named("compileKotlin") {
        dependsOn(tasks.withType<JooqGenerate>())
    }

    tasks.named("clean") {
        doLast {
            delete("src/generated/jooq")
        }
    }

    extensions.configure<nu.studer.gradle.jooq.JooqExtension> {
        version.set(rootProject.property("jooqVersion").toString())
        configurations {
            create("main") {
                generateSchemaSourceOnCompilation.set(false)
                jooqConfiguration.apply {
                    jdbc.apply {
                        driver = "org.postgresql.Driver"
                        url = "$datasourceUrl?currentSchema=$serviceSchema"
                        user = datasourceUser
                        password = datasourcePassword
                    }
                    generator.apply {
                        name = "org.jooq.codegen.JavaGenerator"
                        database.apply {
                            name = "org.jooq.meta.postgres.PostgresDatabase"
                            inputSchema = serviceSchema
                            excludes = "databasechangelog|databasechangeloglock"
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
                            packageName = generatedPackage
                            directory = "src/generated/jooq"
                        }
                    }
                }
            }
        }
    }

    tasks.withType<BootJar>().configureEach {
        archiveFileName.set("${project.name}.jar")
    }
}
