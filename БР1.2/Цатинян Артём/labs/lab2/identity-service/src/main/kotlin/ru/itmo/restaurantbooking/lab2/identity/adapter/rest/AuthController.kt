package ru.itmo.restaurantbooking.lab2.identity.adapter.rest

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RequestMethod
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.AuthResponse
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.LoginRequest
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.OAuthTokenResponse
import ru.itmo.restaurantbooking.lab2.identity.adapter.rest.dto.RegisterRequest
import ru.itmo.restaurantbooking.lab2.identity.service.AuthService

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(
    origins = ["http://localhost:8081", "http://localhost:8082", "http://localhost:8083", "http://localhost:8084"],
    methods = [RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS],
    allowedHeaders = ["*"]
)
class AuthController(
    private val authService: AuthService
) {
    @Operation(security = [])
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    fun register(@Valid @RequestBody request: RegisterRequest): AuthResponse =
        authService.register(request)

    @Operation(security = [])
    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): AuthResponse =
        authService.login(request)

    @Operation(security = [])
    @PostMapping("/token", consumes = [MediaType.APPLICATION_FORM_URLENCODED_VALUE])
    fun token(
        @Parameter(example = "emily.carter.lab2@example.com")
        @RequestParam("username") username: String,
        @Parameter(example = "storageAdmin123")
        @RequestParam("password") password: String,
        @Parameter(example = "password")
        @RequestParam("grant_type", required = false) grantType: String?
    ): OAuthTokenResponse =
        authService.token(username, password)
}
