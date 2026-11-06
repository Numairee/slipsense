// Automatic Gallery Slip Scanner for Pygmy Android
// Scans Android device storage / photo gallery automatically without user having to pick files manually

import { registerPlugin } from '@capacitor/core';
import { parseSlipImage, SAMPLE_TEST_SLIPS } from './slipParser';
import { matchCategory } from '../data/defaultCategories';

const GalleryScanner = registerPlugin('GalleryScanner');

export const AutoScanner = {
  isNative() {
    if (typeof window === 'undefined') return false;
    if (window.Capacitor?.isNativePlatform()) return true;
    const ua = navigator.userAgent || '';
    return /;\s*wv\)/i.test(ua);
  },

  /**
   * Check if a parsed slip is already recorded in transactions
   */
  isDuplicate(newTx, existingTransactions = []) {
    return existingTransactions.some(ex => {
      // 1. Same Ref Code
      if (newTx.ref && ex.ref && newTx.ref === ex.ref) return true;
      // 2. Same Bank + Amount + Date + Time
      if (
        ex.bankId === newTx.bankId &&
        Number(ex.amount) === Number(newTx.amount) &&
        ex.date === newTx.date &&
        ex.time === newTx.time
      ) {
        return true;
      }
      return false;
    });
  },

  /**
   * Native Android: Scans recent gallery photos directly via MediaStore & Google ML Kit on-device
   */
  async scanNativeGallery(existingTransactions = [], categories = [], merchantRules = {}) {
    try {
      // Scan across all bank folders & recent screenshots with timeout protection
      const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ success: true, slips: [], count: 0, timedOut: true }), 25000));
      const scanPromise = GalleryScanner.scanRecentSlips({
        limit: 300
      });

      const res = await Promise.race([scanPromise, timeoutPromise]);

      if (!res) {
        return { success: true, newSlips: [], duplicatesCount: 0, totalScanned: 0 };
      }

      // 1. If Java ML Kit returned parsed slips directly (High Performance)
      if (res.slips && Array.isArray(res.slips)) {
        const newSlips = [];
        let duplicatesCount = 0;

        for (const slip of res.slips) {
          const categorizedSlip = {
            ...slip,
            categoryId: matchCategory(slip.payee, '', merchantRules, categories) || slip.categoryId || 'food'
          };

          if (this.isDuplicate(categorizedSlip, existingTransactions)) {
            duplicatesCount++;
          } else {
            newSlips.push(categorizedSlip);
          }
        }

        return {
          success: true,
          newSlips,
          duplicatesCount,
          totalScanned: res.count || res.slips.length
        };
      }

      // 2. Fallback if photos were returned as raw images
      if (res.photos && res.photos.length > 0) {
        const photos = res.photos;
        const newSlips = [];
        let duplicatesCount = 0;

        for (const p of photos) {
          const fileObj = await this.dataUrlToFile(p.dataUrl, p.name || 'slip.jpg');
          const parseRes = await parseSlipImage(fileObj, merchantRules, categories);

          if (parseRes.success && parseRes.data) {
            const slip = parseRes.data;
            if (this.isDuplicate(slip, existingTransactions)) {
              duplicatesCount++;
            } else {
              newSlips.push(slip);
            }
          }
        }

        return {
          success: true,
          newSlips,
          duplicatesCount,
          totalScanned: photos.length
        };
      }

      return { success: true, newSlips: [], duplicatesCount: 0, totalScanned: 0 };
    } catch (err) {
      console.warn('Native gallery scan error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Browser / PWA: Pick a folder ONCE (e.g. Pictures/KBank or Screenshots) and scan automatically
   */
  async scanFolderPWA(existingTransactions = [], categories = [], merchantRules = {}) {
    if (!('showDirectoryPicker' in window)) {
      return { success: false, error: 'เบราว์เซอร์นี้ไม่รองรับ File System Access' };
    }

    try {
      const dirHandle = await window.showDirectoryPicker({
        mode: 'read',
        startIn: 'pictures'
      });

      const newSlips = [];
      let duplicatesCount = 0;
      let totalScanned = 0;

      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          if (file.type.startsWith('image/')) {
            totalScanned++;
            const parseRes = await parseSlipImage(file, merchantRules, categories);
            if (parseRes.success && parseRes.data) {
              if (this.isDuplicate(parseRes.data, existingTransactions)) {
                duplicatesCount++;
              } else {
                newSlips.push(parseRes.data);
              }
            }
          }
        }
      }

      return {
        success: true,
        newSlips,
        duplicatesCount,
        totalScanned
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, cancelled: true };
      }
      return { success: false, error: err.message };
    }
  },

  /**
   * Simulated Auto-Scan (for demonstration on PC/Web browser)
   */
  async simulateAutoScan(existingTransactions = [], categories = [], merchantRules = {}) {
    await new Promise(r => setTimeout(r, 900));

    // Pick 1-2 random unrecorded sample slips
    const candidates = SAMPLE_TEST_SLIPS.filter(sample => {
      return !existingTransactions.some(ex => ex.payee === sample.payee);
    });

    const selected = candidates.slice(0, 2);
    const newSlips = selected.map(sample => {
      const rnd = Math.floor(100000 + Math.random() * 900000);
      const now = new Date();
      return {
        id: 'tx_auto_' + Date.now() + '_' + rnd,
        date: now.toISOString().split('T')[0],
        time: sample.time || '12:30',
        timestamp: Date.now(),
        amount: sample.amount,
        bankId: sample.bankId,
        payee: sample.payee,
        sender: sample.sender,
        categoryId: sample.categoryId,
        ref: `${sample.bankId}${rnd}`,
        note: sample.note + ' (อ่านอัตโนมัติจากเครื่อง)',
        isManual: false,
      };
    });

    return {
      success: true,
      newSlips,
      duplicatesCount: 2,
      totalScanned: 5
    };
  },

  async dataUrlToFile(dataUrl, filename) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }
};
