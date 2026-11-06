import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';
import { AutoScanner } from '../utils/galleryAutoScanner';

export default function InstallPrompt() {
  const [isDismissed, setIsDismissed] = useState(false);
  const isNative = AutoScanner.isNative();

  // If already running inside Native APK, do not show download prompt
  if (isNative || isDismissed) return null;

  return (
    <div className="mb-3 p-3.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/20 border-2 border-amber-500/40 rounded-2xl flex items-center justify-between gap-3 shadow-sm animate-fade-in">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs text-xl">
          📱
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h5 className="font-extrabold text-xs text-neutral-900 leading-tight">
              ติดตั้ง Pygmy v1.0.2 สำหรับ Android (.apk)
            </h5>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-500 text-white uppercase tracking-wider">
              iQOO 15
            </span>
          </div>
          <p className="text-[11px] text-neutral-600 mt-0.5 leading-snug">
            ติดตั้งลงเครื่องเพื่อ <strong className="text-amber-700">กวาดอ่านสลิปในอัลบั้มอัตโนมัติ</strong> ในเครื่องทันที
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <a
          href="https://github.com/Numairee/pygmy-android/releases/download/v1.0.2/Pygmy-iQOO15.apk"
          download="Pygmy-iQOO15.apk"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs hover:from-amber-600 hover:to-orange-600 active:scale-95 shadow-xs transition-all flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>โหลด APK</span>
        </a>

        <button
          onClick={() => setIsDismissed(true)}
          className="w-7 h-7 rounded-full hover:bg-neutral-200 flex items-center justify-center text-neutral-400 transition-colors"
          title="ปิดการแจ้งเตือน"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
