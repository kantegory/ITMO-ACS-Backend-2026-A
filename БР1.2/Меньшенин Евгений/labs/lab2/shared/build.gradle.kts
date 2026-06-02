plugins {
    alias(libs.plugins.kotlin.jvm)
    kotlin("plugin.serialization") version "2.3.20"
}

group = "com.restaurant"
version = "1.0.0"

kotlin {
    jvmToolchain(21)
}

dependencies {
    api(ktorLibs.server.core)
    api("io.ktor:ktor-server-content-negotiation:3.4.0")
    api("io.ktor:ktor-serialization-kotlinx-json:3.4.0")
    api("io.ktor:ktor-server-status-pages:3.4.0")
    api("io.ktor:ktor-server-cors:3.4.0")
    api("io.ktor:ktor-server-auth:3.4.0")

    api("io.ktor:ktor-client-core:3.4.0")
    api("io.ktor:ktor-client-cio:3.4.0")
    api("io.ktor:ktor-client-content-negotiation:3.4.0")

    api("org.jetbrains.kotlinx:kotlinx-serialization-json:1.8.1")
    api("org.jetbrains.exposed:exposed-core:0.59.0")
    api("org.jetbrains.exposed:exposed-dao:0.59.0")
    api("org.jetbrains.exposed:exposed-jdbc:0.59.0")
    api("org.postgresql:postgresql:42.7.5")
    api("com.h2database:h2:2.3.232")

    implementation(libs.kafka.clients)
    implementation(libs.logback.classic)
    api("com.auth0:java-jwt:4.5.0")
    api("org.mindrot:jbcrypt:0.4")
}
