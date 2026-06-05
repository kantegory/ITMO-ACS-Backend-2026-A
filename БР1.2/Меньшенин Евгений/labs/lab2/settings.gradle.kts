rootProject.name = "restaurant-microservices"

pluginManagement {
    repositories {
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositories {
        mavenCentral()
    }
    versionCatalogs {
        create("ktorLibs").from("io.ktor:ktor-version-catalog:3.4.0")
    }
}

plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

include(
    "shared",
    "identity-service",
    "restaurant-service",
    "availability-service",
    "booking-service",
    "feedback-service",
    "api-gateway",
)
