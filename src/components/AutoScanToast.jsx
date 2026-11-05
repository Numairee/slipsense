import React from 'react';
import { Sparkles, CheckCircle, X, ArrowRight } from 'lucide-react';

export default function AutoScanToast({ notification, onClose }) {
  if (!notification) return null;

  return (
    <div className="fixed top-3 left-4 right-4 z-50 max-w-md mx-auto animate-slide-down">
      <div className="p-3.5 bg-neutral-900 text-white rounded-2xl shadow-xl border border-neutral-700/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-base shrink-0 shadow-xs">
            🐐
          </div>
          <div className="min-w-0">
            <h5 className="font-extrabold text-xs text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              กวาดสลิปอัตโนมัติสำเร็จ!
            </h5>
            <p className="text-[11px] text-neutral-300 truncate">
              {notification.message}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
