// On-Device Thai Bank Slip Parser Engine (Pygmy No-Track Tracker)
// 100% Offline & Private - Integrates Native Android ML Kit + Tesseract OCR + jsQR + Header Color Analysis

import jsQR from 'jsqr';
import { registerPlugin } from '@capacitor/core';
import { matchCategory } from '../data/defaultCategories';
import { parseTextToSlipFields } from './slipFields.js';

const GalleryScanner = registerPlugin('GalleryScanner');

export { parseSlipVerifyQR } from './slipFields.js';
import { parseSlipVerifyQR } from './slipFields.js';

/**
 * Analyze dominant color of the top header area of the slip
 */
export function analyzeBankColor(ctx, width, height) {
  const headerHeight = Math.min(height, Math.max(1, Math.floor(height * 0.18)));
  const imgData = ctx.getImageData(0, 0, width, headerHeight);
  const data = imgData.data;

  let totalR = 0, totalG = 0, totalB = 0, count = 0;
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    const brightness = (r + g + b) / 3;
    if (a > 200 && brightness > 40 && brightness < 240) {
      totalR += r;
      totalG += g;
      totalB += b;
      count++;
    }
  }

  if (count === 0) return null;
  const avgR = totalR / count;
  const avgG = totalG / count;
  const avgB = totalB / count;

  if (avgG > avgR * 1.22 && avgG > avgB * 1.22 && avgG > 65) return 'KBANK';
  if (avgB > avgG * 1.25 && avgR > avgG * 1.08 && avgB > 55) return 'SCB';
  if (avgR > 140 && avgG > 115 && avgB < 105) return 'BAY';
  if (avgB > avgR * 1.35 && avgG > avgR * 1.1 && avgB > 105) return 'KTB';
  if (avgR > 175 && avgG > 75 && avgG < 155 && avgB < 75) return 'TRUEMONEY';
  if (avgR > 180 && avgB > 100 && avgG < 100) return 'DIME';
  if (avgB > avgR * 1.4 && avgB > avgG * 1.2) return 'BBL';
  if (avgB > avgG * 1.15 && avgB > 70) return 'TTB';

  return null;
}

/**
 * Extract transaction data from image file using Native Android ML Kit (when on APK) + JS OCR & QR
 */
