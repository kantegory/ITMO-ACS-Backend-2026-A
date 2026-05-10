package io.github.artsobol.progressservice.feature.progress.dto.response;

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
