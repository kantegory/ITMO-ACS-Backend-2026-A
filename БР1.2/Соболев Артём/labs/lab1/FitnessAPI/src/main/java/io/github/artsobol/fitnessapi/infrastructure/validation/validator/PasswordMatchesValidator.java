package io.github.artsobol.fitnessapi.infrastructure.validation.validator;

import io.github.artsobol.fitnessapi.infrastructure.validation.annotation.PasswordMatches;
import io.github.artsobol.fitnessapi.infrastructure.validation.contract.PasswordConfirmation;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordMatchesValidator implements ConstraintValidator<PasswordMatches, PasswordConfirmation> {
    @Override
    public boolean isValid(
            PasswordConfirmation request,
            ConstraintValidatorContext context
    ) {
        if (request == null) {
            return true;
        }
        if (request.password() == null || request.confirmPassword() == null) {
            return true;
        }

        if (!request.password().equals(request.confirmPassword())) {

            context.disableDefaultConstraintViolation();

            context.buildConstraintViolationWithTemplate("{validation.password.mismatch}")
                    .addPropertyNode("confirmPassword")
                    .addConstraintViolation();

            return false;
        }

        return true;
    }
}
