import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navbar from './components/Navbar';
import InstallPrompt from './components/InstallPrompt';
import AutoScanToast from './components/AutoScanToast';
import HomeView from './views/HomeView';
import StatsView from './views/StatsView';
import HistoryView from './views/HistoryView';
import GoatView from './views/GoatView';
import SettingsView from './views/SettingsView';
import ScanModal from './components/ScanModal';
import ManualAddModal from './components/ManualAddModal';
import SlipDetailModal from './components/SlipDetailModal';
import { Storage } from './utils/storage';
import { exportTransactionsToCSV } from './utils/csvExporter';
import { sound } from './utils/sound';
import { AutoScanner } from './utils/galleryAutoScanner';
import confetti from 'canvas-confetti';

export default function App() {
  const [transactions, setTransactions] = useState(() => Storage.getTransactions());
  const [categories, setCategories] = useState(() => Storage.getCategories());
  const [merchantRules, setMerchantRules] = useState(() => Storage.getMerchantRules());
  const [goatState, setGoatState] = useState(() => Storage.getGoatState());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('home');

  // Modals & Feedback
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [activeDetailTx, setActiveDetailTx] = useState(null);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const [scanToast, setScanToast] = useState(null);

  const syncMonthToLatestSlip = (slips = []) => {
    if (!slips || slips.length === 0) return;
    const firstDateStr = slips[0]?.date;
    if (firstDateStr && /^\d{4}-\d{2}-\d{2}$/.test(firstDateStr)) {
      const [y, m] = firstDateStr.split('-').map(Number);
      if (y >= 2000 && m >= 1 && m <= 12) {
        setCurrentDate(new Date(y, m - 1, 1));
        return;
      }
    }
    setCurrentDate(new Date());
  };

  // Month navigation
  const handlePrevMonth = () => {
    sound.playPop();
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    sound.playPop();
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Trigger Automatic Gallery Scanning (ไม่ต้องเลือกรูปเอง)
  const handleTriggerAutoScan = async (isSilentOnStartup = false) => {
    if (!AutoScanner.isNative()) {
      setIsScanOpen(true);
      return;
    }

    setIsAutoScanning(true);
    const res = await AutoScanner.scanNativeGallery(transactions, categories, merchantRules);
    setIsAutoScanning(false);

    if (res && res.success && res.newSlips && res.newSlips.length > 0) {
      syncMonthToLatestSlip(res.newSlips);
      const updated = Storage.addBatchTransactions(res.newSlips);
      setTransactions(updated);
      const newGoat = Storage.feedGoat(res.newSlips.length);
      setGoatState(newGoat);

      sound.playCrunch();
      setTimeout(() => {
        sound.playGoatBaa();
        confetti({
          particleCount: 45,
          spread: 75,
          origin: { y: 0.25 }
        });
      }, 300);

      setScanToast({
        title: `พบสลิปใหม่ ${res.newSlips.length} ใบ! 🎉`,
        message: `บันทึกยอดและให้อาหารน้องปิ๊กมี่เรียบร้อยแล้ว (ข้ามสลิปซ้ำ ${res.duplicatesCount || 0} ใบ)`
      });

      setTimeout(() => setScanToast(null), 5000);
    } else if (res && res.success === false && !isSilentOnStartup) {
      setScanToast({
        title: 'ต้องการสิทธิ์เข้าถึงอัลบั้มรูปภาพ',
        message: 'กรุณาอนุญาตสิทธิ์รูปภาพ หรือกดปุ่มด้านขวาเพื่อเลือกรูปสลิปเอง',
        actionLabel: 'เลือกรูปเอง',
        onAction: () => setIsScanOpen(true)
      });
      setTimeout(() => setScanToast(null), 6000);
    } else if (!isSilentOnStartup) {
      const dupMsg = res?.duplicatesCount > 0 ? ` (พบสลิปที่บันทึกไปแล้ว ${res.duplicatesCount} ใบ)` : '';
      setScanToast({
        title: `ตรวจอัลบั้มแล้ว (${res?.totalScanned || 0} รูป)${dupMsg}`,
        message: 'ไม่พบสลิปใหม่เพิ่มเติม หากสลิปอยู่ในโฟลเดอร์อื่น กดเลือกรูปสลิปได้เลย',
        actionLabel: 'เลือกรูปสลิป',
        onAction: () => setIsScanOpen(true)
      });
      setTimeout(() => setScanToast(null), 5500);
    }
  };

  // Auto-Scan in background on app startup (just like Pygmy iOS)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (AutoScanner.isNative()) {
        handleTriggerAutoScan(true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Batch import from slips (manual picker)
  const handleImportBatch = (newTxList) => {
    syncMonthToLatestSlip(newTxList);
    const updated = Storage.addBatchTransactions(newTxList);
    setTransactions(updated);
    const newGoat = Storage.feedGoat(newTxList.length);
    setGoatState(newGoat);

    setScanToast({
      title: `บันทึกสลิปสำเร็จ ${newTxList.length} ใบ! 🎉`,
      message: 'เพิ่มรายการเข้าสรุปยอดและให้อาหารน้องปิ๊กมี่เรียบร้อยแล้ว'
    });
    setTimeout(() => setScanToast(null), 4000);
  };

  // Single add manual
  const handleAddManual = (tx) => {
    syncMonthToLatestSlip([tx]);
    const updated = Storage.addTransaction(tx);
    setTransactions(updated);
    const newGoat = Storage.feedGoat(1);
    setGoatState(newGoat);
  };

  // Update transaction
  const handleUpdateTx = (id, updates, rememberMerchant) => {
    const updated = Storage.updateTransaction(id, updates);
    setTransactions(updated);

    if (rememberMerchant && updates.payee && updates.categoryId) {
      Storage.learnMerchantRule(updates.payee, updates.categoryId);
      setMerchantRules(Storage.getMerchantRules());
    }
  };

  // Delete transaction
  const handleDeleteTx = (id) => {
    const updated = Storage.deleteTransaction(id);
    setTransactions(updated);
  };

  // Feed goat manual snack
  const handleFeedGoat = (amount = 1) => {
    const updated = Storage.feedGoat(amount);
    setGoatState(updated);
  };

  // Export CSV
  const handleExportCSV = () => {
    exportTransactionsToCSV(transactions, categories);
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const jsonStr = Storage.exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pygmy_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleImportBackup = (jsonStr) => {
    const success = Storage.importDataJSON(jsonStr);
    if (success) {
      setTransactions(Storage.getTransactions());
      setCategories(Storage.getCategories());
      setMerchantRules(Storage.getMerchantRules());
      setGoatState(Storage.getGoatState());
    }
    return success;
  };

  // Clear data
  const handleClearAll = () => {
    Storage.clearAllData();
    setTransactions([]);
    setMerchantRules({});
    setGoatState(Storage.getGoatState());
  };

  // Clear merchant rules
  const handleClearMerchantRules = () => {
    localStorage.removeItem('pygmy_merchant_rules_v1');
    setMerchantRules({});
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans select-none antialiased text-neutral-900">
      {/* Auto-Scan Floating Toast Notification */}
      <AutoScanToast
        notification={scanToast}
        onClose={() => setScanToast(null)}
      />

      {/* Top Header */}
      <Header
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onResetMonth={() => {
          sound.playPop();
          setCurrentDate(new Date());
        }}
        onOpenPrivacyInfo={() => setActiveTab('settings')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto px-3.5 pt-2.5">
        {/* Android APK Download Prompt Banner (only shown on web browser, hidden inside APK) */}
        <InstallPrompt />

        {/* Tab Views */}
        {activeTab === 'home' && (
          <HomeView
            transactions={transactions}
            categories={categories}
            goatState={goatState}
            currentDate={currentDate}
            isAutoScanning={isAutoScanning}
            onTriggerAutoScan={() => handleTriggerAutoScan(false)}
            onOpenScanModal={() => setIsScanOpen(true)}
            onOpenManualModal={() => setIsManualOpen(true)}
            onOpenDetailModal={(tx) => setActiveDetailTx(tx)}
            onFeedGoat={handleFeedGoat}
            onOpenGoatRoom={() => setActiveTab('goat')}
            onResetMonth={() => setCurrentDate(new Date())}
            onAddTransaction={handleAddManual}
          />
        )}

        {activeTab === 'stats' && (
          <StatsView
            transactions={transactions}
            categories={categories}
            currentDate={currentDate}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            transactions={transactions}
            categories={categories}
            onOpenDetailModal={(tx) => setActiveDetailTx(tx)}
            onExportCSV={handleExportCSV}
          />
        )}

        {activeTab === 'goat' && (
          <GoatView
            goatState={goatState}
            onFeedGoat={handleFeedGoat}
            onOpenScanModal={() => setIsScanOpen(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            categories={categories}
            merchantRules={merchantRules}
            onExportCSV={handleExportCSV}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onClearAllData={handleClearAll}
            onClearMerchantRules={handleClearMerchantRules}
          />
        )}
      </main>

      {/* Modals */}
      <ScanModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        categories={categories}
        merchantRules={merchantRules}
        existingTransactions={transactions}
        onImportBatch={handleImportBatch}
      />

      <ManualAddModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        categories={categories}
        onAddTransaction={handleAddManual}
      />

      <SlipDetailModal
        transaction={activeDetailTx}
        categories={categories}
        onClose={() => setActiveDetailTx(null)}
        onSave={handleUpdateTx}
        onDelete={handleDeleteTx}
      />

      {/* Bottom Navigation */}
      <Navbar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        goatState={goatState}
      />
    </div>
  );
}
