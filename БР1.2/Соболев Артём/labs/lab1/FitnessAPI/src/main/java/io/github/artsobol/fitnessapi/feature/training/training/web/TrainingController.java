package io.github.artsobol.fitnessapi.feature.training.training.web;

import io.github.artsobol.fitnessapi.api.common.dto.SliceResponse;
import io.github.artsobol.fitnessapi.feature.training.training.dto.request.CreateTrainingRequest;
import io.github.artsobol.fitnessapi.feature.training.training.dto.request.UpdateTrainingRequest;
import io.github.artsobol.fitnessapi.feature.training.training.dto.response.TrainingResponse;
import io.github.artsobol.fitnessapi.feature.training.training.service.TrainingService;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@Tag(name = "Training")
@RequestMapping("/trainings")
@RequiredArgsConstructor
public class TrainingController {

    private final TrainingService trainingService;

    @GetMapping
    @Operation(summary = "Get trainings")
    @ApiResponses({
            @ApiResponse(responseCode = "200")
    })
    public SliceResponse<TrainingResponse> getAll(@ParameterObject Pageable pageable) {
        return SliceResponse.from(trainingService.getAll(pageable));
    }

    @GetMapping("/{trainingId}")
    @Operation(summary = "Get training by id")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public TrainingResponse getById(@PathVariable @Positive Long trainingId) {
        return trainingService.getById(trainingId);
    }

    @PostMapping
    @Operation(summary = "Create training")
    @ApiResponses({
            @ApiResponse(responseCode = "201"),
            @ApiResponse(responseCode = "400",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<TrainingResponse> create(
            @RequestBody @Valid CreateTrainingRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        TrainingResponse response = trainingService.create(request, userPrincipal.userId());

        return ResponseEntity.created(UriUtils.buildLocation(response.id())).body(response);
    }

    @PatchMapping("/{trainingId}")
    @Operation(summary = "Update training")
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
    public TrainingResponse update(
            @PathVariable @Positive Long trainingId,
            @RequestBody @Valid UpdateTrainingRequest request
    ) {
        return trainingService.update(request, trainingId);

    }

    @DeleteMapping("/{trainingId}")
    @Operation(summary = "Delete training")
    @ApiResponses({
            @ApiResponse(responseCode = "204"),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<Void> delete(@PathVariable @Positive Long trainingId) {
        trainingService.deactivate(trainingId);

        return ResponseEntity.noContent().build();
    }
}
