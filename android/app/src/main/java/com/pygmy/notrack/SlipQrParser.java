package com.pygmy.notrack;

import java.util.HashMap;
import java.util.Map;

/** Structural Mini-QR reader. A payment request QR is not proof of a completed transfer. */
public final class SlipQrParser {
    private SlipQrParser() {}

    private static Map<String, String> tags(String text) {
        Map<String, String> result = new HashMap<>();
        for (int offset = 0; offset < text.length();) {
            if (offset + 4 > text.length()) return null;
            String header = text.substring(offset, offset + 4);
            if (!header.matches("[0-9]{4}")) return null;
            int length = Integer.parseInt(header.substring(2));
            String tag = header.substring(0, 2);
            if (offset + 4 + length > text.length() || result.containsKey(tag)) return null;
            result.put(tag, text.substring(offset + 4, offset + 4 + length));
            offset += 4 + length;
        }
        return result;
    }

    // Returns bank BOT code and reference, or null when either field is missing.
    public static String[] parse(String raw) {
        if (raw == null || raw.isEmpty() || raw.length() > 4096 || raw.startsWith("000201")) return null;
        Map<String, String> values = tags(raw);
        if (values == null) return null;
        Map<String, String> nested = values.containsKey("00") ? tags(values.get("00")) : null;
        if (nested != null && nested.containsKey("01")) values = nested;
        String bank = values.get("01");
        String ref = values.get("02");
        if (bank == null || !bank.matches("004|014|006|025|002|011|069|030") ||
                ref == null || !ref.matches("[A-Za-z0-9]{8,35}")) return null;
        return new String[] { bank, ref };
    }
}
