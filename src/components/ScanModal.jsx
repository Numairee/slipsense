import React, { useState, useRef } from 'react';
import { X, UploadCloud, Camera, Image, Sparkles, Loader2, Plus, ArrowRight } from 'lucide-react';
import { parseSlipImage, SAMPLE_TEST_SLIPS } from '../utils/slipParser';
import { getBankById, BANK_LIST } from '../data/banks';
import { sound } from '../utils/sound';
import { isDuplicateSlip, canImportSlip } from '../utils/slipFields.js';
import confetti from 'canvas-confetti';
import { useI18n } from '../i18n/index.jsx';

export default function ScanModal({
  isOpen,
  onClose,
  categories,
  merchantRules,
  existingTransactions = [],
  initialItems = [],
  onImportBatch
}) {
  const { t, formatAmount } = useI18n();
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState(initialItems);
  const [dragOver, setDragOver] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const processingRef = useRef(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const checkIsDuplicate = item => isDuplicateSlip(item, existingTransactions);

  const handleFiles = async (files) => {
    if (!files?.length || processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    setError('');
    const newItems = [];
    let rejected = 0;
    try {
      const selected = Array.from(files);
      for (let i = 0; i < selected.length; i++) {
        const file = selected[i];
        setProgress(`${i + 1} / ${selected.length}`);
        if (!file.type.startsWith('image/')) { rejected++; continue; }
        try {
          const res = await parseSlipImage(file, merchantRules, categories);
          if (res.success && res.data) newItems.push(res.data);
          else rejected++;
        } catch { rejected++; }
      }
      setRejectedCount(prev => prev + rejected);
      setExtractedItems(prev => [...prev, ...newItems]);
      if (newItems.length) sound.playCrunch();
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
      setProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
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

  const handleUpdateField = (idx, field, value) => {
    setExtractedItems(prev => {
      const copy = [...prev];
      const nextItem = { ...copy[idx], [field]: field === 'amount' ? (value === '' ? '' : Number(value)) : value };
      nextItem.isDuplicate = checkIsDuplicate(nextItem);
      copy[idx] = nextItem;
      return copy;
    });
  };

  const handleRemoveItem = (idx) => {
    sound.playPop();
    setExtractedItems(prev => prev.filter((_, i) => i !== idx));
  };

  const reviewedItems = extractedItems.map(item => ({
    ...item,
    isDuplicate: checkIsDuplicate(item)
  }));

  const duplicateItemsCount = reviewedItems.filter(i => i.isDuplicate).length;

  const itemsToImport = reviewedItems.filter(item => {
    if (skipDuplicates && item.isDuplicate) return false;
    return canImportSlip(item);
  });

  const handleConfirmImport = () => {
    if (!itemsToImport.length) return;
    sound.playSuccess();
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    } catch {}
    onImportBatch(itemsToImport);
    setExtractedItems([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0C121E] border border-neutral-800 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">{t('reviewTitle')}</h3>
              <p className="text-[11px] text-neutral-400">{t('reviewSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
              dragOver ? 'border-cyan-500 bg-cyan-500/10' : 'border-neutral-700 hover:border-neutral-600 bg-neutral-900/60'
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
                  {t('scanningTitle')} {progress}
                </span>
                <span className="text-xs text-neutral-400">
                  {t('quickScanTip')}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-sm text-white mb-1">
                  {t('autoScanGallery')}
                </h4>
                <p className="text-xs text-neutral-400 mb-4 max-w-xs">
                  {t('quickScanTip')}
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
                    <span>{t('pickFolder')}</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playPop();
                      cameraInputRef.current?.click();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 font-bold text-xs hover:bg-neutral-700 active:scale-95 border border-neutral-700 flex items-center gap-1.5 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t('manualAdd')}</span>
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
                <span>Quick Test:</span>
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
                  {t('reviewTitle')} ({extractedItems.length})
                </span>
                {duplicateItemsCount > 0 && (
                  <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      className="rounded accent-cyan-500 w-3.5 h-3.5"
                    />
                    <span>{t('duplicateWarning')} ({duplicateItemsCount})</span>
                  </label>
                )}
              </div>

              <div className="space-y-2">
                {reviewedItems.map((item, idx) => {
                  const bank = getBankById(item.bankId);
                  const isExcluded = skipDuplicates && item.isDuplicate;

                  return (
                    <div
                      key={item.id || idx}
                      className={`p-3 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-2.5 ${
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
                                {t('duplicateWarning')}
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
                            {formatAmount(item.amount, item.currency)}
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

                      <details open={!canImportSlip(item)} className="w-full text-xs border-t border-neutral-700 pt-2">
                        <summary className="cursor-pointer text-cyan-300">
                          {canImportSlip(item) ? t('detailTitle') : '⚠ ' + t('reviewSubtitle')}
                        </summary>
                        {item.slipThumbnail && <img src={item.slipThumbnail} alt="Slip" className="max-h-64 mx-auto my-2 rounded-lg" />}
                        {item.reviewWarnings?.length > 0 && <p className="text-amber-300 my-2">{item.reviewWarnings.join(' • ')}</p>}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <label className="flex flex-col gap-1">{t('fieldAmount')}
                            <input
                              type="number"
                              value={item.amount ?? ''}
                              min="0.01"
                              step="0.01"
                              onChange={e => handleUpdateField(idx, 'amount', e.target.value)}
                              className="w-full min-w-0 rounded-lg bg-neutral-900 border border-neutral-600 p-2 text-white"
                            />
                          </label>
                          <label className="flex flex-col gap-1">{t('fieldDate')}
                            <input
                              type="date"
                              value={item.date ?? ''}
                              onChange={e => handleUpdateField(idx, 'date', e.target.value)}
                              className="w-full min-w-0 rounded-lg bg-neutral-900 border border-neutral-600 p-2 text-white"
                            />
                          </label>
                          <label className="flex flex-col gap-1">{t('fieldTime')}
                            <input
                              type="time"
                              value={item.time ?? ''}
                              onChange={e => handleUpdateField(idx, 'time', e.target.value)}
                              className="w-full min-w-0 rounded-lg bg-neutral-900 border border-neutral-600 p-2 text-white"
                            />
                          </label>
                          <label className="flex flex-col gap-1">{t('fieldPayee')}
                            <input
                              type="text"
                              value={item.payee ?? ''}
                              onChange={e => handleUpdateField(idx, 'payee', e.target.value)}
                              className="w-full min-w-0 rounded-lg bg-neutral-900 border border-neutral-600 p-2 text-white"
                            />
                          </label>
                          <label className="flex flex-col gap-1">{t('fieldSender')}
                            <input
                              type="text"
                              value={item.sender ?? ''}
                              onChange={e => handleUpdateField(idx, 'sender', e.target.value)}
                              className="w-full min-w-0 rounded-lg bg-neutral-900 border border-neutral-600 p-2 text-white"
                            />
                          </label>
                          <label className="flex flex-col gap-1">{t('fieldRef')}
                            <input
                              type="text"
                              value={item.ref ?? ''}
                              onChange={e => handleUpdateField(idx, 'ref', e.target.value)}
                              className="w-full min-w-0 rounded-lg bg-neutral-900 border border-neutral-600 p-2 text-white"
                            />
                          </label>
                          <label className="col-span-2">{t('fieldBank')}
                            <select
                              value={item.bankId || ''}
                              onChange={e => handleUpdateField(idx, 'bankId', e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-600 rounded-lg p-2 mt-1 text-white"
                            >
                              <option value="">{t('selectBank')}</option>
                              {BANK_LIST.filter(bank => !['OTHER', 'CASH'].includes(bank.id)).map(bank => (
                                <option key={bank.id} value={bank.id}>{bank.name}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </details>
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
              {t('totalRecords')}: <b className="text-white">{itemsToImport.length}</b>
            </div>
            <button
              onClick={handleConfirmImport}
              disabled={isProcessing || itemsToImport.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>{t('saveSelected')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
