import React, { useState } from 'react';
import SummaryCards from '../components/SummaryCards';
import TransactionItem from '../components/TransactionItem';
import { Camera, Sparkles, Zap, Loader2, Calendar, Folder } from 'lucide-react';
import { sound } from '../utils/sound';
import { calculateFinancialHealth } from '../utils/analyticsEngine';
import { useI18n } from '../i18n/index.jsx';

export default function HomeView({
  transactions,
  categories,
  currentDate,
  budgets = {},
  isAutoScanning,
  onTriggerAutoScan,
  onOpenAlbumPicker,
  onClearAndRescan,
  onOpenResetModal,
  onOpenScanModal,
  onOpenManualModal,
  onOpenDetailModal,
  onResetMonth,
  onAddTransaction,
  onNavigateToAnalytics
}) {
  const { t, language } = useI18n();
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
    if (dateStr === todayStr) return t('today');
    if (dateStr === yesterdayStr) return t('yesterday');
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const months = t('months');
    const mIdx = Math.max(0, Math.min(11, parseInt(m, 10) - 1));
    const monthName = Array.isArray(months) ? months[mIdx] : m;
    const displayYear = language === 'th' ? parseInt(y, 10) + 543 : y;
    return `${parseInt(d, 10)} ${monthName} ${displayYear}`;
  };

  const health = calculateFinancialHealth(transactions, currentDate, budgets);

  return (
    <div className="space-y-3.5 pb-24 animate-fade-in">
      {/* Month Navigation Pill */}
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
            <span>{curMonth}/{language === 'th' ? curYear + 543 : curYear}</span>
          </div>
          <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[10px] font-extrabold">
            {t('currentMonthTip')} ↩
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
        titleLabel={t('totalExpenses')}
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
                {isAutoScanning ? t('scanningTitle') : t('autoScanGallery')}
              </div>
              <div className="text-[10px] text-emerald-100 font-medium">
                {t('quickScanTip')}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-extrabold bg-white/25 px-2.5 py-1 rounded-xl shrink-0">
            ⚡
          </span>
        </button>

        {/* Secondary Action Row: Choose Folder, Manual Add */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              sound.playPop();
              if (onOpenAlbumPicker) onOpenAlbumPicker();
            }}
            className="py-2.5 px-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-98 border border-neutral-800 text-neutral-200 font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
          >
            <Folder className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{t('pickFolder')}</span>
          </button>

          <button
            onClick={() => {
              sound.playPop();
              onOpenManualModal();
            }}
            className="py-2.5 px-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-98 border border-neutral-800 text-neutral-200 font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
          >
            <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{t('manualAdd')}</span>
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-extrabold text-sm text-white tracking-tight">
            {t('recentTransactions')}
          </h3>
          <span className="text-xs font-bold text-neutral-400">
            {displayedTxs.length} {t('itemsCount')}
          </span>
        </div>

        {displayedTxs.length === 0 ? (
          <div className="text-center py-10 px-4 bg-neutral-900/60 rounded-3xl border border-neutral-800 text-neutral-400 text-xs">
            <p className="font-bold text-sm text-neutral-300 mb-1">{t('noTransactionsYet')}</p>
            <p>{t('quickScanTip')}</p>
          </div>
        ) : (
          sortedDates.map((dateStr) => (
            <div key={dateStr} className="space-y-1.5">
              <div className="text-[11px] font-bold text-neutral-400 px-1 pt-2">
                {formatDateHeader(dateStr)}
              </div>
              {groupedByDate[dateStr].map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  categories={categories}
                  onClick={onOpenDetailModal}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
