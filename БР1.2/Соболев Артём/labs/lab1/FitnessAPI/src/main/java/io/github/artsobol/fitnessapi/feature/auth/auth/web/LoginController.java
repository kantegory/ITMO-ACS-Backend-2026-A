package io.github.artsobol.fitnessapi.feature.auth.auth.web;

import io.github.artsobol.fitnessapi.config.openapi.PublicEndpoint;
import io.github.artsobol.fitnessapi.config.properties.security.CookieProperties;
import io.github.artsobol.fitnessapi.feature.auth.auth.dto.request.LoginRequest;
import io.github.artsobol.fitnessapi.feature.auth.auth.dto.request.SessionMetadata;
import io.github.artsobol.fitnessapi.feature.auth.auth.dto.response.AuthResponse;
import io.github.artsobol.fitnessapi.feature.auth.auth.service.LoginService;
import io.github.artsobol.fitnessapi.feature.auth.auth.support.DeviceInfo;
import io.github.artsobol.fitnessapi.feature.auth.auth.support.UserAgentService;
import io.github.artsobol.fitnessapi.infrastructure.web.error.dto.ErrorResponse;
import io.github.artsobol.fitnessapi.infrastructure.web.error.dto.ValidationErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@PublicEndpoint
@Tag(name = "Auth")
@RequestMapping("/auth/login")
@RequiredArgsConstructor
public class LoginController {

    private final CookieProperties properties;
    private final LoginService service;
    private final UserAgentService userAgentService;

    @PostMapping
    @Operation(
            summary = "Log in to account"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "400",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletRequest servletRequest
    ) {
        String userAgent = servletRequest.getHeader(HttpHeaders.USER_AGENT);
        String ipAddress = servletRequest.getRemoteAddr();
        DeviceInfo deviceInfo = getDeviceInfo(userAgent);
        log.debug(
                "Received login request username: {} device: {}",
                loginRequest.username(),
                deviceInfo.device()
        );

        AuthResponse authResponse = service.login(
                loginRequest,
                getSessionMetadata(ipAddress, userAgent, deviceInfo)
        );

        log.debug("Login finished username={}", loginRequest.username());
        return getResponse(getResponseCookie(authResponse), authResponse);
    }

    private DeviceInfo getDeviceInfo(String userAgent) {
        return userAgentService.parse(userAgent);
    }

    private @NonNull ResponseCookie getResponseCookie(AuthResponse response) {
        return ResponseCookie.from(properties.cookieName(), response.refreshToken())
                .httpOnly(true)
                .secure(properties.secure())
                .sameSite(properties.sameSite())
                .path(properties.path())
                .maxAge(properties.maxAge())
                .build();
    }

    private static SessionMetadata getSessionMetadata(String ipAddress, String userAgent, DeviceInfo deviceInfo) {
        return new SessionMetadata(ipAddress, userAgent, deviceInfo.device());
    }

    private static ResponseEntity<AuthResponse> getResponse(ResponseCookie responseCookie, AuthResponse authResponse) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, responseCookie.toString())
                .body(authResponse);
    }
}
