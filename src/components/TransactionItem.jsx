import React from 'react';
import { getBankById } from '../data/banks';
import { getCategoryById } from '../data/defaultCategories';
import { Image as ImageIcon } from 'lucide-react';

export default function TransactionItem({ transaction, categories, onClick }) {
  const bank = getBankById(transaction.bankId);
  const category = getCategoryById(categories, transaction.categoryId);

  const formatBaht = (num) => {
    return Number(num || 0).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div
      onClick={() => onClick(transaction)}
      className="group flex items-center justify-between p-3.5 bg-neutral-900 hover:bg-neutral-850 active:bg-neutral-800 rounded-2xl border border-neutral-800/90 shadow-md transition-all cursor-pointer select-none"
    >
      {/* Left: Bank Badge & Details */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Bank Logo / Badge */}
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm relative overflow-hidden"
          style={{
            backgroundColor: bank.color,
            color: bank.textColor
          }}
          title={bank.fullName || bank.name}
        >
          {bank.iconText}
          {transaction.slipThumbnail && (
            <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-black/80 flex items-center justify-center text-white">
              <ImageIcon className="w-2.5 h-2.5 text-cyan-400" />
            </div>
          )}
        </div>

        {/* Payee & Subtitle */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h4 className="font-extrabold text-xs sm:text-sm text-white truncate">
              {transaction.payee || `${bank.name} (${bank.shortName})`}
            </h4>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-400 flex-wrap">
            {/* Bank Badge Pill */}
            <span
              className="inline-flex items-center px-1.5 py-0.2 rounded-md text-[10px] font-bold shrink-0 border"
              style={{
                backgroundColor: `${bank.color}20`,
                color: bank.color,
                borderColor: `${bank.color}40`
              }}
            >
              {bank.name}
            </span>

            <span className="font-mono text-[11px] text-neutral-400">
              {transaction.time || '--:--'}
            </span>

            <span className="text-neutral-600">•</span>

            {/* Category tag */}
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[10px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700"
            >
              <span>{category.icon}</span>
              <span>{category.shortName || category.name}</span>
            </span>
          </div>

          {transaction.note && (
            <p className="text-[11px] text-neutral-400 truncate mt-0.5">
              {transaction.note}
            </p>
          )}
        </div>
      </div>

      {/* Right: Amount & Bank Name */}
      <div className="text-right shrink-0 pl-3">
        <div className="font-mono font-bold text-xs sm:text-sm text-white tracking-tight">
          -฿{formatBaht(transaction.amount)}
        </div>
        <div
          className="text-[10px] font-extrabold mt-0.5"
          style={{ color: bank.color }}
        >
          {bank.shortName}
        </div>
      </div>
    </div>
  );
}
