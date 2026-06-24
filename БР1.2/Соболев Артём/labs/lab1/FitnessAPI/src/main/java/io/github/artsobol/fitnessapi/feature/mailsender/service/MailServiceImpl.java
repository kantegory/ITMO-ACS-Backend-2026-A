package io.github.artsobol.fitnessapi.feature.mailsender.service;

import io.github.artsobol.fitnessapi.feature.mailsender.entity.MailType;
import io.github.artsobol.fitnessapi.feature.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MailServiceImpl implements MailService {

    private final List<MailHandler> handlers;

    @Override
    public void sendEmail(User user, MailType type, Map<String, Object> params) {
        for (MailHandler handler : handlers) {
            if (handler.getType() == type) {
                handler.send(user, params);
                return;
            }
        }
        throw new IllegalArgumentException("Unsupported Mail type: " + type);
    }

}
