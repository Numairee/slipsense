// High-Performance On-Device Slip OCR Engine (Tesseract.js)
// Extracts real amounts, dates, times, payees, and reference numbers from Thai bank transfer slips

import { createWorker } from 'tesseract.js';

let workerPromise = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      try {
        const worker = await createWorker('eng+tha', 1, {
          logger: () => {},
        });
        return worker;
      } catch (err) {
        workerPromise = null;
        throw err;
      }
    })();
  }
  return workerPromise;
}

/**
 * Preprocess image on canvas: Gentle Grayscale + Contrast Enhancement
 * Preserves gray and colored slip text without wiping out midtones
 */
export function preprocessCanvasForOCR(sourceCanvas) {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceCanvas, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Gentle contrast curve that keeps gray slip labels (rgb 120-180) legible
    const enhanced = gray > 225 ? 255 : gray < 50 ? 0 : Math.round(((gray - 50) / 175) * 220);
    data[i] = enhanced;
    data[i + 1] = enhanced;
    data[i + 2] = enhanced;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Run OCR on image canvas with timeout protection so UI never hangs
 */
export async function runSlipOCR(canvas, timeoutMs = 5500) {
  try {
    const processed = preprocessCanvasForOCR(canvas);
    const ocrTask = (async () => {
      const worker = await getWorker();
      const ret = await worker.recognize(processed);
      const text = ret?.data?.text || '';
      return {
        success: true,
        text,
        parsed: parseTextToSlipFields(text)
      };
    })();

    const timeoutTask = new Promise((resolve) =>
      setTimeout(() => resolve({ success: false, text: '', parsed: null, timedOut: true }), timeoutMs)
    );

    return await Promise.race([ocrTask, timeoutTask]);
  } catch (err) {
    console.warn('OCR error, using fallback:', err);
    return {
      success: false,
      text: '',
      parsed: null
    };
  }
}

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
const THAI_MONTHS = [
  ['มี.ค.', '03'], ['มิ.ย.', '06'], ['ม.ค.', '01'], ['ก.พ.', '02'], ['เม.ย.', '04'],
  ['พ.ค.', '05'], ['ก.ค.', '07'], ['ส.ค.', '08'], ['ก.ย.', '09'], ['ต.ค.', '10'],
  ['พ.ย.', '11'], ['ธ.ค.', '12']
].map(([abbr, mm]) => {
  const body = [...abbr.replace(/\./g, '')].map(ch => ch).join(`${THAI_MARKS}\\.?${THAI_MARKS}`);
  return { mm, re: new RegExp(`(\\d{1,2})\\s*${body}${THAI_MARKS}\\.?\\s*(\\d{2,4})`) };
});

function normalizeYear(y) {
  if (y < 100) y += y >= 40 ? 2500 : 2000;
  if (y > 2400) y -= 543;
  return y;
}

const MASKED_ACCOUNT_RE = /[xX*%๐\d]{2,}\s*-[xX*%๐\d\s-]*\d{3,}/;

export function parseTextToSlipFields(rawText = '') {
  const text = normalizeThaiOcr(rawText);
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Extract Amount
  let amount = null;
  const amountExplicitRe = /(?:จำนวนเงิน|ยอดเงิน|Amount|จำนวน|ยอดโอน|โอนเงิน|บาท)?\s*[:\s]*\b([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{1,6})\s*\.\s*([0-9]{2})\b/i;
  const generalDecRe = /\b([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{1,6})\s*\.\s*([0-9]{2})\b/g;

  for (const line of lines) {
    if (line.includes('จำนวน') || line.includes('ยอด') || line.toLowerCase().includes('amount') || line.includes('บาท') || line.toLowerCase().includes('thb')) {
      const match = line.match(amountExplicitRe);
      if (match) {
        const val = parseFloat(`${match[1].replace(/,/g, '')}.${match[2]}`);
        if (val > 0 && val < 1000000 && val !== 2024 && val !== 2025 && val !== 2026 && val !== 2567 && val !== 2568 && val !== 2569) {
          amount = val;
          break;
        }
      }
    }
  }

  if (!amount) {
    let m;
    while ((m = generalDecRe.exec(text)) !== null) {
      const val = parseFloat(`${m[1].replace(/,/g, '')}.${m[2]}`);
      if (val >= 1.0 && val < 500000 && val !== 2024 && val !== 2025 && val !== 2026 && val !== 2567 && val !== 2568 && val !== 2569) {
        amount = val;
        break;
      }
    }
  }

  // 2. Extract Time
  let time = null;
  const timeColonRe = /\b([0-2]?\d:[0-5]\d)\b/;
  const timeDotRe = /\b([0-2]?\d\.[0-5]\d)\s*น\./;
  for (const line of lines) {
    const mc = line.match(timeColonRe);
    if (mc) {
      time = mc[1].length === 4 ? '0' + mc[1] : mc[1];
      break;
    }
    const md = line.match(timeDotRe);
    if (md) {
      const t = md[1].replace('.', ':');
      time = t.length === 4 ? '0' + t : t;
      break;
    }
  }

  // 3. Extract Date
  let date = null;
  const dateSlashRe = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/;

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
      if (parseInt(m, 10) >= 1 && parseInt(m, 10) <= 12 && parseInt(d, 10) >= 1 && parseInt(d, 10) <= 31) {
        date = `${y}-${m}-${d}`;
        break;
      }
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

  // 6. Extract Reference
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
