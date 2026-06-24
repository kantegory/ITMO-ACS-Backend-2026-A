package io.github.artsobol.fitnessapi.infrastructure.validation.annotation;

import io.github.artsobol.fitnessapi.infrastructure.validation.validator.SlugValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Constraint(validatedBy = SlugValidator.class)
@Target({ElementType.FIELD, ElementType.RECORD_COMPONENT, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface Slug {

    String message() default "{validation.slug.wrong}";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
