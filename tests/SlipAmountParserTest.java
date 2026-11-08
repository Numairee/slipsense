import com.pygmy.notrack.SlipAmountParser;
import com.pygmy.notrack.SlipQrParser;
import com.pygmy.notrack.SlipDateParser;

public class SlipAmountParserTest {
    private static void check(String text, double expected) {
        double actual = SlipAmountParser.parse(text);
        if (Math.abs(actual - expected) > 0.00001) throw new AssertionError(text + ": " + actual);
    }
    public static void main(String[] args) {
        check("ค่าธรรมเนียม 10.00 บาท\nจำนวนเงิน 1,250.75 บาท", 1250.75);
        check("Amount\n2,569.00\nFee 10.00", 2569);
        check("จำนวนเงิน ๑๒๓.๔๕ บาท", 123.45);
        check("Amount 0.50 THB", 0.5);
        check("จำนวนเงิน 250 บาท", 250);
        check("08.11.2026\n12.45 น.\nRef 20261108123456", 0);
        check("Account 1234567890\nค่าธรรมเนียม 10.00", 0);
        check("Amount 100.00\nAmount 200.00", 0);
        check("Amount 2026.00", 2026);
        check("จำนวนเงิน 125.- บาท", 125);
        for (String[] pair : new String[][] {
            {"8 Nov 2026", "2026-11-08"}, {"08/11/2569", "2026-11-08"},
            {"2026-11-08", "2026-11-08"}, {"8 พ.ย. 2569", "2026-11-08"},
            {"๘ พ.ย. ๒๕๖๙", "2026-11-08"}, {"29/02/2567", "2024-02-29"},
            {"31/02/2569", ""}, {"29/02/2569", ""}, {"not a date", ""}
        }) {
            if (!SlipDateParser.parse(pair[0]).equals(pair[1])) throw new AssertionError("Date: " + pair[0]);
        }
        String reference = "ABC010300612345";
        String validQr = "010300402" + String.format("%02d", reference.length()) + reference;
        if (SlipQrParser.parse(validQr) == null || !SlipQrParser.parse(validQr)[1].equals("ABC010300612345")) throw new AssertionError("Mini-QR");
        if (SlipQrParser.parse("https://example.com/01030040212ABC123456789") != null) throw new AssertionError("URL");
        if (SlipQrParser.parse(validQr.substring(0, validQr.length() - 1)) != null) throw new AssertionError("Truncated QR");
        if (SlipQrParser.parse("01030045406100.00") != null) throw new AssertionError("Payment QR");
        System.out.println("Native amount regression checks passed");
    }
}
