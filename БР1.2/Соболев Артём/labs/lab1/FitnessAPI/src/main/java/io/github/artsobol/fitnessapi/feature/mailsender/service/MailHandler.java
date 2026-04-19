package io.github.artsobol.fitnessapi.feature.mailsender.service;

import io.github.artsobol.fitnessapi.feature.mailsender.entity.MailType;
import io.github.artsobol.fitnessapi.feature.user.entity.User;

import java.util.Map;

public interface MailHandler {
    MailType getType();
    void send(User user, Map<String, Object> params);
}
