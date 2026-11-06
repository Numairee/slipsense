import React from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { AutoScanner } from '../utils/galleryAutoScanner';

const THAI_MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function Header({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onResetMonth,
  onOpenPrivacyInfo
}) {
  const monthIdx = currentDate.getMonth();
  const yearBE = currentDate.getFullYear() + 543;
  const monthName = THAI_MONTH_NAMES[monthIdx];
  const now = new Date();
  const isCurrentMonth = currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() === now.getMonth();
  const isNative = AutoScanner.isNative();

  return (
    <header
      className={`sticky top-0 z-30 bg-[#080C14]/90 backdrop-blur-md pb-2.5 px-4 border-b border-neutral-800 transition-all ${
        isNative ? 'pt-[max(calc(env(safe-area-inset-top,0px)+10px),36px)]' : 'pt-3'
      }`}
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div
          onClick={onOpenPrivacyInfo}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-blue-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
            <Zap className="w-5 h-5 fill-cyan-400 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-base tracking-tight text-white leading-none">
                SlipSense
              </h1>
              <span className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" />
                No-Track
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                v2.0.0
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
              Smart Slip & Wealth Intelligence • ออฟไลน์ 100%
            </p>
          </div>
        </div>

        {/* Month Selector Pill */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-2xl shadow-md p-0.5">
          <button
            onClick={onPrevMonth}
            className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors active:scale-90"
            title="เดือนก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            onClick={onResetMonth}
            className="px-2 py-0.5 text-center select-none cursor-pointer hover:bg-neutral-800 rounded-lg transition-colors min-w-[74px]"
            title="แตะเพื่อกลับมาเดือนปัจจุบัน"
          >
            <div className="text-[11px] font-extrabold text-white leading-tight">
              {monthName}
            </div>
            <div className="text-[9px] font-semibold text-neutral-400 leading-tight flex items-center justify-center gap-1">
              <span>{yearBE}</span>
              {!isCurrentMonth && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" title="แตะเพื่อกลับเดือนปัจจุบัน" />
              )}
            </div>
          </div>

          <button
            onClick={onNextMonth}
            className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors active:scale-90"
            title="เดือนถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
