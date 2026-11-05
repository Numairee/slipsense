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
      <div className="flex items-center gap-3 min-w-0">
        {/* Bank Logo / Badge */}
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs relative overflow-hidden"
          style={{
            backgroundColor: bank.color,
            color: bank.textColor
          }}
        >
          {bank.iconText}
          {/* Subtle slip badge icon if slip image attached */}
          {transaction.slipThumbnail && (
            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-white/90 flex items-center justify-center text-neutral-800">
              <ImageIcon className="w-2 h-2 text-neutral-700" />
            </div>
          )}
        </div>

        {/* Payee & Subtitle */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h4 className="font-bold text-sm text-neutral-900 truncate">
              {transaction.payee || 'ไม่ระบุผู้รับ'}
            </h4>
            {!transaction.isManual && (
              <span className="shrink-0 text-[9px] font-semibold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                สลิป
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
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

      {/* Right: Amount */}
      <div className="text-right shrink-0 pl-3">
        <div className="font-mono font-bold text-sm text-neutral-900 tracking-tight">
          -฿{formatBaht(transaction.amount)}
        </div>
        <div className="text-[10px] text-neutral-400 font-medium">
          {bank.shortName}
        </div>
      </div>
    </div>
  );
}
