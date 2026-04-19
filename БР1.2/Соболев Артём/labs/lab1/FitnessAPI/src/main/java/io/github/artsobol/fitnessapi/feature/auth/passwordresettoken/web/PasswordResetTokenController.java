package io.github.artsobol.fitnessapi.feature.auth.passwordresettoken.web;

import io.github.artsobol.fitnessapi.config.openapi.PublicEndpoint;
import io.github.artsobol.fitnessapi.feature.auth.passwordresettoken.dto.request.ForgotPasswordRequest;
import io.github.artsobol.fitnessapi.feature.auth.passwordresettoken.dto.request.ResetPasswordRequest;
import io.github.artsobol.fitnessapi.feature.auth.passwordresettoken.service.PasswordResetTokenService;
import io.github.artsobol.fitnessapi.feature.mailsender.entity.MailType;
import io.github.artsobol.fitnessapi.feature.mailsender.service.MailService;
import io.github.artsobol.fitnessapi.feature.user.entity.User;
import io.github.artsobol.fitnessapi.feature.user.service.UserFinder;
import io.github.artsobol.fitnessapi.infrastructure.web.error.dto.ErrorResponse;
import io.github.artsobol.fitnessapi.infrastructure.web.error.dto.ValidationErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@PublicEndpoint
@Tag(name = "Auth")
@RequestMapping("/auth/password-reset")
@RequiredArgsConstructor
public class PasswordResetTokenController {

    private final PasswordResetTokenService passwordResetTokenService;
    private final UserFinder userFinder;
    private final MailService mailService;

    @PostMapping("/request")
    @Operation(summary = "Request to reset password")
    @ApiResponses({
            @ApiResponse(responseCode = "202"),
            @ApiResponse(responseCode = "400",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Void> requestReset(@Valid @RequestBody ForgotPasswordRequest request) {
        User user = userFinder.findByEmailOrThrow(request.email());

        String rawToken = passwordResetTokenService.createResetToken(user);
        String resetUrl = "http://localhost:3000/api/v1/reset-password?token=" + rawToken;

        mailService.sendEmail(user, MailType.PASSWORD_RESET, Map.of("resetUrl", resetUrl));

        return ResponseEntity.accepted().build();
    }

    @PostMapping
    @Operation(summary = "Reset password")
    @ApiResponses({
            @ApiResponse(responseCode = "204"),
            @ApiResponse(responseCode = "400",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class)))
    })
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetTokenService.resetPassword(request.token(), request.password());
        return ResponseEntity.noContent().build();
    }
}
