package io.github.artsobol.fitnessapi.infrastructure.validation.annotation;

import io.github.artsobol.fitnessapi.infrastructure.validation.validator.NullOrNotBlankValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Constraint(validatedBy = NullOrNotBlankValidator.class)
@Target({ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface NullOrNotBlank {

    String message() default "{validation.null.or.notblank}";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}