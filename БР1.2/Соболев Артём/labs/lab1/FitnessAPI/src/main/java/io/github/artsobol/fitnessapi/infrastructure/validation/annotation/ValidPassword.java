package io.github.artsobol.fitnessapi.infrastructure.validation.annotation;

import io.github.artsobol.fitnessapi.infrastructure.validation.validator.PasswordValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Constraint(validatedBy = PasswordValidator.class)
@Target({ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPassword {

    String message() default "{validation.password.security}";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

}
