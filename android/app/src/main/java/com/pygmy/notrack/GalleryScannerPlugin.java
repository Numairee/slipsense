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
import java.util.concurrent.TimeUnit;
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
                JSObject slipObj = processBitmapStrict(bmp, System.currentTimeMillis(), fileName, "manual", nowSec, true);
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
                int limit = call.getInt("limit", 400);

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
                List<CandidateMedia> screenshotsAndOthersList = new ArrayList<>();
                Set<Long> seenIds = new HashSet<>();

                // Stage 1: Explicitly scan bank folders first (K PLUS, SCB, NEXT, KMA, ttb, etc.)
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

                // Stage 2: Scan recent photos from Screenshots & Downloads (up to 200 images)
                try (Cursor cursor = resolver.query(collection, projection, null, null, sortOrder)) {
                    if (cursor != null) {
                        int idCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID);
                        int nameCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME);
                        int bucketCol = cursor.getColumnIndex(MediaStore.Images.Media.BUCKET_DISPLAY_NAME);
                        int dateCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_ADDED);

                        int inspectedGeneral = 0;
                        while (cursor.moveToNext() && inspectedGeneral < 200) {
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

                            // Only examine screenshots, downloads, or slip files in general scan
                            String lowerBucket = cm.bucket.toLowerCase(Locale.ROOT);
                            String lowerName = (cm.name != null ? cm.name : "").toLowerCase(Locale.ROOT);
                            if (cm.isBankSource || lowerBucket.contains("screenshot") || lowerBucket.contains("download") ||
                                lowerName.contains("screenshot") || lowerName.contains("slip")) {
                                screenshotsAndOthersList.add(cm);
                            }
                        }
                    }
                }

                // Combine: Bank album photos first, then screenshot/download candidates
                List<CandidateMedia> finalQueue = new ArrayList<>(bankFolderList);
                for (CandidateMedia cm : screenshotsAndOthersList) {
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

                Log.d(TAG, "Examined " + scannedCount + " images, found " + parsedSlips.length() + " authentic slips");

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

            return processBitmapStrict(bmp, id, fileName, bucketName, dateAddedSec, isBankSource);

        } catch (Exception e) {
            Log.w(TAG, "processImageUri error: " + e.getMessage());
            return null;
        } finally {
            if (bmp != null && !bmp.isRecycled()) {
                bmp.recycle();
            }
        }
    }

    /**
     * Strict Slip Verification Engine:
     * Eliminates false positives (photos of dogs, nature, food, general screenshots)
     * and strictly extracts authentic bank e-slips only.
     */
    private JSObject processBitmapStrict(Bitmap bmp, long id, String fileName, String bucketName, long dateAddedSec, boolean isBankSource) {
        InputImage inputImage = InputImage.fromBitmap(bmp, 0);

        // 1. Scan QR code
        String qrPayload = "";
        String qrBankId = null;
        String qrRefCode = null;

        if (barcodeScanner != null) {
            try {
                List<Barcode> barcodes = Tasks.await(barcodeScanner.process(inputImage), 4, TimeUnit.SECONDS);
                for (Barcode b : barcodes) {
                    String raw = b.getRawValue();
                    if (raw != null && !raw.isEmpty()) {
                        qrPayload = raw;
                        qrBankId = detectBankFromQR(raw);
                        qrRefCode = extractRefFromQR(raw);
                        break;
                    }
                }
            } catch (Exception ignored) {}
        }

        // 2. Scan OCR text
        String ocrText = "";
        if (textRecognizer != null) {
            try {
                Text visionText = Tasks.await(textRecognizer.process(inputImage), 6, TimeUnit.SECONDS);
                ocrText = visionText.getText();
            } catch (Exception ignored) {}
        }

        // 3. Strict Slip Verification Gate
        boolean hasSlipVerifyQR = !qrPayload.isEmpty() && isAuthenticSlipQR(qrPayload);
        double extractedAmount = extractStrictDecimalAmount(ocrText);

        // An authentic slip MUST have a decimal amount found on the image (e.g. 145.00, 1,280.50)
        // If no decimal amount was read, and no valid slip QR was found, IT IS NOT A SLIP!
        if (extractedAmount <= 0.0 && !hasSlipVerifyQR) {
            return null;
        }

        // Check supporting structural evidence:
        boolean hasMaskedAcc = Pattern.compile("(?i)[xX*]{2,}[-\\s]?[xX*0-9-]{3,}").matcher(ocrText).find();
        boolean hasTime = Pattern.compile("\\b[0-2]?[0-9]:[0-5][0-9]\\b").matcher(ocrText).find();
        boolean hasTransferKeywords = hasSlipKeywords(ocrText);
        boolean hasRefCode = Pattern.compile("(?i)(?:Ref|Transaction ID|Trans ID|เลขที่|รหัส)[:\\s]*[A-Za-z0-9]{10,}").matcher(ocrText).find();

        int evidenceScore = 0;
        if (hasSlipVerifyQR) evidenceScore += 4;
        if (isBankSource) evidenceScore += 2;
        if (extractedAmount > 0.0) evidenceScore += 2;
        if (hasMaskedAcc) evidenceScore += 2;
        if (hasTransferKeywords) evidenceScore += 2;
        if (hasTime) evidenceScore += 1;
        if (hasRefCode) evidenceScore += 2;

        // Requires at least Score >= 3 (e.g. valid QR, OR Amount + Bank Folder, OR Amount + Masked Account + Keywords)
        // General photos of food/nature score 0 and are instantly discarded!
        if (evidenceScore < 3) {
            return null;
        }

        // If amount was not found in OCR text but we have a valid slip QR, use fallback amount if possible, else skip
        if (extractedAmount <= 0.0) {
            return null; // A financial tracker cannot track transactions with 0 baht
        }

        // 4. Determine Bank ID with strict priority
        String folderBank = detectBankFromFolderOrFile(fileName, bucketName);
        String textBank = detectBankFromOCRText(ocrText);
        String colorBank = detectBankFromConcentratedLogoHSV(bmp);

        String finalBankId = "KBANK";
        if (qrBankId != null) {
            finalBankId = qrBankId;
        } else if (folderBank != null) {
            finalBankId = folderBank;
        } else if (textBank != null) {
            finalBankId = textBank;
        } else if (colorBank != null) {
            finalBankId = colorBank;
        }

        // 5. Parse Dates, Times, Payees
        long nowSec = System.currentTimeMillis() / 1000;
        long effectiveSec = (dateAddedSec > 1500000000L && dateAddedSec <= nowSec + 86400) ? dateAddedSec : nowSec;
        Date dateObj = new Date(effectiveSec * 1000);
        SimpleDateFormat ymdFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        SimpleDateFormat hmFormat = new SimpleDateFormat("HH:mm", Locale.US);

        String date = ymdFormat.format(dateObj);
        String time = hmFormat.format(dateObj);

        Matcher tm = Pattern.compile("\\b([0-2]?[0-9]:[0-5][0-9])\\b").matcher(ocrText);
        if (tm.find()) {
            String rawT = tm.group(1);
            time = rawT.length() == 4 ? "0" + rawT : rawT;
        }

        String ref = qrRefCode != null ? qrRefCode : extractRefCodeFromText(ocrText, finalBankId, id, effectiveSec);
        String payee = extractSmartPayee(ocrText, finalBankId);
        String categoryId = matchCategoryByPayee(payee);

        // Generate thumbnail
        String thumbBase64 = "";
        try {
            int thumbW = 220;
            int thumbH = (int) ((float) bmp.getHeight() / bmp.getWidth() * thumbW);
            Bitmap thumb = Bitmap.createScaledBitmap(bmp, thumbW, Math.max(10, thumbH), true);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            thumb.compress(Bitmap.CompressFormat.JPEG, 70, baos);
            thumbBase64 = "data:image/jpeg;base64," + Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP);
            thumb.recycle();
        } catch (Exception ignored) {}

        JSObject slipObj = new JSObject();
        slipObj.put("id", "slip_" + id);
        slipObj.put("bankId", finalBankId);
        slipObj.put("amount", extractedAmount);
        slipObj.put("payee", payee);
        slipObj.put("sender", "บัญชีของฉัน");
        slipObj.put("date", date);
        slipObj.put("time", time);
        slipObj.put("timestamp", effectiveSec * 1000);
        slipObj.put("ref", ref);
        slipObj.put("categoryId", categoryId);
        slipObj.put("slipThumbnail", thumbBase64);
        slipObj.put("rawOcrText", ocrText);
        slipObj.put("isManual", false);

        Log.d(TAG, "VERIFIED SLIP: Bank=" + finalBankId + " Amount=" + extractedAmount + " Date=" + date + " Payee=" + payee);
        return slipObj;
    }

    /**
     * Strict Decimal Amount Parser:
     * Extracts ONLY numbers formatted as amounts with 2 decimal places (e.g. 145.00, 1,280.50).
     * Rejects standalone years (2024, 2025, 2026, 2567, 2568, 2569) and filename numbers.
     */
    private double extractStrictDecimalAmount(String text) {
        if (text == null || text.isEmpty()) return 0.0;

        Pattern decPattern = Pattern.compile("\\b([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{1,6})\\s*\\.\\s*([0-9]{2})\\b");
        Matcher m = decPattern.matcher(text);

        List<Double> candidateAmounts = new ArrayList<>();
        while (m.find()) {
            try {
                String intPart = m.group(1).replace(",", "").trim();
                String decPart = m.group(2).trim();
                double val = Double.parseDouble(intPart + "." + decPart);

                // Reject years and unreasonable values
                if (val >= 1.0 && val < 500000.0 &&
                    val != 2024.0 && val != 2025.0 && val != 2026.0 &&
                    val != 2567.0 && val != 2568.0 && val != 2569.0) {
                    candidateAmounts.add(val);
                }
            } catch (Exception ignored) {}
        }

        if (candidateAmounts.isEmpty()) return 0.0;

        // Prefer amount near explicit keywords (จำนวนเงิน, ยอดเงิน, Amount, บาท, THB)
        String[] lines = text.split("\n");
        for (String line : lines) {
            String lower = line.toLowerCase(Locale.ROOT);
            if (lower.contains("จำนวน") || lower.contains("ยอด") || lower.contains("amount") ||
                lower.contains("baht") || lower.contains("thb") || lower.contains("บาท")) {
                Matcher lm = decPattern.matcher(line);
                if (lm.find()) {
                    try {
                        String intPart = lm.group(1).replace(",", "").trim();
                        String decPart = lm.group(2).trim();
                        double val = Double.parseDouble(intPart + "." + decPart);
                        if (val >= 1.0 && val < 500000.0 && val != 2024.0 && val != 2025.0 && val != 2026.0) {
                            return val;
                        }
                    } catch (Exception ignored) {}
                }
            }
        }

        // Return first valid decimal amount
        return candidateAmounts.get(0);
    }

    private boolean isAuthenticSlipQR(String qr) {
        if (qr == null || qr.length() < 16) return false;
        // PromptPay SlipVerify Mini-QR starts with 00 or has 000001 / 0103
        return qr.contains("000001") || qr.contains("0103") || qr.startsWith("000201") || qr.contains("A000000677");
    }

    private boolean hasSlipKeywords(String text) {
        String lower = text.toLowerCase(Locale.ROOT);
        return lower.contains("transfer") || lower.contains("successful") || lower.contains("success") ||
               lower.contains("promptpay") || lower.contains("baht") || lower.contains("thb") ||
               lower.contains("amount") || lower.contains("transaction") || lower.contains("k plus") ||
               lower.contains("scb") || lower.contains("krungthai") || lower.contains("krungsri") ||
               lower.contains("ttb") || lower.contains("bualuang") || lower.contains("ref") ||
               lower.contains("paid") || lower.contains("payment") || lower.contains("scan");
    }

    /**
     * Decode Bank of Thailand (BOT) 3-digit code from SlipVerify QR payloads
     * Format: ...0103[BOT_CODE]02...
     */
    private static String detectBankFromQR(String qr) {
        if (qr == null || qr.isEmpty()) return null;

        Pattern p = Pattern.compile("0103(\\d{3})");
        Matcher m = p.matcher(qr);
        if (m.find()) {
            String code = m.group(1);
            String b = botCodeToBankId(code);
            if (b != null) return b;
        }

        // Direct code fallback
        if (qr.contains("0004") || qr.contains("0040")) return "KBANK";
        if (qr.contains("0014") || qr.contains("0140")) return "SCB";
        if (qr.contains("0006") || qr.contains("0060")) return "KTB";
        if (qr.contains("0025") || qr.contains("0250")) return "BAY";
        if (qr.contains("0011") || qr.contains("0110")) return "TTB";
        if (qr.contains("0002") || qr.contains("0020")) return "BBL";
        if (qr.contains("0030") || qr.contains("0300")) return "GSB";
        if (qr.contains("0069") || qr.contains("0690")) return "DIME";
        if (qr.contains("0104") || qr.contains("1040")) return "TRUEMONEY";

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
     * Accurate HSV Logo Color Detection:
     * Requires HIGH concentration (>= 350 saturated pixels) in header area.
     * Prevents false positives from nature/food photos.
     */
    private String detectBankFromConcentratedLogoHSV(Bitmap bmp) {
        try {
            int w = bmp.getWidth();
            int h = Math.max(10, (int) (bmp.getHeight() * 0.25));
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
                    if (max - min < 35) continue; // Skip paper, gray, white, black

                    Color.RGBToHSV(r, g, b, hsv);
                    float hue = hsv[0];
                    float sat = hsv[1];
                    float val = hsv[2];

                    if (sat < 0.35f || val < 0.20f || val > 0.95f) continue;

                    if (hue >= 90 && hue <= 160) kbankGreen++;
                    else if (hue >= 255 && hue <= 295) scbPurple++;
                    else if (hue >= 178 && hue <= 215) ktbCyan++;
                    else if (hue >= 40 && hue <= 65) bayYellow++;
                    else if (hue >= 220 && hue <= 245) bblNavy++;
                    else if (hue >= 310 && hue <= 345) gsbPink++;
                    else if (hue >= 15 && hue <= 36) orangeColor++;
                }
            }

            int strictThreshold = 350;
            if (scbPurple >= strictThreshold && scbPurple > kbankGreen) return "SCB";
            if (kbankGreen >= strictThreshold && kbankGreen > scbPurple) return "KBANK";
            if (ktbCyan >= strictThreshold) return "KTB";
            if (bayYellow >= strictThreshold) return "BAY";
            if (gsbPink >= strictThreshold) return "GSB";
            if (orangeColor >= strictThreshold) return "TRUEMONEY";
            if (bblNavy >= strictThreshold) return "BBL";

        } catch (Exception ignored) {}
        return null;
    }

    private String extractRefCodeFromText(String text, String bankId, long id, long effectiveSec) {
        Pattern refPattern = Pattern.compile("(?i)(?:Ref|Transaction ID|Trans ID|เลขที่รายการ|รหัสอ้างอิง)[:\\s]*([A-Za-z0-9]{10,35})");
        Matcher rm = refPattern.matcher(text);
        if (rm.find()) {
            return rm.group(1);
        }

        Pattern tokenRef = Pattern.compile("\\b(?=[A-Za-z0-9]*\\d)[A-Za-z0-9]{14,35}\\b");
        Matcher tm = tokenRef.matcher(text);
        if (tm.find()) {
            return tm.group(0);
        }

        return bankId + "_" + effectiveSec + "_" + id;
    }

    private String extractSmartPayee(String text, String bankId) {
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
                return candidate;
            }
        }

        // Check if there is a second masked account for the receiver
        Matcher accMatcher = Pattern.compile("(?i)([xX*]{2,}[-\\s]?[xX*0-9-]{3,})").matcher(text);
        List<String> accounts = new ArrayList<>();
        while (accMatcher.find()) {
            accounts.add(accMatcher.group(1));
        }
        if (accounts.size() >= 2) {
            return "โอนไปยังบัญชี (" + accounts.get(1) + ")";
        } else if (text.toLowerCase(Locale.ROOT).contains("promptpay") || text.contains("พร้อมเพย์")) {
            return "โอนเงินพร้อมเพย์";
        }

        // Friendly Default
        switch (bankId) {
            case "KBANK": return "โอนเงิน (K PLUS)";
            case "SCB": return "โอนเงิน (SCB EASY)";
            case "KTB": return "โอนเงิน (Krungthai NEXT)";
            case "BAY": return "โอนเงิน (KMA กรุงศรี)";
            case "TTB": return "โอนเงิน (ttb touch)";
            case "BBL": return "โอนเงิน (Bualuang)";
            case "GSB": return "โอนเงิน (MyMo)";
            case "TRUEMONEY": return "โอนเงิน (TrueMoney)";
            case "DIME": return "โอนเงิน (Dime!)";
            case "MAKE": return "โอนเงิน (MAKE)";
            default: return "โอนเงินสำเร็จ";
        }
    }

    private String matchCategoryByPayee(String payee) {
        String lower = payee.toLowerCase(Locale.ROOT);
        if (lower.contains("cafe") || lower.contains("coffee") || lower.contains("อาหาร") ||
            lower.contains("7-eleven") || lower.contains("cj") || lower.contains("kfc") ||
            lower.contains("mcdonald") || lower.contains("starbucks") || lower.contains("amazon")) {
            return "food";
        } else if (lower.contains("ptt") || lower.contains("bpass") ||
                   lower.contains("m-flow") || lower.contains("bts") || lower.contains("mrt") || lower.contains("grab")) {
            return "transport";
        } else if (lower.contains("shopee") || lower.contains("lazada") || lower.contains("uniqlo") ||
                   lower.contains("mall") || lower.contains("shop") || lower.contains("lotus") || lower.contains("bigc")) {
            return "shopping";
        } else {
            return "food";
        }
    }
}
