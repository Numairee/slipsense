import React from 'react';
import { TrendingDown, Calendar, ReceiptText, ArrowUpRight } from 'lucide-react';

export default function SummaryCards({
  totalAmount = 0,
  dailyAverage = 0,
  count = 0,
  daysInMonth = 30,
  currentDay = 1
}) {
  const formatBaht = (num) => {
    return Number(num || 0).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {/* Primary Card: Total Spending */}
      <div className="col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 text-white p-5 shadow-lg shadow-neutral-900/10">
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ยอดใช้จ่ายรวมเดือนนี้
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
              {count} รายการ
            </span>
          </div>

          <div className="my-1">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-semibold text-neutral-400">฿</span>
              <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
                {formatBaht(totalAmount)}
              </span>
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
            <span>เฉลี่ยรายวัน ณ ปัจจุบัน</span>
            <span className="font-semibold text-neutral-200 font-mono">
              ฿{formatBaht(dailyAverage)} / วัน
            </span>
          </div>
        </div>

        {/* Decorative backdrop glow */}
        <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -top-8 w-28 h-28 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
      </div>

      {/* Subcard 1: Daily Average */}
      <div className="rounded-2xl bg-white p-3.5 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-neutral-500 mb-1">
          <span className="text-[11px] font-medium">เฉลี่ยต่อวัน</span>
          <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-lg font-bold text-neutral-900 font-mono">
            ฿{formatBaht(dailyAverage)}
          </div>
          <span className="text-[10px] text-neutral-400">
            คำนวณจาก {currentDay} วันแรก
          </span>
        </div>
      </div>

      {/* Subcard 2: Slip Count & Status */}
      <div className="rounded-2xl bg-white p-3.5 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-neutral-500 mb-1">
          <span className="text-[11px] font-medium">สลิปที่อ่านแล้ว</span>
          <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <ReceiptText className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-lg font-bold text-neutral-900 font-mono">
            {count} <span className="text-xs font-normal text-neutral-500">ใบ</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />
            บันทึกครบถ้วน
          </span>
        </div>
      </div>
    </div>
  );
}
