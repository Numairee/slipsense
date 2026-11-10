# SlipSense

> **Private on-device smart slip & receipt scanner for Android and the Web.**  
> Automatically extract transactions from bank slips and digital payment receipts worldwide without cloud servers or tracking.

[![Validate slip parsing and web build](https://github.com/Numairee/slipsense/actions/workflows/validate.yml/badge.svg)](https://github.com/Numairee/slipsense/actions/workflows/validate.yml)
[![Build & Release SlipSense Android APK](https://github.com/Numairee/slipsense/actions/workflows/build-apk.yml/badge.svg)](https://github.com/Numairee/slipsense/actions/workflows/build-apk.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Overview

SlipSense scans and indexes bank transfer slips, digital wallet confirmations, and payment receipts directly on your device. All image parsing and text recognition run locally through client-side OCR and native platform bridges. Your photos, transaction amounts, and financial records never leave your phone.

### Key Capabilities

1. **Global Slip & Receipt OCR:**
   - Multi-currency recognition: USD (`$`), EUR (`€`), GBP (`£`), JPY (`¥`), CNY (`¥`), THB (`฿`), SGD (`S$`), MYR (`RM`), AUD (`A$`), CAD (`C$`), and others.
   - Worldwide financial institutions and digital wallets:
     - **Global FinTech:** PayPal, Wise, Revolut, Stripe, Apple Pay, Google Pay, Venmo, Cash App, Zelle, WeChat Pay, Alipay, LINE Pay.
     - **International Banks:** JPMorgan Chase, Bank of America, Wells Fargo, Citibank, HSBC, Barclays, Santander, BBVA, DBS, and generic payment receipts.
     - **Thai Banking:** K PLUS, SCB EASY, Krungthai NEXT, Krungsri KMA, Bangkok Bank, ttb touch, MAKE by KBank, Dime!, Kept, TrueMoney, MyMo (GSB).
   - Extracts amount, date, time, payee/merchant, sender, reference code, and payment method across Latin, Thai, Chinese, and Japanese scripts.
   - Bank of Thailand / ITMX Mini-QR TLV verification.

2. **Multi-Language Interface (i18n):**
   - 🇺🇸 English
   - 🇹🇭 ภาษาไทย (Thai)
   - 🇨🇳 简体中文 (Simplified Chinese)
   - 🇯🇵 日本語 (Japanese)
   - 🇪🇸 Español (Spanish)
   - Real-time language switching with persistent preference storage.

3. **100% On-Device Privacy (No-Track):**
   - Fully functional offline without an internet connection.
   - Zero telemetry, analytics, or external trackers.
   - Gallery safety guarantee: device photos are only read for OCR parsing and are never altered, moved, or deleted.

4. **Financial Analytics & Budgeting:**
   - Monthly burn rate and daily average metrics.
   - Interactive daily expense timeline and category breakdown charts.
   - Top merchant expense ranking and payment method distribution.
   - Category budget tracking with visual limit indicators.

5. **Merchant Memory Rules:**
   - Automatically remembers user-assigned categories for frequent payees and shops.

6. **Export & Portability:**
   - CSV export with UTF-8 BOM encoding for direct import into Microsoft Excel, Apple Numbers, and Google Sheets.
   - Full JSON database backup and restore.

---

## Getting Started

### Prerequisites
- Node.js 20 or higher
- npm 10 or higher

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/Numairee/slipsense.git
cd slipsense

# Install dependencies
npm install

# Run automated test suite (58 regression tests)
npm test

# Verify text style contract
npm run unslop

# Start local development server
npm run dev

# Build production bundle
npm run build
```

---

## Android Native Build

The native Android application is packaged with [Capacitor](https://capacitorjs.com/):

```bash
# 1. Build web distribution and sync to Android
npm run android:sync

# 2. Open project in Android Studio
npm run android:open
```

In Android Studio:
- Select **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate `app-release.apk`.
- Alternatively, automated APK artifacts are built by GitHub Actions on every release.

---

## Project Structure

```text
slipsense/
├── .github/workflows/          # CI validation and automated APK release workflows
├── android/                    # Capacitor Android Studio project (Java / Gradle)
├── public/                     # Static web assets, manifest, and icons
├── src/
│   ├── components/             # Reusable UI components (Modals, Headers, Cards)
│   ├── data/                   # Bank definitions and expense categories
│   ├── i18n/                   # Multi-language translations (EN, TH, ZH, JA, ES)
│   ├── utils/                  # OCR engine, slip field extractors, and storage
│   ├── views/                  # Primary screen views (Home, Analytics, Budgets, History, Settings)
│   ├── App.jsx                 # Application state coordinator
│   └── main.jsx                # Application root entry
├── tests/                      # Automated test suite (amount, dates, QR, global slips)
├── capacitor.config.json       # Capacitor configuration
├── package.json
└── vite.config.js
```

---

## Automated Test Coverage

The test suite runs with Node's native test runner (`node --test tests/*.test.js`):
- Multi-currency amount extraction (standard decimals, Thai digits, fullwidth characters, edge bounds).
- Global digital wallets (PayPal, Wise, Revolut, Alipay, Santander, POS receipts).
- Date format normalization (ISO, slash dates, Thai/English/Spanish month names, East Asian dates).
- Reference code extraction across multi-lingual receipt layouts.
- Mini-QR TLV tag length and structure parsing.
- Duplicate transaction prevention and storage consistency.

---

## License

This project is licensed under the MIT License.
