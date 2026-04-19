package io.github.artsobol.fitnessapi.feature.auth.emailverifiedtoken.web;

import io.github.artsobol.fitnessapi.feature.auth.emailverifiedtoken.service.EmailVerificationService;
import io.github.artsobol.fitnessapi.feature.mailsender.entity.MailType;
import io.github.artsobol.fitnessapi.feature.mailsender.service.MailService;
import io.github.artsobol.fitnessapi.feature.user.entity.User;
import io.github.artsobol.fitnessapi.feature.user.service.UserFinder;
import io.github.artsobol.fitnessapi.infrastructure.web.error.dto.ErrorResponse;
import io.github.artsobol.fitnessapi.security.user.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@Tag(name = "Auth")
@RequestMapping("/auth/email-verification")
@RequiredArgsConstructor
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;
    private final MailService mailService;
    private final UserFinder userFinder;

    @PostMapping("/request")
    @Operation(summary = "Request email verification")
    @ApiResponses({
            @ApiResponse(responseCode = "202"),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Void> requestVerification(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        User user = userFinder.findByIdOrThrow(userPrincipal.userId());

        String rawToken = emailVerificationService.createVerificationToken(user);
        String verificationUrl = buildVerificationUrl(rawToken);

        mailService.sendEmail(
                user,
                MailType.EMAIL_VERIFICATION,
                Map.of("appName", "FitnessAPI", "verificationUrl", verificationUrl)
        );

        return ResponseEntity.accepted().build();
    }

    private String buildVerificationUrl(String token) {
        return "http://localhost:3000/verify-email?token=" + token;
    }
}
