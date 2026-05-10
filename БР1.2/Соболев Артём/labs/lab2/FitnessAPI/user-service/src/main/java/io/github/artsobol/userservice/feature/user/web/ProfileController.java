package io.github.artsobol.userservice.feature.user.web;

import io.github.artsobol.common.config.openapi.ProtectedEndpoint;
import io.github.artsobol.common.infrastructure.web.error.dto.ErrorResponse;
import io.github.artsobol.common.infrastructure.web.error.dto.ValidationErrorResponse;
import io.github.artsobol.common.security.user.UserPrincipal;
import io.github.artsobol.common.utils.UriUtils;
import io.github.artsobol.userservice.feature.user.dto.request.CreateProfileRequest;
import io.github.artsobol.userservice.feature.user.dto.request.UpdateProfileRequest;
import io.github.artsobol.userservice.feature.user.dto.response.ProfileResponse;
import io.github.artsobol.userservice.feature.user.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/profiles")
@Tag(name = "Profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService service;

    @GetMapping("/me")
    @ProtectedEndpoint
    @Operation(summary = "Get own profile")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ProfileResponse getMyProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return service.getProfileByUserId(userPrincipal.userId());
    }

    @GetMapping("/{username}")
    @Operation(summary = "Get profile by username")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "404",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ProfileResponse getProfileByUsername(@PathVariable String username) {
        return service.getProfileByUsername(username);
    }

    @PostMapping
    @Operation(summary = "Create own profile")
    @ApiResponses({
            @ApiResponse(responseCode = "201"),
            @ApiResponse(responseCode = "400",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ResponseEntity<ProfileResponse> createProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody @Valid CreateProfileRequest request
    ) {
        ProfileResponse response = service.createProfile(userPrincipal.userId(), request);

        return ResponseEntity.created(UriUtils.buildLocation(response.user().username())).body(response);
    }

    @PatchMapping
    @Operation(summary = "Update profile")
    @ApiResponses({
            @ApiResponse(responseCode = "200"),
            @ApiResponse(responseCode = "400",
                    content = @Content(schema = @Schema(implementation = ValidationErrorResponse.class))),
            @ApiResponse(responseCode = "401",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    })
    public ProfileResponse updateProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody @Valid UpdateProfileRequest request
    ) {
        return service.updateProfile(userPrincipal.userId(), request);
    }
}
