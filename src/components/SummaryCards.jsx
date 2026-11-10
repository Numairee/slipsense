import React from 'react';
import { Calendar, ReceiptText, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';

export default function SummaryCards({
  totalAmount = 0,
  dailyAverage = 0,
  count = 0,
  totalAllTimeCount = 0,
  currentDay = 1,
  titleLabel = null
}) {
  const { t, formatAmount } = useI18n();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-[#121824] text-white p-5 border border-neutral-700/60 shadow-2xl shadow-black/50">
      <div className="relative z-10">
        {/* Top Status Strip */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-neutral-300 tracking-wide">
              {titleLabel || t('totalExpenses')}
            </span>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-cyan-300 border border-white/10 font-mono">
            {count} {t('totalRecords')}
          </span>
        </div>

        {/* Master Total Amount Display */}
        <div className="flex items-baseline gap-1.5 my-2">
          <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
            {formatAmount(totalAmount)}
          </span>
        </div>

        {/* Apple Card Style Glass Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-3.5 mt-3 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-2.5 flex items-center justify-between border border-white/5">
            <div>
              <div className="text-[10px] text-neutral-400 font-medium">
                {t('dailyAverage')} ({currentDay} {t('daysCount')})
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-white font-mono mt-0.5">
                {formatAmount(dailyAverage)}
              </div>
            </div>
            <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-2.5 flex items-center justify-between border border-white/5">
            <div>
              <div className="text-[10px] text-neutral-400 font-medium">
                {t('totalRecords')}
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-emerald-300 font-mono mt-0.5 flex items-center gap-1">
                <span>{totalAllTimeCount || count}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
              <ReceiptText className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Fintech Hologram Glow */}
      <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -top-10 w-36 h-36 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
    </div>
  );
}
