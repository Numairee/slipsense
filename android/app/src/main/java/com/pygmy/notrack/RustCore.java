package com.pygmy.notrack;

public class RustCore {
    private static boolean isLoaded = false;

    static {
        try {
            System.loadLibrary("pygmy_core");
            isLoaded = true;
        } catch (UnsatisfiedLinkError e) {
            isLoaded = false;
        }
    }

    public static boolean isAvailable() {
        return isLoaded;
    }

    public static native String parseSlipText(String ocrText);
    public static native String computeSlipHash(String bankId, double amount, String date, String time, String refCode);
}
