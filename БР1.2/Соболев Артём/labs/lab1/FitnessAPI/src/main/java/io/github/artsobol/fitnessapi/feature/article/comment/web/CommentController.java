package io.github.artsobol.fitnessapi.feature.article.comment.web;

import io.github.artsobol.fitnessapi.feature.article.comment.dto.request.UpdateCommentRequest;
import io.github.artsobol.fitnessapi.feature.article.comment.dto.response.CommentResponse;
import io.github.artsobol.fitnessapi.feature.article.comment.service.CommentService;
import io.github.artsobol.fitnessapi.infrastructure.web.error.dto.ErrorResponse;
import io.github.artsobol.fitnessapi.infrastructure.web.error.dto.ValidationErrorResponse;
import io.github.artsobol.fitnessapi.security.user.UserPrincipal;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@Tag(name = "Article comment")
@RequestMapping("/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService service;

    @PatchMapping("/{commentId}")
    @Operation(summary = "Update article comment")
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
    public CommentResponse update(
            @PathVariable @Positive Long commentId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody @Valid UpdateCommentRequest request
    ) {
        return service.updateComment(commentId, principal.userId(), request);
    }

    @DeleteMapping("/{commentId}")
    @Operation(summary = "Delete article comment")
    @ApiResponses({
            @ApiResponse(responseCode = "204"),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<Void> delete(
            @PathVariable @Positive Long commentId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        service.deactivateComment(commentId, principal.userId());

        return ResponseEntity.noContent().build();
    }

}
