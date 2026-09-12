package ru.itmo.rentease;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();
    private final byte[] secret;
    private final ObjectMapper objectMapper;

    public JwtService(@Value("${app.jwt-secret}") String secret, ObjectMapper objectMapper) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.objectMapper = objectMapper;
    }

    public String accessToken(UUID userId, String role) {
        return token(userId, role, Instant.now().plusSeconds(3600));
    }

    public String refreshToken(UUID userId, String role) {
        return token(userId, role, Instant.now().plusSeconds(604800));
    }

    public JwtUser parse(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3 || !signature(parts[0], parts[1]).equals(parts[2])) {
                throw AppException.unauthorized("Invalid token");
            }
            Map<String, Object> payload = objectMapper.readValue(DECODER.decode(parts[1]), new TypeReference<>() {});
            Number exp = (Number) payload.get("exp");
            if (exp == null || exp.longValue() < Instant.now().getEpochSecond()) {
                throw AppException.unauthorized("Token expired");
            }
            return new JwtUser(UUID.fromString((String) payload.get("sub")), (String) payload.get("role"));
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            throw AppException.unauthorized("Invalid token");
        }
    }

    private String token(UUID userId, String role, Instant expiresAt) {
        try {
            Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sub", userId.toString());
            payload.put("role", role);
            payload.put("exp", expiresAt.getEpochSecond());
            String encodedHeader = encode(header);
            String encodedPayload = encode(payload);
            return encodedHeader + "." + encodedPayload + "." + signature(encodedHeader, encodedPayload);
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot create token", ex);
        }
    }

    private String encode(Object value) throws Exception {
        return ENCODER.encodeToString(objectMapper.writeValueAsBytes(value));
    }

    private String signature(String encodedHeader, String encodedPayload) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        return ENCODER.encodeToString(mac.doFinal((encodedHeader + "." + encodedPayload).getBytes(StandardCharsets.UTF_8)));
    }

    public record JwtUser(UUID userId, String role) {}
}
