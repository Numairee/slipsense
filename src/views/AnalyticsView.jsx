import React, { useState } from 'react';
import {
  calculateFinancialHealth,
  calculateSpendingForecast,
  detectMoneyLeaks,
  getWeekdayVsWeekendBreakdown,
  getDayOfWeekBreakdown,
  getTimeOfDayBreakdown,
  getBankShareBreakdown
} from '../utils/analyticsEngine';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Clock,
  Building2,
  Zap,
  ArrowUpRight,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3,
  HelpCircle
} from 'lucide-react';
import { sound } from '../utils/sound';

export default function AnalyticsView({ transactions, categories, currentDate, budgets = {} }) {
  const [selectedDayInfo, setSelectedDayInfo] = useState(null);

  const curYear = currentDate.getFullYear();
  const curMonth = currentDate.getMonth() + 1;
  const monthPrefix = `${curYear}-${curMonth.toString().padStart(2, '0')}`;

  const monthTxs = transactions.filter(tx => tx.date && tx.date.startsWith(monthPrefix));
  const totalAmount = monthTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  // Run Analytics Engines
  const health = calculateFinancialHealth(transactions, currentDate, budgets);
  const forecast = calculateSpendingForecast(transactions, currentDate);
  const leaks = detectMoneyLeaks(transactions, currentDate);
  const weekStats = getWeekdayVsWeekendBreakdown(transactions, currentDate);
  const dayStats = getDayOfWeekBreakdown(transactions, currentDate);
  const timeStats = getTimeOfDayBreakdown(transactions, currentDate);
  const bankStats = getBankShareBreakdown(transactions, currentDate);

  const formatBaht = (num) => {
    return Number(num || 0).toLocaleString('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatDecimalBaht = (num) => {
    return Number(num || 0).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Top Banner / Intelligence Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>วิเคราะห์การเงินอัจฉริยะ</span>
          </h2>
          <p className="text-xs text-neutral-400 font-medium">
            SlipSense AI Intelligence • ประมวลผลในเครื่อง 100%
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>No-Track</span>
        </div>
      </div>

      {/* 1. Financial Health Score Hero Card (Revolut / Apple Card style) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 border border-neutral-700/60 p-5 shadow-xl shadow-black/40">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-white/10 text-amber-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold text-neutral-300">
                คะแนนสุขภาพทางการเงิน
              </span>
            </div>
            <div
              className="px-3 py-1 rounded-full text-xs font-black tracking-wide"
              style={{
                backgroundColor: `${health.color}25`,
                color: health.color,
                border: `1px solid ${health.color}50`
              }}
            >
              ระดับ {health.grade}
            </div>
          </div>

          <div className="flex items-end justify-between my-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                  {health.score}
                </span>
                <span className="text-base font-bold text-neutral-400">/ 100</span>
              </div>
              <p className="text-xs font-bold mt-1" style={{ color: health.color }}>
                {health.title}
              </p>
            </div>

            {/* Health Radial / Progress Ring Preview */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke={health.color}
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray="163"
                  strokeDashoffset={163 - (163 * health.score) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute text-xs font-extrabold font-mono text-white">
                {health.grade}
              </span>
            </div>
          </div>

          {/* Actionable Insights Bullet points */}
          <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
            <div className="text-[11px] font-extrabold text-neutral-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>สรุปบทวิเคราะห์ & คำแนะนำเฉพาะคุณ</span>
            </div>
            {health.insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-neutral-300 leading-relaxed bg-white/5 rounded-xl p-2.5">
                <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ambient glow decoration */}
        <div
          className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: health.color }}
        />
      </div>

      {/* 2. Spending Forecast & Pace (พยากรณ์ยอดสิ้นเดือน) */}
      <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-4.5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-white">
                คาดการณ์ยอดใช้จ่ายสิ้นเดือน
              </h3>
              <p className="text-[10px] text-neutral-400">
                วิเคราะห์จากความเร็วการใช้เงิน {forecast.daysPassed} วันแรก
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            forecast.isPacingFaster
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            {forecast.isPacingFaster ? 'เร็วกว่าเดือนก่อน' : 'คุมอัตราได้คงที่'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 my-2">
          <div className="bg-neutral-800/80 rounded-2xl p-3 border border-neutral-700/50">
            <span className="text-[10px] text-neutral-400 font-medium">
              ยอดที่ใช้ไปแล้ว ({forecast.daysPassed} วัน)
            </span>
            <div className="text-lg font-black font-mono text-white mt-1">
              ฿{formatBaht(forecast.totalSpent)}
            </div>
            <span className="text-[10px] text-neutral-400">
              เฉลี่ย ฿{formatBaht(forecast.dailyBurn)}/วัน
            </span>
          </div>

          <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/20 rounded-2xl p-3 border border-cyan-500/30">
            <span className="text-[10px] text-cyan-300 font-medium">
              ยอดสิ้นเดือนโดยประมาณ
            </span>
            <div className="text-lg font-black font-mono text-cyan-200 mt-1">
              ฿{formatBaht(forecast.projectedTotal)}
            </div>
            <span className="text-[10px] text-cyan-300/80">
              เหลืออีก {forecast.daysRemaining} วัน
            </span>
          </div>
        </div>

        {/* Progress Bar of Month Elapsed vs Money Spent */}
        <div className="mt-3 pt-2">
          <div className="flex justify-between text-[10px] text-neutral-400 font-medium mb-1">
            <span>ผ่านไปแล้ว {forecast.daysPassed} จาก {forecast.totalDays} วัน</span>
            <span>{Math.round((forecast.daysPassed / forecast.totalDays) * 100)}% ของเดือน</span>
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((forecast.daysPassed / forecast.totalDays) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Money Leaks Radar (ตรวจจับเงินรั่วไหลย่อย < 120฿) */}
      <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-4.5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-white">
                เรดาร์ตรวจจับรูรั่วการเงิน (Money Leaks)
              </h3>
              <p className="text-[10px] text-neutral-400">
                รายจ่ายย่อยที่ไม่เกิน ฿120 สะสมบ่อยครั้ง
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            {leaks.count} รายการ
          </span>
        </div>

        <div className="bg-neutral-800/80 rounded-2xl p-3 border border-neutral-700/50 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-neutral-400 font-medium">รวมยอดเงินที่รั่วไหลย่อย</div>
            <div className="text-xl font-black font-mono text-amber-300 mt-0.5">
              ฿{formatDecimalBaht(leaks.totalAmount)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-neutral-400">คิดเป็นสัดส่วน</span>
            <div className="text-base font-extrabold font-mono text-white">
              {leaks.percentage}% <span className="text-xs text-neutral-400">ของทั้งหมด</span>
            </div>
          </div>
        </div>

        {leaks.topLeakVenues && leaks.topLeakVenues.length > 0 && (
          <div className="mt-3 pt-2">
            <div className="text-[11px] font-bold text-neutral-300 mb-2">
              สถานที่/รายการที่จ่ายย่อยบ่อยที่สุด:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {leaks.topLeakVenues.map((venue, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-medium border border-neutral-700 flex items-center gap-1.5"
                >
                  <span className="text-amber-400 font-bold">#{idx + 1}</span>
                  <span>{venue.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 text-white font-mono">
                    {venue.count}x
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Day-of-Week Spending Heatmap & Chart (พฤติกรรมรายวัน วันธรรมดา vs วันหยุด) */}
      <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-4.5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-white">
                พฤติกรรมใช้เงินรายสัปดาห์ (จันทร์ - อาทิตย์)
              </h3>
              <p className="text-[10px] text-neutral-400">
                วันธรรมดา vs วันหยุดสุดสัปดาห์
              </p>
            </div>
          </div>
          {dayStats.peakDay && dayStats.peakDay.amount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              พีคสุด: {dayStats.peakDay.shortName}
            </span>
          )}
        </div>

        {/* Weekday vs Weekend Comparison Strip */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2.5 rounded-2xl bg-neutral-800/80 border border-neutral-700/50">
            <div className="text-[10px] text-neutral-400 font-medium">วันทำงาน (จ.-ศ.)</div>
            <div className="text-sm font-extrabold font-mono text-white mt-0.5">
              ฿{formatBaht(weekStats.weekday.total)}
            </div>
            <div className="text-[10px] text-neutral-400">
              เฉลี่ย ฿{formatBaht(weekStats.weekday.avg)}/รายการ ({weekStats.weekday.percentage}%)
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-neutral-800/80 border border-neutral-700/50">
            <div className="text-[10px] text-neutral-400 font-medium">วันหยุด (ส.-อา.)</div>
            <div className="text-sm font-extrabold font-mono text-purple-300 mt-0.5">
              ฿{formatBaht(weekStats.weekend.total)}
            </div>
            <div className="text-[10px] text-neutral-400">
              เฉลี่ย ฿{formatBaht(weekStats.weekend.avg)}/รายการ ({weekStats.weekend.percentage}%)
            </div>
          </div>
        </div>

        {/* 7-Day Bar Chart */}
        <div className="pt-2">
          <div className="flex items-end justify-between gap-1.5 h-32 px-1">
            {dayStats.days.map((d) => {
              const isPeak = dayStats.peakDay?.dayIdx === d.dayIdx && d.amount > 0;
              const isWeekend = d.dayIdx === 0 || d.dayIdx === 6;

              return (
                <div
                  key={d.dayIdx}
                  onClick={() => {
                    sound.playPop();
                    setSelectedDayInfo(d);
                  }}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  <div className="text-[9px] font-mono text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                    {d.amount > 0 ? `฿${formatBaht(d.amount)}` : '-'}
                  </div>
                  <div
                    className={`w-full max-w-[28px] rounded-t-lg transition-all duration-500 ${
                      isPeak
                        ? 'bg-gradient-to-t from-purple-600 to-pink-500 shadow-md shadow-purple-500/30'
                        : isWeekend
                        ? 'bg-gradient-to-t from-purple-900 to-indigo-600'
                        : 'bg-neutral-700 hover:bg-neutral-600'
                    }`}
                    style={{
                      height: `${Math.max(6, d.barPercent)}%`
                    }}
                  />
                  <span className={`text-[10px] mt-1.5 font-bold ${
                    isPeak ? 'text-purple-300 font-black' : isWeekend ? 'text-purple-400/80' : 'text-neutral-400'
                  }`}>
                    {d.shortName}
                  </span>
                </div>
              );
            })}
          </div>

          {selectedDayInfo && (
            <div className="mt-3 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center justify-between text-neutral-300">
              <div>
                <span className="font-bold text-white">{selectedDayInfo.fullName}: </span>
                <span>รวม ฿{formatDecimalBaht(selectedDayInfo.amount)} ({selectedDayInfo.count} รายการ)</span>
              </div>
              <button
                onClick={() => setSelectedDayInfo(null)}
                className="text-[10px] text-neutral-400 hover:text-white"
              >
                ปิด
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Time-of-Day Analysis (ช่วงเวลาที่ใช้จ่าย) */}
      <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-4.5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-white">
                ช่วงเวลาการใช้เงินในแต่ละวัน
              </h3>
              <p className="text-[10px] text-neutral-400">
                เวลาที่คุณมักจะเสียเงินบ่อยที่สุด
              </p>
            </div>
          </div>
          {timeStats.peakSlot && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
              มากที่สุด: {timeStats.peakSlot.label.split(' ')[0]}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {timeStats.slots.map((s) => (
            <div key={s.id} className="p-3 rounded-2xl bg-neutral-800/80 border border-neutral-700/50">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-neutral-300 flex items-center gap-1">
                  <span>{s.icon}</span>
                  <span>{s.label.split(' ')[0]}</span>
                </span>
                <span className="font-mono text-neutral-400 text-[10px]">{s.percentage}%</span>
              </div>
              <div className="text-sm font-extrabold font-mono text-white">
                ฿{formatBaht(s.amount)}
              </div>
              <div className="w-full h-1.5 rounded-full bg-neutral-700 mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                  style={{ width: `${s.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Bank Drain Distribution (สัดส่วนธนาคารที่เงินไหลออก) */}
      <div className="rounded-3xl bg-neutral-900 border border-neutral-800 p-4.5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-white">
                สัดส่วนการตัดเงินแยกตามธนาคาร
              </h3>
              <p className="text-[10px] text-neutral-400">
                บัญชีใดเงินไหลออกมากที่สุดในเดือนนี้
              </p>
            </div>
          </div>
        </div>

        {bankStats.length === 0 ? (
          <div className="text-center py-6 text-xs text-neutral-400">
            ยังไม่มีข้อมูลสลิปธนาคารสำหรับเดือนนี้
          </div>
        ) : (
          <div className="space-y-2.5">
            {bankStats.map((b) => (
              <div key={b.bankId} className="p-2.5 rounded-2xl bg-neutral-800/70 border border-neutral-700/50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: b.color }}
                    />
                    <span className="text-xs font-bold text-white">{b.name}</span>
                    <span className="text-[10px] text-neutral-400">({b.count} สลิป)</span>
                  </div>
                  <div className="text-xs font-black font-mono text-white">
                    ฿{formatDecimalBaht(b.amount)}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 rounded-full bg-neutral-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${b.percentage}%`,
                        backgroundColor: b.color
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 w-8 text-right">
                    {b.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
