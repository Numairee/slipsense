import { THAI_BANKS } from '../data/banks.js';

/**
 * Tesseract often emits Thai with a space between every glyph ("เล ข ท ี ร า ย ก า ร").
 * Collapse whitespace between Thai characters (and around dots inside Thai abbreviations
 * such as "พ . ย .") so keyword regexes can match.
 */
export function normalizeThaiOcr(text = '') {
  const TH = '\u0E00-\u0E7F';
  let t = String(text).normalize('NFC').replace(/[０-９]/g, ch => String(ch.charCodeAt(0) - 0xFF10)).replace(/\r/g, '');
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
  const text = normalizeThaiOcr(rawText).replace(/[๐-๙]/g, ch => String(ch.charCodeAt(0) - 0x0E50));
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Rank monetary candidates by their labels; dates, fees and account IDs are not amounts.
  const amountLabel = /จำนวนเงิน|ยอดเงิน|ยอดโอน|amount|โอนเงิน(?:จำนวน)?/i;
  const currency = /บาท|thb|baht|฿/i;
  const excluded = /ค่าธรรมเนียม|fee|ยอดคงเหลือ|balance|เลขที่|อ้างอิง|reference|transaction\s*id|บัญชี|account/i;
  const candidates = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/(\d)\s*\.\s*-(?=\s*(?:บาท|THB|baht|฿)?\s*$)/i, '$1.00');
    if (excluded.test(line) || (i > 0 && excluded.test(lines[i - 1]) && !/\d/.test(lines[i - 1]))) continue;
    const labelled = amountLabel.test(line);
    const previousLabel = i > 0 && amountLabel.test(lines[i - 1]) && !excluded.test(lines[i - 1]);
    const money = /(?<![\d.,/:-])(\d{1,3}(?:,\s*\d{3})+|\d{1,7})\s*\.\s*(\d{2})(?![\d./:-])/g;
    for (const m of line.matchAll(money)) {
      // Dot-formatted time and numeric dates must not become expenses.
      if (/น\./.test(line) && !labelled && !currency.test(line)) continue;
      const value = Number(m[1].replace(/[,\s]/g, '') + '.' + m[2]);
      if (value > 0 && value <= 1000000) candidates.push({ value, score: labelled ? 4 : previousLabel ? 3 : currency.test(line) ? 2 : 1 });
    }
    if (labelled || previousLabel || currency.test(line)) {
      const m = line.match(/^(?:.*?(?:จำนวนเงิน|ยอดเงิน|ยอดโอน|amount|฿|THB)[:：\s]*)?(\d{1,3}(?:,\d{3})+|\d{1,7})(?:\s*(?:บาท|THB|baht|฿))?\s*$/i);
      if (m) {
        const value = Number(m[1].replace(/,/g, ''));
        if (value > 0 && value <= 1000000) candidates.push({ value, score: labelled ? 4 : 3 });
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const ambiguousAmount = !!best && candidates.some(c => c.score === best.score && c.value !== best.value);
  const amount = ambiguousAmount ? null : best?.value ?? null;

  // 2. Extract Time
  let time = null;
  const timeColonRe = /\b((?:[01]?\d|2[0-3]):[0-5]\d)\b/;
  const timeDotRe = /\b((?:[01]?\d|2[0-3])\.[0-5]\d)\s*น\./;
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
  const dateSlashRe = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/;

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

  const englishMonth = text.match(/\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{2,4})\b/i);
  if (!date && englishMonth) {
    const month = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(englishMonth[2].slice(0, 3).toLowerCase()) + 1;
    date = `${normalizeYear(Number(englishMonth[3]))}-${String(month).padStart(2, '0')}-${englishMonth[1].padStart(2, '0')}`;
  }
  const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) date = `${normalizeYear(Number(isoMatch[1]))}-${isoMatch[2]}-${isoMatch[3]}`;
  if (date && !isValidSlipDate(date)) date = null;

  // 4. Extract Payee
  let payee = null;
  const payeeRe = /(?:ไปยัง|ผู้รับเงิน|ชื่อผู้รับ|ผู้รับ|โอนให้|^To\b)[:\s]*([^\n\r]+)/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(payeeRe);
    if (m && m[1].trim()) {
      payee = m[1].trim();
      break;
    }
    if (/^(ไปยัง|ผู้รับเงิน|ชื่อผู้รับ|ผู้รับ|โอนให้|to)[:：]?$/i.test(line) && i + 1 < lines.length) {
      payee = lines[i + 1].trim();
      break;
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
  if (/make(?: by kbank)?|cloud pocket/.test(fullLower)) bankId = 'MAKE';
  else if (/kept/.test(fullLower)) bankId = 'KEPT';
  else if (/mymo|ออมสิน/.test(fullLower)) bankId = 'GSB';
  else if (fullLower.includes('กสิกร') || fullLower.includes('kbank') || fullLower.includes('k plus')) bankId = 'KBANK';
  else if (fullLower.includes('ไทยพาณิชย์') || fullLower.includes('scb')) bankId = 'SCB';
  else if (fullLower.includes('กรุงไทย') || fullLower.includes('ktb') || fullLower.includes('next')) bankId = 'KTB';
  else if (fullLower.includes('กรุงศรี') || fullLower.includes('bay') || fullLower.includes('kma')) bankId = 'BAY';
  else if (fullLower.includes('กรุงเทพ') || fullLower.includes('bbl') || fullLower.includes('bualuang')) bankId = 'BBL';
  else if (fullLower.includes('ttb') || fullLower.includes('ธนชาต')) bankId = 'TTB';
  else if (fullLower.includes('make') || fullLower.includes('cloud pocket')) bankId = 'MAKE';
  else if (fullLower.includes('dime') || fullLower.includes('เกียรตินาคิน')) bankId = 'DIME';
  else if (fullLower.includes('truemoney') || fullLower.includes('ทรูมันนี่')) bankId = 'TRUEMONEY';

  if (payee && /จำนวน|ยอดเงิน|ค่าธรรมเนียม|อ้างอิง|amount|reference|fee/i.test(payee)) payee = null;
  return {
    amount,
    ambiguousAmount,
    time,
    date,
    payee,
    sender,
    refCode,
    bankId
  };
}


