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
import com.google.mlkit.vision.barcode.BarcodeScannerOptions;
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
            BarcodeScannerOptions qrOnlyOptions = new BarcodeScannerOptions.Builder()
                .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
                .build();
            barcodeScanner = BarcodeScanning.getClient(qrOnlyOptions);
            Log.d(TAG, "ML Kit initialized successfully (QR-only & Latin OCR)");

            // Warm up native ML Kit models asynchronously in background so first scan is instant
            new Thread(() -> {
                try {
                    Bitmap dummy = Bitmap.createBitmap(32, 32, Bitmap.Config.ARGB_8888);
                    InputImage dummyImg = InputImage.fromBitmap(dummy, 0);
                    if (textRecognizer != null) textRecognizer.process(dummyImg);
                    if (barcodeScanner != null) barcodeScanner.process(dummyImg);
                    Log.d(TAG, "ML Kit pre-warm finished in background");
                } catch (Exception ignored) {}
            }).start();
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

    /**
     * Resilient MediaStore Scanner:
     * Does NOT use fragile SQL LIKE clauses which fail across Android 14/15 OEM ROMs (iQOO/Vivo, Samsung, Xiaomi).
     * Scans recent photos directly and accurately matches Thai albums (ภาพหน้าจอ, ดาวน์โหลด, etc.)
     * and bank albums (K PLUS, SCB, NEXT, etc.).
     */
    private void executeGalleryScan(PluginCall call) {
        new Thread(() -> {
            try {
                int maxToInspect = call.getInt("limit", 400);

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

                List<CandidateMedia> highPriorityList = new ArrayList<>();
                List<CandidateMedia> standardList = new ArrayList<>();
                Set<Long> seenIds = new HashSet<>();

                // Clean direct query without fragile SQL LIKE filters
                try (Cursor cursor = resolver.query(collection, projection, null, null, sortOrder)) {
                    if (cursor != null) {
                        int idCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID);
                        int nameCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME);
                        int bucketCol = cursor.getColumnIndex(MediaStore.Images.Media.BUCKET_DISPLAY_NAME);
                        int dateCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_ADDED);

                        int totalInspected = 0;
                        while (cursor.moveToNext() && totalInspected < maxToInspect) {
                            totalInspected++;
                            long id = cursor.getLong(idCol);
                            if (seenIds.contains(id)) continue;
                            seenIds.add(id);

                            CandidateMedia cm = new CandidateMedia();
                            cm.id = id;
                            cm.name = cursor.getString(nameCol);
                            cm.bucket = bucketCol >= 0 ? cursor.getString(bucketCol) : "";
                            cm.dateAdded = cursor.getLong(dateCol);
                            cm.isBankSource = isKnownBankOrSlipSource(cm.name, cm.bucket);

                            if (cm.isBankSource) {
                                highPriorityList.add(cm);
                            } else if (isLikelySlipContainer(cm.name, cm.bucket)) {
                                standardList.add(cm);
                            } else {
                                // Keep general photos if queue has capacity
                                if (standardList.size() < 120) {
                                    standardList.add(cm);
                                }
                            }
                        }
                    }
                }

                // Prioritize bank folders & screenshots/downloads first
                List<CandidateMedia> finalQueue = new ArrayList<>(highPriorityList);
                finalQueue.addAll(standardList);

                Log.d(TAG, "Scanned " + finalQueue.size() + " candidate images from device");

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

    /**
     * Checks if file or folder is specifically a Thai bank album
     */
    private boolean isKnownBankOrSlipSource(String fileName, String bucketName) {
        String combined = ((fileName != null ? fileName : "") + " " + (bucketName != null ? bucketName : "")).toLowerCase(Locale.ROOT);
        return combined.contains("k plus") || combined.contains("kplus") || combined.contains("kbank") ||
               combined.contains("scb") || combined.contains("krungthai") || combined.contains("next") ||
               combined.contains("ktb") || combined.contains("kma") || combined.contains("krungsri") ||
               combined.contains("bay") || combined.contains("ttb") || combined.contains("tmb") ||
               combined.contains("bualuang") || combined.contains("bangkok") || combined.contains("bbl") ||
               combined.contains("mymo") || combined.contains("gsb") || combined.contains("truemoney") ||
               combined.contains("dime") || combined.contains("make") || combined.contains("slip") ||
               combined.contains("transfer") || combined.contains("promptpay") ||
               combined.contains("สลิป") || combined.contains("โอน") || combined.contains("กสิกร") ||
               combined.contains("ไทยพาณิชย์") || combined.contains("กรุงไทย") || combined.contains("กรุงศรี") ||
               combined.contains("ออมสิน") || combined.contains("พร้อมเพย์");
    }

    /**
     * Checks if folder is a common screenshot, download, or messaging container in Thai or English
     */
    private boolean isLikelySlipContainer(String fileName, String bucketName) {
        String combined = ((fileName != null ? fileName : "") + " " + (bucketName != null ? bucketName : "")).toLowerCase(Locale.ROOT);
        return combined.contains("screenshot") || combined.contains("ภาพหน้าจอ") || combined.contains("แคป") ||
               combined.contains("download") || combined.contains("ดาวน์โหลด") || combined.contains("line") ||
               combined.contains("facebook") || combined.contains("messenger") || combined.contains("wechat") ||
               combined.contains("pictures") || combined.contains("dcim") || combined.contains("camera") ||
               combined.contains("รูปภาพ");
    }

    private JSObject processImageUri(ContentResolver resolver, Uri uri, long id, String fileName, String bucketName, long dateAddedSec, boolean isBankSource) {
        Bitmap bmp = null;
        try {
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inJustDecodeBounds = true;
            try (InputStream is = resolver.openInputStream(uri)) {
                BitmapFactory.decodeStream(is, null, options);
            }

            int reqDimension = 720;
            int maxDim = Math.max(options.outWidth, options.outHeight);
            int inSampleSize = 1;
            while ((maxDim / inSampleSize) > reqDimension) {
                inSampleSize *= 2;
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
        }
    }

    /**
     * SlipSense Verification Engine:
     * Robustly extracts authentic bank e-slips from all Thai banks.
     * Prevents rejecting valid slips by recognizing Thai keywords and diverse amount styles.
     */
    private JSObject processBitmapStrict(Bitmap bmp, long id, String fileName, String bucketName, long dateAddedSec, boolean isBankSource) {
        InputImage inputImage = InputImage.fromBitmap(bmp, 0);

        // 1. Scan OCR text first (slips always have transaction text)
        String ocrText = "";
        if (textRecognizer != null) {
            try {
                Text visionText = Tasks.await(textRecognizer.process(inputImage));
                ocrText = visionText.getText();
            } catch (Exception e) {
                Log.d(TAG, "Text OCR note for " + fileName + ": " + e.getMessage());
            }
        }

        // 2. Scan QR code (SlipVerify / PromptPay Mini QR - QR format only for max speed)
        String qrPayload = "";
        String qrBankId = null;
        String qrRefCode = null;

        if (barcodeScanner != null) {
            try {
                List<Barcode> barcodes = Tasks.await(barcodeScanner.process(inputImage));
                for (Barcode b : barcodes) {
                    String raw = b.getRawValue();
                    if (raw != null && !raw.isEmpty()) {
                        qrPayload = raw;
                        qrBankId = detectBankFromQR(raw);
                        qrRefCode = extractRefFromQR(raw);
                        break;
                    }
                }
            } catch (Exception e) {
                Log.d(TAG, "Barcode scan note for " + fileName + ": " + e.getMessage());
            }
        }

        // 3. Verification & Amount Extraction
        boolean hasSlipVerifyQR = !qrPayload.isEmpty() && isAuthenticSlipQR(qrPayload);
        double extractedAmount = extractSmartAmount(ocrText);

        Log.d(TAG, "Evaluated " + fileName + ": QR=" + (!qrPayload.isEmpty()) + ", ocrLen=" + ocrText.length() + ", amount=" + extractedAmount);

        // Check supporting structural evidence:
        boolean hasMaskedAcc = Pattern.compile("(?i)[xX*]{2,}[-\\s]?[xX*0-9-]{3,}").matcher(ocrText).find();
        boolean hasTime = Pattern.compile("\\b[0-2]?[0-9]:[0-5][0-9]\\b").matcher(ocrText).find();
        boolean hasTransferKeywords = hasSlipKeywords(ocrText);
        boolean hasRefCode = Pattern.compile("(?i)(?:Ref|Transaction ID|Trans ID|เลขที่|รหัส|อ้างอิง)[:\\s]*[A-Za-z0-9]{8,}").matcher(ocrText).find();

        String folderBank = detectBankFromFolderOrFile(fileName, bucketName);
        String textBank = detectBankFromOCRText(ocrText);
        String colorBank = detectBankFromConcentratedLogoHSV(bmp);

        // If no amount was extracted, try fallback if it has strong bank slip indicators
        if (extractedAmount <= 0.0) {
            if (hasSlipVerifyQR || isBankSource || folderBank != null || colorBank != null || hasTransferKeywords) {
                extractedAmount = extractAnyNumberFallback(ocrText);
            }
            if (extractedAmount <= 0.0 && !hasSlipVerifyQR) {
                return null;
            }
        }

        int evidenceScore = 0;
        if (hasSlipVerifyQR) evidenceScore += 5;
        if (isBankSource || folderBank != null) evidenceScore += 2;
        if (extractedAmount > 0.0) evidenceScore += 2;
        if (hasMaskedAcc) evidenceScore += 2;
        if (hasTransferKeywords) evidenceScore += 2;
        if (hasTime) evidenceScore += 1;
        if (hasRefCode) evidenceScore += 2;
        if (textBank != null) evidenceScore += 2;
        if (colorBank != null) evidenceScore += 2;

        // Evidence threshold: Needs at least 2 points to be verified (e.g. amount + keywords, or QR)
        Log.d(TAG, "Evidence for " + fileName + ": score=" + evidenceScore + " (QR=" + hasSlipVerifyQR + ", amount=" + extractedAmount + ", bankSource=" + isBankSource + ", textBank=" + textBank + ", colorBank=" + colorBank + ")");
        if (evidenceScore < 2) {
            return null;
        }

        // 4. Determine Bank ID with strict priority
        String finalBankId = "KBANK";
        if (qrBankId != null) {
            finalBankId = qrBankId;
        } else if (textBank != null) {
            finalBankId = textBank;
        } else if (colorBank != null) {
            finalBankId = colorBank;
        } else if (folderBank != null) {
            finalBankId = folderBank;
        }

        // 5. Parse Dates, Times, Payees
        long nowSec = System.currentTimeMillis() / 1000;
        long effectiveSec = (dateAddedSec > 1500000000L && dateAddedSec <= nowSec + 86400) ? dateAddedSec : nowSec;
        Date dateObj = new Date(effectiveSec * 1000);
        SimpleDateFormat ymdFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        SimpleDateFormat hmFormat = new SimpleDateFormat("HH:mm", Locale.US);

        String date = ymdFormat.format(dateObj);
        String time = hmFormat.format(dateObj);

        // Extract precise transaction date from OCR text if present
        date = extractDateFromText(ocrText, date);

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
     * Smart Amount Parser:
     * Supports standard decimals (145.00, 1,280.50), dot-dash (145.-),
     * and integer amounts preceded by currency/transfer keywords.
     */
    private double extractSmartAmount(String text) {
        if (text == null || text.isEmpty()) return 0.0;

        // 1. Check lines with explicit keywords first (จำนวนเงิน, ยอดเงิน, Amount, บาท, THB, ฿)
        Pattern decPattern = Pattern.compile("([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{1,6})\\s*[.,]\\s*([0-9]{2})");
        Pattern intPatternWithCues = Pattern.compile("(?i)(?:จำนวนเงิน|ยอดโอน|ยอดเงิน|amount|baht|thb|บาท|฿)[:\\s]*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{1,6})\\b");

        String[] lines = text.split("\n");
        for (String line : lines) {
            String lower = line.toLowerCase(Locale.ROOT);
            if (lower.contains("จำนวน") || lower.contains("ยอด") || lower.contains("amount") ||
                lower.contains("baht") || lower.contains("thb") || lower.contains("บาท") || lower.contains("฿")) {

                // Try decimal in keyword line
                Matcher dm = decPattern.matcher(line);
                if (dm.find()) {
                    try {
                        String intPart = dm.group(1).replace(",", "").trim();
                        String decPart = dm.group(2).trim();
                        double val = Double.parseDouble(intPart + "." + decPart);
                        if (isValidAmount(val)) return val;
                    } catch (Exception ignored) {}
                }

                // Try integer with cue
                Matcher im = intPatternWithCues.matcher(line);
                if (im.find()) {
                    try {
                        String rawNum = im.group(1).replace(",", "").trim();
                        double val = Double.parseDouble(rawNum);
                        if (isValidAmount(val)) return val;
                    } catch (Exception ignored) {}
                }
            }
        }

        // 2. Scan entire text for standard 2-decimal numbers (e.g. 145.00, 1,250.50)
        Matcher m = decPattern.matcher(text);
        List<Double> candidateAmounts = new ArrayList<>();
        while (m.find()) {
            try {
                String intPart = m.group(1).replace(",", "").trim();
                String decPart = m.group(2).trim();
                double val = Double.parseDouble(intPart + "." + decPart);
                if (isValidAmount(val)) {
                    candidateAmounts.add(val);
                }
            } catch (Exception ignored) {}
        }

        if (!candidateAmounts.isEmpty()) {
            return candidateAmounts.get(0);
        }

        // 3. Scan for dot-dash format (e.g. 145.-)
        Pattern dashPattern = Pattern.compile("\\b([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{1,6})\\s*[.,]\\s*-\\b");
        Matcher dashM = dashPattern.matcher(text);
        if (dashM.find()) {
            try {
                String num = dashM.group(1).replace(",", "").trim();
                double val = Double.parseDouble(num);
                if (isValidAmount(val)) return val;
            } catch (Exception ignored) {}
        }

        return 0.0;
    }

    /**
     * Extracts precise transaction date from OCR text (Thai months & BE years)
     */
    private String extractDateFromText(String text, String fallbackDate) {
        if (text == null || text.isEmpty()) return fallbackDate;
        String[] thMonths = {"ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."};
        for (int i = 0; i < thMonths.length; i++) {
            String mStr = thMonths[i];
            if (text.contains(mStr)) {
                Pattern p = Pattern.compile("([0-3]?[0-9])\\s*" + Pattern.quote(mStr) + "\\s*([0-9]{2,4})");
                Matcher m = p.matcher(text);
                if (m.find()) {
                    try {
                        int day = Integer.parseInt(m.group(1));
                        int rawY = Integer.parseInt(m.group(2));
                        int year = rawY;
                        if (rawY >= 2500) year = rawY - 543;
                        else if (rawY < 100) year = rawY + 2500 - 543; // e.g. 69 -> 2569 -> 2026
                        int month = i + 1;
                        return String.format(Locale.US, "%04d-%02d-%02d", year, month, day);
                    } catch (Exception ignored) {}
                }
            }
        }
        return fallbackDate;
    }

    private double extractAnyNumberFallback(String text) {
        if (text == null || text.isEmpty()) return 0.0;
        Pattern p = Pattern.compile("\\b([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{2,6})\\b");
        Matcher m = p.matcher(text);
        while (m.find()) {
            try {
                double val = Double.parseDouble(m.group(1).replace(",", ""));
                if (isValidAmount(val)) return val;
            } catch (Exception ignored) {}
        }
        return 0.0;
    }

    private boolean isValidAmount(double val) {
        if (val < 1.0 || val > 1000000.0) return false;
        // Reject common Thai BE and CE years
        if (val == 2023.0 || val == 2024.0 || val == 2025.0 || val == 2026.0 ||
            val == 2566.0 || val == 2567.0 || val == 2568.0 || val == 2569.0) {
            return false;
        }
        return true;
    }

    private boolean isAuthenticSlipQR(String qr) {
        if (qr == null || qr.length() < 12) return false;
        return qr.contains("000001") || qr.contains("0103") || qr.startsWith("000201") || qr.contains("A000000677") || qr.contains("promptpay");
    }

    private boolean hasSlipKeywords(String text) {
        String lower = text.toLowerCase(Locale.ROOT);
        return lower.contains("โอน") || lower.contains("สำเร็จ") || lower.contains("บาท") ||
               lower.contains("จำนวน") || lower.contains("ยอด") || lower.contains("พร้อมเพย์") ||
               lower.contains("บัญชี") || lower.contains("รายการ") || lower.contains("เวลา") ||
               lower.contains("วันที่") || lower.contains("ผู้รับ") || lower.contains("ผู้โอน") ||
               lower.contains("ธนาคาร") || lower.contains("ค่าธรรมเนียม") ||
               lower.contains("transfer") || lower.contains("successful") || lower.contains("success") ||
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
        if (combined.contains("kplus") || combined.contains("k plus") || combined.contains("kbank") || combined.contains("kasikorn") || combined.contains("กสิกร")) return "KBANK";
        if (combined.contains("scb") || combined.contains("easy") || combined.contains("ไทยพาณิชย์")) return "SCB";
        if (combined.contains("next") || combined.contains("krungthai") || combined.contains("ktb") || combined.contains("paotang") || combined.contains("กรุงไทย")) return "KTB";
        if (combined.contains("kma") || combined.contains("krungsri") || combined.contains("bay") || combined.contains("kept") || combined.contains("กรุงศรี")) return "BAY";
        if (combined.contains("ttb") || combined.contains("tmb") || combined.contains("thanachart") || combined.contains("ทหารไทย")) return "TTB";
        if (combined.contains("bualuang") || combined.contains("bangkok") || combined.contains("bbl") || combined.contains("กรุงเทพ")) return "BBL";
        if (combined.contains("mymo") || combined.contains("gsb") || combined.contains("aomsin") || combined.contains("ออมสิน")) return "GSB";
        if (combined.contains("truemoney") || combined.contains("tmn") || combined.contains("ทรูมันนี่")) return "TRUEMONEY";
        if (combined.contains("dime") || combined.contains("kkp") || combined.contains("เกียรตินาคิน")) return "DIME";
        if (combined.contains("make") || combined.contains("cloud pocket")) return "MAKE";
        return null;
    }

    private static String detectBankFromOCRText(String text) {
        String upper = text.toUpperCase(Locale.ROOT);
        if (upper.contains("K PLUS") || upper.contains("KBANK") || upper.contains("KPLUS") || upper.contains("KASIKORN") || text.contains("กสิกร")) return "KBANK";
        if (upper.contains("SCB") || upper.contains("EASY APP") || upper.contains("SIAM COMMERCIAL") || text.contains("ไทยพาณิชย์")) return "SCB";
        if (upper.contains("KRUNGTHAI") || upper.contains("NEXT") || upper.contains("PAOTANG") || upper.contains("KTB") || text.contains("กรุงไทย")) return "KTB";
        if (upper.contains("KRUNGSRI") || upper.contains("KMA") || upper.contains("BAY") || upper.contains("AYUDHYA") || upper.contains("KEPT") || text.contains("กรุงศรี")) return "BAY";
        if (upper.contains("TTB") || upper.contains("TMB") || upper.contains("THANACHART") || text.contains("ทหารไทย")) return "TTB";
        if (upper.contains("BANGKOK BANK") || upper.contains("BUALUANG") || upper.contains("BBL") || text.contains("กรุงเทพ")) return "BBL";
        if (upper.contains("MYMO") || upper.contains("GSB") || text.contains("ออมสิน")) return "GSB";
        if (upper.contains("TRUEMONEY") || upper.contains("TRUE MONEY") || text.contains("ทรูมันนี่")) return "TRUEMONEY";
        if (upper.contains("DIME") || upper.contains("KKP") || text.contains("เกียรตินาคิน")) return "DIME";
        if (upper.contains("MAKE BY KBANK") || upper.contains("CLOUD POCKET")) return "MAKE";
        return null;
    }

    /**
     * Accurate HSV Logo Color Detection
     */
    private String detectBankFromConcentratedLogoHSV(Bitmap bmp) {
        try {
            int w = bmp.getWidth();
            int h = Math.max(10, (int) (bmp.getHeight() * 0.28));
            int step = Math.max(2, w / 45);

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
                    if (max - min < 30) continue;

                    Color.RGBToHSV(r, g, b, hsv);
                    float hue = hsv[0];
                    float sat = hsv[1];
                    float val = hsv[2];

                    if (sat < 0.30f || val < 0.20f || val > 0.95f) continue;

                    if (hue >= 90 && hue <= 160) kbankGreen++;
                    else if (hue >= 255 && hue <= 295) scbPurple++;
                    else if (hue >= 178 && hue <= 215) ktbCyan++;
                    else if (hue >= 40 && hue <= 65) bayYellow++;
                    else if (hue >= 220 && hue <= 245) bblNavy++;
                    else if (hue >= 310 && hue <= 345) gsbPink++;
                    else if (hue >= 15 && hue <= 36) orangeColor++;
                }
            }

            int threshold = 200;
            if (scbPurple >= threshold && scbPurple > kbankGreen) return "SCB";
            if (kbankGreen >= threshold && kbankGreen > scbPurple) return "KBANK";
            if (ktbCyan >= threshold) return "KTB";
            if (bayYellow >= threshold) return "BAY";
            if (gsbPink >= threshold) return "GSB";
            if (orangeColor >= threshold) return "TRUEMONEY";
            if (bblNavy >= threshold) return "BBL";

        } catch (Exception ignored) {}
        return null;
    }

    private String extractRefCodeFromText(String text, String bankId, long id, long effectiveSec) {
        Pattern refPattern = Pattern.compile("(?i)(?:Ref|Transaction ID|Trans ID|เลขที่รายการ|รหัสอ้างอิง)[:\\s]*([A-Za-z0-9]{8,35})");
        Matcher rm = refPattern.matcher(text);
        if (rm.find()) {
            return rm.group(1);
        }

        Pattern tokenRef = Pattern.compile("\\b(?=[A-Za-z0-9]*\\d)[A-Za-z0-9]{12,35}\\b");
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
