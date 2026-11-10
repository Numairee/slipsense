import React, { useState } from 'react';
import { Download, X, Zap } from 'lucide-react';
import { AutoScanner } from '../utils/galleryAutoScanner';
import { useI18n } from '../i18n/index.jsx';

export default function InstallPrompt() {
  const { t } = useI18n();
  const [isDismissed, setIsDismissed] = useState(false);
  const isNative = AutoScanner.isNative();

  // If already running inside Native APK, do not show download prompt
  if (isNative || isDismissed) return null;

  return (
    <div className="mb-3 p-3.5 bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-blue-500/15 border border-cyan-500/30 rounded-2xl flex items-center justify-between gap-3 shadow-md animate-fade-in text-white">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md">
          <Zap className="w-5 h-5 fill-white text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h5 className="font-extrabold text-xs text-white leading-tight">
              {t('installTitle')}
            </h5>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-cyan-500 text-white uppercase tracking-wider">
              NEW
            </span>
          </div>
          <p className="text-[11px] text-neutral-300 mt-0.5 leading-snug">
            {t('installDesc')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <a
          href="https://github.com/Numairee/slipsense/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-extrabold text-xs hover:from-emerald-600 hover:to-cyan-600 active:scale-95 shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t('downloadApk')}</span>
        </a>

        <button
          onClick={() => setIsDismissed(true)}
          className="w-7 h-7 rounded-full hover:bg-neutral-800 flex items-center justify-center text-neutral-400 transition-colors"
          title={t('close')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