export async function parseSlipImage(file, merchantRules = {}, categories = []) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      const isNativeAndroid = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform();

      // 0. Fast-path on Android APK: Use native Google ML Kit OCR + Barcode Scanner (<150ms, 100% offline)
      let nativeSlip = null;
      if (isNativeAndroid) {
        try {
          const natRes = await GalleryScanner.analyzeSingleImage({
            dataUrl,
            fileName: file.name || 'slip.jpg'
          });
          if (natRes && natRes.success && natRes.slip) {
            nativeSlip = natRes.slip;
          }
        } catch (err) {
          console.warn('Native analyzeSingleImage fallback to canvas OCR:', err);
        }
      }

      const img = new Image();

      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 2000;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, width, height);

          // 1. Scan for QR code via jsQR
          let detectedBankId = null;
          let qrBankId = null;
          let refCode = nativeSlip?.rawOcrText ? parseTextToSlipFields(nativeSlip.rawOcrText).refCode : null;
          try {
            const imgData = ctx.getImageData(0, 0, width, height);
            const qrCode = jsQR(imgData.data, width, height);
            if (qrCode && qrCode.data) {
              const qrParsed = parseSlipVerifyQR(qrCode.data);
              if (qrParsed) {
                qrBankId = qrParsed.bankCode;
                detectedBankId = qrBankId;
                if (qrParsed.transRef && !refCode) refCode = qrParsed.transRef;
              }
            }
          } catch {
            // QR scanning fallback
          }

          // 2. Color Header Detection
          const colorBank = analyzeBankColor(ctx, width, height);
          if (colorBank && !detectedBankId) {
            detectedBankId = colorBank;
          }

          // 3. Run Tesseract OCR (on Web, or quick 2.5s enrichment on Android if payee wasn't English)
          let ocrParsed = nativeSlip?.rawOcrText ? parseTextToSlipFields(nativeSlip.rawOcrText) : null;
          let rawOcrText = nativeSlip?.rawOcrText || '';
          const shouldRunTesseract = !nativeSlip || !ocrParsed?.amount || !ocrParsed?.payee || !ocrParsed?.date;
          if (shouldRunTesseract) {
            const timeoutMs = 30000;
            const { runSlipOCR } = await import('./ocrEngine');
            const ocrRes = await runSlipOCR(canvas, timeoutMs);
            ocrParsed = ocrRes?.parsed || ocrParsed;
            if (ocrRes?.text) rawOcrText = ocrRes.text;
          }

          if (ocrParsed) {
            if (ocrParsed.bankId && !qrBankId) detectedBankId = ocrParsed.bankId;
            if (ocrParsed.refCode && !refCode) refCode = ocrParsed.refCode;
          }

          detectedBankId = qrBankId || ocrParsed?.bankId || nativeSlip?.bankId || detectedBankId;

          // Strict Verification Gatekeeper: Must have actual amount found in receipt text
          const finalAmount = ocrParsed?.ambiguousAmount ? null : ocrParsed?.amount || nativeSlip?.amount || null;

          if (!finalAmount || finalAmount <= 0) {
            resolve({
              success: false,
              error: 'รูปภาพนี้ไม่ใช่สลิปโอนเงิน หรือไม่พบตัวเลขยอดเงินที่ชัดเจน'
            });
            return;
          }

          if (!detectedBankId) {
            // Check if text has any general banking cues
            const lower = rawOcrText.toLowerCase();
            if (lower.includes('โอน') || lower.includes('transfer') || lower.includes('promptpay') || lower.includes('พร้อมเพย์')) {
              detectedBankId = 'OTHER';
            } else {
              resolve({
                success: false,
                error: 'ไม่สามารถระบุธนาคารผู้ให้บริการหรือรูปแบบสลิปได้'
              });
              return;
            }
          }

          // Missing fields stay visible for review instead of being fabricated.
          const finalPayee = ocrParsed?.payee || (/^(?:โอน|MAKE by KBank)/.test(nativeSlip?.payee || '') ? '' : nativeSlip?.payee) || '';
          const finalDate = ocrParsed?.date || '';
          const finalTime = ocrParsed?.time || '';
          const finalSender = ocrParsed?.sender || '';
          const reviewWarnings = [];
          if (!finalDate) reviewWarnings.push('อ่านวันที่ไม่ชัดเจน');
          if (!finalTime) reviewWarnings.push('อ่านเวลาไม่ชัดเจน');
          if (!finalPayee) reviewWarnings.push('อ่านชื่อผู้รับไม่ชัดเจน');
          if (!refCode) reviewWarnings.push('ไม่พบเลขอ้างอิง');
          if (detectedBankId === 'OTHER') reviewWarnings.push('ไม่ทราบธนาคาร');

          let thumbnail = nativeSlip?.slipThumbnail || '';
          if (!thumbnail) {
            try {
              const thumbCanvas = document.createElement('canvas');
              const thumbWidth = 240;
              const thumbHeight = Math.round((height * thumbWidth) / width);
              thumbCanvas.width = thumbWidth;
              thumbCanvas.height = thumbHeight;
              const tCtx = thumbCanvas.getContext('2d');
              tCtx.drawImage(canvas, 0, 0, thumbWidth, thumbHeight);
              thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.65);
            } catch {
              // thumbnail fallback
            }
          }

          const finalCategory = matchCategory(finalPayee, '', merchantRules, categories);

          resolve({
            success: true,
            data: {
              id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
              date: finalDate,
              time: finalTime,
              timestamp: Date.now(),
              amount: finalAmount,
              bankId: detectedBankId,
              payee: finalPayee,
              sender: finalSender,
              categoryId: finalCategory,
              ref: refCode,
              note: '',
              slipThumbnail: thumbnail,
              isManual: false,
              rawFilename: file.name,
              ocrConfidence: reviewWarnings.length ? 'low' : 'medium',
              reviewWarnings,
              rawOcrText
            }
          });
        } catch (err) {
          console.error('Slip parsing error:', err);
          resolve({ success: false, error: err.message });
        }
      };

      img.onerror = () => {
        resolve({ success: false, error: 'ไม่สามารถเปิดไฟล์รูปภาพได้' });
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      resolve({ success: false, error: 'เกิดข้อผิดพลาดในการอ่านไฟล์' });
    };

    reader.readAsDataURL(file);
  });
}

