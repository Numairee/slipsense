package com.pygmy.notrack;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

@CapacitorPlugin(
    name = "GalleryScanner",
    permissions = {
        @Permission(
            alias = "images",
            strings = {
                Manifest.permission.READ_MEDIA_IMAGES,
                Manifest.permission.READ_EXTERNAL_STORAGE
            }
        )
    }
)
public class GalleryScannerPlugin extends Plugin {

    @PluginMethod
    public void scanRecentSlips(PluginCall call) {
        if (!hasRequiredPermissions()) {
            requestPermissionForAlias("images", call, "imagesPermsCallback");
            return;
        }

        readRecentGalleryImages(call);
    }

    @PermissionCallback
    private void imagesPermsCallback(PluginCall call) {
        if (hasRequiredPermissions()) {
            readRecentGalleryImages(call);
        } else {
            call.reject("Permission to read photos was denied");
        }
    }

    private void readRecentGalleryImages(PluginCall call) {
        new Thread(() -> {
            try {
                int limit = call.getInt("limit", 30);
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

                String selection = MediaStore.Images.Media.DATE_ADDED + " >= ?";
                String[] selectionArgs = new String[] { String.valueOf(sinceSeconds) };
                String sortOrder = MediaStore.Images.Media.DATE_ADDED + " DESC LIMIT " + limit;

                Cursor cursor = resolver.query(collection, projection, selection, selectionArgs, sortOrder);
                JSArray results = new JSArray();

                if (cursor != null) {
                    int idCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID);
                    int nameCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME);
                    int dateCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_ADDED);

                    while (cursor.moveToNext() && results.length() < limit) {
                        long id = cursor.getLong(idCol);
                        String name = cursor.getString(nameCol);
                        long dateAdded = cursor.getLong(dateCol);

                        Uri contentUri = ContentUris.withAppendedId(collection, id);

                        // Load and scale down image to prevent memory exhaustion and speed up OCR
                        try (InputStream is = resolver.openInputStream(contentUri)) {
                            BitmapFactory.Options options = new BitmapFactory.Options();
                            options.inJustDecodeBounds = true;
                            BitmapFactory.decodeStream(is, null, options);

                            // Calculate inSampleSize (target ~800-1000px max dimension)
                            int reqDim = 900;
                            int inSampleSize = 1;
                            if (options.outHeight > reqDim || options.outWidth > reqDim) {
                                int halfH = options.outHeight / 2;
                                int halfW = options.outWidth / 2;
                                while ((halfH / inSampleSize) >= reqDim && (halfW / inSampleSize) >= reqDim) {
                                    inSampleSize *= 2;
                                }
                            }

                            // Re-open stream to decode actual bitmap
                            try (InputStream is2 = resolver.openInputStream(contentUri)) {
                                BitmapFactory.Options decodeOpts = new BitmapFactory.Options();
                                decodeOpts.inSampleSize = inSampleSize;
                                Bitmap bmp = BitmapFactory.decodeStream(is2, null, decodeOpts);

                                if (bmp != null) {
                                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                                    bmp.compress(Bitmap.CompressFormat.JPEG, 70, baos);
                                    byte[] bytes = baos.toByteArray();
                                    String b64 = Base64.encodeToString(bytes, Base64.NO_WRAP);

                                    JSObject item = new JSObject();
                                    item.put("id", String.valueOf(id));
                                    item.put("name", name);
                                    item.put("dateAdded", dateAdded);
                                    item.put("dataUrl", "data:image/jpeg;base64," + b64);
                                    results.put(item);

                                    bmp.recycle();
                                }
                            }
                        } catch (Exception e) {
                            // Skip individual corrupted or inaccessible image
                        }
                    }
                    cursor.close();
                }

                JSObject res = new JSObject();
                res.put("photos", results);
                call.resolve(res);

            } catch (Exception e) {
                call.reject("Error scanning gallery: " + e.getMessage());
            }
        }).start();
    }
}
