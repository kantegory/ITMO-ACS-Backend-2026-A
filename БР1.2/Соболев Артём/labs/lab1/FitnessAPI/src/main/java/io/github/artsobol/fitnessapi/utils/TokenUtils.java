package io.github.artsobol.fitnessapi.utils;

import io.github.artsobol.fitnessapi.exception.security.CryptoException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

public final class TokenUtils {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();

    private TokenUtils() {
        throw new AssertionError("Utility class");
    }

    public static String generateRawToken(int bytes) {
        byte[] buf = new byte[bytes];
        SECURE_RANDOM.nextBytes(buf);
        return ENCODER.encodeToString(buf);
    }

    public static String hmacSha256Base64Url(String raw, String pepper) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    pepper.getBytes(StandardCharsets.UTF_8),
                    mac.getAlgorithm()
            );
            mac.init(secretKeySpec);
            byte[] digest = mac.doFinal(raw.getBytes(StandardCharsets.UTF_8));
            return ENCODER.encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new CryptoException("crypto.hmacSha256.notSupported", e);
        } catch (InvalidKeyException e) {
            throw new CryptoException("crypto.hmacSha256.invalidKey", e);
        }
    }
}
