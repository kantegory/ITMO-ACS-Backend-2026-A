package io.github.artsobol.userservice.infrastructure.validation.contract;

public interface PasswordConfirmation {
    String password();

    String confirmPassword();
}
