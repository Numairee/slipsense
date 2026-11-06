import React, { useState } from 'react';
import SummaryCards from '../components/SummaryCards';
import TransactionItem from '../components/TransactionItem';
import { Camera, Plus, Sparkles, Receipt, Zap, Loader2, Calendar, RefreshCw, Trash2, ArrowUpRight, TrendingUp } from 'lucide-react';
import { sound } from '../utils/sound';
import { calculateFinancialHealth } from '../utils/analyticsEngine';

export default function HomeView({
  transactions,
  categories,
  currentDate,
  budgets = {},
  isAutoScanning,
  onTriggerAutoScan,
  onClearAndRescan,
  onOpenResetModal,
  onOpenScanModal,
  onOpenManualModal,
  onOpenDetailModal,
  onResetMonth,
  onAddTransaction,
  onNavigateToAnalytics
}) {
  const [viewScope, setViewScope] = useState('month'); // 'month' | 'all'

  const curYear = currentDate.getFullYear();
  const curMonth = currentDate.getMonth() + 1;
  const monthPrefix = `${curYear}-${curMonth.toString().padStart(2, '0')}`;

  const monthTxs = transactions.filter(tx => {
    return tx.date && tx.date.startsWith(monthPrefix);
  });

  const effectiveScope = (viewScope === 'all' || (monthTxs.length === 0 && transactions.length > 0)) ? 'all' : 'month';
  const displayedTxs = effectiveScope === 'all' ? transactions : monthTxs;

  // Totals
  const totalAmount = displayedTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const now = new Date();
  const isCurrentMonthNow = now.getFullYear() === curYear && (now.getMonth() + 1) === curMonth;
  const daysPassed = isCurrentMonthNow ? Math.max(1, now.getDate()) : new Date(curYear, curMonth, 0).getDate();
  const dailyAverage = totalAmount / Math.max(1, daysPassed);

  // Group by date
  const groupedByDate = {};
  const todayStr = now.toISOString().split('T')[0];
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  displayedTxs.forEach(tx => {
    const d = tx.date || todayStr;
    if (!groupedByDate[d]) {
      groupedByDate[d] = [];
    }
    groupedByDate[d].push(tx);
  });

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const formatDateHeader = (dateStr) => {
    if (dateStr === todayStr) return 'วันนี้';
    if (dateStr === yesterdayStr) return 'เมื่อวาน';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const thaiMonthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const mIdx = Math.max(0, Math.min(11, parseInt(m, 10) - 1));
    const yearBE = (parseInt(y, 10) + 543).toString().slice(-2);
    return `${parseInt(d, 10)} ${thaiMonthsShort[mIdx]} ${yearBE}`;
  };

  const health = calculateFinancialHealth(transactions, currentDate, budgets);

  return (
    <div className="space-y-3.5 pb-24 animate-fade-in">
      {/* Month Warning Pill if user navigated away from current month */}
      {!isCurrentMonthNow && (
        <div
          onClick={() => {
            sound.playPop();
            if (onResetMonth) onResetMonth();
          }}
          className="px-3.5 py-2 rounded-2xl bg-cyan-600/90 text-white font-bold text-xs flex items-center justify-between shadow-md cursor-pointer active:scale-98 transition-all hover:bg-cyan-600"
        >
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>กำลังดูเดือน {curMonth}/{curYear + 543}</span>
          </div>
          <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[10px] font-extrabold">
            กลับเดือนปัจจุบัน ↩
          </span>
        </div>
      )}

      {/* Hero Apple Card Style Balance & Burn Rate */}
      <SummaryCards
        totalAmount={totalAmount}
        dailyAverage={dailyAverage}
        count={displayedTxs.length}
        totalAllTimeCount={transactions.length}
        currentDay={daysPassed}
        titleLabel={effectiveScope === 'all' && monthTxs.length === 0 && transactions.length > 0
          ? 'ยอดใช้จ่ายรวมทั้งหมด'
          : 'ยอดใช้จ่ายรวมเดือนนี้'}
      />

      {/* Quick Wealth Intelligence Snapshot */}
      <div
        onClick={() => {
          sound.playPop();
          if (onNavigateToAnalytics) onNavigateToAnalytics();
        }}
        className="rounded-2xl p-3 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 active:scale-99 transition-all cursor-pointer shadow-md flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm font-mono"
            style={{
              backgroundColor: `${health.color}20`,
              color: health.color,
              border: `1px solid ${health.color}40`
            }}
          >
            {health.grade}
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1">
              <span>{health.title}</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            <div className="text-[10px] text-neutral-400">
              คะแนนสุขภาพการเงิน {health.score}/100 • แตะเพื่อดูบทวิเคราะห์เต็ม
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-cyan-400 text-xs font-bold shrink-0">
          <span>ดูวิเคราะห์</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Primary Action Bar */}
      <div className="space-y-2">
        {/* Main Auto-Scan Button */}
        <button
          onClick={() => {
            sound.playPop();
            onTriggerAutoScan();
          }}
          disabled={isAutoScanning}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 active:scale-98 text-white font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              {isAutoScanning ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Zap className="w-4 h-4 fill-white text-white" />
              )}
            </div>
            <div className="text-left">
              <div className="leading-tight text-xs sm:text-sm font-black">
                {isAutoScanning ? 'กำลังกวาดหารูปสลิปในเครื่อง...' : 'กวาดอ่านสลิปอัตโนมัติ ⚡'}
              </div>
              <div className="text-[10px] text-emerald-100 font-medium">
                ตรวจหาและอ่านสลิปธนาคารในอัลบั้มเครื่องทันที ไม่ต้องเลือกรูปเอง
              </div>
            </div>
          </div>
          <span className="text-[11px] font-extrabold bg-white/25 px-2.5 py-1 rounded-xl shrink-0">
            {isAutoScanning ? 'รอสักครู่...' : 'กวาดเลย'}
          </span>
        </button>

        {/* Secondary Options: Pick Slip Image, Manual Cash */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              sound.playPop();
              onOpenScanModal();
            }}
            className="py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-98 border border-neutral-800 text-neutral-200 font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>เลือกรูปสลิปเอง</span>
          </button>

          <button
            onClick={() => {
              sound.playPop();
              onOpenManualModal();
            }}
            className="py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-98 border border-neutral-800 text-neutral-200 font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>จดเงินสด</span>
          </button>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="font-extrabold text-xs sm:text-sm text-white tracking-tight flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-cyan-400" />
            <span>รายการใช้จ่าย</span>
          </h3>

          <div className="flex items-center gap-1.5">
            {transactions.length > 0 && onOpenResetModal && (
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  onOpenResetModal();
                }}
                title="ล้างข้อมูลแอปทั้งหมดหรือสแกนใหม่"
                className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 active:scale-95 font-bold text-[10px] flex items-center gap-1 border border-rose-500/30 transition-all shadow-2xs"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>ล้างแอป</span>
              </button>
            )}

            {/* Segmented Scope Filter: เดือนนี้ vs ทั้งหมด */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 p-0.5 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setViewScope('month');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  effectiveScope === 'month'
                    ? 'bg-neutral-800 text-white shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                เดือนนี้ ({monthTxs.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setViewScope('all');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  effectiveScope === 'all'
                    ? 'bg-neutral-800 text-white shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                ทั้งหมด ({transactions.length})
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {displayedTxs.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-3xl bg-neutral-900 border border-neutral-800/80 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-3 text-cyan-400">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-sm text-white">
              {effectiveScope === 'month' ? 'ยังไม่มีรายการในเดือนนี้' : 'ยังไม่มีประวัติสลิปในแอป'}
            </h4>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto mt-1 leading-relaxed">
              กดปุ่ม <span className="text-emerald-400 font-bold">กวาดอ่านสลิปอัตโนมัติ</span> ด้านบน เพื่อตรวจหาและบันทึกสลิปโอนเงินจากอัลบั้มเครื่องทันที
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedDates.map((dateStr) => {
              const dayTxs = groupedByDate[dateStr];
              const dayTotal = dayTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

              return (
                <div key={dateStr} className="space-y-1.5">
                  <div className="flex items-center justify-between px-1 text-[11px]">
                    <span className="font-extrabold text-neutral-400">
                      {formatDateHeader(dateStr)}
                    </span>
                    <span className="font-bold font-mono text-neutral-400">
                      รวม ฿{dayTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {dayTxs.map((tx) => (
                      <TransactionItem
                        key={tx.id}
                        transaction={tx}
                        categories={categories}
                        onClick={() => {
                          sound.playPop();
                          onOpenDetailModal(tx);
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
