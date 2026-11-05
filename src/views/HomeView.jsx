import React, { useState } from 'react';
import SummaryCards from '../components/SummaryCards';
import GoatWidget from '../components/GoatWidget';
import TransactionItem from '../components/TransactionItem';
import { Camera, Plus, Sparkles, Filter, ChevronRight, Receipt, Zap, Loader2 } from 'lucide-react';
import { sound } from '../utils/sound';

export default function HomeView({
  transactions,
  categories,
  goatState,
  currentDate,
  isAutoScanning,
  onTriggerAutoScan,
  onOpenScanModal,
  onOpenManualModal,
  onOpenDetailModal,
  onFeedGoat,
  onOpenGoatRoom
}) {
  const [filterPeriod, setFilterPeriod] = useState('all');

  // Filter transactions for current month
  const curYear = currentDate.getFullYear();
  const curMonth = currentDate.getMonth() + 1;
  const monthPrefix = `${curYear}-${curMonth.toString().padStart(2, '0')}`;

  const monthTxs = transactions.filter(tx => {
    return tx.date && tx.date.startsWith(monthPrefix);
  });

  // Calculate totals
  const totalAmount = monthTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  const now = new Date();
  const isCurrentMonthNow = now.getFullYear() === curYear && (now.getMonth() + 1) === curMonth;
  const daysPassed = isCurrentMonthNow ? Math.max(1, now.getDate()) : new Date(curYear, curMonth, 0).getDate();
  const dailyAverage = totalAmount / daysPassed;

  // Group transactions by date
  const groupedByDate = {};
  const todayStr = now.toISOString().split('T')[0];
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  monthTxs.forEach(tx => {
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
    const [y, m, d] = dateStr.split('-');
    const thaiMonthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${parseInt(d, 10)} ${thaiMonthsShort[parseInt(m, 10) - 1]}`;
  };

  const formatBaht = (num) => {
    return Number(num || 0).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Goat Interactive Card */}
      <GoatWidget
        goatState={goatState}
        onFeedGoat={onFeedGoat}
        onOpenGoatRoom={onOpenGoatRoom}
      />

      {/* Monthly Summary Cards */}
      <SummaryCards
        totalAmount={totalAmount}
        dailyAverage={dailyAverage}
        count={monthTxs.length}
        currentDay={daysPassed}
      />

      {/* Primary Action Buttons */}
      <div className="space-y-2">
        {/* Main Auto-Scan Button (อ่านสลิปในเครื่องเองอัตโนมัติ) */}
        <button
          onClick={() => {
            sound.playPop();
            onTriggerAutoScan();
          }}
          disabled={isAutoScanning}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-98 text-white font-extrabold text-sm shadow-md shadow-amber-500/25 flex items-center justify-between transition-all"
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
              <div className="leading-tight text-sm font-black">
                {isAutoScanning ? 'กำลังกวาดหารูปสลิปในเครื่อง...' : 'กวาดอ่านสลิปอัตโนมัติ ⚡'}
              </div>
              <div className="text-[10px] text-amber-100 font-normal">
                อ่านรูปสลิปในอัลบั้มเอง ไม่ต้องคอยกดเลือกรูป
              </div>
            </div>
          </div>
          <span className="text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-xl shrink-0">
            {isAutoScanning ? 'ค้นหา...' : 'กวาดเลย'}
          </span>
        </button>

        {/* Secondary options: Pick files manually or Manual Cash */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              sound.playPop();
              onOpenScanModal();
            }}
            className="py-2.5 px-3 rounded-xl bg-white hover:bg-neutral-50 active:scale-98 border border-neutral-200/80 text-neutral-700 font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Camera className="w-3.5 h-3.5 text-neutral-500" />
            <span>เลือกรูปสลิปเอง</span>
          </button>

          <button
            onClick={() => {
              sound.playPop();
              onOpenManualModal();
            }}
            className="py-2.5 px-3 rounded-xl bg-white hover:bg-neutral-50 active:scale-98 border border-neutral-200/80 text-neutral-700 font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-neutral-500" />
            <span>จดเงินสด</span>
          </button>
        </div>
      </div>

      {/* Transactions Section Header */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-extrabold text-sm text-neutral-900 tracking-tight flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-neutral-500" />
            รายการรายจ่ายเดือนนี้
          </h3>
          <span className="text-xs text-neutral-400 font-medium">
            {monthTxs.length} รายการ
          </span>
        </div>

        {/* Empty state */}
        {sortedDates.length === 0 ? (
          <div className="py-12 px-6 rounded-3xl bg-white border border-neutral-200/80 text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100/60 text-amber-600 flex items-center justify-center text-3xl mb-3">
              🐐
            </div>
            <h4 className="font-bold text-neutral-800 text-sm mb-1">
              ยังไม่มีรายการในเดือนนี้
            </h4>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto mb-4">
              แตะปุ่ม "กวาดอ่านสลิปอัตโนมัติ" ปิ๊กมี่จะไปดึงสลิปที่มีในเครื่องมาบันทึกให้ทันที!
            </p>
            <button
              onClick={onTriggerAutoScan}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs hover:bg-amber-600 active:scale-95"
            >
              <Zap className="w-4 h-4 fill-white" />
              กวาดสลิปในเครื่องตอนนี้
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((dateStr) => {
              const dayTxs = groupedByDate[dateStr];
              const dayTotal = dayTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

              return (
                <div key={dateStr} className="space-y-2">
                  {/* Date Sticky Header */}
                  <div className="flex items-center justify-between px-1 text-xs text-neutral-500">
                    <span className="font-bold text-neutral-700">
                      {formatDateHeader(dateStr)} ({dateStr})
                    </span>
                    <span className="font-mono text-neutral-400 font-medium">
                      รวม ฿{formatBaht(dayTotal)}
                    </span>
                  </div>

                  {/* Transactions of the day */}
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
