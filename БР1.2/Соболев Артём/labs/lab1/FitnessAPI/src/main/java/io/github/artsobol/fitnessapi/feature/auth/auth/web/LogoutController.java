package io.github.artsobol.fitnessapi.feature.auth.auth.web;

import io.github.artsobol.fitnessapi.config.openapi.PublicEndpoint;
import io.github.artsobol.fitnessapi.config.properties.security.CookieProperties;
import io.github.artsobol.fitnessapi.feature.auth.auth.dto.request.RefreshTokenRequest;
import io.github.artsobol.fitnessapi.feature.auth.auth.service.RefreshService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.WebUtils;
import org.springframework.util.StringUtils;

@Slf4j
@RestController
@PublicEndpoint
@Tag(name = "Auth")
@RequestMapping("/auth/logout")
@RequiredArgsConstructor
public class LogoutController {

    private final CookieProperties properties;
    private final RefreshService service;

    @PostMapping
    @Operation(summary = "Log out current session")
    @ApiResponses({
            @ApiResponse(responseCode = "204"),
    })
    public ResponseEntity<Void> logout(
            @RequestBody(required = false) RefreshTokenRequest body,
            HttpServletRequest servletRequest
    ) {
        String refreshToken = resolveRefreshToken(body, servletRequest);
        log.debug("Receiving logout request");

        service.logout(refreshToken);
        log.debug("Logout request finished");

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, getDeleteResponseCookie().toString())
                .build();
    }

    private String resolveRefreshToken(RefreshTokenRequest body, HttpServletRequest servletRequest) {
        if (body != null && StringUtils.hasText(body.refreshToken())) {
            return body.refreshToken();
        }

        return getRefreshToken(servletRequest);
    }

    private String getRefreshToken(HttpServletRequest servletRequest) {
        jakarta.servlet.http.Cookie cookie = WebUtils.getCookie(servletRequest, properties.cookieName());
        return cookie != null ? cookie.getValue() : null;
    }

    private @NonNull ResponseCookie getDeleteResponseCookie() {
        return ResponseCookie.from(properties.cookieName(), "")
                .httpOnly(true)
                .secure(properties.secure())
                .sameSite(properties.sameSite())
                .path(properties.path())
                .maxAge(0)
                .build();
    }
}
