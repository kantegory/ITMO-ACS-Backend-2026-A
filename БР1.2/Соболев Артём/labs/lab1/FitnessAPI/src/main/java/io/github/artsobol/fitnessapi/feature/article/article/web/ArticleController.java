package io.github.artsobol.fitnessapi.feature.article.article.web;

import io.github.artsobol.fitnessapi.api.common.dto.SliceResponse;
import io.github.artsobol.fitnessapi.feature.article.article.dto.request.CreateArticleRequest;
import io.github.artsobol.fitnessapi.feature.article.article.dto.request.UpdateArticleRequest;
import io.github.artsobol.fitnessapi.feature.article.article.dto.response.ArticleResponse;
import io.github.artsobol.fitnessapi.feature.article.article.service.ArticleService;
import io.github.artsobol.fitnessapi.infrastructure.web.error.dto.ErrorResponse;
import io.github.artsobol.fitnessapi.infrastructure.web.error.dto.ValidationErrorResponse;
import io.github.artsobol.fitnessapi.security.user.UserPrincipal;
import io.github.artsobol.fitnessapi.utils.UriUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
@Tag(name = "Article")
@RequestMapping("/articles")
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleService articleService;

    @GetMapping("/{articleId}")
    @Operation(summary = "Get article by id")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ArticleResponse getById(
            @Parameter(description = "Article identifier", example = "1") @PathVariable @Positive Long articleId
    ) {
        return articleService.getById(articleId);
    }

    @GetMapping
    @Operation(summary = "Get articles")
    @ApiResponses({
            @ApiResponse(responseCode = "200")
    })

    public SliceResponse<ArticleResponse> getAll(@ParameterObject Pageable pageable) {
        return SliceResponse.from(articleService.getAll(pageable));
    }

    @PostMapping
    @Operation(summary = "Create article")
    @ApiResponses({
            @ApiResponse(responseCode = "201"),
            @ApiResponse(responseCode = "400",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<ArticleResponse> create(
            @RequestBody @Valid CreateArticleRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        ArticleResponse response = articleService.create(request, userPrincipal.userId());

        return ResponseEntity.created(UriUtils.buildLocation(response.id())).body(response);
    }

    @PatchMapping("/{articleId}")
    @Operation(summary = "Update article")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Article updated"),
            @ApiResponse(responseCode = "400", description = "Invalid request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden request"),
            @ApiResponse(responseCode = "404", description = "Article not found"),
    })
    public ArticleResponse update(
            @PathVariable @Positive Long articleId,
            @RequestBody @Valid UpdateArticleRequest request

    ) {
        return articleService.update(request, articleId);
    }

    @DeleteMapping("/{articleId}")
    @Operation(summary = "Delete article")
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
            @Parameter(description = "Article identifier", example = "1") @PathVariable @Positive Long articleId

    ) {
        articleService.delete(articleId);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{articleId}/categories/{categoryId}")
    @Operation(summary = "Add category to article")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Category added to article"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden request"),
            @ApiResponse(responseCode = "404", description = "Article or category not found"),
            @ApiResponse(responseCode = "409", description = "Category already assigned"),
    })
    public ArticleResponse addCategory(
            @Parameter(description = "Article identifier", example = "1") @PathVariable @Positive Long articleId,
            @Parameter(description = "Category identifier", example = "1") @PathVariable @Positive Long categoryId

    ) {
        return articleService.addCategory(articleId, categoryId);
    }

    @DeleteMapping("/{articleId}/categories/{categoryId}")
    @Operation(summary = "Remove category from article")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Category removed from article"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden request"),
            @ApiResponse(responseCode = "404", description = "Article or category not found"),
            @ApiResponse(responseCode = "409", description = "Category not assigned"),
    })
    public ResponseEntity<Void> removeCategory(
            @Parameter(description = "Article identifier", example = "1") @PathVariable @Positive Long articleId,
            @Parameter(description = "Category identifier", example = "1") @PathVariable @Positive Long categoryId

    ) {
        articleService.removeCategory(articleId, categoryId);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{articleId}/videos/{videoId}")
    @Operation(summary = "Add video to article")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Video added to article"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden request"),
            @ApiResponse(responseCode = "404", description = "Article or video not found"),
            @ApiResponse(responseCode = "409", description = "Video already assigned"),
    })
    public ArticleResponse addVideo(
            @Parameter(description = "Article identifier", example = "1") @PathVariable @Positive Long articleId,
            @Parameter(description = "Video identifier", example = "1") @PathVariable @Positive Long videoId

    ) {
        return articleService.addVideo(articleId, videoId);
    }

    @DeleteMapping("/{articleId}/videos/{videoId}")
    @Operation(summary = "Remove video from article")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Video removed from article"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden request"),
            @ApiResponse(responseCode = "404", description = "Article or video not found"),
            @ApiResponse(responseCode = "409", description = "Video not assigned"),
    })
    public ResponseEntity<Void> removeVideo(
            @Parameter(description = "Article identifier", example = "1") @PathVariable @Positive Long articleId,
            @Parameter(description = "Video identifier", example = "1") @PathVariable @Positive Long videoId

    ) {
        articleService.removeVideo(articleId, videoId);

        return ResponseEntity.noContent().build();
    }

}
