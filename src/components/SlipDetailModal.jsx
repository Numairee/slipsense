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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bank Header Strip */}
        <div
          className="p-5 text-white relative transition-colors"
          style={{ backgroundColor: bank.color }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-xs">
                {bank.iconText}
              </span>
              <div>
                <h3 className="font-bold text-sm leading-tight">{bank.fullName}</h3>
                <span className="text-[11px] text-white/80">สลิปอิเล็กทรอนิกส์ e-Slip</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Big Amount */}
          <div className="text-center py-2">
            <div className="text-xs uppercase tracking-wider text-white/70 font-semibold mb-1">
              ยอดเงินที่ชำระ
            </div>
            <div className="text-3xl font-black font-mono tracking-tight">
              ฿{formatBaht(amount)}
            </div>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-neutral-800">
          {/* Slip Thumbnail (if available) */}
          {transaction.slipThumbnail && (
            <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-neutral-50 p-2 flex items-center gap-3">
              <img
                src={transaction.slipThumbnail}
                alt="Slip preview"
                className="w-16 h-20 object-cover rounded-xl border border-neutral-200"
              />
              <div className="text-xs text-neutral-500">
                <span className="font-semibold text-neutral-800 block mb-0.5">
                  สลิปต้นฉบับ (เก็บในเครื่อง)
                </span>
                <span>ระบบอ่านข้อมูลอัตโนมัติ ไม่ได้ส่งรูปออกไปที่ไหน</span>
              </div>
            </div>
          )}

          {/* Payee / Receiver */}
          <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-200/80">
            <label className="text-[11px] font-semibold text-neutral-400 block mb-1 uppercase tracking-wide">
              ร้านค้า / ผู้รับเงิน
            </label>
            <input
              type="text"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              className="w-full font-bold text-sm text-neutral-900 bg-transparent focus:outline-hidden"
              placeholder="ระบุชื่อร้านค้าหรือผู้รับ"
            />
            {transaction.sender && (
              <div className="mt-2 pt-2 border-t border-neutral-200/60 text-xs text-neutral-500 flex items-center justify-between">
                <span>จาก:</span>
                <span className="font-medium text-neutral-700">{transaction.sender}</span>
              </div>
            )}
          </div>

          {/* Date, Time, Ref */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-neutral-50 rounded-xl p-2.5 border border-neutral-200/70">
              <span className="text-[10px] text-neutral-400 font-semibold block mb-0.5">วันเวลา</span>
              <span className="font-medium text-neutral-800 flex items-center gap-1">
                <Clock className="w-3 h-3 text-neutral-400" />
                {transaction.date} {transaction.time}
              </span>
            </div>
            <div className="bg-neutral-50 rounded-xl p-2.5 border border-neutral-200/70 truncate">
              <span className="text-[10px] text-neutral-400 font-semibold block mb-0.5">รหัสอ้างอิง</span>
              <span className="font-mono text-neutral-700 truncate block text-[11px]">
                {transaction.ref || '-'}
              </span>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-2 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-neutral-500" />
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
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs scale-102 font-bold'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
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
            <label className="flex items-center gap-2 mt-2.5 text-xs text-neutral-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMerchant}
                onChange={(e) => setRememberMerchant(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
              />
              <span>จำหมวดหมู่นี้สำหรับ <b>"{payee}"</b> ในครั้งต่อไป</span>
            </label>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-neutral-500" />
              บันทึกช่วยจำ (Note)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ข้าวเที่ยง, ช้อปปิ้งของใช้..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-hidden focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-200/80 bg-neutral-50 flex items-center justify-between gap-3">
          {showConfirmDelete ? (
            <div className="flex items-center gap-2 w-full animate-fade-in">
              <span className="text-xs font-semibold text-rose-600 flex-1">ยืนยันลบรายการนี้?</span>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-200 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-xl shadow-xs hover:bg-rose-700"
              >
                ลบเลย
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="w-10 h-10 rounded-xl border border-neutral-200 hover:border-rose-300 hover:text-rose-600 flex items-center justify-center text-neutral-500 transition-colors"
                title="ลบรายการนี้"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-3 px-4 rounded-2xl bg-neutral-900 text-white font-bold text-sm shadow-md hover:bg-neutral-800 active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                บันทึกการเปลี่ยนแปลง
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
