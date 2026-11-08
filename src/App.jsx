import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navbar from './components/Navbar';
import InstallPrompt from './components/InstallPrompt';
import AutoScanToast from './components/AutoScanToast';
import HomeView from './views/HomeView';
import AnalyticsView from './views/AnalyticsView';
import BudgetsView from './views/BudgetsView';
import HistoryView from './views/HistoryView';
import SettingsView from './views/SettingsView';
import ScanModal from './components/ScanModal';
import ManualAddModal from './components/ManualAddModal';
import SlipDetailModal from './components/SlipDetailModal';
import ResetAppModal from './components/ResetAppModal';
import AlbumPickerModal from './components/AlbumPickerModal';
import { Storage } from './utils/storage';
import { exportTransactionsToCSV } from './utils/csvExporter';
import { sound } from './utils/sound';
import { AutoScanner } from './utils/galleryAutoScanner';

export default function App() {
  const [transactions, setTransactions] = useState(() => Storage.getTransactions());
  const [categories, setCategories] = useState(() => Storage.getCategories());
  const [merchantRules, setMerchantRules] = useState(() => Storage.getMerchantRules());
  const [budgets, setBudgets] = useState(() => Storage.getBudgets());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('home');

  // Modals & Feedback
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [pendingScanItems, setPendingScanItems] = useState([]);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isAlbumPickerOpen, setIsAlbumPickerOpen] = useState(false);
  const [activeDetailTx, setActiveDetailTx] = useState(null);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const [scanToast, setScanToast] = useState(null);
  const [autoScanOnStartup, setAutoScanOnStartup] = useState(() => {
    return localStorage.getItem('slipsense_auto_scan_on_launch') === 'true';
  });

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
    if (isAutoScanning) return;
    if (!AutoScanner.isNative()) {
      setIsScanOpen(true);
      return;
    }

    setIsAutoScanning(true);
    let progressListener = null;

    if (!isSilentOnStartup) {
      setScanToast({
        title: 'กำลังตรวจรูปภาพทุกโฟลเดอร์ ⚡',
        message: 'ค้นหาสลิปจากทุกรูปที่แอปมีสิทธิ์อ่าน อาจใช้เวลาหลายนาที'
      });
    }

    try {
      progressListener = await AutoScanner.addProgressListener((data) => {
        if (!isSilentOnStartup) {
          setScanToast({
            title: 'กำลังตรวจรูปภาพในเครื่อง ⚡',
            message: `ตรวจแล้ว ${data.scanned} จาก ${data.total} รูป...`,
            progress: data
          });
        }
      });

      const res = await AutoScanner.scanNativeGallery(transactions, categories, merchantRules);
      setIsAutoScanning(false);

      if (res && res.success && res.newSlips && res.newSlips.length > 0) {
        setPendingScanItems(res.newSlips);
        setIsScanOpen(true);

        setScanToast({
          title: `พบสลิปใหม่ ${res.newSlips.length} ใบ! ⚡`,
          message: `ตรวจสอบข้อมูลก่อนบันทึก (ข้ามสลิปซ้ำ ${res.duplicatesCount || 0} ใบ)`
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
        const dupMsg = res?.duplicatesCount > 0 ? ` (พบสลิปที่เคยบันทึกแล้ว ${res.duplicatesCount} ใบ)` : '';
        setScanToast({
          title: `ตรวจครบ ${res?.totalScanned || 0} รูปแล้ว${dupMsg}`,
          message: res?.limitedAccess ? 'Android อนุญาตเฉพาะบางรูป หากต้องการสแกนทั้งหมด ให้เปิดสิทธิ์รูปภาพทั้งหมดในการตั้งค่าแอป' : 'ตรวจรูปที่แอปมีสิทธิ์อ่านครบแล้ว ไม่พบสลิปใหม่ที่อ่านข้อมูลได้',
          actionLabel: 'เลือกโฟลเดอร์',
          onAction: () => setIsAlbumPickerOpen(true)
        });
        setTimeout(() => setScanToast(null), 5500);
      }
    } catch (e) {
      console.warn('handleTriggerAutoScan error:', e);
      setIsAutoScanning(false);
    } finally {
      if (progressListener && typeof progressListener.remove === 'function') {
        progressListener.remove();
      }
    }
  };

  // Scan a targeted specific album folder
  const handleScanSpecificAlbum = async (bucketName) => {
    if (!AutoScanner.isNative()) {
      setIsScanOpen(true);
      return;
    }

    setIsAutoScanning(true);
    let progressListener = null;

    setScanToast({
      title: `กำลังสแกนโฟลเดอร์ "${bucketName}" ⚡`,
      message: 'กำลังเริ่มต้นตรวจสอบทุกรูปภาพ...'
    });

    try {
      progressListener = await AutoScanner.addProgressListener((data) => {
        setScanToast({
          title: `กำลังสแกน "${bucketName}" ⚡`,
          message: `กำลังตรวจรูปที่ ${data.scanned} จาก ${data.total} รูป...`,
          progress: data
        });
      });

      const res = await AutoScanner.scanAlbum(bucketName, transactions, categories, merchantRules);
      setIsAutoScanning(false);

      if (res && res.success && res.newSlips && res.newSlips.length > 0) {
        setPendingScanItems(res.newSlips);
        setIsScanOpen(true);

        setScanToast({
          title: `พบสลิปใหม่ ${res.newSlips.length} ใบ ใน "${bucketName}"! 🎉`,
          message: `ตรวจสอบข้อมูลก่อนบันทึก (ข้ามสลิปซ้ำ ${res.duplicatesCount || 0} ใบ)`
        });
        setTimeout(() => setScanToast(null), 5000);
      } else {
        const dupMsg = res?.duplicatesCount > 0 ? ` (พบสลิปที่เคยบันทึกแล้ว ${res.duplicatesCount} ใบ)` : '';
        setScanToast({
          title: `ตรวจครบ ${res?.totalScanned || 0} รูปใน "${bucketName}" แล้ว${dupMsg}`,
          message: 'ไม่พบสลิปใหม่เพิ่มเติม'
        });
        setTimeout(() => setScanToast(null), 4500);
      }
    } catch (e) {
      console.warn('handleScanSpecificAlbum error:', e);
      setIsAutoScanning(false);
    } finally {
      if (progressListener && typeof progressListener.remove === 'function') {
        progressListener.remove();
      }
    }
  };

  const handleToggleAutoScanOnStartup = () => {
    setAutoScanOnStartup(prev => {
      const next = !prev;
      localStorage.setItem('slipsense_auto_scan_on_launch', String(next));
      return next;
    });
  };

  // Auto-Scan in background on app startup (only if enabled by user in settings)
  useEffect(() => {
    const timer = setTimeout(() => {
      const isEnabled = localStorage.getItem('slipsense_auto_scan_on_launch') === 'true';
      if (AutoScanner.isNative() && isEnabled) {
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

    setScanToast({
      title: `บันทึกสลิปสำเร็จ ${newTxList.length} ใบ! ✨`,
      message: 'เพิ่มรายการเข้าสรุปยอดเรียบร้อยแล้ว'
    });
    setTimeout(() => setScanToast(null), 4000);
  };

  // Single add manual
  const handleAddManual = (tx) => {
    syncMonthToLatestSlip([tx]);
    const updated = Storage.addTransaction(tx);
    setTransactions(updated);
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

  // Update category budget
  const handleUpdateBudget = (categoryId, amount) => {
    const updated = Storage.saveBudget(categoryId, amount);
    setBudgets({ ...updated });
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
    a.download = `SlipSense_Backup_${new Date().toISOString().split('T')[0]}.json`;
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
      setBudgets(Storage.getBudgets());
    }
    return success;
  };

  // Clear and reset entire app
  const handleResetEntireApp = () => {
    const clean = Storage.resetEntireApp();
    setTransactions(clean.transactions);
    setCategories(clean.categories);
    setMerchantRules(clean.merchantRules);
    setBudgets(clean.budgets);
    setCurrentDate(new Date());
    setActiveTab('home');

    sound.playPop();
    setScanToast({
      title: 'ล้างข้อมูลแอปเรียบร้อยแล้ว 🧹',
      message: 'ลบรายการสลิปทั้งหมดและรีเซ็ตแอปสู่สถานะเริ่มต้นเรียบร้อยแล้ว'
    });
    setTimeout(() => setScanToast(null), 4000);
  };

  // Clear and rescan uses the same review flow as every other import.
  const handleClearAndRescan = async () => {
    sound.playPop();
    if (!Storage.saveTransactions([])) {
      setScanToast({ title: 'ล้างข้อมูลไม่สำเร็จ', message: 'ไม่สามารถเขียนข้อมูลลงในเครื่องได้ กรุณาลองอีกครั้ง' });
      return;
    }
    setTransactions([]);
    await handleTriggerAutoScan(false);
  };

  return (
    <div className="min-h-screen bg-[#080C14] flex flex-col font-sans select-none antialiased text-white">
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
            currentDate={currentDate}
            budgets={budgets}
            isAutoScanning={isAutoScanning}
            onTriggerAutoScan={() => handleTriggerAutoScan(false)}
            onOpenAlbumPicker={() => setIsAlbumPickerOpen(true)}
            onClearAndRescan={handleClearAndRescan}
            onOpenResetModal={() => setIsResetModalOpen(true)}
            onOpenScanModal={() => setIsScanOpen(true)}
            onOpenManualModal={() => setIsManualOpen(true)}
            onOpenDetailModal={(tx) => setActiveDetailTx(tx)}
            onResetMonth={() => setCurrentDate(new Date())}
            onAddTransaction={handleAddManual}
            onNavigateToAnalytics={() => setActiveTab('analytics')}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            transactions={transactions}
            categories={categories}
            currentDate={currentDate}
            budgets={budgets}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetsView
            transactions={transactions}
            categories={categories}
            currentDate={currentDate}
            budgets={budgets}
            onUpdateBudget={handleUpdateBudget}
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

        {activeTab === 'settings' && (
          <SettingsView
            categories={categories}
            merchantRules={merchantRules}
            autoScanOnStartup={autoScanOnStartup}
            onToggleAutoScanOnStartup={handleToggleAutoScanOnStartup}
            onExportCSV={handleExportCSV}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onOpenResetModal={() => setIsResetModalOpen(true)}
            onClearAllData={handleResetEntireApp}
            onClearAndRescan={handleClearAndRescan}
            onClearMerchantRules={handleClearMerchantRules}
          />
        )}
      </main>

      {/* Modals */}
      <AlbumPickerModal
        isOpen={isAlbumPickerOpen}
        onClose={() => setIsAlbumPickerOpen(false)}
        onSelectAlbum={handleScanSpecificAlbum}
        onScanAllBanks={() => handleTriggerAutoScan(false)}
        isScanning={isAutoScanning}
      />

      <ResetAppModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleResetEntireApp}
        onClearAndRescan={handleClearAndRescan}
        transactionsCount={transactions.length}
      />

      {isScanOpen && <ScanModal
        isOpen={isScanOpen}
        onClose={() => { setIsScanOpen(false); setPendingScanItems([]); }}
        initialItems={pendingScanItems}
        categories={categories}
        merchantRules={merchantRules}
        existingTransactions={transactions}
        onImportBatch={handleImportBatch}
      />}

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
      />
    </div>
  );
}

