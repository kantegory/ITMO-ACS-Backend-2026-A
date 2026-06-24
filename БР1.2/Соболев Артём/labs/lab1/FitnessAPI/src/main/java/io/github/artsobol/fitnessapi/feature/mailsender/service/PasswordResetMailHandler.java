package io.github.artsobol.fitnessapi.feature.mailsender.service;

import freemarker.template.Configuration;
import io.github.artsobol.fitnessapi.feature.mailsender.entity.MailType;
import io.github.artsobol.fitnessapi.feature.user.entity.User;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PasswordResetMailHandler implements MailHandler {

    private final Configuration configuration;
    private final JavaMailSender mailSender;

    @Override
    @SneakyThrows
    public void send(User user, Map<String, Object> params) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");

        helper.setTo(user.getEmail());
        helper.setSubject("Password reset");

        String content = getPasswordResetEmailContent(user, params);
        helper.setText(content, true);

        mailSender.send(mimeMessage);
    }

    @SneakyThrows
    private String getPasswordResetEmailContent(User user, Map<String, Object> params) {
        StringWriter writer = new StringWriter();

        Map<String, Object> model = new HashMap<>();
        model.put("name", user.getUsername());
        model.putAll(params);

        configuration.getTemplate("password-reset.ftlh")
                .process(model, writer);

        return writer.toString();
    }

    @Override
    public MailType getType() {
        return MailType.PASSWORD_RESET;
    }

}
