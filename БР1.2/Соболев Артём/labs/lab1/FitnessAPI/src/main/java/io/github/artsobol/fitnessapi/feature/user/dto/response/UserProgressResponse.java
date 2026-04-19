package io.github.artsobol.fitnessapi.feature.user.dto.response;

public record UserProgressResponse(
        long totalSessions,
        long activeSessions,
        long completedSessions,
        long abandonedSessions,
        long totalExercises,
        long notStartedExercises,
        long inProgressExercises,
        long completedExercises,
        long skippedExercises
) {
}
