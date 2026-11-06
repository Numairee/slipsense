import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, RefreshCw, RotateCcw, ShieldCheck } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-sm bg-neutral-900 rounded-3xl p-5 shadow-2xl border border-neutral-800 animate-scale-up space-y-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white leading-tight">
                ล้างข้อมูลแอป
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {transactionsCount > 0 ? `มีข้อมูลบันทึกอยู่ ${transactionsCount} รายการ` : 'ยังไม่มีรายการในแอป'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'choose' ? (
          <div className="space-y-3 pt-1">
            <p className="text-xs text-neutral-300 leading-relaxed">
              เลือกระดับการล้างข้อมูลที่คุณต้องการดำเนินการ:
            </p>

            {/* Option 1: Full Factory Reset */}
            <button
              onClick={() => {
                sound.playPop();
                setStep('confirm_full');
              }}
              className="w-full p-3.5 rounded-2xl border-2 border-rose-500/40 bg-rose-950/20 hover:bg-rose-950/40 text-left transition-all group active:scale-98"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-rose-400 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4" />
                  <span>ล้างแอปทั้งหมด (คืนค่าเริ่มต้น)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-md">
                  แนะนำ
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                ลบรายการสลิปและข้อมูลที่บันทึกไว้ในแอป SlipSense ทั้งหมด (รูปถ่ายในอัลบั้มมือถือไม่ถูกลบอย่างแน่นอน)
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
                className="w-full p-3.5 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-950/40 text-left transition-all active:scale-98"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-cyan-300 flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4" />
                    <span>ล้างแล้วสแกนสลิปใหม่</span>
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                  ล้างรายการเดิม แล้วเริ่มกวาดค้นหาสลิปจริงในเครื่องใหม่ทั้งหมดทันที
                </p>
              </button>
            )}

            <div className="p-3 bg-neutral-800/80 rounded-2xl border border-neutral-700/60 text-[11px] text-neutral-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <b>ปลอดภัย 100%:</b> ไม่ลบรูปภาพสลิปจริงหรือไฟล์ใดๆ ในแกลเลอรีมือถือของคุณ
              </span>
            </div>
          </div>
        ) : (
          /* Step 2: Confirm Full Reset */
          <div className="space-y-4 pt-1 animate-fade-in">
            <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-left space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-extrabold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>ยืนยันการล้างข้อมูลแอป</span>
              </div>
              <p className="text-xs text-rose-200/80 leading-relaxed">
                การดำเนินการนี้จะลบรายการสลิปและข้อมูลสถิติที่บันทึกไว้ใน SlipSense ทั้งหมด ข้อมูลจะไม่สามารถกู้คืนได้
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('choose')}
                className="flex-1 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-neutral-300 text-xs font-bold hover:bg-neutral-700 active:scale-98 transition-all"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold active:scale-98 transition-all shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันล้างทันที</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
