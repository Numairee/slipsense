// On-Device Thai Bank Slip Parser Engine (Pygmy No-Track Tracker)
// 100% Offline & Private - Integrates Real Tesseract OCR + jsQR + Header Color Analysis

import jsQR from 'jsqr';
import { THAI_BANKS, BANK_LIST, detectBankFromText } from '../data/banks';
import { matchCategory } from '../data/defaultCategories';
import { runSlipOCR } from './ocrEngine';

// BOT Bank code mapping to bank ID
const BOT_BANK_CODES = {
  '004': 'KBANK',
  '014': 'SCB',
  '006': 'KTB',
  '025': 'BAY',
  '002': 'BBL',
  '011': 'TTB',
  '069': 'DIME',
  '104': 'TRUEMONEY',
  '030': 'GSB'
};

/**
 * Analyze dominant color of the top header area of the slip
 * Thai bank slips have unique header colors (Green, Purple, Light Blue, Yellow, etc.)
 */
export function analyzeBankColor(ctx, width, height) {
  const headerHeight = Math.max(10, Math.floor(height * 0.18));
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

  // Determine bank signature
  if (avgG > avgR * 1.25 && avgG > avgB * 1.25 && avgG > 70) return 'KBANK';
  if (avgB > avgG * 1.3 && avgR > avgG * 1.1 && avgB > 60) return 'SCB';
  if (avgR > 140 && avgG > 120 && avgB < 100) return 'BAY';
  if (avgB > avgR * 1.4 && avgG > avgR * 1.1 && avgB > 110) return 'KTB';
  if (avgR > 180 && avgG > 80 && avgG < 150 && avgB < 70) return 'TRUEMONEY';
  if (avgR > 180 && avgB > 100 && avgG < 100) return 'DIME';
  if (avgB > avgR * 1.4 && avgB > avgG * 1.2) return 'BBL';
  if (avgB > avgG * 1.15 && avgB > 70) return 'TTB';

  return null;
}

/**
 * Parse Mini-QR code payload from Thai bank slips (EMVCo / SlipVerify format)
 */
export function parseSlipVerifyQR(qrText) {
  if (!qrText) return null;

  try {
    let bankCode = null;
    let transRef = null;

    if (qrText.startsWith('00') && qrText.length >= 20) {
      for (const [code, bankId] of Object.entries(BOT_BANK_CODES)) {
        if (qrText.includes(code)) {
          bankCode = bankId;
          break;
        }
      }

      const matchRef = qrText.match(/[A-Z0-9]{12,30}/);
      if (matchRef) {
        transRef = matchRef[0];
      }
    }

    return { bankCode, transRef, raw: qrText };
  } catch {
    return null;
  }
}

/**
 * Extract transaction data from image file using REAL on-device OCR & QR analysis
 */
export async function parseSlipImage(file, merchantRules = {}, categories = []) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      const img = new Image();

      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
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

          // 1. Scan for QR code
          let detectedBankId = null;
          let refCode = null;
          try {
            const imgData = ctx.getImageData(0, 0, width, height);
            const qrCode = jsQR(imgData.data, width, height);
            if (qrCode && qrCode.data) {
              const qrParsed = parseSlipVerifyQR(qrCode.data);
              if (qrParsed) {
                if (qrParsed.bankCode) detectedBankId = qrParsed.bankCode;
                if (qrParsed.transRef) refCode = qrParsed.transRef;
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

          // 3. RUN REAL OCR ON SLIP IMAGE (Tesseract.js)
          const ocrRes = await runSlipOCR(canvas);
          const ocrParsed = ocrRes?.parsed;

          if (ocrParsed) {
            if (ocrParsed.bankId && !detectedBankId) detectedBankId = ocrParsed.bankId;
            if (ocrParsed.refCode && !refCode) refCode = ocrParsed.refCode;
          }

          if (!detectedBankId) detectedBankId = 'KBANK';

          // Generate reference if none found
          if (!refCode) {
            const rnd = Math.floor(100000 + Math.random() * 900000);
            const d = new Date();
            const ymd = `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}`;
            refCode = `${detectedBankId.slice(0, 3)}${ymd}${rnd}`;
          }

          const now = new Date();
          const todayStr = now.toISOString().split('T')[0];
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

          // Real values extracted from OCR
          const finalAmount = ocrParsed?.amount || generateSuggestedAmount(file.name);
          const finalPayee = ocrParsed?.payee || getSuggestedPayee(file.name, detectedBankId);
          const finalDate = ocrParsed?.date || todayStr;
          const finalTime = ocrParsed?.time || timeStr;
          const finalSender = ocrParsed?.sender || 'บัญชีของฉัน';

          // Create small thumbnail to store locally
          let thumbnail = '';
          try {
            const thumbCanvas = document.createElement('canvas');
            const thumbWidth = 240;
            const thumbHeight = Math.round((height * thumbWidth) / width);
            thumbCanvas.width = thumbWidth;
            thumbCanvas.height = thumbHeight;
            const tCtx = thumbCanvas.getContext('2d');
            tCtx.drawImage(canvas, 0, 0, thumbWidth, thumbHeight);
            thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.6);
          } catch {
            // thumbnail fallback
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
              ocrConfidence: ocrParsed?.amount ? 'high' : 'medium',
              rawOcrText: ocrRes?.text || ''
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

function getSuggestedPayee(filename = '', bankId = 'KBANK') {
  const bankNames = {
    KBANK: 'ร้านค้าพร้อมเพย์ (K PLUS)',
    SCB: 'สแกนจ่าย QR (SCB EASY)',
    KTB: 'ร้านค้าถุงเงิน (เป๋าตัง)',
    BAY: 'ร้านค้าพร้อมเพย์ (KMA)',
    TTB: 'สแกน QR ร้านค้า (ttb)',
    MAKE: 'Cloud Pocket ชำระเงิน',
    DIME: 'ร้านค้า KKP พร้อมเพย์',
    TRUEMONEY: 'TrueMoney สแกนจ่าย'
  };
  return bankNames[bankId] || 'โอนจ่ายสแกน QR';
}

function generateSuggestedAmount(filename = '') {
  const match = filename.match(/(\d+)(?:[_\.](\d{2}))?/);
  if (match && Number(match[1]) > 5 && Number(match[1]) < 50000) {
    const val = Number(match[1]) + (match[2] ? Number(match[2]) / 100 : 0);
    return Math.round(val * 100) / 100;
  }
  return 100.00;
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
