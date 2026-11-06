import React, { useState } from 'react';
import TransactionItem from '../components/TransactionItem';
import { Search, Filter, Calendar, X, Download } from 'lucide-react';
import { BANK_LIST } from '../data/banks';
import { sound } from '../utils/sound';

export default function HistoryView({
  transactions,
  categories,
  onOpenDetailModal,
  onExportCSV
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBank, setSelectedBank] = useState('all');

  const filtered = transactions.filter(tx => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPayee = (tx.payee || '').toLowerCase().includes(q);
      const matchNote = (tx.note || '').toLowerCase().includes(q);
      const matchRef = (tx.ref || '').toLowerCase().includes(q);
      if (!matchPayee && !matchNote && !matchRef) return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) {
      return false;
    }

    // Bank filter
    if (selectedBank !== 'all' && tx.bankId !== selectedBank) {
      return false;
    }

    return true;
  });

  const totalFilteredAmount = filtered.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const formatBaht = (num) => {
    return Number(num || 0).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="space-y-3.5 pb-24 animate-fade-in">
      {/* Search & Export Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาร้านค้า, บันทึกช่วยจำ, เลขอ้างอิง..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-neutral-900 border border-neutral-800 rounded-2xl text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-cyan-500 shadow-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-neutral-700 flex items-center justify-center text-neutral-300"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => {
            sound.playPop();
            onExportCSV();
          }}
          className="shrink-0 p-2.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 rounded-2xl text-cyan-400 shadow-md flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-all"
          title="ส่งออกไฟล์ CSV สำหรับ Excel"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">CSV</span>
        </button>
      </div>

      {/* Filter Chips Bar (Scrollable) */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => { sound.playPop(); setSelectedCategory('all'); }}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedCategory === 'all'
              ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/30'
              : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          ทุกหมวดหมู่
        </button>

        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => { sound.playPop(); setSelectedCategory(cat.id); }}
            className={`shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              selectedCategory === cat.id
                ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/30'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.shortName || cat.name}</span>
          </button>
        ))}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs px-1 text-neutral-400">
        <span>พบ {filtered.length} รายการ</span>
        <span className="font-bold text-white font-mono">
          รวม ฿{formatBaht(totalFilteredAmount)}
        </span>
      </div>

      {/* Transactions List */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center bg-neutral-900 rounded-3xl border border-neutral-800/80 shadow-md">
          <div className="text-3xl mb-2">🔍</div>
          <h4 className="font-bold text-sm text-white mb-1">ไม่พบรายการที่ตรงกับเงื่อนไข</h4>
          <p className="text-xs text-neutral-400">ลองค้นหาด้วยคำอื่น หรือล้างตัวกรอง</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(tx => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              categories={categories}
              onClick={onOpenDetailModal}
            />
          ))}
        </div>
      )}
    </div>
  );
}
