// 100% Local On-Device Storage for Pygmy
// No servers, no tracking, completely private & offline

import { DEFAULT_CATEGORIES } from '../data/defaultCategories';

const STORAGE_KEYS = {
  TRANSACTIONS: 'pygmy_transactions_v1',
  CATEGORIES: 'pygmy_categories_v1',
  MERCHANT_RULES: 'pygmy_merchant_rules_v1',
  GOAT_STATE: 'pygmy_goat_state_v1',
  SETTINGS: 'pygmy_settings_v1',
};

// Initial demo transactions so the user immediately sees the beautiful UI on first run
export const SAMPLE_INITIAL_TRANSACTIONS = [
  {
    id: 'tx_sample_1',
    date: '2026-11-05',
    time: '12:45',
    timestamp: Date.now() - 3600000 * 4,
    amount: 125.00,
    bankId: 'KBANK',
    payee: '7-Eleven สาขาอโศก',
    sender: 'คุณนิมิตร (xxx-2-89101-1)',
    categoryId: 'food',
    ref: '0143101245009871',
    note: 'ข้าวกล่อง + ชาเขียว',
    isManual: false,
  },
  {
    id: 'tx_sample_2',
    date: '2026-11-05',
    time: '08:30',
    timestamp: Date.now() - 3600000 * 8,
    amount: 62.00,
    bankId: 'SCB',
    payee: 'BTS Skytrain (สถานีหมอชิต)',
    sender: 'คุณนิมิตร (xxx-4-56789-0)',
    categoryId: 'transport',
    ref: '2026110508301142',
    note: 'เดินทางไปทำงาน',
    isManual: false,
  },
  {
    id: 'tx_sample_3',
    date: '2026-11-04',
    time: '19:20',
    timestamp: Date.now() - 3600000 * 24,
    amount: 540.00,
    bankId: 'KTB',
    payee: 'ชาบูชิ สาขาเซ็นทรัล',
    sender: 'คุณนิมิตร (xxx-9-11223-4)',
    categoryId: 'food',
    ref: 'KTB20261104192088',
    note: 'มื้อเย็นกับเพื่อน',
    isManual: false,
  },
  {
    id: 'tx_sample_4',
    date: '2026-11-04',
    time: '15:10',
    timestamp: Date.now() - 3600000 * 28,
    amount: 890.00,
    bankId: 'TTB',
    payee: 'Uniqlo Thailand',
    sender: 'คุณนิมิตร (xxx-0-99887-6)',
    categoryId: 'shopping',
    ref: 'TTB9988112233',
    note: 'เสื้อยืด AIRism',
    isManual: false,
  },
  {
    id: 'tx_sample_5',
    date: '2026-11-03',
    time: '10:00',
    timestamp: Date.now() - 3600000 * 52,
    amount: 1250.00,
    bankId: 'BAY',
    payee: 'การไฟฟ้านครหลวง (MEA)',
    sender: 'คุณนิมิตร (xxx-1-44556-7)',
    categoryId: 'bills',
    ref: 'BAY202611030012',
    note: 'ค่าไฟประจำเดือน',
    isManual: false,
  }
];

export const Storage = {
  // --- Transactions ---
  getTransactions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!raw) {
        // Initialize with sample data for immediate visual delight
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(SAMPLE_INITIAL_TRANSACTIONS));
        return SAMPLE_INITIAL_TRANSACTIONS;
      }
      return JSON.parse(raw);
    } catch {
      return SAMPLE_INITIAL_TRANSACTIONS;
    }
  },

  saveTransactions(transactions) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  },

  addTransaction(tx) {
    const list = this.getTransactions();
    const updated = [tx, ...list];
    this.saveTransactions(updated);
    return updated;
  },

  addBatchTransactions(txList) {
    const list = this.getTransactions();
    const updated = [...txList, ...list];
    this.saveTransactions(updated);
    return updated;
  },

  updateTransaction(id, updates) {
    const list = this.getTransactions();
    const updated = list.map(tx => tx.id === id ? { ...tx, ...updates } : tx);
    this.saveTransactions(updated);
    return updated;
  },

  deleteTransaction(id) {
    const list = this.getTransactions();
    const updated = list.filter(tx => tx.id !== id);
    this.saveTransactions(updated);
    return updated;
  },

  // --- Categories ---
  getCategories() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return raw ? JSON.parse(raw) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },

  saveCategories(categories) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  // --- Merchant Learned Rules ---
  getMerchantRules() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MERCHANT_RULES);
      return raw ? JSON.parse(raw) : {
        '7-eleven': 'food',
        'lineman': 'food',
        'grabfood': 'food',
        'bts': 'transport',
        'mrt': 'transport',
        'shopee': 'shopping',
        'lazada': 'shopping',
      };
    } catch {
      return {};
    }
  },

  learnMerchantRule(payee, categoryId) {
    if (!payee) return;
    const rules = this.getMerchantRules();
    rules[payee.trim().toLowerCase()] = categoryId;
    localStorage.setItem(STORAGE_KEYS.MERCHANT_RULES, JSON.stringify(rules));
  },

  // --- Goat Mascot State ---
  getGoatState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GOAT_STATE);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return {
      name: 'น้องปิ๊กมี่',
      streakDays: 4,
      lastFedDate: new Date().toISOString().split('T')[0],
      totalSlipsEaten: 18,
      hungerLevel: 90, // 0 - 100
      mood: 'happy', // 'hungry' | 'happy' | 'super'
    };
  },

  saveGoatState(state) {
    localStorage.setItem(STORAGE_KEYS.GOAT_STATE, JSON.stringify(state));
  },

  feedGoat(slipsCount = 1) {
    const state = this.getGoatState();
    const today = new Date().toISOString().split('T')[0];
    const isNewDay = state.lastFedDate !== today;

    const newStreak = isNewDay ? state.streakDays + 1 : state.streakDays;
    const updated = {
      ...state,
      streakDays: newStreak,
      lastFedDate: today,
      totalSlipsEaten: (state.totalSlipsEaten || 0) + slipsCount,
      hungerLevel: Math.min(100, (state.hungerLevel || 50) + slipsCount * 25),
      mood: 'super',
    };
    this.saveGoatState(updated);
    return updated;
  },

  // --- Export / Import Backup ---
  exportAllDataJSON() {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      transactions: this.getTransactions(),
      categories: this.getCategories(),
      merchantRules: this.getMerchantRules(),
      goatState: this.getGoatState(),
    }, null, 2);
  },

  importDataJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.transactions) this.saveTransactions(data.transactions);
      if (data.categories) this.saveCategories(data.categories);
      if (data.merchantRules) localStorage.setItem(STORAGE_KEYS.MERCHANT_RULES, JSON.stringify(data.merchantRules));
      if (data.goatState) this.saveGoatState(data.goatState);
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  },

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.MERCHANT_RULES);
    localStorage.removeItem(STORAGE_KEYS.GOAT_STATE);
  }
};
