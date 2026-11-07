import React from 'react';
import { Sparkles, X, Camera, Zap } from 'lucide-react';

export default function AutoScanToast({ notification, onClose }) {
  if (!notification) return null;

  return (
    <div className="fixed top-[max(calc(env(safe-area-inset-top,0px)+12px),44px)] left-3 right-3 z-50 max-w-md mx-auto animate-slide-down">
      <div className="p-3.5 bg-neutral-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-cyan-500/30 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Zap className="w-5 h-5 fill-white text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="font-extrabold text-xs text-cyan-300 flex items-center gap-1 leading-tight">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{notification.title || 'SlipSense Scanner'}</span>
            </h5>
            <p className="text-[11px] text-neutral-300 leading-snug mt-0.5 line-clamp-2">
              {notification.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-start">
          {notification.actionLabel && notification.onAction && (
            <button
              onClick={() => {
                notification.onAction();
                onClose();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-extrabold text-[11px] flex items-center gap-1 active:scale-95 transition-all shadow-sm"
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

      {/* Real-time Progress Bar */}
      {notification.progress && notification.progress.total > 0 && (
        <div className="mt-1.5 p-2.5 bg-neutral-900/95 backdrop-blur-md rounded-xl border border-cyan-500/20 shadow-lg space-y-1.5 animate-fade-in">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-cyan-300 font-bold">
              🔍 กำลังสแกน {notification.progress.scanned} / {notification.progress.total} รูป ({notification.progress.percent}%)
            </span>
            <span className="text-emerald-400 font-black">
              พบสลิป {notification.progress.found} ใบ
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-neutral-700/40">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 rounded-full transition-all duration-150"
              style={{ width: `${Math.min(100, Math.max(2, notification.progress.percent))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
