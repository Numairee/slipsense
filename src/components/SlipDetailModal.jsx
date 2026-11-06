import React, { useState, useEffect } from 'react';
import { X, Trash2, Check, Calendar, Clock, CreditCard, Tag, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { getBankById } from '../data/banks';
import { getCategoryById } from '../data/defaultCategories';
import { sound } from '../utils/sound';

export default function SlipDetailModal({
  transaction,
  categories,
  onClose,
  onSave,
  onDelete
}) {
  if (!transaction) return null;

  const bank = getBankById(transaction.bankId);
  const [selectedCatId, setSelectedCatId] = useState(transaction.categoryId);
  const [note, setNote] = useState(transaction.note || '');
  const [payee, setPayee] = useState(transaction.payee || '');
  const [amount, setAmount] = useState(transaction.amount || 0);
  const [rememberMerchant, setRememberMerchant] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    setSelectedCatId(transaction.categoryId);
    setNote(transaction.note || '');
    setPayee(transaction.payee || '');
    setAmount(transaction.amount || 0);
  }, [transaction]);

  const handleSave = () => {
    sound.playPop();
    onSave(transaction.id, {
      categoryId: selectedCatId,
      note,
      payee,
      amount: Number(amount),
    }, rememberMerchant);
    onClose();
  };

  const handleDelete = () => {
    sound.playPop();
    onDelete(transaction.id);
    onClose();
  };

  const formatBaht = (num) => {
    return Number(num || 0).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in">
      <div
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bank Header Strip */}
        <div
          className="p-5 text-white relative transition-colors shadow-md"
          style={{ backgroundColor: bank.color }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-xs">
                {bank.iconText}
              </span>
              <div>
                <h3 className="font-bold text-sm leading-tight text-white">{bank.fullName}</h3>
                <span className="text-[11px] text-white/80">สลิปอิเล็กทรอนิกส์ e-Slip</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Big Amount */}
          <div className="text-center py-2">
            <div className="text-xs uppercase tracking-wider text-white/80 font-semibold mb-1">
              ยอดเงินที่ชำระ
            </div>
            <div className="text-3xl font-black font-mono tracking-tight text-white">
              ฿{formatBaht(amount)}
            </div>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-white">
          {/* Slip Thumbnail (if available) */}
          {transaction.slipThumbnail && (
            <div className="rounded-2xl border border-neutral-800 overflow-hidden bg-neutral-800/80 p-2.5 flex items-center gap-3">
              <img
                src={transaction.slipThumbnail}
                alt="Slip preview"
                className="w-16 h-20 object-cover rounded-xl border border-neutral-700"
              />
              <div className="text-xs text-neutral-400">
                <span className="font-bold text-white block mb-0.5">
                  สลิปต้นฉบับ (เก็บในเครื่อง)
                </span>
                <span>ระบบอ่านข้อมูลออฟไลน์ 100% ไม่ส่งรูปออกภายนอก</span>
              </div>
            </div>
          )}

          {/* Payee / Receiver */}
          <div className="bg-neutral-800/80 rounded-2xl p-3.5 border border-neutral-700/60">
            <label className="text-[11px] font-semibold text-neutral-400 block mb-1 uppercase tracking-wide">
              ร้านค้า / ผู้รับเงิน
            </label>
            <input
              type="text"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              className="w-full font-bold text-sm text-white bg-transparent focus:outline-hidden"
              placeholder="ระบุชื่อร้านค้าหรือผู้รับ"
            />
            {transaction.sender && (
              <div className="mt-2 pt-2 border-t border-neutral-700/60 text-xs text-neutral-400 flex items-center justify-between">
                <span>จาก:</span>
                <span className="font-medium text-neutral-300">{transaction.sender}</span>
              </div>
            )}
          </div>

          {/* Date, Time, Ref */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-neutral-800/80 rounded-xl p-2.5 border border-neutral-700/60">
              <span className="text-[10px] text-neutral-400 font-semibold block mb-0.5">วันเวลา</span>
              <span className="font-medium text-neutral-200 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-cyan-400" />
                {transaction.date} {transaction.time}
              </span>
            </div>
            <div className="bg-neutral-800/80 rounded-xl p-2.5 border border-neutral-700/60 truncate">
              <span className="text-[10px] text-neutral-400 font-semibold block mb-0.5">รหัสอ้างอิง</span>
              <span className="font-mono text-neutral-300 truncate block text-[11px]">
                {transaction.ref || '-'}
              </span>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-2 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              หมวดหมู่ค่าใช้จ่าย
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCatId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      sound.playPop();
                      setSelectedCatId(cat.id);
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 shadow-md font-bold'
                        : 'border-neutral-700 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    <span className="text-xl mb-1">{cat.icon}</span>
                    <span className="text-[10px] truncate max-w-full">
                      {cat.shortName || cat.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Remember Merchant Rule checkbox */}
            <label className="flex items-center gap-2 mt-2.5 text-xs text-neutral-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMerchant}
                onChange={(e) => setRememberMerchant(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 accent-cyan-500"
              />
              <span>จำหมวดหมู่นี้สำหรับ <b className="text-white">"{payee}"</b> ในครั้งต่อไป</span>
            </label>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              บันทึกช่วยจำ (Note)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="พิมพ์บันทึกช่วยจำเพิ่มเติม..."
              className="w-full p-3 rounded-2xl bg-neutral-800 border border-neutral-700 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-cyan-500 resize-none"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between gap-2">
          {showConfirmDelete ? (
            <div className="flex items-center gap-2 w-full animate-fade-in">
              <span className="text-xs font-bold text-rose-400 flex-1">ยืนยันลบรายการนี้?</span>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-3 py-2 rounded-xl bg-neutral-800 text-xs font-medium text-neutral-300 hover:bg-neutral-700"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 shadow-sm"
              >
                ลบรายการ
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="p-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 transition-colors"
                title="ลบรายการนี้"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>บันทึกการแก้ไข</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
