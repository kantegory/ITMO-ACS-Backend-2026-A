package io.github.artsobol.fitnessapi.security.jwt;

import io.github.artsobol.fitnessapi.infrastructure.localization.MessageService;
import io.github.artsobol.fitnessapi.infrastructure.web.error.dto.ErrorResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
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

    private final MessageService messageService;
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

        String message = messageService.createMessage("auth.unauthorized", null);
        log.warn(
                "Unauthorized request: method={}, URI={}, IP={}",
                request.getMethod(),
                request.getRequestURI(),
                request.getRemoteAddr()
        );
        HttpStatus status = HttpStatus.UNAUTHORIZED;

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
}
