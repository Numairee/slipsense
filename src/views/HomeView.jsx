import React, { useState } from 'react';
import SummaryCards from '../components/SummaryCards';
import GoatWidget from '../components/GoatWidget';
import TransactionItem from '../components/TransactionItem';
import { Camera, Plus, Sparkles, Receipt, Zap, Loader2, Calendar, RefreshCw, Trash2 } from 'lucide-react';
import { sound } from '../utils/sound';
import { SAMPLE_TEST_SLIPS } from '../utils/slipParser';

export default function HomeView({
  transactions,
  categories,
  goatState,
  currentDate,
  isAutoScanning,
  onTriggerAutoScan,
  onClearAndRescan,
  onOpenResetModal,
  onOpenScanModal,
  onOpenManualModal,
  onOpenDetailModal,
  onFeedGoat,
  onOpenGoatRoom,
  onResetMonth,
  onAddTransaction
}) {
  const [viewScope, setViewScope] = useState('month'); // 'month' | 'all'

  const curYear = currentDate.getFullYear();
  const curMonth = currentDate.getMonth() + 1;
  const monthPrefix = `${curYear}-${curMonth.toString().padStart(2, '0')}`;

  const monthTxs = transactions.filter(tx => {
    return tx.date && tx.date.startsWith(monthPrefix);
  });

  // Smart fallback: if current month has 0 items, but user has items in other months, show all automatically
  const effectiveScope = (viewScope === 'all' || (monthTxs.length === 0 && transactions.length > 0)) ? 'all' : 'month';
  const displayedTxs = effectiveScope === 'all' ? transactions : monthTxs;

  // Calculate totals
  const totalAmount = displayedTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const now = new Date();
  const isCurrentMonthNow = now.getFullYear() === curYear && (now.getMonth() + 1) === curMonth;
  const daysPassed = isCurrentMonthNow ? Math.max(1, now.getDate()) : new Date(curYear, curMonth, 0).getDate();
  const dailyAverage = totalAmount / Math.max(1, daysPassed);

  // Group transactions by date
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

  const formatBaht = (num) => {
    return Number(num || 0).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="space-y-3 pb-24 animate-fade-in">
      {/* Compact Month Warning Pill if user navigated away from current month */}
      {!isCurrentMonthNow && (
        <div
          onClick={() => {
            sound.playPop();
            if (onResetMonth) onResetMonth();
          }}
          className="px-3.5 py-2 rounded-2xl bg-amber-500 text-white font-bold text-xs flex items-center justify-between shadow-2xs cursor-pointer active:scale-98 transition-all hover:bg-amber-600"
        >
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>กำลังดูเดือน {curMonth}/{curYear + 543}</span>
          </div>
          <span className="bg-white/25 px-2 py-0.5 rounded-lg text-[10px] font-extrabold">
            กลับเดือนปัจจุบัน ↩
          </span>
        </div>
      )}

      {/* Hero Summary Card */}
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

      {/* Compact Goat Mascot Status Card */}
      <GoatWidget
        goatState={goatState}
        onFeedGoat={onFeedGoat}
        onOpenGoatRoom={onOpenGoatRoom}
      />

      {/* Primary Action Bar */}
      <div className="space-y-2">
        {/* Main Auto-Scan Button */}
        <button
          onClick={() => {
            sound.playPop();
            onTriggerAutoScan();
          }}
          disabled={isAutoScanning}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-98 text-white font-extrabold text-sm shadow-md shadow-amber-500/20 flex items-center justify-between transition-all"
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
              <div className="text-[10px] text-amber-100 font-medium">
                ค้นหาสลิปธนาคารในอัลบั้มเครื่องทันที ไม่ต้องเลือกรูปเอง
              </div>
            </div>
          </div>
          <span className="text-[11px] font-extrabold bg-white/25 px-2.5 py-1 rounded-xl shrink-0">
            {isAutoScanning ? 'รอสักครู่...' : 'กวาดเลย'}
          </span>
        </button>

        {/* Secondary Options: Pick Slip Image, Manual Cash, or Quick Test */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              sound.playPop();
              onOpenScanModal();
            }}
            className="py-2.5 px-3 rounded-xl bg-white hover:bg-neutral-50 active:scale-98 border border-neutral-200/90 text-neutral-800 font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Camera className="w-3.5 h-3.5 text-amber-600" />
            <span>เลือกรูปสลิปเอง</span>
          </button>

          <button
            onClick={() => {
              sound.playPop();
              onOpenManualModal();
            }}
            className="py-2.5 px-3 rounded-xl bg-white hover:bg-neutral-50 active:scale-98 border border-neutral-200/90 text-neutral-800 font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>จดเงินสด</span>
          </button>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="font-extrabold text-xs sm:text-sm text-neutral-900 tracking-tight flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-amber-600" />
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
                className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 active:scale-95 font-bold text-[10px] flex items-center gap-1 border border-rose-200/80 transition-all shadow-2xs"
              >
                <Trash2 className="w-3 h-3 text-rose-600" />
                <span>ล้างแอป</span>
              </button>
            )}

            {/* Segmented Scope Filter: เดือนนี้ vs ทั้งหมด */}
            <div className="flex items-center bg-neutral-200/70 p-0.5 rounded-xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                setViewScope('month');
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                effectiveScope === 'month'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
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
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              ทั้งหมด ({transactions.length})
            </button>
          </div>
        </div>
      </div>

        {/* Empty State */}
        {sortedDates.length === 0 ? (
          <div className="py-8 px-4 rounded-3xl bg-white border border-neutral-200/80 text-center space-y-3 shadow-2xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100/70 text-amber-600 flex items-center justify-center text-2xl">
              🐐
            </div>
            <div>
              <h4 className="font-extrabold text-neutral-800 text-sm mb-1">
                ยังไม่มีรายการสลิปในเดือนนี้
              </h4>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                แตะปุ่ม <b>กวาดอ่านสลิปอัตโนมัติ</b> ด้านบน หรือเลือกรูปสลิปจากเครื่องเพื่ออ่านยอดจริงทันที
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  onOpenScanModal();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-900 text-white font-extrabold text-xs shadow-xs hover:bg-neutral-800 active:scale-95 transition-all"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                เลือกรูปสลิปจากอัลบั้ม
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  const sample = SAMPLE_TEST_SLIPS[Math.floor(Math.random() * SAMPLE_TEST_SLIPS.length)];
                  const rnd = Math.floor(100000 + Math.random() * 900000);
                  const d = new Date();
                  const todayStr = d.toISOString().split('T')[0];
                  if (onAddTransaction) {
                    onAddTransaction({
                      id: 'tx_sample_' + Date.now(),
                      date: todayStr,
                      time: sample.time || '12:30',
                      timestamp: Date.now(),
                      amount: sample.amount,
                      bankId: sample.bankId,
                      payee: sample.payee,
                      sender: sample.sender,
                      categoryId: sample.categoryId,
                      ref: `${sample.bankId}${rnd}`,
                      note: sample.note + ' (สลิปทดสอบ)',
                      isManual: false,
                    });
                  }
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                จำลองสลิปเข้า 1 ใบ (ทดสอบ)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {sortedDates.map((dateStr) => {
              const dayTxs = groupedByDate[dateStr];
              const dayTotal = dayTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

              return (
                <div key={dateStr} className="space-y-2">
                  <div className="flex items-center justify-between px-1 text-xs text-neutral-500">
                    <span className="font-bold text-neutral-700">
                      {formatDateHeader(dateStr)}
                    </span>
                    <span className="font-mono text-neutral-500 font-semibold">
                      รวม -฿{formatBaht(dayTotal)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dayTxs.map((tx) => (
                      <TransactionItem
                        key={tx.id}
                        transaction={tx}
                        categories={categories}
                        onClick={onOpenDetailModal}
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
