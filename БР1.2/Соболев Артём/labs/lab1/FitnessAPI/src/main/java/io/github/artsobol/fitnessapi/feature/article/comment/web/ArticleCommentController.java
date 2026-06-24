package io.github.artsobol.fitnessapi.feature.article.comment.web;

import io.github.artsobol.fitnessapi.api.common.dto.SliceResponse;
import io.github.artsobol.fitnessapi.feature.article.comment.dto.request.CreateCommentRequest;
import io.github.artsobol.fitnessapi.feature.article.comment.dto.response.CommentResponse;
import io.github.artsobol.fitnessapi.feature.article.comment.service.CommentService;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@Tag(name = "Article comment")
@RequestMapping("/articles/{articleId}/comments")
@RequiredArgsConstructor
public class ArticleCommentController {

    private final CommentService service;

    @GetMapping
    @Operation(summary = "Get article comments")
    @ApiResponses({
            @ApiResponse(responseCode = "200"), @ApiResponse(responseCode = "404",
            content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public SliceResponse<CommentResponse> getArticleComments(
            @PathVariable @Positive Long articleId, @ParameterObject Pageable pageable
    ) {
        return SliceResponse.from(service.getArticleComments(articleId, pageable));
    }

    @PostMapping
    @Operation(summary = "Create article comment")
    @ApiResponses({
            @ApiResponse(responseCode = "201"),
            @ApiResponse(responseCode = "400",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<CommentResponse> create(
            @PathVariable Long articleId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody @Valid CreateCommentRequest request
    ) {
        CommentResponse response = service.createComment(principal.userId(), articleId, request);

        return ResponseEntity.created(UriUtils.buildLocation(response.id())).body(response);
    }
}
