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
      className="group flex items-center justify-between p-3.5 bg-white hover:bg-neutral-50/80 active:bg-neutral-100 rounded-2xl border border-neutral-200/70 shadow-2xs transition-all cursor-pointer select-none"
    >
      {/* Left: Bank Badge & Details */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Bank Logo / Badge */}
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs relative overflow-hidden"
          style={{
            backgroundColor: bank.color,
            color: bank.textColor
          }}
          title={bank.fullName || bank.name}
        >
          {bank.iconText}
          {transaction.slipThumbnail && (
            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-white/90 flex items-center justify-center text-neutral-800">
              <ImageIcon className="w-2 h-2 text-neutral-700" />
            </div>
          )}
        </div>

        {/* Payee & Subtitle */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <h4 className="font-extrabold text-sm text-neutral-900 truncate">
              {transaction.payee || `${bank.name} (${bank.shortName})`}
            </h4>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-500 flex-wrap">
            {/* Prominent Bank Badge Pill */}
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 border"
              style={{
                backgroundColor: bank.bgLight || '#f1f5f9',
                color: bank.color,
                borderColor: `${bank.color}30`
              }}
            >
              {bank.name}
            </span>

            <span className="font-mono text-[11px] text-neutral-400">
              {transaction.time || '--:--'}
            </span>

            <span>•</span>

            {/* Category tag */}
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[11px] font-medium"
              style={{
                backgroundColor: category.bgColor,
                color: category.color
              }}
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
        <div className="font-mono font-bold text-sm text-neutral-900 tracking-tight">
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
