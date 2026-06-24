package io.github.artsobol.fitnessapi.feature.training.type.web;

import io.github.artsobol.fitnessapi.api.common.dto.SliceResponse;
import io.github.artsobol.fitnessapi.feature.training.type.dto.request.CreateTypeRequest;
import io.github.artsobol.fitnessapi.feature.training.type.dto.request.UpdateTypeRequest;
import io.github.artsobol.fitnessapi.feature.training.type.dto.response.TypeResponse;
import io.github.artsobol.fitnessapi.feature.training.type.service.TypeService;
import io.github.artsobol.fitnessapi.infrastructure.validation.annotation.Slug;
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
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static io.github.artsobol.fitnessapi.utils.UriUtils.buildLocation;

@Validated
@RestController
@Tag(name = "Type")
@RequestMapping("/types")
@RequiredArgsConstructor
public class TypeController {

    private final TypeService typeService;

    @GetMapping
    @Operation(summary = "Get types")
    @ApiResponses({
            @ApiResponse(responseCode = "200")
    })
    public SliceResponse<TypeResponse> getTypes(@ParameterObject Pageable pageable) {
        return SliceResponse.from(typeService.getTypes(pageable));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get type by slug")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "400",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class)))
    })
    public TypeResponse getBySlug(@PathVariable @Slug String slug) {
        return typeService.getBySlug(slug);
    }

    @PostMapping
    @Operation(summary = "Create tag")
    @ApiResponses({
            @ApiResponse(responseCode = "201"),
            @ApiResponse(responseCode = "400",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<TypeResponse> create(@RequestBody @Valid CreateTypeRequest request) {
        TypeResponse response = typeService.create(request);

        return ResponseEntity.created(buildLocation(response.slug())).body(response);
    }

    @PatchMapping("/{slug}")
    @Operation(summary = "Update tag")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "400",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public TypeResponse update(@PathVariable @Slug String slug, @RequestBody @Valid UpdateTypeRequest request) {
        return typeService.update(slug, request);
    }

    @DeleteMapping("/{slug}")
    @Operation(summary = "Delete tag")
    @ApiResponses({
            @ApiResponse(responseCode = "204"),
            @ApiResponse(responseCode = "400",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<Void> delete(@PathVariable @Slug String slug) {
        typeService.delete(slug);

        return ResponseEntity.noContent().build();
    }
}
