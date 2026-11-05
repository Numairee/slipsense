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
/**
 * Tesseract often emits Thai with a space between every glyph ("เล ข ท ี ร า ย ก า ร").
 * Collapse whitespace between Thai characters (and around dots inside Thai abbreviations
 * such as "พ . ย .") so keyword regexes can match.
 */
export function normalizeThaiOcr(text = '') {
  const TH = '\u0E00-\u0E7F';
  let t = text.replace(/\r/g, '');
  let prev;
  do {
    prev = t;
    t = t.replace(new RegExp(`([${TH}])[ \\t]+([${TH}])`, 'g'), '$1$2');
    t = t.replace(new RegExp(`([${TH}])[ \\t]*\\.[ \\t]*(?=[${TH}\\s\\d]|$)`, 'gm'), '$1.');
  } while (t !== prev);
  return t;
}

const THAI_MARKS = '[\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E\\s]*';
// Order matters: more specific abbreviations first (มี.ค./มิ.ย. before ม.ค.)
const THAI_MONTHS = [
  ['มี.ค.', '03'], ['มิ.ย.', '06'], ['ม.ค.', '01'], ['ก.พ.', '02'], ['เม.ย.', '04'],
  ['พ.ค.', '05'], ['ก.ค.', '07'], ['ส.ค.', '08'], ['ก.ย.', '09'], ['ต.ค.', '10'],
  ['พ.ย.', '11'], ['ธ.ค.', '12']
].map(([abbr, mm]) => {
  // Tolerate stray OCR vowel marks and missing dots between letters
  const body = [...abbr.replace(/\./g, '')].map(ch => ch).join(`${THAI_MARKS}\\.?${THAI_MARKS}`);
  return { mm, re: new RegExp(`(\\d{1,2})\\s*${body}${THAI_MARKS}\\.?\\s*(\\d{2,4})`) };
});

function normalizeYear(y) {
  if (y < 100) y += y >= 40 ? 2500 : 2000; // 2-digit years on Thai slips are Buddhist Era (69 = 2569)
  if (y > 2400) y -= 543;
  return y;
}

const MASKED_ACCOUNT_RE = /[xX%๐\d]{2,}\s*-[xX%๐\d\s-]*\d{3,}/;

export function parseTextToSlipFields(rawText = '') {
  const text = normalizeThaiOcr(rawText);
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
  const dateSlashRe = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;

  for (const line of lines) {
    let found = false;
    for (const { mm, re } of THAI_MONTHS) {
      const tm = line.match(re);
      if (tm) {
        const d = tm[1].padStart(2, '0');
        const y = normalizeYear(parseInt(tm[2], 10));
        date = `${y}-${mm}-${d}`;
        found = true;
        break;
      }
    }
    if (found) break;

    const slashMatch = line.match(dateSlashRe);
    if (slashMatch && !MASKED_ACCOUNT_RE.test(line)) {
      const d = slashMatch[1].padStart(2, '0');
      const m = slashMatch[2].padStart(2, '0');
      const y = normalizeYear(parseInt(slashMatch[3], 10));
      date = `${y}-${m}-${d}`;
      break;
    }
  }

  // 4. Extract Payee
  let payee = null;
  const payeeRe = /(?:ไปยัง|ผู้รับเงิน|ชื่อผู้รับ|โอนให้|^To\b)[:\s]*([^\n\r]+)/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(payeeRe);
    if (m && m[1].trim()) {
      payee = m[1].trim();
      break;
    }
    if (/^(ไปยัง|ผู้รับเงิน|to:?)$/i.test(line) && i + 1 < lines.length) {
      payee = lines[i + 1].trim();
      break;
    }
  }
  // K PLUS style (no label): payee is the first name line after the sender's masked account
  if (!payee) {
    const firstAcc = lines.findIndex(l => MASKED_ACCOUNT_RE.test(l));
    if (firstAcc >= 0) {
      for (let i = firstAcc + 1; i < lines.length; i++) {
        const l = lines[i];
        if (l.length < 3 || MASKED_ACCOUNT_RE.test(l) || /จำนวน|เลขที|รหัส|ค่าธรรมเนียม|อ้างอิง/.test(l)) continue;
        payee = l;
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

  // 6. Extract Reference (code may be on the same line as the label or the next line)
  let refCode = null;
  const refLabelRe = /(?:รหัสอ้างอิง|เลขที่?รายการ|เลขที่?อ้างอิง|Ref(?:erence)?|Transaction ID)/i;
  const codeRe = /([A-Za-z0-9]{10,35})/;
  for (let i = 0; i < lines.length; i++) {
    if (!refLabelRe.test(lines[i])) continue;
    const after = lines[i].split(/[:：]/).slice(1).join(':');
    const m = (after || lines[i].replace(refLabelRe, '')).match(codeRe) || (lines[i + 1] || '').match(codeRe);
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
