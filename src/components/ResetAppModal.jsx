import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, RefreshCw, RotateCcw } from 'lucide-react';
import { sound } from '../utils/sound';

export default function ResetAppModal({
  isOpen,
  onClose,
  onConfirmReset,
  onClearAndRescan,
  transactionsCount = 0
}) {
  const [step, setStep] = useState('choose'); // 'choose' | 'confirm_full'

  if (!isOpen) return null;

  const handleClose = () => {
    sound.playPop();
    setStep('choose');
    onClose();
  };

  const handleExecuteReset = () => {
    sound.playPop();
    onConfirmReset();
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-neutral-200 animate-scale-up space-y-4 text-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-neutral-900 leading-tight">
                ล้างข้อมูลแอป
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {transactionsCount > 0 ? `มีข้อมูลบันทึกอยู่ ${transactionsCount} รายการ` : 'ยังไม่มีรายการในแอป'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'choose' ? (
          <div className="space-y-3 pt-1">
            <p className="text-xs text-neutral-600 leading-relaxed">
              เลือกระดับการล้างข้อมูลที่คุณต้องการดำเนินการ:
            </p>

            {/* Option 1: Full Factory Reset */}
            <button
              onClick={() => {
                sound.playPop();
                setStep('confirm_full');
              }}
              className="w-full p-3.5 rounded-2xl border-2 border-rose-200 bg-rose-50/60 hover:bg-rose-100/70 text-left transition-all group active:scale-98"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-rose-700 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4" />
                  <span>ล้างแอปทั้งหมด (คืนค่าเริ่มต้น)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-200/80 text-rose-800 rounded-md">
                  แนะนำ
                </span>
              </div>
              <p className="text-[11px] text-rose-900/80 mt-1 leading-snug">
                ลบรายการสลิปที่บันทึกไว้ในแอป รีเซ็ตสถิติและการให้อาหารน้องแพะ (รูปในอัลบั้มไม่ถูกลบ)
              </p>
            </button>

            {/* Option 2: Clear & Rescan */}
            {onClearAndRescan && (
              <button
                onClick={() => {
                  sound.playPop();
                  handleClose();
                  onClearAndRescan();
                }}
                className="w-full p-3.5 rounded-2xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-left transition-all active:scale-98"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-amber-800 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4" />
                    <span>ล้างแล้วสแกนสลิปใหม่</span>
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/80 mt-1 leading-snug">
                  ลบรายการเก่าออก แล้วสแกนค้นหาเฉพาะสลิปโอนเงินจริงจากเครื่องใหม่อีกครั้ง
                </p>
              </button>
            )}

            <button
              onClick={handleClose}
              className="w-full py-2.5 text-xs font-bold text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        ) : (
          /* Confirmation Step */
          <div className="space-y-3 pt-1 animate-fade-in">
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-800 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>ยืนยันการล้างข้อมูลทั้งหมด?</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-700">
                <li>ประวัติรายจ่ายและรายการที่บันทึกไว้ในแอปจะถูกล้าง</li>
                <li>สถิติและการให้อาหารน้องปิ๊กมี่จะถูกรีเซ็ตเป็น 0</li>
                <li>กฎจดจำหมวดหมู่ร้านค้าจะถูกล้าง</li>
                <li className="font-bold text-emerald-800 list-none -ml-4 pt-1 flex items-center gap-1">
                  <span>🔒 รูปภาพสลิปจริงในอัลบั้มมือถือจะไม่ถูกลบหรือแตะต้องใดๆ</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setStep('choose')}
                className="flex-1 py-2.5 px-3 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-50 active:scale-98 transition-all"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={handleExecuteReset}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-extrabold text-white shadow-md shadow-rose-600/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันล้างแอป</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
