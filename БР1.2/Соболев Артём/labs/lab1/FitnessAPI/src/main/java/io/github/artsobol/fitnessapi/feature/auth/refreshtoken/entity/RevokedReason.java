package io.github.artsobol.fitnessapi.feature.auth.refreshtoken.entity;

public enum RevokedReason {
    LOGOUT,
    ROTATED,
    COMPROMISED,
    ADMIN_REVOKE
}
