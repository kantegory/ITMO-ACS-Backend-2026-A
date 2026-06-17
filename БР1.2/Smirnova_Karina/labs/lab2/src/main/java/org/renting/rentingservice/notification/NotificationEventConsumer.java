package org.renting.rentingservice.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.renting.rentingservice.messaging.NotificationEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Profile("notification")
@RequiredArgsConstructor
@Slf4j
public class NotificationEventConsumer {

    private final ObjectMapper objectMapper;
    private final JavaMailSender mailSender;

    @KafkaListener(topics = "notification-events", groupId = "notification-service")
    public void consume(String payload) {
        try {
            NotificationEvent event = objectMapper.readValue(payload, NotificationEvent.class);
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(event.getEmail());
            mail.setSubject(event.getSubject());
            mail.setText(event.getContent());
            mailSender.send(mail);
            log.info("Notification sent for eventType={} to={}", event.getEventType(), event.getEmail());
        } catch (Exception ex) {
            log.error("Failed to process notification event", ex);
        }
    }
}
