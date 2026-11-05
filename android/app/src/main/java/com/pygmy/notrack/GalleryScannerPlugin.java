package com.pygmy.notrack;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import com.google.android.gms.tasks.Tasks;
import com.google.mlkit.vision.barcode.BarcodeScanner;
import com.google.mlkit.vision.barcode.BarcodeScanning;
import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@CapacitorPlugin(
    name = "GalleryScanner",
    permissions = {
        @Permission(
            alias = "images",
            strings = {
                Manifest.permission.READ_MEDIA_IMAGES
            }
        ),
        @Permission(
            alias = "storageLegacy",
            strings = {
                Manifest.permission.READ_EXTERNAL_STORAGE
            }
        )
    }
)
public class GalleryScannerPlugin extends Plugin {
    private static final String TAG = "GalleryScanner";

    private TextRecognizer textRecognizer;
    private BarcodeScanner barcodeScanner;

    @Override
    public void load() {
        super.load();
        try {
            textRecognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
            barcodeScanner = BarcodeScanning.getClient();
            Log.d(TAG, "ML Kit TextRecognizer & BarcodeScanner initialized successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error initializing ML Kit: " + e.getMessage());
        }
    }

    private boolean hasGalleryPermission() {
        if (Build.VERSION.SDK_INT >= 34) {
            return getContext().checkSelfPermission(Manifest.permission.READ_MEDIA_IMAGES) == PackageManager.PERMISSION_GRANTED
                || getContext().checkSelfPermission(Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED) == PackageManager.PERMISSION_GRANTED;
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return getContext().checkSelfPermission(Manifest.permission.READ_MEDIA_IMAGES) == PackageManager.PERMISSION_GRANTED;
        } else {
            return getContext().checkSelfPermission(Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
        }
    }

    @PluginMethod
    public void scanRecentSlips(PluginCall call) {
        if (!hasGalleryPermission()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                requestPermissionForAlias("images", call, "permissionCallback");
            } else {
                requestPermissionForAlias("storageLegacy", call, "permissionCallback");
            }
            return;
        }

        executeGalleryScan(call);
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        if (hasGalleryPermission()) {
            executeGalleryScan(call);
        } else {
            call.reject("Permission to access gallery was denied");
        }
    }

    private void executeGalleryScan(PluginCall call) {
        new Thread(() -> {
            try {
                int limit = call.getInt("limit", 50);

                ContentResolver resolver = getContext().getContentResolver();
                Uri collection;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    collection = MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL);
                } else {
                    collection = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                }

                String[] projection = new String[] {
                    MediaStore.Images.Media._ID,
                    MediaStore.Images.Media.DISPLAY_NAME,
                    MediaStore.Images.Media.DATE_ADDED,
                    MediaStore.Images.Media.MIME_TYPE
                };

                // IMPORTANT: Android 11+ (API 30+) forbids "LIMIT" inside sortOrder in ContentResolver.query!
                String sortOrder = MediaStore.Images.Media.DATE_ADDED + " DESC";

                Cursor cursor = resolver.query(collection, projection, null, null, sortOrder);
                JSArray parsedSlips = new JSArray();
                int scannedCount = 0;

                if (cursor != null) {
                    int idCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID);
                    int nameCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME);
                    int dateCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_ADDED);

