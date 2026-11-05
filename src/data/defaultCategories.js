// Default Expense Categories with icons, brand styling, and intelligent keywords
export const DEFAULT_CATEGORIES = [
  {
    id: 'food',
    name: 'อาหารและเครื่องดื่ม',
    shortName: 'อาหาร',
    icon: '🍔',
    color: '#f97316', // Orange
    bgColor: '#fff7ed',
    keywords: [
      'อาหาร', 'ข้าว', 'น้ำ', 'กาแฟ', 'ชา', 'คาเฟ่', 'cafe', 'coffee', 'tea',
      '7-eleven', 'เซเว่น', 'lineman', 'grabfood', 'foodpanda', 'shopeefood', 'robinhood',
      'ส้มตำ', 'ก๋วยเตี๋ยว', 'ชาบู', 'หมูกระทะ', 'สุกี้', 'mk', 'kfc', 'mcdonald', 'burger',
      'pizza', 'bar', 'เหล้า', 'เบียร์', 'ร้านอาหาร', 'kitchen', 'restaurant', 'bakery',
      'ขนม', 'เบเกอรี่', 'amazon', 'starbucks', 'เต่าบิน', 'taobin', 'boost', 'chatramue',
      'ชาตรามือ', 'ชาพะยอม', 'บอนชอน', 'bonchon', 'swensen', 'ตี๋น้อย', 'สเต็ก', 'steak',
      'food', 'drink', 'beverage'
    ]
  },
  {
    id: 'transport',
    name: 'การเดินทางและยานพาหนะ',
    shortName: 'เดินทาง',
    icon: '🚗',
    color: '#0284c7', // Sky Blue
    bgColor: '#f0f9ff',
    keywords: [
      'bts', 'mrt', 'arl', 'srt', 'รถไฟฟ้า', 'แท็กซี่', 'taxi', 'grab', 'bolt',
      'indrive', 'ปั๊ม', 'ptt', 'บางจาก', 'shell', 'caltex', 'esso', 'ปตท',
      'น้ำมัน', 'fuel', 'gas', 'ทางด่วน', 'easy pass', 'm-pass', 'ตั๋วรถ', 'ขสมก',
      'เรือ', 'รถไฟ', 'เครื่องบิน', 'airasia', 'nokair', 'lionair', 'การบินไทย',
      'จอดรถ', 'parking', 'ค่าเดินทาง', 'toll'
    ]
  },
  {
    id: 'shopping',
    name: 'ช้อปปิ้งและของใช้',
    shortName: 'ช้อปปิ้ง',
    icon: '🛍️',
    color: '#ec4899', // Pink
    bgColor: '#fdf2f8',
    keywords: [
      'shopee', 'lazada', 'tiktok', 'tiktok shop', 'watson', 'boots', 'uniqlo',
      'zara', 'h&m', 'eveandboy', 'big c', 'lotus', 'โลตัส', 'บิ๊กซี', 'makro',
      'แม็คโคร', 'cj express', 'villa market', 'gourmet', 'cj more', 'เสื้อผ้า',
      'แฟชั่น', 'รองเท้า', 'กระเป๋า', 'เครื่องสำอาง', 'supermarket', 'mall', 'central',
      'the mall', 'iconsiam', 'shopping', 'ซื้อของ'
    ]
  },
  {
    id: 'bills',
    name: 'บิลและค่าใช้จ่ายประจำ',
    shortName: 'บิล/สาธารณูปโภค',
    icon: '💡',
    color: '#eab308', // Amber
    bgColor: '#fefce8',
    keywords: [
      'กฟน', 'กฟภ', 'การไฟฟ้านครหลวง', 'การไฟฟ้าส่วนภูมิภาค', 'กปน', 'กปภ', 'การประปา',
      'ais', 'true', 'dtac', '3bb', 'nt', 'เน็ต', 'internet', 'wifi', 'netflix',
      'spotify', 'youtube', 'apple', 'google', 'ค่าห้อง', 'ค่าเช่า', 'คอนโด', 'หอพัก',
      'ประกัน', 'aia', 'allianz', 'fwd', 'muang thai', 'บิล', 'ค่าไฟ', 'ค่าน้ำ'
    ]
  },
  {
    id: 'health',
    name: 'สุขภาพและความงาม',
    shortName: 'สุขภาพ',
    icon: '🏥',
    color: '#10b981', // Emerald
    bgColor: '#ecfdf5',
    keywords: [
      'โรงพยาบาล', 'รพ.', 'คลินิก', 'clinic', 'hospital', 'เภสัช', 'ร้านยา',
      'ฟัน', 'ทันตกรรม', 'แว่นตา', 'ตรวจสุขภาพ', 'ฟิตเนส', 'gym', 'fitness',
      'นวด', 'สปา', 'ยา', 'pharmacy'
    ]
  },
  {
    id: 'entertainment',
    name: 'บันเทิงและสันทนาการ',
    shortName: 'บันเทิง',
    icon: '🎮',
    color: '#8b5cf6', // Violet
    bgColor: '#f5f3ff',
    keywords: [
      'major', 'sf cinema', 'โรงหนัง', 'เกม', 'game', 'steam', 'playstation',
      'nintendo', 'garena', 'concert', 'คอนเสิร์ต', 'ตั๋ว', 'karaoke', 'สวนสนุก',
      'การ์ตูน', 'manga', 'webtoon'
    ]
  },
  {
    id: 'donation',
    name: 'ทำบุญและบริจาค',
    shortName: 'ทำบุญ',
    icon: '🙏',
    color: '#06b6d4', // Cyan
    bgColor: '#ecfeff',
    keywords: [
      'วัด', 'ทำบุญ', 'บริจาค', 'ศาลเจ้า', 'มูลนิธิ', 'donation', 'foundation',
      'กุศล', 'สงเคราะห์'
    ]
  },
  {
    id: 'transfer',
    name: 'โอนเงินและอื่นๆ',
    shortName: 'อื่นๆ',
    icon: '💸',
    color: '#64748b', // Slate
    bgColor: '#f8fafc',
    keywords: ['โอนเงิน', 'transfer', 'เงินโอน', 'ทั่วไป', 'อื่นๆ']
  }
];

export function getCategoryById(categories, id) {
  return categories.find(c => c.id === id) || categories.find(c => c.id === 'transfer') || DEFAULT_CATEGORIES[0];
}

/**
 * Intelligent auto-categorization matching
 * Checks learned merchant rules first, then matches payee name and note keywords
 */
export function matchCategory(payee = '', note = '', rules = {}, categories = DEFAULT_CATEGORIES) {
  const cleanPayee = (payee || '').trim().toLowerCase();
  const cleanNote = (note || '').trim().toLowerCase();

  // 1. Check user-learned merchant rules
  if (cleanPayee && rules[cleanPayee]) {
    const matched = categories.find(c => c.id === rules[cleanPayee]);
    if (matched) return matched.id;
  }

  const combined = `${cleanPayee} ${cleanNote}`;

  // 2. Keyword check against categories in order
  for (const cat of categories) {
    if (cat.id === 'transfer') continue; // Transfer is fallback
    for (const kw of (cat.keywords || [])) {
      if (combined.includes(kw.toLowerCase())) {
        return cat.id;
      }
    }
  }

  // 3. Fallback
  return 'transfer';
}
