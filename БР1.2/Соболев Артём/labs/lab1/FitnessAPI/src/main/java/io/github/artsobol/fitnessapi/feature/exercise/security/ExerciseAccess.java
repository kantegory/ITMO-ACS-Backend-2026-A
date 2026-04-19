package io.github.artsobol.fitnessapi.feature.exercise.security;

import io.github.artsobol.fitnessapi.feature.exercise.repository.ExerciseRepository;
import io.github.artsobol.fitnessapi.security.user.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("exerciseAccess")
@RequiredArgsConstructor
public class ExerciseAccess {

    private final ExerciseRepository exerciseRepository;

    public boolean canEdit(Long exerciseId, Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserPrincipal userPrincipal)) {
            return false;
        }
        return exerciseRepository.existsByIdAndAuthorId(exerciseId, userPrincipal.userId());
    }
}
