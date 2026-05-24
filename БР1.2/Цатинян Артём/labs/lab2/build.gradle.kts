import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import org.springframework.boot.gradle.tasks.bundling.BootJar

plugins {
    kotlin("jvm") version "1.9.25" apply false
    kotlin("plugin.spring") version "1.9.25" apply false
    id("org.springframework.boot") version "3.4.4" apply false
    id("io.spring.dependency-management") version "1.1.7" apply false
}

val javaVersion = property("javaVersion").toString()

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
    }

    tasks.withType<Jar>().configureEach {
        enabled = true
    }
}

configure(subprojects.filter { it.name != "common" }) {
    apply(plugin = "org.springframework.boot")

    dependencies {
        add("implementation", project(":common"))
        add("implementation", "org.springframework.boot:spring-boot-starter-web")
        add("implementation", "org.springframework.boot:spring-boot-starter-validation")
        add("implementation", "org.springframework.boot:spring-boot-starter-jdbc")
        add("implementation", "com.fasterxml.jackson.module:jackson-module-kotlin")
        add("implementation", "org.liquibase:liquibase-core:${rootProject.property("liquibaseVersion")}")
        add("runtimeOnly", "org.postgresql:postgresql")
    }

    tasks.withType<BootJar>().configureEach {
        archiveFileName.set("${project.name}.jar")
    }
}
