package io.github.artsobol.userservice.feature.auth.refreshtoken.entity;

public enum RevokedReason {
    LOGOUT,
    ROTATED,
    COMPROMISED,
    ADMIN_REVOKE
}
