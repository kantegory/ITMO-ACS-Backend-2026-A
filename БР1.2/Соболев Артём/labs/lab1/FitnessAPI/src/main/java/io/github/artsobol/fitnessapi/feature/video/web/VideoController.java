package io.github.artsobol.fitnessapi.feature.video.web;

import io.github.artsobol.fitnessapi.feature.video.dto.request.CreateVideoRequest;
import io.github.artsobol.fitnessapi.feature.video.dto.request.UpdateVideoRequest;
import io.github.artsobol.fitnessapi.feature.video.dto.response.VideoResponse;
import io.github.artsobol.fitnessapi.feature.video.service.VideoService;
import io.github.artsobol.fitnessapi.infrastructure.web.error.dto.ErrorResponse;
import io.github.artsobol.fitnessapi.infrastructure.web.error.dto.ValidationErrorResponse;
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

@Validated
@RestController
@Tag(name = "Video")
@RequestMapping("/videos")
@RequiredArgsConstructor
public class VideoController {

    private final VideoService service;

    @GetMapping("/{videoId}")
    @Operation(summary = "Get video by id")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public VideoResponse get(@PathVariable @Positive Long videoId) {
        return service.getById(videoId);
    }


    @PostMapping
    @Operation(summary = "Create video")
    @ApiResponses({
            @ApiResponse(responseCode = "201"),
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
    public ResponseEntity<VideoResponse> create(@RequestBody @Valid CreateVideoRequest request) {
        VideoResponse response = service.create(request);

        return ResponseEntity.created(UriUtils.buildLocation(response.id())).body(response);
    }


    @PatchMapping("/{videoId}")
    @Operation(summary = "Create video")
    @ApiResponses({
            @ApiResponse(responseCode = "201"),
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
    public VideoResponse update(@PathVariable @Positive Long videoId, @RequestBody @Valid UpdateVideoRequest request) {
        return service.update(videoId, request);
    }


    @DeleteMapping("/{videoId}")
    @Operation(summary = "Delete video")
    @ApiResponses({
            @ApiResponse(responseCode = "204"),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<Void> delete(@PathVariable @Positive Long videoId) {
        service.delete(videoId);

        return ResponseEntity.noContent().build();
    }
}
