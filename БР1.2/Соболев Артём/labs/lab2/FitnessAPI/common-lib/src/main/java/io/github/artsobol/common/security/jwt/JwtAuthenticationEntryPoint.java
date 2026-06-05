package io.github.artsobol.common.security.jwt;

import io.github.artsobol.common.infrastructure.web.error.dto.ErrorResponse;
import io.github.artsobol.common.utils.MessageKeyUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final MessageSource messageSource;
    private final ObjectMapper objectMapper;

    @Override
    public void commence(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull AuthenticationException authException
    ) throws IOException, ServletException {
        if (response.isCommitted()) {
            return;
        }

        HttpStatus status = HttpStatus.UNAUTHORIZED;
        String message = resolveMessage("auth.unauthorized");

        log.warn(
                "Unauthorized request: method={}, URI={}, IP={}",
                request.getMethod(),
                request.getRequestURI(),
                request.getRemoteAddr()
        );

        ErrorResponse errorResponse = new ErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                "UNAUTHORIZED",
                message,
                request.getRequestURI()
        );

        response.setStatus(status.value());
        response.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getWriter(), errorResponse);
    }

    private String resolveMessage(String key) {
        String normalizedKey = MessageKeyUtils.normalize(key);
        return messageSource.getMessage(normalizedKey, null, normalizedKey, LocaleContextHolder.getLocale());
    }
}
