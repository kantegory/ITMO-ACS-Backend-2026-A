package io.github.artsobol.progressservice.feature.training.session.web;

import io.github.artsobol.common.api.dto.SliceResponse;
import io.github.artsobol.common.config.openapi.ProtectedEndpoint;
import io.github.artsobol.progressservice.feature.training.session.dto.response.TrainingSessionResponse;
import io.github.artsobol.progressservice.feature.training.session.service.TrainingSessionService;
import io.github.artsobol.common.infrastructure.web.error.dto.ErrorResponse;
import io.github.artsobol.common.security.user.UserPrincipal;
import io.github.artsobol.common.utils.UriUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@ProtectedEndpoint
@RequestMapping
@Tag(name = "Training Session")
@RequiredArgsConstructor
public class TrainingSessionController {

    private final TrainingSessionService trainingSessionService;

    @GetMapping("/training-sessions")
    @Operation(summary = "Get all sessions current user")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public SliceResponse<TrainingSessionResponse> getAllByCurrentUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @ParameterObject Pageable pageable
    ) {
        return SliceResponse.from(trainingSessionService.getAllByUser(principal.userId(), pageable));
    }

    @GetMapping("/training-sessions/{sessionId}")
    @Operation(summary = "Get concrete session current user")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public TrainingSessionResponse getById(
            @PathVariable @Positive Long sessionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return trainingSessionService.getById(sessionId, principal.userId());
    }

    @PostMapping("/trainings/{trainingId}/sessions")
    @Operation(summary = "Create training session")
    @ApiResponses({
            @ApiResponse(responseCode = "201"),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<TrainingSessionResponse> create(
            @PathVariable @Positive Long trainingId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        TrainingSessionResponse response = trainingSessionService.create(trainingId, principal.userId());

        return ResponseEntity.created(UriUtils.buildLocation(response.id())).body(response);
    }

    @PatchMapping("/training-sessions/{sessionId}/complete")
    @Operation(summary = "Complete training session")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public TrainingSessionResponse complete(
            @PathVariable @Positive Long sessionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return trainingSessionService.complete(sessionId, principal.userId());
    }

    @PatchMapping("/training-sessions/{sessionId}/abandon")
    @Operation(summary = "Abandon training session")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public TrainingSessionResponse abandon(
            @PathVariable @Positive Long sessionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return trainingSessionService.abandon(sessionId, principal.userId());
    }
}
