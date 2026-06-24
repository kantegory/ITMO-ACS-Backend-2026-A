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
public class RegistrationMailHandler implements MailHandler {

    private final Configuration configuration;
    private final JavaMailSender mailSender;

    @Override
    @SneakyThrows
    public void send(User user, Map<String, Object> params) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
        helper.setSubject("Thank you for registration, " + user.getUsername());
        helper.setTo(user.getEmail());
        String emailContent = getRegistrationEmailContent(user, params);
        helper.setText(emailContent, true);

        mailSender.send(mimeMessage);
    }

    @SneakyThrows
    private String getRegistrationEmailContent(User user, Map<String, Object> params) {
        StringWriter writer = new StringWriter();
        Map<String, Object> model = new HashMap<>();
        model.put("name", user.getUsername());
        configuration.getTemplate("register.ftlh")
                .process(model, writer);
        return writer.getBuffer().toString();
    }

    @Override
    public MailType getType() {
        return MailType.REGISTRATION;
    }

}
