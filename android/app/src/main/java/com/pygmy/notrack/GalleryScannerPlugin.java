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
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@CapacitorPlugin(
    name = "GalleryScanner",
    permissions = {
        @Permission(
            alias = "images34",
            strings = {
                Manifest.permission.READ_MEDIA_IMAGES,
                Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED
            }
        ),
        @Permission(
            alias = "images33",
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
            Log.d(TAG, "ML Kit initialized successfully");
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
            if (Build.VERSION.SDK_INT >= 34) {
                requestPermissionForAlias("images34", call, "permissionCallback");
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                requestPermissionForAlias("images33", call, "permissionCallback");
            } else {
                requestPermissionForAlias("storageLegacy", call, "permissionCallback");
            }
            return;
        }

        executeGalleryScan(call);
    }

    @PluginMethod
    public void analyzeSingleImage(PluginCall call) {
        new Thread(() -> {
            try {
                String dataUrl = call.getString("dataUrl", "");
                String fileName = call.getString("fileName", "slip.jpg");
                if (dataUrl == null || dataUrl.isEmpty()) {
                    call.reject("Missing dataUrl");
                    return;
                }

                String base64Part = dataUrl.contains(",") ? dataUrl.substring(dataUrl.indexOf(",") + 1) : dataUrl;
                byte[] decoded = Base64.decode(base64Part, Base64.DEFAULT);
                Bitmap bmp = BitmapFactory.decodeByteArray(decoded, 0, decoded.length);
                if (bmp == null) {
                    call.reject("Could not decode image");
                    return;
                }

                long nowSec = System.currentTimeMillis() / 1000;
                JSObject slipObj = analyzeBitmap(bmp, System.currentTimeMillis(), fileName, "manual", nowSec, true);
                bmp.recycle();

                JSObject res = new JSObject();
                res.put("success", slipObj != null);
                if (slipObj != null) {
                    res.put("slip", slipObj);
                }
                call.resolve(res);
            } catch (Exception e) {
                Log.e(TAG, "analyzeSingleImage error", e);
                call.reject("Error analyzing image: " + e.getMessage());
            }
        }).start();
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        if (hasGalleryPermission()) {
            executeGalleryScan(call);
        } else {
            call.reject("Permission to access gallery was denied");
        }
    }

    private static class CandidateMedia {
        long id;
        String name;
        String bucket;
        long dateAdded;
        boolean isBankSource;
    }

    private void executeGalleryScan(PluginCall call) {
        new Thread(() -> {
            try {
                int limit = call.getInt("limit", 500);

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
                    MediaStore.Images.Media.BUCKET_DISPLAY_NAME,
                    MediaStore.Images.Media.DATE_ADDED
                };

                String sortOrder = MediaStore.Images.Media.DATE_ADDED + " DESC";

                List<CandidateMedia> bankFolderList = new ArrayList<>();
                List<CandidateMedia> generalList = new ArrayList<>();
                Set<Long> seenIds = new HashSet<>();

                // Stage 1: Explicitly search for bank folders across all storage (K PLUS, SCB, NEXT, KMA, ttb, etc.)
                String bankKeywordsSelection =
                    MediaStore.Images.Media.BUCKET_DISPLAY_NAME + " LIKE ? OR " +
                    MediaStore.Images.Media.BUCKET_DISPLAY_NAME + " LIKE ? OR " +
                    MediaStore.Images.Media.BUCKET_DISPLAY_NAME + " LIKE ? OR " +
                    MediaStore.Images.Media.BUCKET_DISPLAY_NAME + " LIKE ? OR " +
                    MediaStore.Images.Media.BUCKET_DISPLAY_NAME + " LIKE ? OR " +
                    MediaStore.Images.Media.BUCKET_DISPLAY_NAME + " LIKE ? OR " +
                    MediaStore.Images.Media.BUCKET_DISPLAY_NAME + " LIKE ? OR " +
                    MediaStore.Images.Media.BUCKET_DISPLAY_NAME + " LIKE ? OR " +
                    MediaStore.Images.Media.DISPLAY_NAME + " LIKE ? OR " +
                    MediaStore.Images.Media.DISPLAY_NAME + " LIKE ? OR " +
                    MediaStore.Images.Media.DISPLAY_NAME + " LIKE ? OR " +
                    MediaStore.Images.Media.DISPLAY_NAME + " LIKE ?";

                String[] bankKeywordsArgs = new String[] {
                    "%kplus%", "%k plus%", "%kbank%", "%scb%", "%next%", "%krungthai%",
                    "%kma%", "%ttb%", "%slip%", "%transfer%", "%bualuang%", "%mymo%"
                };

                try (Cursor cursor = resolver.query(collection, projection, bankKeywordsSelection, bankKeywordsArgs, sortOrder)) {
                    if (cursor != null) {
                        int idCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID);
                        int nameCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME);
                        int bucketCol = cursor.getColumnIndex(MediaStore.Images.Media.BUCKET_DISPLAY_NAME);
                        int dateCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_ADDED);

                        while (cursor.moveToNext() && bankFolderList.size() < limit) {
                            long id = cursor.getLong(idCol);
                            if (seenIds.contains(id)) continue;
                            seenIds.add(id);

                            CandidateMedia cm = new CandidateMedia();
                            cm.id = id;
                            cm.name = cursor.getString(nameCol);
                            cm.bucket = bucketCol >= 0 ? cursor.getString(bucketCol) : "";
                            cm.dateAdded = cursor.getLong(dateCol);
                            cm.isBankSource = true;
                            bankFolderList.add(cm);
                        }
                    }
                }

                // Stage 2: Also scan recent photos from Screenshots, Downloads, Camera (up to 350 images)
                try (Cursor cursor = resolver.query(collection, projection, null, null, sortOrder)) {
                    if (cursor != null) {
                        int idCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID);
                        int nameCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME);
                        int bucketCol = cursor.getColumnIndex(MediaStore.Images.Media.BUCKET_DISPLAY_NAME);
                        int dateCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_ADDED);

                        int inspectedGeneral = 0;
                        while (cursor.moveToNext() && inspectedGeneral < 350) {
                            inspectedGeneral++;
                            long id = cursor.getLong(idCol);
                            if (seenIds.contains(id)) continue;
                            seenIds.add(id);

                            CandidateMedia cm = new CandidateMedia();
                            cm.id = id;
                            cm.name = cursor.getString(nameCol);
                            cm.bucket = bucketCol >= 0 ? cursor.getString(bucketCol) : "";
                            cm.dateAdded = cursor.getLong(dateCol);
                            cm.isBankSource = isKnownBankOrSlipSource(cm.name, cm.bucket);
                            generalList.add(cm);
                        }
                    }
                }

                // Combine: Bank folder candidates first, then general candidates
                List<CandidateMedia> finalQueue = new ArrayList<>(bankFolderList);
                for (CandidateMedia cm : generalList) {
                    if (finalQueue.size() >= limit) break;
                    finalQueue.add(cm);
                }

                JSArray parsedSlips = new JSArray();
                int scannedCount = 0;

                for (CandidateMedia item : finalQueue) {
                    scannedCount++;
                    Uri contentUri = ContentUris.withAppendedId(collection, item.id);
                    try {
                        JSObject slip = processImageUri(resolver, contentUri, item.id, item.name, item.bucket, item.dateAdded, item.isBankSource);
                        if (slip != null) {
                            parsedSlips.put(slip);
                        }
                    } catch (Exception e) {
                        Log.w(TAG, "Failed to process photo " + item.id + ": " + e.getMessage());
                    }
                }

                Log.d(TAG, "Scanned " + scannedCount + " total images (bankFolderMatch=" + bankFolderList.size() + "), found " + parsedSlips.length() + " slips");

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

    private boolean isKnownBankOrSlipSource(String fileName, String bucketName) {
        String combined = ((fileName != null ? fileName : "") + " " + (bucketName != null ? bucketName : "")).toLowerCase(Locale.ROOT);
        return combined.contains("k plus") || combined.contains("kplus") || combined.contains("kbank") ||
               combined.contains("scb") || combined.contains("krungthai") || combined.contains("next") ||
               combined.contains("ktb") || combined.contains("kma") || combined.contains("krungsri") ||
               combined.contains("bay") || combined.contains("ttb") || combined.contains("tmb") ||
               combined.contains("bualuang") || combined.contains("bangkok") || combined.contains("bbl") ||
               combined.contains("mymo") || combined.contains("gsb") || combined.contains("truemoney") ||
               combined.contains("dime") || combined.contains("make") || combined.contains("slip") ||
               combined.contains("transfer") || combined.contains("promptpay");
    }

    private JSObject processImageUri(ContentResolver resolver, Uri uri, long id, String fileName, String bucketName, long dateAddedSec, boolean isBankSource) {
        Bitmap bmp = null;
        try {
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inJustDecodeBounds = true;
            try (InputStream is = resolver.openInputStream(uri)) {
                BitmapFactory.decodeStream(is, null, options);
            }

            int reqWidth = 1280;
            int reqHeight = 1280;
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

            return analyzeBitmap(bmp, id, fileName, bucketName, dateAddedSec, isBankSource);

        } catch (Exception e) {
            Log.w(TAG, "processImageUri error: " + e.getMessage());
            return null;
        } finally {
            if (bmp != null && !bmp.isRecycled()) {
                bmp.recycle();
            }
        }
    }

    private JSObject analyzeBitmap(Bitmap bmp, long id, String fileName, String bucketName, long dateAddedSec, boolean forceAcceptIfHasAmount) {
        // 1. QR Code Analysis (EMVCo SlipVerify format)
        InputImage inputImage = InputImage.fromBitmap(bmp, 0);
        String qrPayload = "";
        String qrDetectedBank = null;
        String qrRefCode = null;

        if (barcodeScanner != null) {
            try {
                List<Barcode> barcodes = Tasks.await(barcodeScanner.process(inputImage));
                for (Barcode b : barcodes) {
                    String raw = b.getRawValue();
                    if (raw != null && !raw.isEmpty()) {
                        qrPayload = raw;
                        qrDetectedBank = detectBankFromQR(raw);
                        qrRefCode = extractRefFromQR(raw);
                        break;
                    }
                }
            } catch (Exception ignored) {}
        }

        // 2. OCR Text Analysis
        String ocrText = "";
        if (textRecognizer != null) {
            try {
                Text visionText = Tasks.await(textRecognizer.process(inputImage));
                ocrText = visionText.getText();
            } catch (Exception ignored) {}
        }

        // 3. Dominant Bank Color Analysis (HSV Hue clustering on saturated pixels)
        String colorBank = detectBankFromHeaderHSV(bmp);

        // 4. Folder or Filename Bank Detection
        String folderBank = detectBankFromFolderOrFile(fileName, bucketName);

        // Determine final Bank ID with priority:
        // Priority 1: Official SlipVerify QR code payload (100% standard)
        // Priority 2: Distinct Bank Folder / Filename (e.g. Pictures/K PLUS, SCB_*.jpg)
        // Priority 3: OCR Latin Keywords (e.g. SCB, KBank, Krungthai)
        // Priority 4: Dominant Header HSV Color
        String ocrBank = detectBankFromOCRText(ocrText);
        String finalBankId = "KBANK";
        if (qrDetectedBank != null) {
            finalBankId = qrDetectedBank;
        } else if (folderBank != null) {
            finalBankId = folderBank;
        } else if (ocrBank != null) {
            finalBankId = ocrBank;
        } else if (colorBank != null) {
            finalBankId = colorBank;
        }

        boolean isSlipCandidate = forceAcceptIfHasAmount
            || !qrPayload.isEmpty()
            || isKnownBankOrSlipSource(fileName, bucketName)
            || isSlipByContent(ocrText, qrPayload, colorBank);

        if (!isSlipCandidate) {
            return null;
        }

        ParsedSlip parsed = parseSlipData(ocrText, qrPayload, qrRefCode, fileName, bucketName, dateAddedSec, finalBankId);
        if (parsed.amount <= 0) {
            return null;
        }

        // Create clean thumbnail
        String thumbBase64 = "";
        try {
            int thumbW = 240;
            int thumbH = (int) ((float) bmp.getHeight() / bmp.getWidth() * thumbW);
            Bitmap thumb = Bitmap.createScaledBitmap(bmp, thumbW, Math.max(10, thumbH), true);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            thumb.compress(Bitmap.CompressFormat.JPEG, 70, baos);
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
        slipObj.put("rawOcrText", ocrText);
        slipObj.put("isManual", false);

        Log.d(TAG, "Found Slip: Bank=" + parsed.bankId + " Amt=" + parsed.amount + " Date=" + parsed.date + " Payee=" + parsed.payee);

        return slipObj;
    }

    /**
     * Decode Bank of Thailand (BOT) 3-digit code from SlipVerify QR payloads
     * Format: 0055...0103[BOT_CODE]02...
     */
    private static String detectBankFromQR(String qr) {
        if (qr == null || qr.isEmpty()) return null;

        // Subtag 01 Length 03: 0103[004|014|006|025|011|002|030|069|104]
        Pattern p = Pattern.compile("0103(\\d{3})");
        Matcher m = p.matcher(qr);
        if (m.find()) {
            String code = m.group(1);
            String b = botCodeToBankId(code);
            if (b != null) return b;
        }

        // Direct fallback code search
        if (qr.contains("0004") || qr.contains("0040") || qr.contains("KBANK")) return "KBANK";
        if (qr.contains("0014") || qr.contains("0140") || qr.contains("SCB")) return "SCB";
        if (qr.contains("0006") || qr.contains("0060") || qr.contains("KTB")) return "KTB";
        if (qr.contains("0025") || qr.contains("0250") || qr.contains("BAY")) return "BAY";
        if (qr.contains("0011") || qr.contains("0110") || qr.contains("TTB")) return "TTB";
        if (qr.contains("0002") || qr.contains("0020") || qr.contains("BBL")) return "BBL";
        if (qr.contains("0030") || qr.contains("0300") || qr.contains("GSB")) return "GSB";
        if (qr.contains("0069") || qr.contains("0690") || qr.contains("DIME")) return "DIME";
        if (qr.contains("0104") || qr.contains("1040") || qr.contains("TRUEMONEY")) return "TRUEMONEY";

        return null;
    }

    private static String extractRefFromQR(String qr) {
        if (qr == null || qr.isEmpty()) return null;
        try {
            int sub02 = qr.indexOf("02");
            if (sub02 != -1 && sub02 + 4 < qr.length()) {
                int len = Integer.parseInt(qr.substring(sub02 + 2, sub02 + 4));
                if (len > 8 && sub02 + 4 + len <= qr.length()) {
                    return qr.substring(sub02 + 4, sub02 + 4 + len);
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    private static String botCodeToBankId(String code) {
        switch (code) {
            case "004": return "KBANK";
            case "014": return "SCB";
            case "006": return "KTB";
            case "025": return "BAY";
            case "011": return "TTB";
            case "002": return "BBL";
            case "030": return "GSB";
            case "069": return "DIME";
            case "034": return "BAAC";
            case "065": return "TBANK";
            case "022": return "CIMB";
            case "024": return "UOB";
            case "104": return "TRUEMONEY";
            default: return null;
        }
    }

    private static String detectBankFromFolderOrFile(String fileName, String bucketName) {
        String combined = ((fileName != null ? fileName : "") + " " + (bucketName != null ? bucketName : "")).toLowerCase(Locale.ROOT);
        if (combined.contains("kplus") || combined.contains("k plus") || combined.contains("kbank") || combined.contains("kasikorn")) return "KBANK";
        if (combined.contains("scb") || combined.contains("easy")) return "SCB";
        if (combined.contains("next") || combined.contains("krungthai") || combined.contains("ktb") || combined.contains("paotang")) return "KTB";
        if (combined.contains("kma") || combined.contains("krungsri") || combined.contains("bay") || combined.contains("kept")) return "BAY";
        if (combined.contains("ttb") || combined.contains("tmb") || combined.contains("thanachart")) return "TTB";
        if (combined.contains("bualuang") || combined.contains("bangkok") || combined.contains("bbl")) return "BBL";
        if (combined.contains("mymo") || combined.contains("gsb") || combined.contains("aomsin")) return "GSB";
        if (combined.contains("truemoney") || combined.contains("tmn")) return "TRUEMONEY";
        if (combined.contains("dime") || combined.contains("kkp")) return "DIME";
        if (combined.contains("make") || combined.contains("cloud pocket")) return "MAKE";
        return null;
    }

    private static String detectBankFromOCRText(String text) {
        String upper = text.toUpperCase(Locale.ROOT);
        if (upper.contains("K PLUS") || upper.contains("KBANK") || upper.contains("KPLUS") || upper.contains("KASIKORN")) return "KBANK";
        if (upper.contains("SCB") || upper.contains("EASY APP") || upper.contains("SIAM COMMERCIAL")) return "SCB";
        if (upper.contains("KRUNGTHAI") || upper.contains("NEXT") || upper.contains("PAOTANG") || upper.contains("KTB")) return "KTB";
        if (upper.contains("KRUNGSRI") || upper.contains("KMA") || upper.contains("BAY") || upper.contains("AYUDHYA") || upper.contains("KEPT")) return "BAY";
        if (upper.contains("TTB") || upper.contains("TMB") || upper.contains("THANACHART")) return "TTB";
        if (upper.contains("BANGKOK BANK") || upper.contains("BUALUANG") || upper.contains("BBL")) return "BBL";
        if (upper.contains("MYMO") || upper.contains("GSB")) return "GSB";
        if (upper.contains("TRUEMONEY") || upper.contains("TRUE MONEY")) return "TRUEMONEY";
        if (upper.contains("DIME") || upper.contains("KKP")) return "DIME";
        if (upper.contains("MAKE BY KBANK") || upper.contains("CLOUD POCKET")) return "MAKE";
        return null;
    }

    /**
     * Accurate Bank Detection via HSV Hue Clustering on Saturated Header Pixels
     * Works even if the slip background is white and only the logo has color!
     */
    private String detectBankFromHeaderHSV(Bitmap bmp) {
        try {
            int w = bmp.getWidth();
            int h = Math.max(10, (int) (bmp.getHeight() * 0.28));
            int step = Math.max(2, w / 40);

            int kbankGreen = 0;
            int scbPurple = 0;
            int ktbCyan = 0;
            int bayYellow = 0;
            int bblNavy = 0;
            int gsbPink = 0;
            int orangeColor = 0;

            float[] hsv = new float[3];

            for (int y = 0; y < h; y += step) {
                for (int x = 0; x < w; x += step) {
                    int pixel = bmp.getPixel(x, y);
                    int r = Color.red(pixel);
                    int g = Color.green(pixel);
                    int b = Color.blue(pixel);

                    int max = Math.max(r, Math.max(g, b));
                    int min = Math.min(r, Math.min(g, b));
                    if (max - min < 28) continue; // Skip white, gray, black paper

                    Color.RGBToHSV(r, g, b, hsv);
                    float hue = hsv[0];
                    float sat = hsv[1];
                    float val = hsv[2];

                    if (sat < 0.28f || val < 0.20f || val > 0.98f) continue;

                    if (hue >= 85 && hue <= 165) kbankGreen++;
                    else if (hue >= 250 && hue <= 300) scbPurple++;
                    else if (hue >= 175 && hue <= 218) ktbCyan++;
                    else if (hue >= 38 && hue <= 68) bayYellow++;
                    else if (hue >= 219 && hue <= 248) bblNavy++;
                    else if (hue >= 305 && hue <= 350) gsbPink++;
                    else if (hue >= 12 && hue <= 37) orangeColor++;
                }
            }

            int minThreshold = 25;
            if (scbPurple > minThreshold && scbPurple > kbankGreen && scbPurple > ktbCyan) return "SCB";
            if (kbankGreen > minThreshold && kbankGreen > scbPurple && kbankGreen > ktbCyan) return "KBANK";
            if (ktbCyan > minThreshold && ktbCyan > kbankGreen) return "KTB";
            if (bayYellow > minThreshold && bayYellow > kbankGreen) return "BAY";
            if (gsbPink > minThreshold) return "GSB";
            if (orangeColor > minThreshold) return "TRUEMONEY";
            if (bblNavy > minThreshold) return "BBL";

        } catch (Exception ignored) {}
        return null;
    }

    private boolean isSlipByContent(String text, String qr, String colorBank) {
        String lower = text.toLowerCase(Locale.ROOT);

        if (!qr.isEmpty()) return true;
        if (colorBank != null) return true;

        if (lower.contains("transfer") || lower.contains("successful") || lower.contains("amount") ||
            lower.contains("baht") || lower.contains("thb") || lower.contains("promptpay") ||
            lower.contains("transaction") || lower.contains("ref")) {
            return true;
        }

        boolean hasDecimal = Pattern.compile("\\b([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{1,6})\\s*\\.\\s*[0-9]{2}\\b").matcher(text).find();
        boolean hasTime = Pattern.compile("\\b[0-2]?[0-9][:][0-5][0-9]\\b").matcher(text).find();
        boolean hasMaskedAcc = Pattern.compile("(?i)[xX*]{2,}[-\\s]?[xX*0-9-]{3,}").matcher(text).find();

        return hasDecimal && (hasTime || hasMaskedAcc);
    }

    private static class ParsedSlip {
        String bankId = "KBANK";
        double amount = 0.0;
        String payee = "โอนเงินผ่านระบบ";
        String sender = "บัญชีของฉัน";
        String date = "";
        String time = "12:00";
        String ref = "";
        String categoryId = "food";
    }

    private ParsedSlip parseSlipData(String text, String qr, String qrRef, String fileName, String bucketName, long dateAddedSec, String finalBankId) {
        ParsedSlip p = new ParsedSlip();
        p.bankId = finalBankId != null ? finalBankId : "KBANK";

        // 1. Amount Extraction
        Pattern generalDec = Pattern.compile("\\b([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{1,6})\\s*\\.\\s*([0-9]{2})\\b");
        Matcher m2 = generalDec.matcher(text);
        List<Double> candidates = new ArrayList<>();
        while (m2.find()) {
            try {
                String intPart = m2.group(1).replace(",", "").trim();
                String decPart = m2.group(2).trim();
                double val = Double.parseDouble(intPart + "." + decPart);
                if (val > 0 && val < 1000000 && val != 2024 && val != 2025 && val != 2026 && val != 2567 && val != 2568 && val != 2569) {
                    candidates.add(val);
                }
            } catch (Exception ignored) {}
        }

        if (!candidates.isEmpty()) {
            p.amount = candidates.get(0);
        } else {
            Matcher fnAmt = Pattern.compile("([0-9]{2,5})(?:\\.[0-9]{2})?").matcher(fileName != null ? fileName : "");
            if (fnAmt.find()) {
                try {
                    double v = Double.parseDouble(fnAmt.group(1));
                    if (v > 0 && v < 100000 && v != 2024 && v != 2025 && v != 2026) {
                        p.amount = v;
                    }
                } catch (Exception ignored) {}
            }
        }

        // 2. Date & Time
        long nowSec = System.currentTimeMillis() / 1000;
        long effectiveSec = (dateAddedSec > 1500000000L && dateAddedSec <= nowSec + 86400) ? dateAddedSec : nowSec;
        Date dateObj = new Date(effectiveSec * 1000);
        SimpleDateFormat ymdFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        SimpleDateFormat hmFormat = new SimpleDateFormat("HH:mm", Locale.US);

        p.date = ymdFormat.format(dateObj);
        p.time = hmFormat.format(dateObj);

        Pattern timePattern = Pattern.compile("\\b([0-2]?[0-9]:[0-5][0-9])\\b");
        Matcher timeMatcher = timePattern.matcher(text);
        if (timeMatcher.find()) {
            String rawTime = timeMatcher.group(1);
            if (rawTime.length() == 4) rawTime = "0" + rawTime;
            p.time = rawTime;
        }

        // 3. Reference Code
        if (qrRef != null && !qrRef.isEmpty()) {
            p.ref = qrRef;
        } else {
            Pattern refPattern = Pattern.compile("(?i)(?:Ref|Transaction ID|Trans ID)[:\\s]*([A-Za-z0-9]{10,35})");
            Matcher refMatcher = refPattern.matcher(text);
            if (refMatcher.find()) {
                p.ref = refMatcher.group(1);
            } else {
                Pattern tokenRef = Pattern.compile("\\b(?=[A-Za-z0-9]*\\d)[A-Za-z0-9]{12,35}\\b");
                Matcher tm = tokenRef.matcher(text);
                if (tm.find()) {
                    p.ref = tm.group(0);
                } else if (!qr.isEmpty()) {
                    p.ref = "QR" + Math.abs(qr.hashCode());
                } else {
                    p.ref = p.bankId + "_" + idFromFile(fileName, effectiveSec);
                }
            }
        }

        // 4. Payee Extraction
        String[] lines = text.split("\n");
        int firstMaskedIdx = -1;
        for (int i = 0; i < lines.length; i++) {
            if (lines[i].matches("(?i).*[xX*]{2,}[-\\s]?[xX*0-9-]{3,}.*")) {
                firstMaskedIdx = i;
                break;
            }
        }

        int startIdx = firstMaskedIdx >= 0 ? firstMaskedIdx + 1 : 0;
        for (int i = startIdx; i < lines.length; i++) {
            String trimmed = lines[i].trim();
            if (trimmed.length() < 3) continue;
            if (trimmed.contains(":")) continue;
            if (!p.ref.isEmpty() && trimmed.replace(" ", "").contains(p.ref)) continue;
            if (trimmed.matches("(?i).*[xX*]{2,}[-\\s]?[xX*0-9-]{3,}.*")) continue;
            if (trimmed.matches(".*[0-9]+\\.[0-9]{2}.*")) continue;
            if (trimmed.matches(".*[0-2]?[0-9]:[0-5][0-9].*")) continue;
            if (trimmed.matches(".*\\b[A-Za-z0-9]{10,}\\b.*")) continue;

            StringBuilder cleanBrand = new StringBuilder();
            for (String tok : trimmed.split("\\s+")) {
                if (tok.matches(".*[\\u0080-\\u024F].*")) continue;
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

        // Clear Bank-Specific Label if no specific shop name was found
        if (p.payee.equals("โอนเงินผ่านระบบ") || p.payee.isEmpty()) {
            switch (p.bankId) {
                case "KBANK": p.payee = "กสิกรไทย (K PLUS)"; break;
                case "SCB": p.payee = "ไทยพาณิชย์ (SCB EASY)"; break;
                case "KTB": p.payee = "กรุงไทย (Krungthai NEXT)"; break;
                case "BAY": p.payee = "กรุงศรีอยุธยา (KMA)"; break;
                case "TTB": p.payee = "ทีเอ็มบีธนชาต (ttb touch)"; break;
                case "BBL": p.payee = "กรุงเทพ (Bualuang mBanking)"; break;
                case "GSB": p.payee = "ออมสิน (MyMo)"; break;
                case "TRUEMONEY": p.payee = "ทรูมันนี่ (TrueMoney)"; break;
                case "DIME": p.payee = "เกียรตินาคินภัทร (Dime!)"; break;
                case "MAKE": p.payee = "MAKE by KBank"; break;
                default: p.payee = "สแกนโอนจ่าย QR"; break;
            }
        }

        // Categorize
        String lowerPayee = p.payee.toLowerCase(Locale.ROOT);
        if (lowerPayee.contains("cafe") || lowerPayee.contains("coffee") || lowerPayee.contains("อาหาร") ||
            lowerPayee.contains("7-eleven") || lowerPayee.contains("cj") || lowerPayee.contains("kfc") ||
            lowerPayee.contains("mcdonald") || lowerPayee.contains("starbucks") || lowerPayee.contains("amazon")) {
            p.categoryId = "food";
        } else if (lowerPayee.contains("ptt") || lowerPayee.contains("bpass") ||
                   lowerPayee.contains("m-flow") || lowerPayee.contains("bts") || lowerPayee.contains("mrt") || lowerPayee.contains("grab")) {
            p.categoryId = "transport";
        } else if (lowerPayee.contains("shopee") || lowerPayee.contains("lazada") || lowerPayee.contains("uniqlo") ||
                   lowerPayee.contains("mall") || lowerPayee.contains("shop") || lowerPayee.contains("lotus") || lowerPayee.contains("bigc")) {
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
