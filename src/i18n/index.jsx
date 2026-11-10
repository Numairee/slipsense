import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, SUPPORTED_LANGUAGES } from './translations.js';

const LanguageContext = createContext(null);

function detectDefaultLanguage() {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('slipsense_language');
  if (saved && translations[saved]) return saved;

  const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
  if (browserLang.startsWith('th')) return 'th';
  if (browserLang.startsWith('zh')) return 'zh';
  if (browserLang.startsWith('ja')) return 'ja';
  if (browserLang.startsWith('es')) return 'es';
  return 'en';
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(detectDefaultLanguage);
  const [displayCurrency, setDisplayCurrencyState] = useState(() => {
    if (typeof window === 'undefined') return 'AUTO';
    return localStorage.getItem('slipsense_display_currency') || 'AUTO';
  });

  const setLanguage = (langCode) => {
    if (translations[langCode]) {
      setLanguageState(langCode);
      localStorage.setItem('slipsense_language', langCode);
      document.documentElement.lang = langCode;
    }
  };

  const setDisplayCurrency = (curr) => {
    setDisplayCurrencyState(curr);
    localStorage.setItem('slipsense_display_currency', curr);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key, params = {}) => {
    const currentDict = translations[language] || translations.en;
    let text = currentDict[key] ?? translations.en[key] ?? key;
    if (typeof text === 'string' && params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return text;
  };

  const formatAmount = (num, slipCurrency = 'THB') => {
    const n = Number(num) || 0;
    const currency = displayCurrency !== 'AUTO' ? displayCurrency : (slipCurrency || 'THB');
    
    // Choose symbol / prefix
    const symbols = {
      THB: '฿',
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CNY: '¥',
      SGD: 'S$',
      MYR: 'RM',
      AUD: 'A$',
      CAD: 'C$',
      INR: '₹',
      KRW: '₩'
    };
    const symbol = symbols[currency] || currency;

    const formattedNum = n.toLocaleString(language === 'th' ? 'th-TH' : language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US', {
      minimumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2,
    });

    if (currency === 'THB') {
      return `${symbol}${formattedNum}`;
    }
    if (['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'SGD', 'MYR', 'AUD', 'CAD', 'INR', 'KRW'].includes(currency)) {
      return `${symbol}${formattedNum}`;
    }
    return `${formattedNum} ${currency}`;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        displayCurrency,
        setDisplayCurrency,
        formatAmount,
        supportedLanguages: SUPPORTED_LANGUAGES,
        currentTranslations: translations[language] || translations.en
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useI18n must be used within a LanguageProvider');
  }
  return ctx;
}
