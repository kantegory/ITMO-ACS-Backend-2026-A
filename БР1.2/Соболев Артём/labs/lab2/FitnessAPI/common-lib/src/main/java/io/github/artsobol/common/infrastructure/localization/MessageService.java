package io.github.artsobol.common.infrastructure.localization;

import io.github.artsobol.common.utils.MessageKeyUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.validation.FieldError;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageSource messageSource;

    public String createMessage(String key, Object[] args) {
        try {
            Locale locale = LocaleContextHolder.getLocale();
            return messageSource.getMessage(MessageKeyUtils.normalize(key), args, locale);
        } catch (Exception e) {
            return messageSource.getMessage("default.error.message", null, LocaleContextHolder.getLocale());
        }
    }

    public String resolveValidationMessage(FieldError error) {
        String defaultMessage = error.getDefaultMessage();
        if (defaultMessage == null || defaultMessage.isBlank()) {
            return "Validation error";
        }

        try {
            return messageSource.getMessage(
                    MessageKeyUtils.normalize(defaultMessage),
                    error.getArguments(),
                    LocaleContextHolder.getLocale()
            );
        } catch (Exception e) {
            return defaultMessage;
        }
    }
}
