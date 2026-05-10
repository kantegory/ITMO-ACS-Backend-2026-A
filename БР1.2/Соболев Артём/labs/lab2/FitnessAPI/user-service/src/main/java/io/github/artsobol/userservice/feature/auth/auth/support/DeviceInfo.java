package io.github.artsobol.userservice.feature.auth.auth.support;

public record DeviceInfo(
        String browser,
        String browserVersion,
        String device
) {
}
