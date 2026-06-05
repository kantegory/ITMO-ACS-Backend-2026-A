plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(ktorLibs.plugins.ktor)
    kotlin("plugin.serialization") version "2.3.20"
    application
}
application { mainClass = "io.ktor.server.netty.EngineMain" }
kotlin { jvmToolchain(21) }
dependencies {
    implementation(project(":shared"))
    implementation(ktorLibs.server.config.yaml)
    implementation(ktorLibs.server.netty)
    implementation("io.ktor:ktor-server-content-negotiation:3.4.0")
    implementation("io.ktor:ktor-server-auth:3.4.0")
    implementation("io.ktor:ktor-server-auth-jwt:3.4.0")
    implementation("io.ktor:ktor-server-swagger:3.4.0")
    implementation("io.ktor:ktor-client-core:3.4.0")
    implementation("io.ktor:ktor-client-cio:3.4.0")
    implementation("io.ktor:ktor-client-content-negotiation:3.4.0")
}

tasks.processResources {
    from(rootProject.file("openapi/public-api.yaml")) {
        into("openapi")
    }
}
