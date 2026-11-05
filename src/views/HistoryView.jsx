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
    <div className="space-y-3 pb-20 animate-fade-in">
      {/* Search & Export Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาร้านค้า, บันทึกช่วยจำ, เลขอ้างอิง..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-neutral-200/80 rounded-2xl text-xs placeholder:text-neutral-400 focus:outline-hidden focus:border-neutral-900 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500"
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
          className="shrink-0 p-2.5 bg-white border border-neutral-200/80 hover:bg-neutral-50 rounded-2xl text-neutral-700 shadow-2xs flex items-center gap-1 text-xs font-bold active:scale-95 transition-all"
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
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
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
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.shortName || cat.name}</span>
          </button>
        ))}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs px-1 text-neutral-500">
        <span>พบ {filtered.length} รายการ</span>
        <span className="font-bold text-neutral-900 font-mono">
          รวม ฿{formatBaht(totalFilteredAmount)}
        </span>
      </div>

      {/* Transactions List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200/80">
          <div className="text-3xl mb-2">🔍</div>
          <h4 className="font-bold text-sm text-neutral-800 mb-1">ไม่พบรายการที่ตรงกับเงื่อนไข</h4>
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
