package io.github.artsobol.fitnessapi.infrastructure.validation.contract;

public interface PasswordConfirmation {
    String password();

    String confirmPassword();
}
