import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Show Android guide
      alert('วิธีติดตั้งบน Android:\n1. แตะจุด 3 จุด (⋮) มุมขวาบนของ Chrome\n2. เลือก "ติดตั้งแอป" หรือ "เพิ่มลงในหน้าจอหลัก" (Add to Home screen)');
    }
  };

  if (isInstalled || isDismissed) return null;

  return (
    <div className="mx-4 mb-3 p-3 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-emerald-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-2 shadow-xs animate-fade-in">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Smartphone className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h5 className="font-bold text-xs text-neutral-900 leading-tight">
            ติดตั้ง Pygmy บน Android
          </h5>
          <p className="text-[10px] text-neutral-600 truncate">
            ใช้งานแบบเต็มหน้าจอเหมือนแอปแท้ 100%
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstall}
          className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-[11px] hover:bg-amber-600 active:scale-95 shadow-xs transition-all flex items-center gap-1"
        >
          <Download className="w-3 h-3" />
          ติดตั้ง
        </button>

        <button
          onClick={() => setIsDismissed(true)}
          className="w-6 h-6 rounded-full hover:bg-neutral-200 flex items-center justify-center text-neutral-400"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