export function isValidSlipDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Requiring payee as well avoids merging two legitimate transfers in the same minute.
export function isDuplicateSlip(item, existing = []) {
  return existing.some(ex => {
    if (item.ref && ex.ref) return item.bankId === ex.bankId && item.ref === ex.ref;
    return !!(item.date && item.time && item.payee && ex.payee &&
      item.bankId === ex.bankId && Number(item.amount) === Number(ex.amount) &&
      item.date === ex.date && item.time === ex.time &&
      item.payee.trim().toLowerCase() === ex.payee.trim().toLowerCase());
  });
}

export function canImportSlip(item) {
  return Number.isFinite(Number(item.amount)) && Number(item.amount) > 0 &&
    Number(item.amount) <= 1000000 && !!THAI_BANKS[item.bankId] && !['OTHER', 'CASH'].includes(item.bankId) && isValidSlipDate(item.date) &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(item.time || '') && !!item.payee?.trim();
}

// Read TLV lengths instead of matching accidental "0103"/"02" substrings in IDs or URLs.
export function parseSlipVerifyQR(raw) {
  if (typeof raw !== 'string' || !raw || raw.length > 4096) return null;
  function readTLV(value) {
    const tags = new Map();
    for (let offset = 0; offset < value.length;) {
      const header = value.slice(offset, offset + 4);
      if (!/^\d{4}$/.test(header)) return null;
      const length = Number(header.slice(2));
      if (offset + 4 + length > value.length || tags.has(header.slice(0, 2))) return null;
      tags.set(header.slice(0, 2), value.slice(offset + 4, offset + 4 + length));
      offset += 4 + length;
    }
    return tags;
  }
  const outer = readTLV(raw);
  if (!outer) return null;
  const nested = outer.has('00') ? readTLV(outer.get('00')) : null;
  const tags = nested?.has('01') ? nested : outer;
  const banks = { '004': 'KBANK', '014': 'SCB', '006': 'KTB', '025': 'BAY', '002': 'BBL', '011': 'TTB', '069': 'DIME', '030': 'GSB' };
  const bankCode = banks[tags.get('01')];
  const transRef = tags.get('02');
  if (!bankCode || !/^[A-Za-z0-9]{8,35}$/.test(transRef || '')) return null;
  return { bankCode, transRef, raw };
}
