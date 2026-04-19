package io.github.artsobol.fitnessapi.infrastructure.validation.validator;

import io.github.artsobol.fitnessapi.infrastructure.validation.annotation.Slug;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

public class SlugValidator implements ConstraintValidator<Slug, String> {

    public static final Pattern SLUG_PATTERN = Pattern.compile("^[a-z0-9]+(?:-[a-z0-9]+)*$");

    @Override
    public boolean isValid(String slug, ConstraintValidatorContext constraintValidatorContext) {
        if (slug == null) {
            return true;
        }

        return SLUG_PATTERN.matcher(slug).matches();
    }
}
