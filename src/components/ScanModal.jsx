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
      }
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

  // Add realistic sample test slips for immediate test verification
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

  const handleUpdateItemAmount = (idx, newAmt) => {
    const val = parseFloat(newAmt);
    setExtractedItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], amount: isNaN(val) ? 0 : val };
      return copy;
    });
  };

  const handleUpdateItemPayee = (idx, newPayee) => {
    setExtractedItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], payee: newPayee };
      return copy;
    });
  };

  const handleRemoveItem = (idx) => {
    sound.playPop();
    setExtractedItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Items to import (filtered by skipDuplicates if enabled)
  const itemsToImport = skipDuplicates
    ? extractedItems.filter(item => !item.isDuplicate)
    : extractedItems;

  const duplicatesCount = extractedItems.filter(item => item.isDuplicate).length;

  const handleConfirmImport = () => {
    if (itemsToImport.length === 0) return;

    sound.playCrunch();
    setTimeout(() => {
      sound.playGoatBaa();
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200/80 flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-lg">
              📸
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900 leading-tight">
                สแกนสลิปโอนเงิน (e-Slip)
              </h3>
              <p className="text-[11px] text-neutral-500 font-medium">
                อ่านข้อมูลในเครื่อง 100% • ตรวจจับสลิปซ้ำให้อัตโนมัติ
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
              dragOver
                ? 'border-amber-500 bg-amber-50/50 scale-101'
                : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50/50'
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
              <div className="py-6 flex flex-col items-center justify-center text-neutral-600">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-2" />
                <span className="font-bold text-sm text-neutral-800">
                  กำลังอ่านข้อมูลสลิปในเครื่อง...
                </span>
                <span className="text-xs text-neutral-500">
                  ตรวจจับธนาคาร, วันที่, จำนวนเงิน และตรวจเช็กสลิปซ้ำ
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-sm text-neutral-900 mb-1">
                  เลือกรูปสลิปจากอัลบั้ม หรือ ถ่ายรูปสลิป
                </h4>
                <p className="text-xs text-neutral-500 max-w-xs mb-4">
                  เลือกทีละหลายๆ รูปพร้อมกันได้เลย ระบบจะแยกสลิปที่เคยอ่านแล้วให้อัตโนมัติ ไม่ต้องกลัวยอดซ้ำ
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold shadow-xs hover:bg-neutral-800 active:scale-95 transition-all"
                  >
                    <Image className="w-4 h-4" />
                    เลือกรูปสลิปในเครื่อง
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-xs font-bold hover:bg-neutral-100 active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    ถ่ายภาพสลิป
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 1-Click Sample Slips Section */}
          <div className="bg-neutral-100/70 rounded-2xl p-3 border border-neutral-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                ทดสอบด้วยสลิปตัวอย่าง (1-Click Test)
              </span>
              <span className="text-[10px] text-neutral-400">กดเพื่อลองสแกน</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {SAMPLE_TEST_SLIPS.map((sample, idx) => {
                const b = getBankById(sample.bankId);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddSample(sample)}
                    className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-neutral-200/80 text-xs font-medium hover:border-neutral-400 active:scale-95 transition-all shadow-2xs"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: b.color }}
                    />
                    <span>{b.shortName} (฿{sample.amount})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Extracted Items Preview List */}
          {extractedItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                    สลิปที่ตรวจพบ ({extractedItems.length} ใบ)
                  </h4>
                  {duplicatesCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      พบสลิปซ้ำ {duplicatesCount} ใบ
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setExtractedItems([])}
                  className="text-[11px] text-rose-500 hover:text-rose-700 font-medium"
                >
                  ล้างทั้งหมด
                </button>
              </div>

              {/* Skip duplicates toggle */}
              {duplicatesCount > 0 && (
                <div className="mb-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-between text-xs text-amber-900">
                  <span className="flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    ข้ามสลิปที่เคยอ่านแล้วอัตโนมัติ
                  </span>
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                  />
                </div>
              )}

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {extractedItems.map((item, idx) => {
                  const b = getBankById(item.bankId);
                  const c = getCategoryById(categories, item.categoryId);

                  return (
                    <div
                      key={item.id || idx}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 animate-fade-in ${
                        item.isDuplicate
                          ? 'bg-amber-50/60 border-amber-200/80 opacity-75'
                          : 'bg-neutral-50 border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {item.slipThumbnail ? (
                          <img
                            src={item.slipThumbnail}
                            alt="Slip"
                            className="w-10 h-12 object-cover rounded-xl border border-neutral-300 shadow-2xs shrink-0"
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[11px] shrink-0 text-white shadow-2xs"
                            style={{ backgroundColor: b.color }}
                          >
                            {b.iconText}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={item.payee}
                              onChange={(e) => handleUpdateItemPayee(idx, e.target.value)}
                              className="font-bold text-xs text-neutral-900 bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-amber-500 focus:outline-hidden px-0.5 w-full truncate"
                              title="แตะเพื่อแก้ไขชื่อร้านค้า / ผู้รับเงิน"
                            />
                            {item.isDuplicate ? (
                              <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-200 text-amber-900 flex items-center gap-0.5">
                                ⚠️ อ่านแล้ว
                              </span>
                            ) : (
                              <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                                ✨ สลิปใหม่
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-0.5">
                            <span>{item.date} {item.time}</span>
                            <span>•</span>
                            {/* Category Selector Pill */}
                            <select
                              value={item.categoryId}
                              onChange={(e) => handleUpdateItemCategory(idx, e.target.value)}
                              className="text-[11px] font-semibold bg-white border border-neutral-200 rounded-lg px-1.5 py-0.5 text-neutral-700 focus:outline-hidden"
                            >
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.icon} {cat.shortName || cat.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="flex items-center font-mono font-bold text-xs text-neutral-900">
                            <span className="text-neutral-400 mr-0.5">-฿</span>
                            <input
                              type="number"
                              step="0.01"
                              value={item.amount}
                              onChange={(e) => handleUpdateItemAmount(idx, e.target.value)}
                              className="w-20 font-mono font-bold text-xs text-right bg-white border border-neutral-200 hover:border-neutral-400 focus:border-amber-500 rounded-lg px-1.5 py-1 focus:outline-hidden shadow-2xs"
                              title="แตะเพื่อแก้ไขจำนวนเงิน"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="w-6 h-6 rounded-full hover:bg-neutral-200 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors"
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
        <div className="p-4 border-t border-neutral-200/80 bg-neutral-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            disabled={itemsToImport.length === 0}
            onClick={handleConfirmImport}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 ${
              itemsToImport.length > 0
                ? 'bg-amber-500 hover:bg-amber-600 text-white active:scale-98'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>
              บันทึก ({itemsToImport.length} สลิป)
              {duplicatesCount > 0 && skipDuplicates && ` • ข้ามซ้ำ ${duplicatesCount} ใบ`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
