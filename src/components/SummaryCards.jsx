import React from 'react';
import { Calendar, ReceiptText, CheckCircle2 } from 'lucide-react';

export default function SummaryCards({
  totalAmount = 0,
  dailyAverage = 0,
  count = 0,
  totalAllTimeCount = 0,
  currentDay = 1,
  titleLabel = 'ยอดใช้จ่ายรวมเดือนนี้'
}) {
  const formatBaht = (num) => {
    return Number(num || 0).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 text-white p-4 shadow-lg shadow-neutral-900/10">
      <div className="relative z-10">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {titleLabel}
          </span>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300">
            {count} รายการ
          </span>
        </div>

        {/* Main Baht Total */}
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-base font-bold text-neutral-400">฿</span>
          <span className="text-3xl font-black tracking-tight text-white font-mono">
            {formatBaht(totalAmount)}
          </span>
        </div>

        {/* Compact Bottom Metrics Strip (replaces bulky extra white cards) */}
        <div className="grid grid-cols-2 gap-2 pt-3 mt-2.5 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl px-3 py-2 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-neutral-400 font-medium">เฉลี่ยต่อวัน ({currentDay} วัน)</div>
              <div className="text-xs font-extrabold text-white font-mono mt-0.5">
                ฿{formatBaht(dailyAverage)}
              </div>
            </div>
            <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl px-3 py-2 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-neutral-400 font-medium">สลิปที่บันทึกแล้ว</div>
              <div className="text-xs font-extrabold text-emerald-300 font-mono mt-0.5 flex items-center gap-1">
                <span>{totalAllTimeCount || count} ใบ</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
            </div>
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <ReceiptText className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Decorative backdrop glow */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
      <div className="absolute -left-8 -top-8 w-28 h-28 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
    </div>
  );
}
