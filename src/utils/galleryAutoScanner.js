// Automatic Gallery Slip Scanner for SlipSense
// Scans Android device storage / photo gallery automatically or by targeted album without user having to pick files manually

import { Capacitor, registerPlugin } from '@capacitor/core';
import { parseSlipImage, SAMPLE_TEST_SLIPS } from './slipParser';
import { matchCategory } from '../data/defaultCategories';

const GalleryScanner = registerPlugin('GalleryScanner');

export const AutoScanner = {
  isNative() {
    if (typeof window === 'undefined') return false;
    try {
      if (Capacitor && typeof Capacitor.isNativePlatform === 'function' && Capacitor.isNativePlatform()) {
        return true;
      }
    } catch (e) {}
    if (window.Capacitor?.isNativePlatform?.()) return true;
    const ua = navigator.userAgent || '';
    return /;\s*wv\)/i.test(ua) || /Android.*Version\/[0-9.]+\s+(?:Chrome|Mobile)/i.test(ua);
  },

  /**
   * Listen to real-time scanning progress events from native plugin
   */
  async addProgressListener(callback) {
    if (this.isNative() && GalleryScanner.addListener) {
      try {
        return await GalleryScanner.addListener('scanProgress', callback);
      } catch (err) {
        console.warn('Failed to add scanProgress listener:', err);
      }
    }
    return { remove: () => {} };
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
   * Fetch all device photo albums / folders with photo count and bank flags
   */
  async getPhotoAlbums() {
    if (!this.isNative()) {
      return [
        { bucketName: 'K PLUS', count: 18, isBank: true, bankId: 'KBANK', bankLabel: 'กสิกรไทย (K PLUS)' },
        { bucketName: 'SCB EASY', count: 9, isBank: true, bankId: 'SCB', bankLabel: 'ไทยพาณิชย์ (SCB EASY)' },
        { bucketName: 'Krungthai NEXT', count: 6, isBank: true, bankId: 'KTB', bankLabel: 'กรุงไทย (Krungthai NEXT)' },
        { bucketName: 'Screenshots', count: 42, isBank: false, isScreenshot: true, bankLabel: 'ภาพหน้าจอ (Screenshots)' }
      ];
    }
    try {
      const res = await GalleryScanner.getPhotoAlbums();
      if (res && res.albums) {
        return res.albums;
      }
      return [];
    } catch (err) {
      console.warn('Failed to getPhotoAlbums:', err);
      return [];
    }
  },

  /**
   * Native Android: Scans a specific album folder (e.g. 'K PLUS' or 'Screenshots') with 100% depth
   */
  async scanAlbum(bucketName, existingTransactions = [], categories = [], merchantRules = {}) {
    return this.scanNativeGallery(existingTransactions, categories, merchantRules, {
      bucketName,
      limit: 2000
    });
  },

  /**
   * Native Android: Scans gallery photos directly via MediaStore & Google ML Kit on-device
   * Options:
   * - bucketName: if set, scans 100% of images in that specific folder
   * - limit: max photos to inspect (default 500 for auto, 2000 for targeted folder)
   */
  async scanNativeGallery(existingTransactions = [], categories = [], merchantRules = {}, options = {}) {
    try {
      const res = await GalleryScanner.scanRecentSlips({
        bucketName: options.bucketName || null,
        limit: options.limit || (options.bucketName ? 2000 : 500)
      });

      if (!res) {
        return { success: true, newSlips: [], duplicatesCount: 0, totalScanned: 0 };
      }

      // If Java ML Kit returned parsed slips directly (High Performance)
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
          totalScanned: res.count || res.slips.length,
          targetBucket: res.targetBucket || options.bucketName || 'ALL_BANKS'
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
