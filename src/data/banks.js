// Thai Bank Definitions with official brand colors, codes, and OCR detection patterns
export const THAI_BANKS = {
  OTHER: {
    id: 'OTHER', name: 'ไม่ทราบธนาคาร', shortName: 'ไม่ทราบ',
    color: '#525252', textColor: '#ffffff', keywords: [], iconText: '?'
  },
  KBANK: {
    id: 'KBANK',
    code: '004',
    name: 'กสิกรไทย',
    fullName: 'ธนาคารกสิกรไทย (K PLUS)',
    shortName: 'KBank',
    color: '#00a950',
    textColor: '#ffffff',
    bgLight: '#e6f7ee',
    keywords: ['กสิกรไทย', 'kplus', 'k plus', 'kbank', 'kasikornbank', 'ธนาคารกสิกรไทย'],
    iconText: 'K',
  },
  SCB: {
    id: 'SCB',
    code: '014',
    name: 'ไทยพาณิชย์',
    fullName: 'ธนาคารไทยพาณิชย์ (SCB EASY)',
    shortName: 'SCB',
    color: '#4e2a84',
    textColor: '#ffffff',
    bgLight: '#f3eefb',
    keywords: ['ไทยพาณิชย์', 'scb', 'scb easy', 'siam commercial bank', 'ธนาคารไทยพาณิชย์'],
    iconText: 'SCB',
  },
  KTB: {
    id: 'KTB',
    code: '006',
    name: 'กรุงไทย',
    fullName: 'ธนาคารกรุงไทย (Krungthai NEXT)',
    shortName: 'KTB',
    color: '#00a4e4',
    textColor: '#ffffff',
    bgLight: '#e5f6fd',
    keywords: ['กรุงไทย', 'krungthai', 'ktb', 'krungthai next', 'ธนาคารกรุงไทย'],
    iconText: 'KTB',
  },
  BAY: {
    id: 'BAY',
    code: '025',
    name: 'กรุงศรี',
    fullName: 'ธนาคารกรุงศรีอยุธยา (KMA)',
    shortName: 'BAY',
    color: '#fec400',
    textColor: '#332600',
    bgLight: '#fff9e6',
    keywords: ['กรุงศรีอยุธยา', 'กรุงศรี', 'bay', 'krungsri', 'kma', 'ธนาคารกรุงศรี'],
    iconText: 'BAY',
  },
  BBL: {
    id: 'BBL',
    code: '002',
    name: 'กรุงเทพ',
    fullName: 'ธนาคารกรุงเทพ (Bualuang mBanking)',
    shortName: 'BBL',
    color: '#1e3a8a',
    textColor: '#ffffff',
    bgLight: '#edf2fa',
    keywords: ['กรุงเทพ', 'bangkok bank', 'bbl', 'bualuang', 'บัวหลวง', 'ธนาคารกรุงเทพ'],
    iconText: 'BBL',
  },
  TTB: {
    id: 'TTB',
    code: '011',
    name: 'ทีทีบี',
    fullName: 'ทีเอ็มบีธนชาต (ttb touch)',
    shortName: 'ttb',
    color: '#002d62',
    secondaryColor: '#f26522',
    textColor: '#ffffff',
    bgLight: '#e6edf5',
    keywords: ['ทีเอ็มบีธนชาต', 'ttb touch', 'ttb', 'tmb', 'ธนชาต', 'thanachart'],
    iconText: 'ttb',
  },
  MAKE: {
    id: 'MAKE',
    code: '004',
    name: 'MAKE by KBank',
    fullName: 'MAKE by KBank (Cloud Pocket)',
    shortName: 'MAKE',
    color: '#06d6a0',
    textColor: '#04382c',
    bgLight: '#e6fcf5',
    keywords: ['make by kbank', 'make', 'cloud pocket'],
    iconText: 'MAKE',
  },
  DIME: {
    id: 'DIME',
    code: '069',
    name: 'Dime!',
    fullName: 'Dime! by KKP',
    shortName: 'Dime',
    color: '#ff007a',
    textColor: '#ffffff',
    bgLight: '#ffe6f2',
    keywords: ['dime', 'dime!', 'kiatnakin', 'เกียรตินาคินภัทร', 'kkp'],
    iconText: 'Dime',
  },
  KEPT: {
    id: 'KEPT',
    code: '025',
    name: 'Kept',
    fullName: 'Kept by krungsri',
    shortName: 'Kept',
    color: '#008080',
    textColor: '#ffffff',
    bgLight: '#e6f3f3',
    keywords: ['kept', 'kept by krungsri', 'กระปุก'],
    iconText: 'Kept',
  },
  TRUEMONEY: {
    id: 'TRUEMONEY',
    code: '104',
    name: 'ทรูมันนี่',
    fullName: 'TrueMoney Wallet',
    shortName: 'TrueMoney',
    color: '#ff8200',
    textColor: '#ffffff',
    bgLight: '#fff2e6',
    keywords: ['truemoney', 'true money', 'ทรูมันนี่', 'wallet', 'ทรู'],
    iconText: 'TMN',
  },
  GSB: {
    id: 'GSB',
    code: '030',
    name: 'ออมสิน',
    fullName: 'ธนาคารออมสิน (MyMo)',
    shortName: 'GSB',
    color: '#eb1985',
    textColor: '#ffffff',
    bgLight: '#fde8f3',
    keywords: ['ออมสิน', 'mymo', 'gsb', 'government savings bank', 'ธนาคารออมสิน'],
    iconText: 'GSB',
  },
  CASH: {
    id: 'CASH',
    code: '000',
    name: 'เงินสด/อื่นๆ',
    fullName: 'เงินสด / รายการบันทึกเอง',
    shortName: 'เงินสด',
    color: '#64748b',
    textColor: '#ffffff',
    bgLight: '#f1f5f9',
    keywords: ['เงินสด', 'cash', 'manual'],
    iconText: '💵',
  }
};

export const BANK_LIST = Object.values(THAI_BANKS);

export function getBankById(id) {
  return THAI_BANKS[id] || THAI_BANKS.CASH;
}

export function detectBankFromText(text = '') {
  const lower = text.toLowerCase();
  for (const bank of BANK_LIST) {
    if (bank.id === 'CASH') continue;
    for (const kw of bank.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return bank;
      }
    }
  }
  return THAI_BANKS.KBANK; // Common default if unknown
}

