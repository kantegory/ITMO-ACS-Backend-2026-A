package io.github.artsobol.fitnessapi.feature.mailsender.service;

import io.github.artsobol.fitnessapi.feature.mailsender.entity.MailType;
import io.github.artsobol.fitnessapi.feature.user.entity.User;

import java.util.Map;
import java.util.Properties;

public interface MailService {

    void sendEmail(User user, MailType type, Map<String, Object> params);
}
