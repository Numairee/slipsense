package com.pygmy.notrack;

import java.util.*;
import java.util.regex.*;

/** Calendar-validated dates. Missing dates stay empty for review. */
public final class SlipDateParser {
    private static String calendarDate(int year, int month, int day) {
        if (year < 100) year += year >= 40 ? 2500 : 2000;
        if (year > 2400) year -= 543;
        if (year < 2000 || year > 2100) return "";
        Calendar calendar = new GregorianCalendar();
        calendar.clear();
        calendar.setLenient(false);
        calendar.set(year, month - 1, day);
        try {
            calendar.getTime();
            return String.format(Locale.US, "%04d-%02d-%02d", year, month, day);
        } catch (IllegalArgumentException invalid) { return ""; }
    }

    public static String parse(String text) {
        if (text == null) return "";
        for (int i = 0; i < 10; i++) text = text.replace((char) (0x0E50 + i), (char) ('0' + i));
        Matcher iso = Pattern.compile("\\b(20[0-9]{2})-([0-9]{1,2})-([0-9]{1,2})\\b").matcher(text);
        if (iso.find()) return calendarDate(Integer.parseInt(iso.group(1)), Integer.parseInt(iso.group(2)), Integer.parseInt(iso.group(3)));
        Matcher numeric = Pattern.compile("\\b([0-9]{1,2})[/-]([0-9]{1,2})[/-]([0-9]{2,4})\\b").matcher(text);
        if (numeric.find()) return calendarDate(Integer.parseInt(numeric.group(3)), Integer.parseInt(numeric.group(2)), Integer.parseInt(numeric.group(1)));
        String[] thai = {"ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."};
        String[] english = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        for (int month = 0; month < 12; month++) {
            Matcher named = Pattern.compile("([0-9]{1,2})\\s*(?:" + Pattern.quote(thai[month]) + "|" + english[month] + "[a-z]*\\.?)\\s*([0-9]{2,4})", Pattern.CASE_INSENSITIVE).matcher(text);
            if (named.find()) return calendarDate(Integer.parseInt(named.group(2)), month + 1, Integer.parseInt(named.group(1)));
        }
        return "";
    }

}