                    while (cursor.moveToNext() && scannedCount < limit) {
                        scannedCount++;
                        long id = cursor.getLong(idCol);
                        String name = cursor.getString(nameCol);
                        long dateAdded = cursor.getLong(dateCol);

                        Uri contentUri = ContentUris.withAppendedId(collection, id);

                        try {
                            JSObject slip = processImageUri(resolver, contentUri, id, name, dateAdded);
                            if (slip != null) {
                                parsedSlips.put(slip);
                            }
                        } catch (Exception e) {
                            Log.w(TAG, "Failed to process photo " + id + ": " + e.getMessage());
                        }
                    }
                    cursor.close();
                }

                Log.d(TAG, "Scanned " + scannedCount + " photos, found " + parsedSlips.length() + " slips");

                JSObject res = new JSObject();
                res.put("success", true);
                res.put("slips", parsedSlips);
                res.put("count", scannedCount);
                call.resolve(res);

            } catch (Exception e) {
                Log.e(TAG, "Gallery scan exception", e);
                call.reject("Error scanning gallery: " + e.getMessage());
            }
        }).start();
    }

    private JSObject processImageUri(ContentResolver resolver, Uri uri, long id, String fileName, long dateAddedSec) {
        Bitmap bmp = null;
        try {
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inJustDecodeBounds = true;
            try (InputStream is = resolver.openInputStream(uri)) {
                BitmapFactory.decodeStream(is, null, options);
            }

            int reqWidth = 1000;
            int reqHeight = 1000;
            int inSampleSize = 1;
            if (options.outHeight > reqHeight || options.outWidth > reqWidth) {
                int halfH = options.outHeight / 2;
                int halfW = options.outWidth / 2;
                while ((halfH / inSampleSize) >= reqHeight && (halfW / inSampleSize) >= reqWidth) {
                    inSampleSize *= 2;
                }
            }

            BitmapFactory.Options decodeOpts = new BitmapFactory.Options();
            decodeOpts.inSampleSize = inSampleSize;
            decodeOpts.inPreferredConfig = Bitmap.Config.ARGB_8888;

            try (InputStream is = resolver.openInputStream(uri)) {
                bmp = BitmapFactory.decodeStream(is, null, decodeOpts);
            }

            if (bmp == null) return null;

            String headerColorBank = analyzeHeaderBankColor(bmp);

            // Run ML Kit Text and Barcode
            InputImage inputImage = InputImage.fromBitmap(bmp, 0);

            String qrPayload = "";
            if (barcodeScanner != null) {
                try {
                    List<Barcode> barcodes = Tasks.await(barcodeScanner.process(inputImage));
                    for (Barcode b : barcodes) {
                        if (b.getRawValue() != null) {
                            qrPayload = b.getRawValue();
                            break;
                        }
                    }
                } catch (Exception ignored) {}
            }

            String ocrText = "";
            if (textRecognizer != null) {
                try {
                    Text visionText = Tasks.await(textRecognizer.process(inputImage));
                    ocrText = visionText.getText();
                } catch (Exception ignored) {}
            }

            Log.d(TAG, "Photo id=" + id + " name=" + fileName + " colorBank=" + headerColorBank + " qrLen=" + qrPayload.length() + " ocr=" + ocrText.replace("\n", " | "));

            // Identify if this is a Thai bank slip
            boolean hasSlipKeywords = isSlip(ocrText, qrPayload, fileName);
            if (!hasSlipKeywords) {
                return null;
            }

            // Parse financial fields
            ParsedSlip parsed = parseSlipData(ocrText, qrPayload, fileName, dateAddedSec, headerColorBank);
            if (parsed.amount <= 0) {
                return null; // Ignore non-payment images
            }

            // Create thumbnail
            String thumbBase64 = "";
            try {
                int thumbW = 200;
                int thumbH = (int) ((float) bmp.getHeight() / bmp.getWidth() * thumbW);
                Bitmap thumb = Bitmap.createScaledBitmap(bmp, thumbW, Math.max(10, thumbH), true);
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                thumb.compress(Bitmap.CompressFormat.JPEG, 65, baos);
                thumbBase64 = "data:image/jpeg;base64," + Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP);
                thumb.recycle();
            } catch (Exception ignored) {}

            JSObject slipObj = new JSObject();
            slipObj.put("id", "slip_" + id);
            slipObj.put("bankId", parsed.bankId);
            slipObj.put("amount", parsed.amount);
            slipObj.put("payee", parsed.payee);
            slipObj.put("sender", parsed.sender);
            slipObj.put("date", parsed.date);
            slipObj.put("time", parsed.time);
            slipObj.put("timestamp", dateAddedSec * 1000);
            slipObj.put("ref", parsed.ref);
            slipObj.put("categoryId", parsed.categoryId);
            slipObj.put("slipThumbnail", thumbBase64);
            slipObj.put("isManual", false);

            return slipObj;

        } catch (Exception e) {
            Log.w(TAG, "processImageUri error: " + e.getMessage());
            return null;
        } finally {
            if (bmp != null && !bmp.isRecycled()) {
                bmp.recycle();
            }
        }
    }

    private String analyzeHeaderBankColor(Bitmap bmp) {
        try {
            int w = bmp.getWidth();
            int h = Math.max(5, (int) (bmp.getHeight() * 0.15));
            long rSum = 0, gSum = 0, bSum = 0, count = 0;
            int step = Math.max(2, w / 25);
            for (int y = 0; y < h; y += step) {
                for (int x = 0; x < w; x += step) {
                    int pixel = bmp.getPixel(x, y);
                    int r = Color.red(pixel);
                    int g = Color.green(pixel);
                    int b = Color.blue(pixel);
                    int bright = (r + g + b) / 3;
                    if (bright > 30 && bright < 240) {
                        rSum += r;
                        gSum += g;
                        bSum += b;
                        count++;
                    }
                }
            }
            if (count == 0) return null;
            double avgR = (double) rSum / count;
            double avgG = (double) gSum / count;
            double avgB = (double) bSum / count;

            if (avgG > avgR * 1.25 && avgG > avgB * 1.25 && avgG > 70) return "KBANK";
            if (avgB > avgG * 1.3 && avgR > avgG * 1.1 && avgB > 60) return "SCB";
            if (avgR > 140 && avgG > 120 && avgB < 100) return "BAY";
            if (avgB > avgR * 1.4 && avgG > avgR * 1.1 && avgB > 110) return "KTB";
            if (avgR > 180 && avgG > 80 && avgG < 150 && avgB < 70) return "TRUEMONEY";
        } catch (Exception ignored) {}
        return null;
    }

    private boolean isSlip(String text, String qr, String fileName) {
        String lowerText = text.toLowerCase(Locale.ROOT);
        String lowerFile = fileName != null ? fileName.toLowerCase(Locale.ROOT) : "";

        // QR check: EMVCo or PromptPay
        if (qr.startsWith("00") || qr.contains("000400") || qr.contains("001400") || qr.contains("000600")) {
            return true;
        }

        // Common bank & slip keywords
        if (lowerText.contains("k plus") || lowerText.contains("kbank") || lowerText.contains("scb") ||
            lowerText.contains("krungthai") || lowerText.contains("ktb") || lowerText.contains("kma") ||
            lowerText.contains("krungsri") || lowerText.contains("ttb") || lowerText.contains("bbl") ||
            lowerText.contains("bualuang") || lowerText.contains("promptpay") || lowerText.contains("truemoney") ||
            lowerText.contains("dime") || lowerText.contains("amount") || lowerText.contains("transfer") ||
            lowerText.contains("successful") || lowerText.contains("จำนวน") || lowerText.contains("ยอดเงิน") ||
            lowerText.contains("โอนสำเร็จ") || lowerText.contains("บาท") || lowerText.contains("baht")) {
            return true;
        }

        // Structural pattern check (for Thai slips read by Latin OCR: has decimal amount AND time or masked account or ref code)
        boolean hasDecimalAmount = Pattern.compile("[0-9]{1,3}(?:,[0-9]{3})*\\.[0-9]{2}").matcher(text).find();
        boolean hasTime = Pattern.compile("[0-2]?[0-9]:[0-5][0-9]").matcher(text).find();
        boolean hasMaskedAcc = Pattern.compile("(?i)[xX]{2,}-[xX0-9-]+").matcher(text).find();
        boolean hasLongRef = Pattern.compile("\\b(?=[A-Za-z0-9]*\\d)[A-Za-z0-9]{14,35}\\b").matcher(text).find();
        if (hasDecimalAmount && (hasTime || hasMaskedAcc || hasLongRef)) {
            return true;
        }

        // Filename hints
        if (lowerFile.contains("slip") || lowerFile.contains("kbank") || lowerFile.contains("kplus") ||
            lowerFile.contains("scb") || lowerFile.contains("transfer")) {
            return true;
        }

        return false;
    }

    private static class ParsedSlip {
        String bankId = "KBANK";
        double amount = 0.0;
        String payee = "ร้านค้าพร้อมเพย์";
        String sender = "บัญชีของฉัน";
        String date = "";
        String time = "12:00";
        String ref = "";
        String categoryId = "food";
    }

    private ParsedSlip parseSlipData(String text, String qr, String fileName, long dateAddedSec, String headerColorBank) {
        ParsedSlip p = new ParsedSlip();
        if (headerColorBank != null) {
            p.bankId = headerColorBank;
        }

        // 1. Bank detection from text or QR
        String upperText = text.toUpperCase(Locale.ROOT);
        if (upperText.contains("KBANK") || upperText.contains("K PLUS") || upperText.contains("กสิกร") || qr.contains("000400")) {
            p.bankId = "KBANK";
        } else if (upperText.contains("SCB") || upperText.contains("ไทยพาณิชย์") || qr.contains("001400")) {
            p.bankId = "SCB";
        } else if (upperText.contains("KTB") || upperText.contains("KRUNGTHAI") || upperText.contains("กรุงไทย") || upperText.contains("เป๋าตัง") || qr.contains("000600")) {
            p.bankId = "KTB";
        } else if (upperText.contains("BAY") || upperText.contains("KRUNGSRI") || upperText.contains("KMA") || upperText.contains("กรุงศรี")) {
            p.bankId = "BAY";
        } else if (upperText.contains("TTB") || upperText.contains("TMB") || upperText.contains("THANACHART")) {
            p.bankId = "TTB";
        } else if (upperText.contains("BBL") || upperText.contains("BANGKOK BANK") || upperText.contains("กรุงเทพ")) {
            p.bankId = "BBL";
        } else if (upperText.contains("TRUEMONEY")) {
            p.bankId = "TRUEMONEY";
        } else if (upperText.contains("DIME")) {
            p.bankId = "DIME";
        } else if (upperText.contains("MAKE")) {
            p.bankId = "MAKE";
        }

        // 2. Extract Amount (Looking for decimal like 120.00 or 1,250.00)
        Pattern generalDec = Pattern.compile("([0-9]{1,3}(?:,[0-9]{3})*\\.[0-9]{2})");
        Matcher m2 = generalDec.matcher(text);
        while (m2.find()) {
            try {
                String amtStr = m2.group(1).replace(",", "");
                double val = Double.parseDouble(amtStr);
                if (val > 0 && val < 500000 && val != 2024 && val != 2025 && val != 2026 && val != 2567 && val != 2568 && val != 2569) {
                    p.amount = val;
                    break;
                }
            } catch (Exception ignored) {}
        }

        // 3. Extract Date & Time
        long nowSec = System.currentTimeMillis() / 1000;
        long effectiveSec = (dateAddedSec > 1500000000L && dateAddedSec <= nowSec + 86400) ? dateAddedSec : nowSec;
        Date dateObj = new Date(effectiveSec * 1000);
        SimpleDateFormat ymdFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        SimpleDateFormat hmFormat = new SimpleDateFormat("HH:mm", Locale.US);

        p.date = ymdFormat.format(dateObj);
        p.time = hmFormat.format(dateObj);

        Pattern timePattern = Pattern.compile("([0-2]?[0-9]:[0-5][0-9])");
        Matcher timeMatcher = timePattern.matcher(text);
        if (timeMatcher.find()) {
            String rawTime = timeMatcher.group(1);
            if (rawTime.length() == 4) rawTime = "0" + rawTime;
            p.time = rawTime;
        }

        // 4. Reference Code (try labeled first, then split ref, then standalone 12-35 char alphanumeric code)
        Pattern refPattern = Pattern.compile("(?i)(?:เลขที่รายการ|รหัสอ้างอิง|Ref|Transaction ID|Trans ID)[:\\s]*([A-Za-z0-9]{10,35})");
        Matcher refMatcher = refPattern.matcher(text);
        if (refMatcher.find()) {
            p.ref = refMatcher.group(1);
        } else {
            Pattern splitRef = Pattern.compile("\\b([0-9]{8,20})\\s+([A-Za-z0-9]{5,20})\\b");
            Matcher sm = splitRef.matcher(text);
            Pattern tokenRef = Pattern.compile("\\b(?=[A-Za-z0-9]*\\d)[A-Za-z0-9]{12,35}\\b");
            Matcher tm = tokenRef.matcher(text);
            if (tm.find()) {
                p.ref = tm.group(0);
            } else if (sm.find()) {
                p.ref = sm.group(1) + sm.group(2);
            } else if (!qr.isEmpty()) {
                p.ref = "QR" + Math.abs(qr.hashCode());
            } else {
                p.ref = p.bankId + "_" + idFromFile(fileName, effectiveSec);
            }
        }

        // 5. Extract Payee
        String[] lines = text.split("\n");
        int firstMaskedIdx = -1;
        for (int i = 0; i < lines.length; i++) {
            if (lines[i].matches("(?i).*[xX]{2,}-[xX0-9-]+.*")) {
                firstMaskedIdx = i;
                break;
            }
        }

        // Only look at lines after sender's masked account (where payee resides on all Thai slips)
        int startIdx = firstMaskedIdx >= 0 ? firstMaskedIdx + 1 : 0;
        for (int i = startIdx; i < lines.length; i++) {
            String trimmed = lines[i].trim();
            if (trimmed.length() < 3) continue;
            if (trimmed.contains(":")) continue;
            if (!p.ref.isEmpty() && trimmed.replace(" ", "").contains(p.ref)) continue;
            if (trimmed.matches("(?i).*[xX]{2,}-[xX0-9-]+.*")) continue;
            if (trimmed.matches(".*[0-9]+\\.[0-9]{2}.*")) continue;
            if (trimmed.matches(".*[0-2]?[0-9]:[0-5][0-9].*")) continue;
            if (trimmed.matches(".*\\b[A-Za-z0-9]{10,}\\b.*")) continue;

            // Keep clean ASCII Proper/Brand tokens (e.g., "7-Eleven", "Starbucks", "Uniqlo", "PTT")
            // and drop Latin-OCR diacritic gibberish from misread Thai glyphs
            StringBuilder cleanBrand = new StringBuilder();
            for (String tok : trimmed.split("\\s+")) {
                if (tok.matches(".*[\\u0080-\\u024F].*")) continue; // diacritic gibberish
                if (tok.matches("[A-Z0-9][A-Za-z0-9&.'-]{1,}")) {
                    if (cleanBrand.length() > 0) cleanBrand.append(" ");
                    cleanBrand.append(tok);
                }
            }
            String candidate = cleanBrand.toString().trim();
            String up = candidate.toUpperCase(Locale.ROOT);
            if (candidate.length() >= 3 && !up.equals("K PLUS") && !up.equals("SCB EASY") && !up.equals("KBANK") && !up.equals("SCB")) {
                p.payee = candidate;
                break;
            }
        }

        if (p.payee.equals("ร้านค้าพร้อมเพย์") || p.payee.isEmpty()) {
            if (p.bankId.equals("KBANK")) p.payee = "ร้านค้าพร้อมเพย์ (K PLUS)";
            else if (p.bankId.equals("SCB")) p.payee = "สแกนจ่าย QR (SCB EASY)";
            else if (p.bankId.equals("KTB")) p.payee = "ร้านค้าเป๋าตัง / ถุงเงิน";
            else if (p.bankId.equals("BAY")) p.payee = "ร้านค้าพร้อมเพย์ (KMA)";
            else if (p.bankId.equals("TTB")) p.payee = "สแกนจ่าย QR (ttb)";
            else p.payee = "สแกนโอนจ่าย QR";
        }

        // Categorize by keywords in payee
        String lowerPayee = p.payee.toLowerCase(Locale.ROOT);
        if (lowerPayee.contains("cafe") || lowerPayee.contains("coffee") || lowerPayee.contains("อาหาร") ||
            lowerPayee.contains("ข้าว") || lowerPayee.contains("ก๋วยเตี๋ยว") || lowerPayee.contains("7-eleven") ||
            lowerPayee.contains("cj") || lowerPayee.contains("ชา") || lowerPayee.contains("หมู")) {
            p.categoryId = "food";
        } else if (lowerPayee.contains("ปตท") || lowerPayee.contains("ptt") || lowerPayee.contains("bpass") ||
                   lowerPayee.contains("m-flow") || lowerPayee.contains("bts") || lowerPayee.contains("mrt") || lowerPayee.contains("grab")) {
            p.categoryId = "transport";
        } else if (lowerPayee.contains("shopee") || lowerPayee.contains("lazada") || lowerPayee.contains("uniqlo") ||
                   lowerPayee.contains("mall") || lowerPayee.contains("shop")) {
            p.categoryId = "shopping";
        } else {
            p.categoryId = "food";
        }

        return p;
    }

    private String idFromFile(String fileName, long fallback) {
        if (fileName != null && !fileName.isEmpty()) {
            return fileName.replaceAll("[^A-Za-z0-9]", "");
        }
        return String.valueOf(fallback);
    }
}
