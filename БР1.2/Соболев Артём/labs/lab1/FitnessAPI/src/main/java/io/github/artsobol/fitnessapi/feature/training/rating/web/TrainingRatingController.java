package io.github.artsobol.fitnessapi.feature.training.rating.web;

import io.github.artsobol.fitnessapi.api.common.dto.SliceResponse;
import io.github.artsobol.fitnessapi.feature.training.rating.dto.request.CreateTrainingRatingRequest;
import io.github.artsobol.fitnessapi.feature.training.rating.dto.response.TrainingRatingResponse;
import io.github.artsobol.fitnessapi.feature.training.rating.service.TrainingRatingService;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@Tag(name = "Training Rating")
@RequestMapping("/training/{trainingId}/ratings")
@RequiredArgsConstructor
public class TrainingRatingController {

    private final TrainingRatingService trainingRatingService;

    @PostMapping
    @Operation(summary = "Create rating")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201"),
            @ApiResponse(responseCode = "400",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<TrainingRatingResponse> create(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable @Positive Long trainingId,
            @RequestBody @Valid CreateTrainingRatingRequest request
    ) {
        TrainingRatingResponse response = trainingRatingService.create(trainingId, userPrincipal.userId(), request);

        return ResponseEntity.created(UriUtils.buildLocation(trainingId)).body(response);
    }

    @GetMapping
    @Operation(summary = "Get ratings")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public SliceResponse<TrainingRatingResponse> getAll(
            @PathVariable @Positive Long trainingId,
            @ParameterObject Pageable pageable
    ) {
        return SliceResponse.from(trainingRatingService.getAll(trainingId, pageable));
    }

    @DeleteMapping
    @Operation(summary = "Delete rating")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable @Positive Long trainingId
    ) {
        trainingRatingService.delete(trainingId, userPrincipal.userId());

        return ResponseEntity.noContent().build();
    }

}
