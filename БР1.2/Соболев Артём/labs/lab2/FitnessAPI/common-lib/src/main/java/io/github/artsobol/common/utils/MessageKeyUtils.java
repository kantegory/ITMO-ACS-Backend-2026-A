package io.github.artsobol.common.utils;

public final class MessageKeyUtils {

    private MessageKeyUtils() {
    }

    public static String normalize(String key) {
        if (key == null) {
            return null;
        }

        String trimmedKey = key.trim();
        if (trimmedKey.length() > 1 && trimmedKey.startsWith("{") && trimmedKey.endsWith("}")) {
            return trimmedKey.substring(1, trimmedKey.length() - 1);
        }

        return trimmedKey;
    }
}
