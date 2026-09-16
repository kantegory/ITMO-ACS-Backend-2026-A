package ru.itmo.rentease.common;

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
    private final ObjectMapper mapper;

    public JwtService(@Value("${app.jwt-secret:local-lab2-secret-change-me}") String secret, ObjectMapper mapper) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.mapper = mapper;
    }

    public String userToken(UUID userId, Role role) {
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("sub", userId.toString());
        claims.put("role", role.name());
        claims.put("type", "user");
        return token(claims, Instant.now().plusSeconds(3600));
    }

    public String refreshToken(UUID userId, Role role) {
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("sub", userId.toString());
        claims.put("role", role.name());
        claims.put("type", "user");
        return token(claims, Instant.now().plusSeconds(604800));
    }

    public String serviceToken(String serviceName) {
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("sub", serviceName);
        claims.put("type", "service");
        claims.put("scope", "internal");
        return token(claims, Instant.now().plusSeconds(300));
    }

    public Principal parse(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3 || !signature(parts[0], parts[1]).equals(parts[2])) {
                throw AppException.unauthorized("Invalid token");
            }
            Map<String, Object> payload = mapper.readValue(DECODER.decode(parts[1]), new TypeReference<>() {});
            Number exp = (Number) payload.get("exp");
            if (exp == null || exp.longValue() < Instant.now().getEpochSecond()) {
                throw AppException.unauthorized("Token expired");
            }
            String type = String.valueOf(payload.getOrDefault("type", "user"));
            if ("service".equals(type)) {
                return new Principal(null, null, String.valueOf(payload.get("sub")), true);
            }
            return new Principal(UUID.fromString(String.valueOf(payload.get("sub"))),
                    Role.valueOf(String.valueOf(payload.get("role"))), null, false);
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            throw AppException.unauthorized("Invalid token");
        }
    }

    private String token(Map<String, Object> claims, Instant expiresAt) {
        try {
            Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
            claims.put("exp", expiresAt.getEpochSecond());
            String h = encode(header);
            String p = encode(claims);
            return h + "." + p + "." + signature(h, p);
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot create token", ex);
        }
    }

    private String encode(Object value) throws Exception { return ENCODER.encodeToString(mapper.writeValueAsBytes(value)); }

    private String signature(String header, String payload) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        return ENCODER.encodeToString(mac.doFinal((header + "." + payload).getBytes(StandardCharsets.UTF_8)));
    }

    public record Principal(UUID userId, Role role, String serviceName, boolean service) {}
}
