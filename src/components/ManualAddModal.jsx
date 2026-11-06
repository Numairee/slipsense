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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-tight">
                จดรายจ่ายเงินสด / บันทึกเอง
              </h3>
              <p className="text-[11px] text-neutral-400 font-medium">
                สำหรับกรณีจ่ายเงินสด หรือไม่มีสลิปโอน
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1.5">
              จำนวนเงิน (บาท) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-neutral-500">
                ฿
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-neutral-800 border border-neutral-700 text-2xl font-black font-mono text-white placeholder:text-neutral-600 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            {/* Quick add baht pills */}
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 no-scrollbar">
              {[20, 50, 100, 500, 1000].map((add) => (
                <button
                  key={add}
                  type="button"
                  onClick={() => handleQuickAddBaht(add)}
                  className="px-2.5 py-1 rounded-xl bg-neutral-800 border border-neutral-700 text-xs font-mono font-medium text-neutral-300 hover:bg-neutral-700 active:scale-95 transition-all"
                >
                  +{add}
                </button>
              ))}
            </div>
          </div>

          {/* Payee / Description */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1.5">
              ร้านค้า / ผู้รับเงิน / รายการ
            </label>
            <input
              type="text"
              placeholder="เช่น ข้าวมันไก่, กาแฟสด, ค่ารถเมล์"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1.5">
              หมวดหมู่
            </label>
            <div className="grid grid-cols-4 gap-1.5">
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
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 shadow-sm'
                        : 'border-neutral-700 bg-neutral-800/80 text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-[10px] font-bold truncate max-w-full">
                      {cat.shortName || cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1.5">
                วันที่
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-hidden focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1.5">
                เวลา
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-hidden focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Payment Method / Bank */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1.5">
              ช่องทางการจ่าย
            </label>
            <select
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-hidden focus:border-cyan-500"
            >
              <option value="CASH">💵 เงินสด (Cash)</option>
              {BANK_LIST.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.fullName})
                </option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1.5">
              บันทึกช่วยจำ (ไม่บังคับ)
            </label>
            <input
              type="text"
              placeholder="หมายเหตุเพิ่มเติม..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 text-white font-black text-sm shadow-lg shadow-cyan-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกรายการ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
