package io.github.artsobol.fitnessapi.feature.training.favourite.web;

import io.github.artsobol.fitnessapi.api.common.dto.SliceResponse;
import io.github.artsobol.fitnessapi.config.openapi.ProtectedEndpoint;
import io.github.artsobol.fitnessapi.feature.training.favourite.dto.response.TrainingFavouriteResponse;
import io.github.artsobol.fitnessapi.feature.training.favourite.service.TrainingFavouriteService;
import io.github.artsobol.fitnessapi.infrastructure.web.error.dto.ErrorResponse;
import io.github.artsobol.fitnessapi.security.user.UserPrincipal;
import io.github.artsobol.fitnessapi.utils.UriUtils;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@ProtectedEndpoint
@Tag(name = "Favourite Training")
@RequestMapping("/training/")
@RequiredArgsConstructor
public class TrainingFavouriteController {

    private final TrainingFavouriteService trainingFavouriteService;

    @PostMapping("/{trainingId}")
    @Operation(summary = "Add training to favourite")
    @ApiResponses({
            @ApiResponse(responseCode = "201"),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<TrainingFavouriteResponse> create(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable @Positive Long trainingId
    ) {
        TrainingFavouriteResponse response = trainingFavouriteService.create(userPrincipal.userId(), trainingId);

        return ResponseEntity.created(UriUtils.buildLocation(trainingId)).body(response);
    }

    @GetMapping
    @Operation(summary = "Get own favourite trainings")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public SliceResponse<TrainingFavouriteResponse> getAll(
            @ParameterObject Pageable pageable,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        return SliceResponse.from(trainingFavouriteService.getAll(userPrincipal.userId(), pageable));
    }


    @DeleteMapping("/{trainingId}")
    @Operation(summary = "Delete favourite training")
    @ApiResponses({
            @ApiResponse(responseCode = "204"),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable @Positive Long trainingId
    ) {
        trainingFavouriteService.delete(userPrincipal.userId(), trainingId);

        return ResponseEntity.noContent().build();
    }

}
