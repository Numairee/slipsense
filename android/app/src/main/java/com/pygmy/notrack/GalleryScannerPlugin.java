package com.pygmy.notrack;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
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
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
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
                long sinceSeconds = call.getLong("since", 0L);

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

                String selection = null;
                String[] selectionArgs = null;
                if (sinceSeconds > 0) {
                    selection = MediaStore.Images.Media.DATE_ADDED + " >= ?";
                    selectionArgs = new String[] { String.valueOf(sinceSeconds) };
                }

                String sortOrder = MediaStore.Images.Media.DATE_ADDED + " DESC LIMIT " + limit;

                Cursor cursor = resolver.query(collection, projection, selection, selectionArgs, sortOrder);
                JSArray parsedSlips = new JSArray();

                if (cursor != null) {
                    int idCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID);
                    int nameCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME);
                    int dateCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_ADDED);

                    while (cursor.moveToNext()) {
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

                JSObject res = new JSObject();
                res.put("success", true);
                res.put("slips", parsedSlips);
                res.put("count", parsedSlips.length());
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
            // Check dimensions first
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
            decodeOpts.inPreferredConfig = Bitmap.Config.RGB_565; // memory efficient

            try (InputStream is = resolver.openInputStream(uri)) {
                bmp = BitmapFactory.decodeStream(is, null, decodeOpts);
            }

            if (bmp == null) return null;

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

            // Identify if this is a Thai bank slip
            boolean hasSlipKeywords = isSlip(ocrText, qrPayload, fileName);
            if (!hasSlipKeywords) {
                return null;
            }

            // Parse financial fields
            ParsedSlip parsed = parseSlipData(ocrText, qrPayload, fileName, dateAddedSec);
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
            return null;
        } finally {
            if (bmp != null && !bmp.isRecycled()) {
                bmp.recycle();
            }
        }
    }

    private boolean isSlip(String text, String qr, String fileName) {
        String lowerText = text.toLowerCase(Locale.ROOT);
        String lowerFile = fileName.toLowerCase(Locale.ROOT);

        // QR check: EMVCo or PromptPay
        if (qr.startsWith("00") || qr.contains("000400") || qr.contains("001400") || qr.contains("000600")) {
            return true;
        }

        // Common bank slip triggers
        if (lowerText.contains("kbank") || lowerText.contains("scb") || lowerText.contains("krungthai") ||
            lowerText.contains("kma") || lowerText.contains("ttb") || lowerText.contains("promptpay") ||
            lowerText.contains("amount") || lowerText.contains("transfer") || lowerText.contains("successful") ||
            lowerText.contains("จำนวนเงิน") || lowerText.contains("ยอดเงิน") || lowerText.contains("โอนสำเร็จ") ||
            lowerText.contains("บาท") || lowerText.contains("baht")) {
            return true;
        }

        // Filename hints
        if (lowerFile.contains("slip") || lowerFile.contains("kbank") || lowerFile.contains("scb") || lowerFile.contains("transfer")) {
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

    private ParsedSlip parseSlipData(String text, String qr, String fileName, long dateAddedSec) {
        ParsedSlip p = new ParsedSlip();

        // 1. Bank detection
        String upperText = text.toUpperCase(Locale.ROOT);
        if (upperText.contains("KBANK") || upperText.contains("K PLUS") || upperText.contains("กสิกร")) {
            p.bankId = "KBANK";
        } else if (upperText.contains("SCB") || upperText.contains("ไทยพาณิชย์")) {
            p.bankId = "SCB";
        } else if (upperText.contains("KTB") || upperText.contains("KRUNGTHAI") || upperText.contains("กรุงไทย") || upperText.contains("เป๋าตัง")) {
            p.bankId = "KTB";
        } else if (upperText.contains("BAY") || upperText.contains("KRUNGSRI") || upperText.contains("กรุงศรี")) {
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
        Pattern amountPattern = Pattern.compile("(?i)(?:จำนวนเงิน|ยอดเงิน|Amount|จำนวน|ยอดโอน|โอนเงิน|บาท)?\\s*[:\\s]*([0-9]{1,3}(?:,[0-9]{3})*\\.[0-9]{2})");
        Matcher m = amountPattern.matcher(text);
        while (m.find()) {
            try {
                String amtStr = m.group(1).replace(",", "");
                double val = Double.parseDouble(amtStr);
                // Exclude common year numbers like 2024.00, 2025.00, 2026.00, 2567.00, 2568.00, 2569.00
                if (val > 0 && val < 500000 && val != 2024 && val != 2025 && val != 2026 && val != 2567 && val != 2568 && val != 2569) {
                    p.amount = val;
                    break;
                }
            } catch (Exception ignored) {}
        }

        // Fallback amount: any decimal number
        if (p.amount <= 0) {
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
        }

        // 3. Extract Date & Time
        Date dateObj = new Date(dateAddedSec > 0 ? dateAddedSec * 1000 : System.currentTimeMillis());
        SimpleDateFormat ymdFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        SimpleDateFormat hmFormat = new SimpleDateFormat("HH:mm", Locale.US);

        p.date = ymdFormat.format(dateObj);
        p.time = hmFormat.format(dateObj);

        // Try extracting time from text e.g. 14:32
        Pattern timePattern = Pattern.compile("([0-2]?[0-9]:[0-5][0-9])");
        Matcher timeMatcher = timePattern.matcher(text);
        if (timeMatcher.find()) {
            p.time = timeMatcher.group(1);
        }

        // 4. Extract Payee
        String[] lines = text.split("\n");
        boolean foundTo = false;
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.startsWith("ไปยัง") || trimmed.startsWith("ถึง") || trimmed.toLowerCase().startsWith("to:")) {
                foundTo = true;
                continue;
            }
            if (foundTo && trimmed.length() > 2) {
                p.payee = trimmed;
                break;
            }
        }

        if (p.payee.equals("ร้านค้าพร้อมเพย์") || p.payee.isEmpty()) {
            if (p.bankId.equals("KBANK")) p.payee = "ร้านค้าพร้อมเพย์ (K PLUS)";
            else if (p.bankId.equals("SCB")) p.payee = "ร้านค้า QR (SCB EASY)";
            else if (p.bankId.equals("KTB")) p.payee = "ร้านค้าเป๋าตัง / ถุงเงิน";
            else if (p.bankId.equals("BAY")) p.payee = "ร้านค้าพร้อมเพย์ (KMA)";
            else if (p.bankId.equals("TTB")) p.payee = "สแกนจ่าย QR (ttb)";
            else p.payee = "สแกนโอนจ่าย QR";
        }

        // 5. Reference Code
        Pattern refPattern = Pattern.compile("(?i)(?:เลขที่รายการ|รหัสอ้างอิง|Ref|Transaction ID|Trans ID)[:\\s]*([A-Za-z0-9]{10,35})");
        Matcher refMatcher = refPattern.matcher(text);
        if (refMatcher.find()) {
            p.ref = refMatcher.group(1);
        } else if (!qr.isEmpty()) {
            p.ref = "QR" + Math.abs(qr.hashCode());
        } else {
            p.ref = p.bankId + (dateAddedSec > 0 ? dateAddedSec : System.currentTimeMillis() / 1000);
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
            p.categoryId = "food"; // default
        }

        return p;
    }
}
