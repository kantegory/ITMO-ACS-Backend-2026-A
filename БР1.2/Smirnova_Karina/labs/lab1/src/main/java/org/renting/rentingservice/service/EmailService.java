package org.renting.rentingservice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    public void sendVerificationEmail(String email, String rawToken) {
        log.info("=== EMAIL VERIFICATION (mock) ===");
        log.info("To: {}", email);
        log.info("Confirm with POST /users/email/confirm body: {{ \"token\": \"{}\" }}", rawToken);
        log.info("=================================");
    }
}
