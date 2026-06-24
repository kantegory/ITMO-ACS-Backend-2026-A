package io.github.artsobol.fitnessapi.utils;

import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.Arrays;
import java.util.Objects;

public final class UriUtils {

    private UriUtils() {
        throw new AssertionError("Utility class");
    }

    public static URI buildLocation(Object... pathSegments) {
        if (pathSegments == null || pathSegments.length == 0) {
            throw new IllegalArgumentException("At least one path segment is required");
        }

        String[] normalizedSegments = Arrays.stream(pathSegments)
                .map(UriUtils::toPathSegment)
                .toArray(String[]::new);

        return ServletUriComponentsBuilder.fromCurrentRequestUri()
                .pathSegment(normalizedSegments)
                .build()
                .toUri();
    }

    public static URI buildLocation(String pathTemplate, Object... uriVariables) {
        Objects.requireNonNull(pathTemplate, "Path template must not be null");

        return ServletUriComponentsBuilder.fromCurrentRequestUri()
                .path(pathTemplate)
                .buildAndExpand(uriVariables)
                .toUri();
    }

    private static String toPathSegment(Object pathSegment) {
        return Objects.requireNonNull(pathSegment, "Path segment must not be null").toString();
    }
}
