package io.github.artsobol.fitnessapi.infrastructure.validation.annotation;

import io.github.artsobol.fitnessapi.infrastructure.validation.validator.PasswordMatchesValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Constraint(validatedBy = PasswordMatchesValidator.class)
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface PasswordMatches {

    String message() default "{validation.password.mismatch}";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
