package io.github.artsobol.fitnessapi.feature.exercise.web;

import io.github.artsobol.fitnessapi.api.common.dto.SliceResponse;
import io.github.artsobol.fitnessapi.feature.exercise.dto.request.CreateExerciseRequest;
import io.github.artsobol.fitnessapi.feature.exercise.dto.request.UpdateExerciseRequest;
import io.github.artsobol.fitnessapi.feature.exercise.dto.response.ExerciseResponse;
import io.github.artsobol.fitnessapi.feature.exercise.service.ExerciseService;
import io.github.artsobol.fitnessapi.infrastructure.web.error.dto.ErrorResponse;
import io.github.artsobol.fitnessapi.infrastructure.web.error.dto.ValidationErrorResponse;
import io.github.artsobol.fitnessapi.security.user.UserPrincipal;
import io.github.artsobol.fitnessapi.utils.UriUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@Tag(name = "Exercise")
@RequestMapping("/exercises")
@RequiredArgsConstructor
public class ExerciseController {

    private final ExerciseService exerciseService;

    @GetMapping
    @Operation(summary = "Get exercises")
    @ApiResponses({
            @ApiResponse(responseCode = "200")
    })
    public SliceResponse<ExerciseResponse> getAll(@ParameterObject Pageable pageable) {
        return SliceResponse.from(exerciseService.getAll(pageable));
    }

    @GetMapping("/{exerciseId}")
    @Operation(summary = "Get exercise by id")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ExerciseResponse getById(@PathVariable @Positive Long exerciseId) {
        return exerciseService.getById(exerciseId);
    }

    @PostMapping
    @Operation(summary = "Create exercise")
    @ApiResponses({
            @ApiResponse(responseCode = "201"),
            @ApiResponse(responseCode = "400",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<ExerciseResponse> create(
            @RequestBody @Valid CreateExerciseRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        ExerciseResponse response = exerciseService.create(request, userPrincipal.userId());

        return ResponseEntity.created(UriUtils.buildLocation(response.id())).body(response);
    }

    @PatchMapping("/{exerciseId}")
    @Operation(summary = "Update exercise")
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
    })
    public ExerciseResponse update(
            @PathVariable @Positive Long exerciseId,
            @RequestBody @Valid UpdateExerciseRequest request
    ) {
        return exerciseService.update(exerciseId, request);

    }

    @PutMapping("/{exerciseId}/videos/{videoId}")
    @Operation(summary = "Add video to exercise")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ExerciseResponse addVideo(@PathVariable @Positive Long exerciseId, @PathVariable @Positive  Long videoId) {
        return exerciseService.addVideo(exerciseId, videoId);
    }

    @Operation(summary = "Add video from exercise")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    @DeleteMapping("/{exerciseId}/videos/{videoId}")
    public ResponseEntity<Void> removeVideo(@PathVariable @Positive Long exerciseId, @PathVariable @Positive  Long videoId) {
        exerciseService.removeVideo(exerciseId, videoId);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{exerciseId}")
    @Operation(summary = "Delete exercise")
    @ApiResponses({
            @ApiResponse(responseCode = "204"),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<Void> delete(@PathVariable @Positive Long exerciseId) {
        exerciseService.deactivate(exerciseId);

        return ResponseEntity.noContent().build();
    }
}
