import React, { useState } from 'react';
import { X, Check, Banknote, Calendar, Tag, FileText } from 'lucide-react';
import { BANK_LIST } from '../data/banks';
import { sound } from '../utils/sound';

export default function ManualAddModal({
  isOpen,
  onClose,
  categories,
  onAddTransaction
}) {
  if (!isOpen) return null;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const [amount, setAmount] = useState('');
  const [payee, setPayee] = useState('');
  const [categoryId, setCategoryId] = useState('food');
  const [bankId, setBankId] = useState('CASH');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(timeStr);

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    sound.playPop();

    const newTx = {
      id: 'tx_manual_' + Date.now(),
      date,
      time,
      timestamp: Date.now(),
      amount: numAmount,
      bankId,
      payee: payee.trim() || 'จ่ายเงินสด',
      sender: 'เงินสดในกระเป๋า',
      categoryId,
      ref: 'CASH-' + Math.floor(1000 + Math.random() * 9000),
      note: note.trim(),
      isManual: true,
    };

    onAddTransaction(newTx);
    onClose();
  };

  const handleQuickAddBaht = (add) => {
    sound.playPop();
    const cur = parseFloat(amount) || 0;
    setAmount((cur + add).toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200/80 flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 leading-tight">
                จดรายจ่ายเงินสด / บันทึกเอง
              </h3>
              <p className="text-[11px] text-neutral-500 font-medium">
                สำหรับกรณีจ่ายเงินสด หรือไม่มีสลิปโอน
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-200/80 hover:bg-neutral-300 flex items-center justify-center text-neutral-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Amount input */}
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 text-center">
            <span className="text-[11px] font-semibold text-neutral-400 block mb-1 uppercase tracking-wide">
              จำนวนเงิน (บาท)
            </span>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-neutral-400">฿</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-48 text-3xl font-black font-mono text-center text-neutral-900 bg-transparent focus:outline-hidden"
              />
            </div>

            {/* Quick add buttons */}
            <div className="flex justify-center gap-1.5 mt-3">
              {[20, 50, 100, 500].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => handleQuickAddBaht(b)}
                  className="px-2.5 py-1 rounded-xl bg-white border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 active:scale-95 shadow-2xs"
                >
                  +{b}
                </button>
              ))}
            </div>
          </div>

          {/* Payee / Shop name */}
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              ชื่อร้านค้า / รายการ
            </label>
            <input
              type="text"
              required
              placeholder="เช่น ร้านก๋วยเตี๋ยว, ค่าตัดผม, ซื้อน้ำ..."
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-hidden focus:border-neutral-900"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-neutral-500" />
              หมวดหมู่
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      sound.playPop();
                      setCategoryId(cat.id);
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
          </div>

          {/* Payment Method / Bank */}
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              ช่องทางการจ่ายเงิน
            </label>
            <select
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm bg-white focus:outline-hidden focus:border-neutral-900"
            >
              {BANK_LIST.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-neutral-500" />
              บันทึกช่วยจำ (ไม่บังคับ)
            </label>
            <input
              type="text"
              placeholder="หมายเหตุเพิ่มเติม..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-hidden focus:border-neutral-900"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              บันทึกรายการ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
