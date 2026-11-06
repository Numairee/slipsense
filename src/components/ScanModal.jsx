import React, { useState, useRef } from 'react';
import { X, UploadCloud, Camera, Image, Check, AlertCircle, Sparkles, Loader2, Plus, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { parseSlipImage, SAMPLE_TEST_SLIPS } from '../utils/slipParser';
import { getBankById } from '../data/banks';
import { getCategoryById } from '../data/defaultCategories';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';

export default function ScanModal({
  isOpen,
  onClose,
  categories,
  merchantRules,
  existingTransactions = [],
  onImportBatch
}) {
  if (!isOpen) return null;

  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [rejectedCount, setRejectedCount] = useState(0);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Check if a transaction is a duplicate against existing database
  const checkIsDuplicate = (item) => {
    return existingTransactions.some(ex => {
      // 1. Match by reference code
      if (item.ref && ex.ref && item.ref === ex.ref) return true;
      // 2. Match by bank + amount + date + time
      if (
        ex.bankId === item.bankId &&
        Number(ex.amount) === Number(item.amount) &&
        ex.date === item.date &&
        ex.time === item.time
      ) {
        return true;
      }
      return false;
    });
  };

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    sound.playPop();

    const newItems = [];
    let rejected = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      const res = await parseSlipImage(file, merchantRules, categories);
      if (res.success && res.data) {
        const isDup = checkIsDuplicate(res.data);
        newItems.push({
          ...res.data,
          isDuplicate: isDup
        });
      } else {
        rejected++;
      }
    }

    if (rejected > 0) {
      setRejectedCount(prev => prev + rejected);
    }
    setExtractedItems(prev => [...newItems, ...prev]);
    setIsProcessing(false);

    if (newItems.length > 0) {
      sound.playCrunch();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleAddSample = (sample) => {
    sound.playPop();
    const d = new Date();
    const todayStr = d.toISOString().split('T')[0];
    const rnd = Math.floor(100000 + Math.random() * 900000);

    const testItem = {
      id: 'tx_test_' + Date.now() + '_' + rnd,
      date: todayStr,
      time: sample.time || '12:00',
      timestamp: Date.now(),
      amount: sample.amount,
      bankId: sample.bankId,
      payee: sample.payee,
      sender: sample.sender,
      categoryId: sample.categoryId,
      ref: `${sample.bankId}${rnd}`,
      note: sample.note,
      isManual: false,
    };

    testItem.isDuplicate = checkIsDuplicate(testItem);
    setExtractedItems(prev => [testItem, ...prev]);
  };

  const handleUpdateItemCategory = (idx, newCatId) => {
    sound.playPop();
    setExtractedItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], categoryId: newCatId };
      return copy;
    });
  };

  const handleRemoveItem = (idx) => {
    sound.playPop();
    setExtractedItems(prev => prev.filter((_, i) => i !== idx));
  };

  const itemsToImport = extractedItems.filter(item => {
    if (skipDuplicates && item.isDuplicate) return false;
    return true;
  });

  const duplicateItemsCount = extractedItems.filter(item => item.isDuplicate).length;

  const handleConfirmImport = () => {
    if (itemsToImport.length === 0) return;

    sound.playCrunch();
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.5 }
      });
    }, 200);

    onImportBatch(itemsToImport);
    onClose();
  };

  const formatBaht = (num) => {
    return Number(num || 0).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-lg">
              📸
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-tight">
                เลือกและสแกนสลิปโอนเงิน (e-Slip)
              </h3>
              <p className="text-[11px] text-neutral-400 font-medium">
                อ่านข้อมูลในเครื่อง 100% • ตรวจจับสลิปซ้ำให้อัตโนมัติ
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
              dragOver
                ? 'border-cyan-500 bg-cyan-950/30 scale-101'
                : 'border-neutral-700 hover:border-neutral-600 bg-neutral-800/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFiles(e.target.files)}
              multiple
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={(e) => handleFiles(e.target.files)}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            {isProcessing ? (
              <div className="py-6 flex flex-col items-center justify-center text-neutral-400">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mb-2" />
                <span className="font-bold text-sm text-white">
                  กำลังอ่านข้อมูลสลิปในเครื่อง...
                </span>
                <span className="text-xs text-neutral-400">
                  ตรวจจับธนาคาร, วันที่, จำนวนเงิน และตรวจเช็กสลิปซ้ำ
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-sm text-white mb-1">
                  ลากไฟล์รูปสลิปมาวาง หรือกดเลือกรูปภาพ
                </h4>
                <p className="text-xs text-neutral-400 mb-4 max-w-xs">
                  รองรับสลิปทุกธนาคารไทย (K PLUS, SCB, NEXT, KMA, ttb, ฯลฯ)
                </p>

                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => {
                      sound.playPop();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500 text-white font-bold text-xs hover:bg-cyan-600 active:scale-95 shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
                  >
                    <Image className="w-4 h-4" />
                    เลือกรูปสลิปจากอัลบั้ม
                  </button>

                  <button
                    onClick={() => {
                      sound.playPop();
                      cameraInputRef.current?.click();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 font-bold text-xs hover:bg-neutral-700 active:scale-95 border border-neutral-700 flex items-center gap-1.5 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    ถ่ายภาพสลิป
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Demo Test Slips */}
          <div className="p-3 bg-neutral-800/60 rounded-2xl border border-neutral-700/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                ทดสอบด้วยตัวอย่างสลิปสำเร็จรูป:
              </span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {SAMPLE_TEST_SLIPS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddSample(sample)}
                  className="shrink-0 px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-[11px] font-medium text-neutral-200 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-cyan-400" />
                  <span>{sample.name.replace('สลิป ', '')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Extracted Items Section */}
          {extractedItems.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-extrabold text-white">
                  สลิปที่ตรวจพบ ({extractedItems.length} ใบ)
                </span>
                {duplicateItemsCount > 0 && (
                  <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      className="rounded accent-cyan-500 w-3.5 h-3.5"
                    />
                    <span>ข้ามสลิปซ้ำ ({duplicateItemsCount})</span>
                  </label>
                )}
              </div>

              <div className="space-y-2">
                {extractedItems.map((item, idx) => {
                  const bank = getBankById(item.bankId);
                  const isExcluded = skipDuplicates && item.isDuplicate;

                  return (
                    <div
                      key={item.id || idx}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                        isExcluded
                          ? 'bg-neutral-800/40 border-neutral-800 opacity-60'
                          : 'bg-neutral-800/80 border-neutral-700/80 shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                          style={{ backgroundColor: bank.color, color: bank.textColor }}
                        >
                          {bank.iconText}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-white truncate">
                              {item.payee}
                            </span>
                            {item.isDuplicate && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 font-bold shrink-0">
                                เคยบันทึกแล้ว
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono">
                            {item.date} • {item.time}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <div className="font-bold font-mono text-xs text-white">
                            ฿{formatBaht(item.amount)}
                          </div>
                          <select
                            value={item.categoryId}
                            onChange={(e) => handleUpdateItemCategory(idx, e.target.value)}
                            className="text-[10px] bg-neutral-700 text-neutral-200 border border-neutral-600 rounded-lg px-1.5 py-0.5 mt-0.5"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.icon} {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="w-6 h-6 rounded-full hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {extractedItems.length > 0 && (
          <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between gap-3">
            <div className="text-xs text-neutral-400">
              พร้อมนำเข้า <b className="text-white">{itemsToImport.length}</b> รายการ
            </div>
            <button
              onClick={handleConfirmImport}
              disabled={itemsToImport.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>บันทึกเข้าสรุปยอด</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
