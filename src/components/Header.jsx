import React from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';

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

  return (
    <header className="sticky top-0 z-30 bg-neutral-100/90 backdrop-blur-md pt-[calc(env(safe-area-inset-top)+10px)] pb-3 px-4 border-b border-neutral-200/60 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl shadow-xs">
            🐐
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-lg tracking-tight text-neutral-900 leading-none">
                Pygmy
              </h1>
              <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" />
                No-Track
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 font-medium">
              จดรายจ่ายแบบไม่จด • 100% Offline
            </p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center bg-white border border-neutral-200/80 rounded-2xl shadow-xs p-1">
          <button
            onClick={onPrevMonth}
            className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors active:scale-95"
            title="เดือนก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            onClick={onResetMonth}
            className="px-2 text-center select-none cursor-pointer hover:bg-neutral-50 rounded-lg transition-colors"
            title="แตะเพื่อกลับมาเดือนปัจจุบัน"
          >
            <div className="text-xs font-bold text-neutral-800 leading-tight">
              {monthName}
            </div>
            <div className="text-[10px] font-medium text-neutral-400 leading-tight flex items-center justify-center gap-0.5">
              <span>{yearBE}</span>
              {!isCurrentMonth && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="ไม่ได้อยู่เดือนปัจจุบัน" />
              )}
            </div>
          </div>

          <button
            onClick={onNextMonth}
            className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors active:scale-95"
            title="เดือนถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
