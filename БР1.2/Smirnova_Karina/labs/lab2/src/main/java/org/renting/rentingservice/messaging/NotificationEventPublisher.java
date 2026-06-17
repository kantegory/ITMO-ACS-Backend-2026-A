package org.renting.rentingservice.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationEventPublisher {

    private static final String TOPIC = "notification-events";

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    public void publish(NotificationEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(TOPIC, event.getEventType(), payload).get();
            log.info("Published notification eventType={} to={}", event.getEventType(), event.getEmail());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize notification event", e);
        } catch (Exception e) {
            log.error("Failed to publish notification event", e);
        }

        sendDirectMailFallback(event);
    }

    private void sendDirectMailFallback(NotificationEvent event) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || event.getEmail() == null || event.getEmail().isBlank()) {
            return;
        }

        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(event.getEmail());
            mail.setSubject(event.getSubject());
            mail.setText(event.getContent());
            mailSender.send(mail);
            log.info("Direct notification email sent to={}", event.getEmail());
        } catch (Exception e) {
            log.error("Failed to send direct notification email", e);
        }
    }
}
