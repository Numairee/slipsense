import React, { useState } from 'react';
import { getCategoryById } from '../data/defaultCategories';
import { getBankById } from '../data/banks';
import { PieChart as PieIcon, BarChart3, TrendingUp, Building2, Store } from 'lucide-react';

export default function StatsView({ transactions, categories, currentDate }) {
  const [activeTab, setActiveTab] = useState('category'); // 'category' | 'bank' | 'merchant'

  const curYear = currentDate.getFullYear();
  const curMonth = currentDate.getMonth() + 1;
  const monthPrefix = `${curYear}-${curMonth.toString().padStart(2, '0')}`;

  const monthTxs = transactions.filter(tx => tx.date && tx.date.startsWith(monthPrefix));
  const totalAmount = monthTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  // 1. Group by Category
  const categoryStats = {};
  monthTxs.forEach(tx => {
    const cid = tx.categoryId || 'transfer';
    if (!categoryStats[cid]) {
      categoryStats[cid] = { amount: 0, count: 0 };
    }
    categoryStats[cid].amount += Number(tx.amount) || 0;
    categoryStats[cid].count += 1;
  });

  const sortedCategories = Object.keys(categoryStats)
    .map(cid => {
      const cat = getCategoryById(categories, cid);
      const stat = categoryStats[cid];
      const pct = totalAmount > 0 ? (stat.amount / totalAmount) * 100 : 0;
      return { ...cat, ...stat, percentage: pct };
    })
    .sort((a, b) => b.amount - a.amount);

  // 2. Group by Bank
  const bankStats = {};
  monthTxs.forEach(tx => {
    const bid = tx.bankId || 'KBANK';
    if (!bankStats[bid]) {
      bankStats[bid] = { amount: 0, count: 0 };
    }
    bankStats[bid].amount += Number(tx.amount) || 0;
    bankStats[bid].count += 1;
  });

  const sortedBanks = Object.keys(bankStats)
    .map(bid => {
      const bank = getBankById(bid);
      const stat = bankStats[bid];
      const pct = totalAmount > 0 ? (stat.amount / totalAmount) * 100 : 0;
      return { ...bank, ...stat, percentage: pct };
    })
    .sort((a, b) => b.amount - a.amount);

  // 3. Group by Merchant / Payee
  const merchantStats = {};
  monthTxs.forEach(tx => {
    const m = (tx.payee || 'ไม่ระบุ').trim();
    if (!merchantStats[m]) {
      merchantStats[m] = { amount: 0, count: 0, bankId: tx.bankId, categoryId: tx.categoryId };
    }
    merchantStats[m].amount += Number(tx.amount) || 0;
    merchantStats[m].count += 1;
  });

  const sortedMerchants = Object.keys(merchantStats)
    .map(m => {
      const stat = merchantStats[m];
      const pct = totalAmount > 0 ? (stat.amount / totalAmount) * 100 : 0;
      return { name: m, ...stat, percentage: pct };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  // 4. Daily Spending Bar Chart Data (days 1 to 31)
  const daysInMonth = new Date(curYear, curMonth, 0).getDate();
  const dailySpendMap = {};
  for (let i = 1; i <= daysInMonth; i++) {
    dailySpendMap[i] = 0;
  }
  monthTxs.forEach(tx => {
    if (tx.date) {
      const day = parseInt(tx.date.split('-')[2], 10);
      if (day) dailySpendMap[day] = (dailySpendMap[day] || 0) + (Number(tx.amount) || 0);
    }
  });

  const maxDailySpend = Math.max(1, ...Object.values(dailySpendMap));

  const formatBaht = (num) => {
    return Number(num || 0).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      {/* Header Overview */}
      <div className="rounded-3xl bg-white p-5 border border-neutral-200/80 shadow-xs">
        <span className="text-xs font-semibold text-neutral-400 block mb-1">
          สรุปการเงินรายเดือน
        </span>
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-neutral-400">฿</span>
            <span className="text-3xl font-black font-mono text-neutral-900 tracking-tight">
              {formatBaht(totalAmount)}
            </span>
          </div>
          <span className="text-xs font-semibold text-neutral-500">
            {monthTxs.length} รายการ
          </span>
        </div>

        {/* Daily Spending Bar Chart */}
        <div>
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
            <span className="font-bold flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-neutral-400" />
              การใช้จ่ายรายวัน (วันที่ 1 - {daysInMonth})
            </span>
            <span className="text-[11px] text-neutral-400">
              สูงสุด ฿{formatBaht(maxDailySpend)}
            </span>
          </div>

          <div className="h-28 flex items-end gap-1 pt-4 pb-2 border-b border-neutral-100 overflow-x-auto no-scrollbar">
            {Object.entries(dailySpendMap).map(([day, spend]) => {
              const heightPct = (spend / maxDailySpend) * 100;
              const hasSpend = spend > 0;

              return (
                <div
                  key={day}
                  className="flex-1 min-w-[8px] flex flex-col items-center gap-1 group relative cursor-pointer"
                  title={`วันที่ ${day}: ฿${formatBaht(spend)}`}
                >
                  <div className="w-full h-20 flex items-end justify-center">
                    <div
                      className={`w-full max-w-[12px] rounded-t-sm transition-all duration-300 ${
                        hasSpend
                          ? 'bg-amber-500 group-hover:bg-amber-600'
                          : 'bg-neutral-100'
                      }`}
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                    />
                  </div>
                  {/* Day number on bottom */}
                  {parseInt(day, 10) % 5 === 0 && (
                    <span className="text-[9px] text-neutral-400 font-mono">
                      {day}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs: Categories | Banks | Top Merchants */}
      <div className="flex bg-neutral-200/70 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('category')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'category'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          หมวดหมู่
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'bank'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          บัญชี/ธนาคาร
        </button>
        <button
          onClick={() => setActiveTab('merchant')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'merchant'
              ? 'bg-white text-neutral-900 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          ร้านค้า Top 10
        </button>
      </div>

      {/* Tab 1: Categories Breakdown */}
      {activeTab === 'category' && (
        <div className="space-y-2 animate-fade-in">
          {sortedCategories.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl text-center text-neutral-400 text-xs">
              ยังไม่มีข้อมูลในเดือนนี้
            </div>
          ) : (
            sortedCategories.map(cat => (
              <div
                key={cat.id}
                className="p-3.5 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{cat.icon}</span>
                    <div>
                      <h4 className="font-bold text-xs text-neutral-900">
                        {cat.name}
                      </h4>
                      <span className="text-[11px] text-neutral-400">
                        {cat.count} รายการ
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-neutral-900">
                      ฿{formatBaht(cat.amount)}
                    </div>
                    <span className="text-[11px] font-semibold text-neutral-500">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Bank Share */}
      {activeTab === 'bank' && (
        <div className="space-y-2 animate-fade-in">
          {sortedBanks.map(b => (
            <div
              key={b.id}
              className="p-3.5 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-2xs"
                  style={{ backgroundColor: b.color }}
                >
                  {b.iconText}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-neutral-900">
                    {b.fullName}
                  </h4>
                  <span className="text-[11px] text-neutral-400">
                    {b.count} สลิป • {b.percentage.toFixed(1)}% ของทั้งหมด
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-bold text-xs text-neutral-900">
                  ฿{formatBaht(b.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Top Merchants */}
      {activeTab === 'merchant' && (
        <div className="space-y-2 animate-fade-in">
          {sortedMerchants.map((m, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-600 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-neutral-900 truncate">
                    {m.name}
                  </h4>
                  <span className="text-[11px] text-neutral-400">
                    จ่ายไป {m.count} ครั้ง
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-mono font-bold text-xs text-neutral-900">
                  ฿{formatBaht(m.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
