import React from 'react';
import { Sparkles, X, Camera } from 'lucide-react';

export default function AutoScanToast({ notification, onClose }) {
  if (!notification) return null;

  return (
    <div className="fixed top-[max(calc(env(safe-area-inset-top,0px)+12px),44px)] left-3 right-3 z-50 max-w-md mx-auto animate-slide-down">
      <div className="p-3.5 bg-neutral-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-white/15 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-lg shrink-0 shadow-xs">
            🐐
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="font-extrabold text-xs text-amber-400 flex items-center gap-1 leading-tight">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{notification.title || 'ระบบกวาดสลิปอัตโนมัติ'}</span>
            </h5>
            <p className="text-[11px] text-neutral-200 leading-snug mt-0.5 line-clamp-2">
              {notification.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {notification.actionLabel && notification.onAction && (
            <button
              onClick={() => {
                notification.onAction();
                onClose();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-[11px] flex items-center gap-1 active:scale-95 transition-all"
            >
              <Camera className="w-3 h-3" />
              <span>{notification.actionLabel}</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