export const SAMPLE_TEST_SLIPS = [
  {
    name: 'สลิป K PLUS (7-Eleven)',
    bankId: 'KBANK',
    amount: 145.00,
    payee: '7-Eleven สาขาอโศกมนตรี',
    categoryId: 'food',
    sender: 'คุณนิมิตร (xxx-2-89101-1)',
    note: 'ของกินเล่น + กาแฟ',
    time: '12:35'
  },
  {
    name: 'สลิป SCB EASY (ร้านส้มตำเจ๊ไก่)',
    bankId: 'SCB',
    amount: 280.00,
    payee: 'ร้านส้มตำแซ่บเจ๊ไก่ (พร้อมเพย์)',
    categoryId: 'food',
    sender: 'คุณนิมิตร (xxx-4-56789-0)',
    note: 'ตำปูปลาร้า คอหมูย่าง',
    time: '13:15'
  },
  {
    name: 'สลิป Krungthai NEXT (ปั๊ม ปตท. PTT)',
    bankId: 'KTB',
    amount: 800.00,
    payee: 'ปตท. น้ำมันและการค้าปลีก (OR)',
    categoryId: 'transport',
    sender: 'คุณนิมิตร (xxx-9-11223-4)',
    note: 'เติมน้ำมัน Gasohol 95',
    time: '09:10'
  },
  {
    name: 'สลิป MAKE by KBank (LINE MAN)',
    bankId: 'MAKE',
    amount: 195.00,
    payee: 'LINE MAN Delivery (ข้าวมันไก่)',
    categoryId: 'food',
    sender: 'คุณนิมิตร (Cloud Pocket: ของกิน)',
    note: 'ข้าวมันไก่พิเศษ + ชาไทย',
    time: '18:40'
  },
  {
    name: 'สลิป ttb touch (Uniqlo CentralWorld)',
    bankId: 'TTB',
    amount: 1290.00,
    payee: 'Uniqlo (Thailand) Co., Ltd.',
    categoryId: 'shopping',
    sender: 'คุณนิมิตร (xxx-0-99887-6)',
    note: 'กางเกงสแล็คทำงาน',
    time: '16:20'
  },
  {
    name: 'สลิป Dime! (Shopee Pay)',
    bankId: 'DIME',
    amount: 350.00,
    payee: 'ShopeePay Thailand',
    categoryId: 'shopping',
    sender: 'คุณนิมิตร (Dime! Save)',
    note: 'เคสโทรศัพท์มือถือ',
    time: '20:15'
  },
  {
    name: 'สลิป TrueMoney (Café Amazon)',
    bankId: 'TRUEMONEY',
    amount: 75.00,
    payee: 'Café Amazon สาขา ปตท.',
    categoryId: 'food',
    sender: 'คุณนิมิตร (TrueMoney 081-xxx-xxxx)',
    note: 'ชาเขียวนมเย็นหวานน้อย',
    time: '14:05'
  },
  {
    name: 'สลิป KMA กรุงศรี (BTS Skytrain)',
    bankId: 'BAY',
    amount: 55.00,
    payee: 'บมจ. ระบบขนส่งมวลชนกรุงเทพ (BTS)',
    categoryId: 'transport',
    sender: 'คุณนิมิตร (xxx-1-44556-7)',
    note: 'ตั๋วรถไฟฟ้าไปสยาม',
    time: '08:45'
  }
];

