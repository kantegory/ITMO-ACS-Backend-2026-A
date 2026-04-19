package io.github.artsobol.fitnessapi.feature.training.training.web;

import io.github.artsobol.fitnessapi.feature.training.training.dto.response.TrainingResponse;
import io.github.artsobol.fitnessapi.feature.training.training.service.TrainingService;
import io.github.artsobol.fitnessapi.infrastructure.web.error.dto.ErrorResponse;
import io.github.artsobol.fitnessapi.infrastructure.web.error.dto.ValidationErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@Tag(name = "Training Relation")
@RequestMapping("/trainings/{trainingId}")
@RequiredArgsConstructor
public class TrainingRelationController {

    private final TrainingService trainingService;

    @PutMapping("/tags/{slug}")
    @Operation(summary = "Add tag to training")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "400",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public TrainingResponse addTag(@PathVariable @Positive Long trainingId, @PathVariable String slug) {
        return trainingService.addTag(trainingId, slug);
    }

    @DeleteMapping("/tags/{slug}")
    @Operation(summary = "Remove tag from training")
    @ApiResponses({
            @ApiResponse(responseCode = "204"),
            @ApiResponse(responseCode = "400",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<Void> removeTag(@PathVariable @Positive Long trainingId, @PathVariable String slug) {
        trainingService.removeTag(trainingId, slug);

        return ResponseEntity.noContent().build();
    }

    @PutMapping("/types/{slug}")
    @Operation(summary = "Add type to training")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "400",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public TrainingResponse addType(@PathVariable @Positive Long trainingId, @PathVariable String slug) {
        return trainingService.addType(trainingId, slug);
    }

    @DeleteMapping("/types/{slug}")
    @Operation(summary = "Remove type from training")
    @ApiResponses({
            @ApiResponse(responseCode = "204"),
            @ApiResponse(responseCode = "400",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<Void> removeType(@PathVariable @Positive Long trainingId, @PathVariable String slug) {
        trainingService.removeType(trainingId, slug);

        return ResponseEntity.noContent().build();
    }

    @PutMapping("/exercises/{exerciseId}")
    @Operation(summary = "Add exercise to training")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public TrainingResponse addExercise(
            @PathVariable @Positive Long trainingId,
            @PathVariable @Positive Long exerciseId
    ) {
        return trainingService.addExercise(trainingId, exerciseId);
    }

    @DeleteMapping("/exercise-items/{trainingExerciseId}")
    @Operation(summary = "Remove exercise from training")
    @ApiResponses({
            @ApiResponse(responseCode = "204"),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<Void> removeExercise(
            @PathVariable @Positive Long trainingId,
            @PathVariable @Positive Long trainingExerciseId
    ) {
        trainingService.removeExercise(trainingId, trainingExerciseId);

        return ResponseEntity.noContent().build();
    }
}
