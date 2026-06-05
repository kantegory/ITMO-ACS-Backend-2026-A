package io.github.artsobol.progressservice.feature.progress.web;

import io.github.artsobol.common.config.openapi.ProtectedEndpoint;
import io.github.artsobol.common.security.user.UserPrincipal;
import io.github.artsobol.progressservice.feature.progress.dto.response.UserProgressResponse;
import io.github.artsobol.progressservice.feature.progress.service.ProgressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@ProtectedEndpoint
@Tag(name = "Progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @GetMapping({"/progress/me", "/profiles/me/progress"})
    @Operation(summary = "Get own progress")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "401")
    })
    public UserProgressResponse getMyProgress(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return progressService.getProgress(userPrincipal.userId());
    }
}
