package ru.itmo.restaurantbooking.lab2.common.exception

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@ConditionalOnProperty(name = ["app.sentry-demo.enabled"], havingValue = "true")
class SentryDemoController {
    @GetMapping("/internal/demo/sentry-error")
    fun testError(): Nothing = throw IllegalStateException("Sentry monitoring test error")
}
