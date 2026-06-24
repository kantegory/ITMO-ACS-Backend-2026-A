package io.github.artsobol.fitnessapi.feature.training.training.security;

import io.github.artsobol.fitnessapi.feature.training.training.repository.TrainingRepository;
import io.github.artsobol.fitnessapi.security.user.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("trainingAccess")
@RequiredArgsConstructor
public class TrainingAccess {

    private final TrainingRepository trainingRepository;

    public boolean canEdit(Long trainingId, Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserPrincipal userPrincipal)) {
            return false;
        }
        return trainingRepository.existsByIdAndAuthorId(trainingId, userPrincipal.userId());
    }
}
