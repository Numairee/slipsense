package com.pygmy.notrack;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Amount extraction shared by single-image and album scans. No Android dependencies. */
public final class SlipAmountParser {
    private static final Pattern LABEL = Pattern.compile("จำนวนเงิน|ยอดเงิน|ยอดโอน|amount", Pattern.CASE_INSENSITIVE);
    private static final Pattern CURRENCY = Pattern.compile("บาท|thb|baht|฿", Pattern.CASE_INSENSITIVE);
    private static final Pattern EXCLUDED = Pattern.compile("ค่าธรรมเนียม|ค่าบริการ|เวลา|\\btime\\b|fee|ยอดคงเหลือ|balance|เลขที่|อ้างอิง|reference|transaction\\s*id|บัญชี|account", Pattern.CASE_INSENSITIVE);
    private static final Pattern DECIMAL = Pattern.compile("(?<![0-9A-Za-z.,/:-])([0-9]{1,3}(?:,\\s*[0-9]{3})+|[0-9]{1,7})\\s*\\.\\s*([0-9]{2})(?![0-9A-Za-z.,/:-])");
    private static final Pattern INTEGER = Pattern.compile("^(?:.*?(?:จำนวนเงิน|ยอดเงิน|ยอดโอน|amount|฿|THB)[:：\\s]*)?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{1,7})(?:\\s*(?:บาท|THB|baht|฿))?\\s*$", Pattern.CASE_INSENSITIVE);

    private SlipAmountParser() {}

    public static double parse(String text) {
        if (text == null || text.isEmpty()) return 0;
        StringBuilder normalized = new StringBuilder();
        for (char ch : text.toCharArray()) {
            normalized.append(ch >= '๐' && ch <= '๙' ? (char) ('0' + ch - '๐') : ch);
        }
        String[] lines = normalized.toString().replaceAll("([\\u0e00-\\u0e7f])[ \\t]+(?=[\\u0e00-\\u0e7f])", "$1").split("\n");
        int bestScore = 0;
        double best = 0;
        boolean ambiguous = false;
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim().replaceAll("(?i)([0-9])\\s*\\.\\s*-(?=\\s*(?:บาท|THB|baht|฿)?\\s*$)", "$1.00");
            if (EXCLUDED.matcher(line).find() || (i > 0 && EXCLUDED.matcher(lines[i - 1]).find() && !Pattern.compile("[0-9]").matcher(lines[i - 1]).find())) continue;
            boolean labelled = LABEL.matcher(line).find();
            boolean previous = i > 0 && LABEL.matcher(lines[i - 1]).find() && !EXCLUDED.matcher(lines[i - 1]).find();
            boolean currency = CURRENCY.matcher(line).find();
            if (line.contains("น.") && !labelled && !currency) continue;
            int score = labelled ? 4 : previous ? 3 : currency ? 2 : 1;
            Matcher matcher = DECIMAL.matcher(line);
            boolean decimalFound = false;
            while (matcher.find()) {
                decimalFound = true;
                double value = Double.parseDouble(matcher.group(1).replaceAll("[,\\s]", "") + "." + matcher.group(2));
                if (value <= 0 || value > 1000000) continue;
                if (score > bestScore) { best = value; bestScore = score; ambiguous = false; }
                else if (score == bestScore && value != best) ambiguous = true;
            }
            if (!decimalFound && (labelled || previous || currency)) {
                Matcher integer = INTEGER.matcher(line);
                if (integer.matches()) {
                    double value = Double.parseDouble(integer.group(1).replace(",", ""));
                    int integerScore = labelled ? 4 : 3;
                    if (value > 0 && value <= 1000000) {
                        if (integerScore > bestScore) { best = value; bestScore = integerScore; ambiguous = false; }
                        else if (integerScore == bestScore && value != best) ambiguous = true;
                    }
                }
            }
        }
        return ambiguous ? 0 : best;
    }
}
