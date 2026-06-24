package io.github.artsobol.fitnessapi.feature.training.sessionexercise.web;

import io.github.artsobol.fitnessapi.api.common.dto.SliceResponse;
import io.github.artsobol.fitnessapi.config.openapi.ProtectedEndpoint;
import io.github.artsobol.fitnessapi.feature.training.sessionexercise.dto.response.TrainingSessionExerciseResponse;
import io.github.artsobol.fitnessapi.feature.training.sessionexercise.service.TrainingSessionExerciseService;
import io.github.artsobol.fitnessapi.security.user.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@ProtectedEndpoint
@RequestMapping
@Tag(name = "Training Session Exercise")
@RequiredArgsConstructor
public class TrainingSessionExerciseController {

    private final TrainingSessionExerciseService trainingSessionExerciseService;

    @GetMapping("/training-sessions/{sessionId}/exercises")
    @Operation(summary = "Get exercises session by training")
    public SliceResponse<TrainingSessionExerciseResponse> getAllByTrainingSession(
            @PathVariable @Positive Long sessionId,
            @AuthenticationPrincipal UserPrincipal principal,
            @ParameterObject Pageable pageable
    ) {
        return SliceResponse.from(trainingSessionExerciseService.getAllByTrainingSession(
                sessionId,
                principal.userId(),
                pageable
        ));
    }

    @GetMapping("/training-session-exercises/{sessionExerciseId}")
    public TrainingSessionExerciseResponse getById(
            @PathVariable @Positive Long sessionExerciseId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return trainingSessionExerciseService.getById(sessionExerciseId, principal.userId());
    }

    @PostMapping("/training-session-exercises/{sessionExerciseId}/start")
    public TrainingSessionExerciseResponse start(
            @PathVariable @Positive Long sessionExerciseId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return trainingSessionExerciseService.start(sessionExerciseId, principal.userId());
    }

    @PostMapping("/training-session-exercises/{sessionExerciseId}/complete")
    public TrainingSessionExerciseResponse complete(
            @PathVariable @Positive Long sessionExerciseId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return trainingSessionExerciseService.complete(sessionExerciseId, principal.userId());
    }

    @PostMapping("/training-session-exercises/{sessionExerciseId}/skip")
    public TrainingSessionExerciseResponse skip(
            @PathVariable @Positive Long sessionExerciseId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return trainingSessionExerciseService.skip(sessionExerciseId, principal.userId());
    }
}
