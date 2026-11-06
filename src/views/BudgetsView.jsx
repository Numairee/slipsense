import React, { useState } from 'react';
import { Target, AlertCircle, CheckCircle2, TrendingDown, Edit3, Plus, ShieldCheck } from 'lucide-react';
import { getCategoryById } from '../data/defaultCategories';
import { sound } from '../utils/sound';

export default function BudgetsView({
  transactions,
  categories,
  currentDate,
  budgets,
  onUpdateBudget
}) {
  const [editingCategory, setEditingCategory] = useState(null);
  const [newBudgetVal, setNewBudgetVal] = useState('');

  const curYear = currentDate.getFullYear();
  const curMonth = currentDate.getMonth() + 1;
  const monthPrefix = `${curYear}-${curMonth.toString().padStart(2, '0')}`;

  const monthTxs = transactions.filter(tx => tx.date && tx.date.startsWith(monthPrefix));
  const totalSpent = monthTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  // Group spent by category
  const categorySpent = {};
  monthTxs.forEach(tx => {
    const cid = tx.categoryId || 'other';
    categorySpent[cid] = (categorySpent[cid] || 0) + (Number(tx.amount) || 0);
  });

  // Calculate total monthly budget
  const totalBudget = Object.values(budgets).reduce((a, b) => a + Number(b || 0), 0);
  const remainingBudget = Math.max(0, totalBudget - totalSpent);
  const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Days remaining in month
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === curYear && (now.getMonth() + 1) === curMonth;
  const totalDays = new Date(curYear, curMonth, 0).getDate();
  const daysPassed = isCurrentMonth ? Math.max(1, now.getDate()) : totalDays;
  const daysRemaining = Math.max(1, totalDays - daysPassed);
  const dailySafeSpend = remainingBudget / daysRemaining;

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

  const handleOpenEdit = (cat) => {
    sound.playPop();
    setEditingCategory(cat);
    setNewBudgetVal(budgets[cat.id] || 0);
  };

  const handleSaveBudget = (e) => {
    e.preventDefault();
    if (editingCategory) {
      sound.playCrunch();
      onUpdateBudget(editingCategory.id, Number(newBudgetVal));
      setEditingCategory(null);
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>จัดงบประมาณรายเดือน</span>
          </h2>
          <p className="text-xs text-neutral-400 font-medium">
            คุมรายจ่ายรายหมวด • เตือนก่อนงบรั่วไหล
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
          <Target className="w-3.5 h-3.5" />
          <span>เป้าหมายการเงิน</span>
        </div>
      </div>

      {/* Main Budget Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 border border-neutral-700/60 p-5 shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-300">
              งบประมาณรวมประจำเดือน
            </span>
            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
              overallPct > 100
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : overallPct > 80
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              ใช้ไปแล้ว {overallPct}%
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-2">
            <span className="text-3xl sm:text-4xl font-black font-mono text-white">
              ฿{formatDecimalBaht(totalSpent)}
            </span>
            <span className="text-sm font-bold text-neutral-400">
              / ฿{formatBaht(totalBudget)}
            </span>
          </div>

          {/* Master Progress Bar */}
          <div className="mt-3">
            <div className="w-full h-2.5 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  overallPct > 100
                    ? 'bg-rose-500'
                    : overallPct > 80
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                }`}
                style={{ width: `${Math.min(100, overallPct)}%` }}
              />
            </div>
          </div>

          {/* Remaining & Daily Safe Limit */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/10">
            <div className="bg-white/5 rounded-2xl p-2.5">
              <span className="text-[10px] text-neutral-400 font-medium">งบที่เหลือในเดือนนี้</span>
              <div className="text-sm font-black font-mono text-emerald-300 mt-0.5">
                ฿{formatBaht(remainingBudget)}
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-2.5">
              <span className="text-[10px] text-neutral-400 font-medium">ใช้ได้ปลอดภัยต่อวัน</span>
              <div className="text-sm font-black font-mono text-cyan-300 mt-0.5">
                ฿{formatBaht(dailySafeSpend)} <span className="text-[10px] font-sans font-normal text-neutral-400">({daysRemaining} วัน)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* Category Budgets List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold text-white">
            งบประมาณแยกตามหมวดหมู่
          </h3>
          <span className="text-[10px] text-neutral-400">
            แตะที่รายการเพื่อแก้ไขงบ
          </span>
        </div>

        {categories.map((cat) => {
          const spent = categorySpent[cat.id] || 0;
          const budget = budgets[cat.id] || 0;
          const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
          const isOver = spent > budget && budget > 0;

          return (
            <div
              key={cat.id}
              onClick={() => handleOpenEdit(cat)}
              className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 active:scale-99 transition-all cursor-pointer shadow-md"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{cat.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{cat.name}</span>
                      <Edit3 className="w-3 h-3 text-neutral-500" />
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      ใช้ไป ฿{formatDecimalBaht(spent)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-xs font-black font-mono ${
                    isOver ? 'text-rose-400' : 'text-neutral-200'
                  }`}>
                    {budget > 0 ? `฿${formatBaht(budget)}` : 'ยังไม่ได้ตั้ง'}
                  </div>
                  {budget > 0 && (
                    <span className={`text-[10px] font-bold ${
                      isOver ? 'text-rose-400' : pct > 80 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {pct}%
                    </span>
                  )}
                </div>
              </div>

              {budget > 0 && (
                <div className="w-full h-1.5 rounded-full bg-neutral-800 mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Budget Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{editingCategory.icon}</span>
              <div>
                <h3 className="text-sm font-extrabold text-white">
                  แก้ไขงบหมวด {editingCategory.name}
                </h3>
                <p className="text-[11px] text-neutral-400">
                  ระบุงบประมาณรายเดือนที่ต้องการควบคุม
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  งบประมาณต่อเดือน (บาท)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">฿</span>
                  <input
                    type="number"
                    value={newBudgetVal}
                    onChange={(e) => setNewBudgetVal(e.target.value)}
                    placeholder="เช่น 5000"
                    autoFocus
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-mono font-bold text-base focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-bold hover:bg-neutral-700 active:scale-98 transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-extrabold hover:bg-emerald-600 active:scale-98 transition-all shadow-md shadow-emerald-500/20"
                >
                  บันทึกงบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
