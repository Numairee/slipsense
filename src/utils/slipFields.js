import { THAI_BANKS, ALL_BANKS, detectBankFromText } from '../data/banks.js';

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

const SPANISH_MONTHS = [
  ['ene', '01'], ['feb', '02'], ['mar', '03'], ['abr', '04'], ['may', '05'], ['jun', '06'],
  ['jul', '07'], ['ago', '08'], ['sep', '09'], ['oct', '10'], ['nov', '11'], ['dic', '12']
];

const ENGLISH_MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
];

function normalizeYear(y) {
  if (y < 100) y += y >= 40 ? 2500 : 2000;
  if (y > 2400) y -= 543;
  return y;
}

const MASKED_ACCOUNT_RE = /[xX*%๐\d]{2,}\s*-[xX*%๐\d\s-]*\d{3,}/;

export function parseTextToSlipFields(rawText = '') {
  const text = normalizeThaiOcr(rawText).replace(/[๐-๙]/g, ch => String(ch.charCodeAt(0) - 0x0E50));
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Detect currency
  let currencyCode = 'THB';
  if (/(?:\$|usd)/i.test(text)) currencyCode = 'USD';
  else if (/(?:€|eur)/i.test(text)) currencyCode = 'EUR';
  else if (/(?:£|gbp)/i.test(text)) currencyCode = 'GBP';
  else if (/(?:¥|jpy)/i.test(text)) currencyCode = 'JPY';
  else if (/(?:cny|元|rmb)/i.test(text)) currencyCode = 'CNY';
  else if (/(?:s\$|sgd)/i.test(text)) currencyCode = 'SGD';
  else if (/(?:rm|myr)/i.test(text)) currencyCode = 'MYR';
  else if (/(?:aud|a\$)/i.test(text)) currencyCode = 'AUD';
  else if (/(?:cad|c\$)/i.test(text)) currencyCode = 'CAD';
  else if (/(?:inr|₹)/i.test(text)) currencyCode = 'INR';
  else if (/(?:krw|₩)/i.test(text)) currencyCode = 'KRW';
  else if (/(?:บาท|thb|baht|฿)/i.test(text)) currencyCode = 'THB';

  // Multi-lingual labels: Thai, English, Spanish, Chinese, Japanese, French, German
  const amountLabel = /(?:จำนวนเงิน|ยอดเงิน|ยอดโอน|โอนเงิน(?:จำนวน)?|รวมทั้งสิ้น|ยอดชำระ|amount|total(?:\s*amount)?|grand\s*total|subtotal|paid|monto(?:\s*total)?|importe|total\s*a\s*pagar|金额|转账金额|付款金额|实付|合计|总计|支払金額|振込金額|送金額|金額|合計|montant|virement|betrag|gesamtbetrag|summe)/i;
  const currencyPattern = /(?:\b(?:thb|baht|usd|eur|gbp|jpy|cny|rmb|sgd|myr|aud|cad|chf|inr|krw|php|vnd|idr|brl|mxn)\b|[บาท฿$€£¥元₹₩₱₫])/i;
  const excluded = /(?:ค่าธรรมเนียม|ค่าบริการ|เวลา|\btime\b|\bfees?\b|service\s*charge|commission|comisión|手续费|手数料|ยอดคงเหลือ|\bbalance\b|current\s*balance|available\s*balance|saldo|余额|残高|เลขที่|อ้างอิง|\breference\b|\btrans(?:action)?\s*id\b|order\s*id|บัญชี|\baccount\b|account\s*no|acct)/i;

  const candidates = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/(\d)\s*\.\s*-(?=\s*(?:บาท|THB|baht|฿|\$|€|£|¥)?\s*$)/i, '$1.00');
    if (excluded.test(line) || (i > 0 && excluded.test(lines[i - 1]) && !/\d/.test(lines[i - 1]))) continue;
    const labelled = amountLabel.test(line);
    const previousLabel = i > 0 && amountLabel.test(lines[i - 1]) && !excluded.test(lines[i - 1]);
    const money = /(?<![\dA-Za-z.,/:-])(\d{1,3}(?:,\s*\d{3})+|\d{1,7})\s*\.\s*(\d{2})(?![\dA-Za-z.,/:-])/g;
    for (const m of line.matchAll(money)) {
      // Dot-formatted time and numeric dates must not become expenses.
      if (/น\./.test(line) && !labelled && !currencyPattern.test(line)) continue;
      const value = Number(m[1].replace(/[,\s]/g, '') + '.' + m[2]);
      if (value > 0 && value <= 1000000) candidates.push({ value, score: labelled ? 4 : previousLabel ? 3 : currencyPattern.test(line) ? 2 : 1 });
    }
    if (labelled || previousLabel || currencyPattern.test(line)) {
      const m = line.match(/^(?:.*?(?:จำนวนเงิน|ยอดเงิน|ยอดโอน|amount|total|monto|金额|金額|฿|THB|\$|€|£|¥)[:：\s]*)?(\d{1,3}(?:,\d{3})+|\d{1,7})(?:\s*(?:บาท|THB|baht|฿|\b(?:usd|eur|gbp|jpy|cny)\b|元|\$|€|£|¥))?\s*$/i);
      if (m && !/\b(?:20\d\d|25\d\d)\b/.test(line)) {
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
  const time12hRe = /\b((?:0?[1-9]|1[0-2]):[0-5]\d)\s*(AM|PM)\b/i;
  const time24hRe = /\b((?:[01]?\d|2[0-3]):[0-5]\d)(?::[0-5]\d)?\b/;
  const timeDotRe = /\b((?:[01]?\d|2[0-3])\.[0-5]\d)\s*น\./;

  for (const line of lines) {
    const m12 = line.match(time12hRe);
    if (m12) {
      let [hh, mm] = m12[1].split(':').map(Number);
      const ampm = m12[2].toUpperCase();
      if (ampm === 'PM' && hh < 12) hh += 12;
      if (ampm === 'AM' && hh === 12) hh = 0;
      time = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      break;
    }
    const mc = line.match(time24hRe);
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
    // Check Thai Months
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

    // Check East Asian Date: YYYY年MM月DD日
    const eaMatch = line.match(/(\d{4})[年/\-.]\s*(\d{1,2})[月/\-.]\s*(\d{1,2})[日號]?/);
    if (eaMatch) {
      const y = normalizeYear(parseInt(eaMatch[1], 10));
      const m = eaMatch[2].padStart(2, '0');
      const d = eaMatch[3].padStart(2, '0');
      if (parseInt(m, 10) >= 1 && parseInt(m, 10) <= 12 && parseInt(d, 10) >= 1 && parseInt(d, 10) <= 31) {
        date = `${y}-${m}-${d}`;
        break;
      }
    }

    const slashMatch = line.match(dateSlashRe);
    if (slashMatch && !MASKED_ACCOUNT_RE.test(line)) {
      const part1 = parseInt(slashMatch[1], 10);
      const part2 = parseInt(slashMatch[2], 10);
      const y = normalizeYear(parseInt(slashMatch[3], 10));
      
      // Determine day and month
      let d, m;
      if (part1 > 12 && part2 <= 12) {
        d = String(part1).padStart(2, '0');
        m = String(part2).padStart(2, '0');
      } else {
        d = String(part1).padStart(2, '0');
        m = String(part2).padStart(2, '0');
      }
      if (parseInt(m, 10) >= 1 && parseInt(m, 10) <= 12 && parseInt(d, 10) >= 1 && parseInt(d, 10) <= 31) {
        date = `${y}-${m}-${d}`;
        break;
      }
    }
  }

  // English Month name check: "8 Nov 2026" or "Nov 8, 2026"
  if (!date) {
    const enDayFirst = text.match(/\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{2,4})\b/i);
    if (enDayFirst) {
      const month = ENGLISH_MONTHS.indexOf(enDayFirst[2].slice(0, 3).toLowerCase()) + 1;
      date = `${normalizeYear(Number(enDayFirst[3]))}-${String(month).padStart(2, '0')}-${enDayFirst[1].padStart(2, '0')}`;
    } else {
      const enMonthFirst = text.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{2,4})\b/i);
      if (enMonthFirst) {
        const month = ENGLISH_MONTHS.indexOf(enMonthFirst[1].slice(0, 3).toLowerCase()) + 1;
        date = `${normalizeYear(Number(enMonthFirst[3]))}-${String(month).padStart(2, '0')}-${enMonthFirst[2].padStart(2, '0')}`;
      }
    }
  }

  // Spanish Month check: "8 de noviembre de 2026"
  if (!date) {
    const esMatch = text.match(/\b(\d{1,2})\s+(?:de\s+)?(ene(?:ro)?|feb(?:rero)?|mar(?:zo)?|abr(?:il)?|may(?:o)?|jun(?:io)?|jul(?:io)?|ago(?:sto)?|sep(?:tiembre)?|oct(?:ubre)?|nov(?:iembre)?|dic(?:iembre)?)\.?,?\s+(?:de\s+)?(\d{2,4})\b/i);
    if (esMatch) {
      const abbr = esMatch[2].slice(0, 3).toLowerCase();
      const monthObj = SPANISH_MONTHS.find(([m]) => m === abbr);
      if (monthObj) {
        date = `${normalizeYear(Number(esMatch[3]))}-${monthObj[1]}-${esMatch[1].padStart(2, '0')}`;
      }
    }
  }

  const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) date = `${normalizeYear(Number(isoMatch[1]))}-${isoMatch[2]}-${isoMatch[3]}`;
  if (date && !isValidSlipDate(date)) date = null;

  // 4. Extract Payee (Recipient) across languages
  let payee = null;
  const payeeRe = /(?:ไปยัง|ผู้รับเงิน|ชื่อผู้รับ|ผู้รับ|โอนให้|^To\b|recipient|payee|merchant|paid to|transfer to|destinatario|beneficiario|comercio|收款人|收款方|转入|商户|受取人|振込先|加盟店)[:：\s]*([^\n\r]+)/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(payeeRe);
    if (m && m[1].trim()) {
      payee = m[1].trim();
      break;
    }
    if (/^(ไปยัง|ผู้รับเงิน|ชื่อผู้รับ|ผู้รับ|โอนให้|to|recipient|payee|destinatario|beneficiario|收款人|受取人)[:：]?$/i.test(line) && i + 1 < lines.length) {
      payee = lines[i + 1].trim();
      break;
    }
  }

  // 5. Extract Sender across languages
  let sender = null;
  const senderRe = /(?:จาก|ผู้โอน|^From\b|sender|payer|remitente|pagador|付款人|付款方|转出|ご依頼人|振込元)[:：\s]*([^\n\r]+)/i;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(senderRe);
    if (m && m[1].trim()) {
      sender = m[1].trim();
      break;
    }
  }

  // 6. Extract Reference across languages
  let refCode = null;
  const refLabelRe = /(?:รหัสอ้างอิง|เลขที่?รายการ|เลขที่?อ้างอิง|Ref(?:erence)?|Ref\s*No|Transaction\s*ID|Trans\s*ID|Order\s*ID|Receipt\s*(?:No|#)|Invoice\s*(?:No|#)|Referencia|交易单号|交易流水号|凭证号|参考号|取引番号|照会番号)/i;
  const codeRe = /([A-Za-z0-9_-]{8,40})/;
  for (let i = 0; i < lines.length; i++) {
    if (!refLabelRe.test(lines[i])) continue;
    const after = lines[i].split(/[:：]/).slice(1).join(':');
    const m = (after || lines[i].replace(refLabelRe, '')).match(codeRe) || (lines[i + 1] || '').match(codeRe);
    if (m) {
      refCode = m[1];
      break;
    }
  }

  // 7. Detect Bank or Payment Provider from Text
  let bankId = null;
  const fullLower = text.toLowerCase();
  
  // Specific checks with high fidelity
  if (/make(?: by kbank)?|cloud pocket/.test(fullLower)) bankId = 'MAKE';
  else if (/kept/.test(fullLower)) bankId = 'KEPT';
  else if (/mymo|ออมสิน/.test(fullLower)) bankId = 'GSB';
  else if (fullLower.includes('กสิกร') || fullLower.includes('kbank') || fullLower.includes('k plus')) bankId = 'KBANK';
  else if (fullLower.includes('ไทยพาณิชย์') || fullLower.includes('scb')) bankId = 'SCB';
  else if (fullLower.includes('กรุงไทย') || fullLower.includes('ktb') || fullLower.includes('next')) bankId = 'KTB';
  else if (fullLower.includes('กรุงศรี') || fullLower.includes('bay') || fullLower.includes('kma')) bankId = 'BAY';
  else if (fullLower.includes('กรุงเทพ') || fullLower.includes('bbl') || fullLower.includes('bualuang')) bankId = 'BBL';
  else if (fullLower.includes('ttb') || fullLower.includes('ธนชาต')) bankId = 'TTB';
  else if (fullLower.includes('dime') || fullLower.includes('เกียรตินาคิน')) bankId = 'DIME';
  else if (fullLower.includes('truemoney') || fullLower.includes('ทรูมันนี่')) bankId = 'TRUEMONEY';
  else {
    // Global & international banks/fintech providers
    const detected = detectBankFromText(text);
    if (detected && detected.id !== 'OTHER' && detected.id !== 'CASH') {
      bankId = detected.id;
    }
  }

  if (payee && /(?:จำนวน|ยอดเงิน|ค่าธรรมเนียม|อ้างอิง|\bamount\b|\btotal\b|\breference\b|\bfees?\b|\bmonto\b|金额|金額)/i.test(payee)) {
    payee = null;
  }

  return {
    amount,
    ambiguousAmount,
    time,
    date,
    payee,
    sender,
    refCode,
    bankId,
    currency: currencyCode
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
  const bankValid = !!(ALL_BANKS[item.bankId] || THAI_BANKS[item.bankId]) && !['OTHER', 'CASH'].includes(item.bankId);
  return Number.isFinite(Number(item.amount)) && Number(item.amount) > 0 &&
    Number(item.amount) <= 1000000 && bankValid && isValidSlipDate(item.date) &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(item.time || '') && !!item.payee?.trim();
}

// Read TLV lengths instead of matching accidental "0103"/"02" substrings in IDs or URLs.
export function parseSlipVerifyQR(raw) {
  if (typeof raw !== 'string' || !raw || raw.length > 4096 || raw.startsWith('000201')) return null;
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
