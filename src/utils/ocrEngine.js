// High-Performance On-Device Slip OCR Engine (Tesseract.js)
// Extracts real amounts, dates, times, payees, and reference numbers from Thai bank transfer slips

import { createWorker } from 'tesseract.js';

let workerPromise = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng+tha', 1, {
        logger: () => {}, // silent in production
      });
      return worker;
    })();
  }
  return workerPromise;
}

/**
 * Preprocess image on canvas: Grayscale + Contrast Stretch for maximum OCR readability
 */
export function preprocessCanvasForOCR(sourceCanvas) {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Convert to grayscale & increase contrast
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // High-contrast text binarization threshold
    const enhanced = gray > 140 ? 255 : (gray < 80 ? 0 : gray);
    data[i] = enhanced;
    data[i + 1] = enhanced;
    data[i + 2] = enhanced;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Run OCR on image canvas and parse financial slip entities
 */
export async function runSlipOCR(canvas) {
  try {
    const processed = preprocessCanvasForOCR(canvas);
    const worker = await getWorker();
    const ret = await worker.recognize(processed);
    const text = ret.data.text || '';

    return {
      success: true,
      text,
      parsed: parseTextToSlipFields(text)
    };
  } catch (err) {
    console.warn('OCR error, using canvas heuristics fallback:', err);
    return {
      success: false,
      text: '',
      parsed: null
    };
  }
}

/**
 * Parse raw text into structured Thai slip data
 */
export function parseTextToSlipFields(text = '') {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Extract Amount
  let amount = null;
  // Match lines with Amount / จำนวนเงิน / ยอดเงิน
  const amountExplicitRe = /(?:จำนวนเงิน|ยอดเงิน|Amount|จำนวน|ยอดโอน|โอนเงิน|บาท)?\s*[:\s]*([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})/i;
  const generalDecRe = /([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})/g;

  // Try explicit line first
  for (const line of lines) {
    if (line.includes('จำนวน') || line.includes('ยอด') || line.toLowerCase().includes('amount') || line.includes('บาท')) {
      const match = line.match(amountExplicitRe);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (val > 0 && val < 1000000 && val !== 2024 && val !== 2025 && val !== 2026 && val !== 2567 && val !== 2568 && val !== 2569) {
          amount = val;
          break;
        }
      }
    }
  }

  // Fallback: search all decimal numbers
  if (!amount) {
    const allMatches = text.match(generalDecRe) || [];
    for (const m of allMatches) {
      const val = parseFloat(m.replace(/,/g, ''));
      if (val >= 1.0 && val < 500000 && val !== 2024 && val !== 2025 && val !== 2026 && val !== 2567 && val !== 2568 && val !== 2569) {
        amount = val;
        break;
      }
    }
  }

  // 2. Extract Time
  let time = null;
  const timeRe = /(\d{1,2}[:.]\d{2})/g;
  for (const line of lines) {
    if (line.includes('เวลา') || line.includes('น.') || line.includes(':')) {
      const m = line.match(timeRe);
      if (m && m.length > 0) {
        time = m[0].replace('.', ':');
        break;
      }
    }
  }

  // 3. Extract Date
  let date = null;
  const thaiMonths = {
    'ม.ค.': '01', 'ก.พ.': '02', 'มี.ค.': '03', 'เม.ย.': '04',
    'พ.ค.': '05', 'มิ.ย.': '06', 'ก.ค.': '07', 'ส.ค.': '08',
    'ก.ย.': '09', 'ต.ค.': '10', 'พ.ย.': '11', 'ธ.ค.': '12'
  };

  const dateThaiRe = /(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*(\d{2,4})/;
  const dateSlashRe = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;

  for (const line of lines) {
    const thaiMatch = line.match(dateThaiRe);
    if (thaiMatch) {
      const d = thaiMatch[1].padStart(2, '0');
      const m = thaiMonths[thaiMatch[2]] || '11';
      let y = parseInt(thaiMatch[3], 10);
      if (y > 2500) y -= 543;
      else if (y < 100) y += 2000;
      date = `${y}-${m}-${d}`;
      break;
    }

    const slashMatch = line.match(dateSlashRe);
    if (slashMatch) {
      const d = slashMatch[1].padStart(2, '0');
      const m = slashMatch[2].padStart(2, '0');
      let y = parseInt(slashMatch[3], 10);
      if (y > 2500) y -= 543;
      else if (y < 100) y += 2000;
      date = `${y}-${m}-${d}`;
      break;
    }
  }

  // 4. Extract Payee
  let payee = null;
  const payeeRe = /(?:ไปยัง|ผู้รับเงิน|To|ชื่อผู้รับ|โอนให้|ร้านค้า)[:\s]*([^\n\r]+)/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(payeeRe);
    if (m && m[1].trim()) {
      payee = m[1].trim();
      break;
    }
    if ((line.includes('ไปยัง') || line.includes('ผู้รับเงิน') || line.toLowerCase().startsWith('to')) && i + 1 < lines.length) {
      const next = lines[i + 1].trim();
      if (next && !next.includes('จำนวน') && !next.includes('เลขที่') && !next.includes('00')) {
        payee = next;
        break;
      }
    }
  }

  // 5. Extract Sender
  let sender = null;
  const senderRe = /(?:จาก|ผู้โอน|From)[:\s]*([^\n\r]+)/i;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(senderRe);
    if (m && m[1].trim()) {
      sender = m[1].trim();
      break;
    }
  }

  // 6. Extract Reference
  let refCode = null;
  const refRe = /(?:รหัสอ้างอิง|เลขที่รายการ|Ref|Transaction Ref)[:\s]*([A-Za-z0-9]{10,35})/i;
  for (const line of lines) {
    const m = line.match(refRe);
    if (m) {
      refCode = m[1];
      break;
    }
  }

  // 7. Detect Bank from Text
  let bankId = null;
  const fullLower = text.toLowerCase();
  if (fullLower.includes('กสิกร') || fullLower.includes('kbank') || fullLower.includes('k plus')) bankId = 'KBANK';
  else if (fullLower.includes('ไทยพาณิชย์') || fullLower.includes('scb')) bankId = 'SCB';
  else if (fullLower.includes('กรุงไทย') || fullLower.includes('ktb') || fullLower.includes('next')) bankId = 'KTB';
  else if (fullLower.includes('กรุงศรี') || fullLower.includes('bay') || fullLower.includes('kma')) bankId = 'BAY';
  else if (fullLower.includes('กรุงเทพ') || fullLower.includes('bbl') || fullLower.includes('bualuang')) bankId = 'BBL';
  else if (fullLower.includes('ttb') || fullLower.includes('ธนชาต')) bankId = 'TTB';
  else if (fullLower.includes('make') || fullLower.includes('cloud pocket')) bankId = 'MAKE';
  else if (fullLower.includes('dime') || fullLower.includes('เกียรตินาคิน')) bankId = 'DIME';
  else if (fullLower.includes('truemoney') || fullLower.includes('ทรูมันนี่')) bankId = 'TRUEMONEY';

  return {
    amount,
    time,
    date,
    payee,
    sender,
    refCode,
    bankId
  };
}
