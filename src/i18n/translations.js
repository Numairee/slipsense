// Multi-language translation dictionaries for SlipSense
// Supported: English (en), Thai (th), Simplified Chinese (zh), Japanese (ja), Spanish (es)

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'th', name: 'Thai', nativeName: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'zh', name: 'Chinese', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
];

export const translations = {
  en: {
    // Brand
    brandName: 'SlipSense',
    brandTagline: 'Private On-Device Expense Tracker',
    noTrackBadge: 'No-Track',
    versionBadge: 'v2.2.0',
    appSubtitle: 'Global Slip & Expense Tracker • 100% Offline',

    // Nav
    tabHome: 'Overview',
    tabAnalytics: 'Analytics',
    tabBudgets: 'Budgets',
    tabHistory: 'History',
    tabSettings: 'Settings',

    // Months
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    currentMonthTip: 'Tap to return to current month',

    // Overview & Summary
    totalExpenses: 'Total Expenses',
    dailyAverage: 'Daily Average',
    dayStreak: 'Day Streak',
    totalRecords: 'Records',
    noTransactionsYet: 'No transactions recorded yet',
    recentTransactions: 'Recent Transactions',
    viewAll: 'View all',
    today: 'Today',
    yesterday: 'Yesterday',
    daysCount: 'days',

    // Mascot Widget
    mascotName: 'Pygmy Mascot',
    hungerBar: 'Hunger Bar',
    streakDays: 'day streak',
    feedMascot: 'Feed Slip',
    mascotFull: 'Well Fed',
    mascotHungry: 'Needs Receipts',
    mascotTip: 'Log daily expenses to maintain your recording habit.',

    // Quick Actions
    autoScanGallery: 'Scan Gallery',
    autoScanDesc: 'Detect slips across device folders',
    pickFolder: 'Choose Folder',
    manualAdd: 'Add Manually',
    quickScanTip: 'Supports receipts and bank slips worldwide',

    // Scan & Review Modal
    reviewTitle: 'Review Detected Slips',
    reviewSubtitle: 'Confirm details before saving to your records',
    saveSelected: 'Save Confirmed Slips',
    cancel: 'Cancel',
    save: 'Save',
    duplicateWarning: 'Duplicate slip detected',
    fieldAmount: 'Amount',
    fieldCurrency: 'Currency',
    fieldDate: 'Date',
    fieldTime: 'Time',
    fieldBank: 'Provider / Bank',
    fieldCategory: 'Category',
    fieldPayee: 'Recipient / Merchant',
    fieldSender: 'Sender / Payer',
    fieldRef: 'Reference ID',
    autoDetected: 'Auto-detected',
    noSlipsFound: 'No eligible slips detected in this batch',
    scanningTitle: 'Scanning Device Images',
    scanningProgress: 'Processed {scanned} of {total} images...',

    // Manual Add Modal
    manualAddTitle: 'Add Transaction',
    amountPlaceholder: '0.00',
    notePlaceholder: 'Optional note or memo',
    selectCategory: 'Select Category',
    selectBank: 'Select Payment Method',

    // Details Modal
    detailTitle: 'Transaction Details',
    editTransaction: 'Edit Transaction',
    deleteTransaction: 'Delete Transaction',
    deleteConfirm: 'Are you sure you want to delete this transaction?',
    close: 'Close',

    // Analytics View
    analyticsTitle: 'Monthly Expense Insights',
    dailySpendingTrend: 'Daily Spending Trend',
    categoryDistribution: 'Spending by Category',
    bankDistribution: 'Payment Methods & Banks',
    topMerchants: 'Top Payees / Merchants',
    highestSpendingDay: 'Highest Spending Day',
    noDataForMonth: 'No data available for this month',

    // Budgets View
    budgetsTitle: 'Monthly Budgets',
    totalMonthlyBudget: 'Total Monthly Budget',
    budgetUsed: 'Used',
    budgetRemaining: 'Remaining',
    setBudgetPrompt: 'Set Monthly Spending Limit',
    categoryLimits: 'Category Allocations',
    overBudgetWarning: 'Over budget by',

    // History View
    historyTitle: 'Transaction History',
    searchPlaceholder: 'Search by payee, bank, or reference...',
    filterAll: 'All',
    exportCsvButton: 'Export CSV',
    itemsCount: 'items',
    noMatchingRecords: 'No transactions match your search',

    // Settings View
    settingsTitle: 'Settings & Privacy',
    languageSection: 'App Language',
    languageDesc: 'Choose your preferred display language',
    currencySection: 'Default Display Currency',
    currencyDesc: 'Format amounts throughout the dashboard',
    autoDetectCurrency: 'Auto (from receipt)',
    privacyHeading: '100% On-Device Privacy',
    privacySubheading: 'All slip recognition and data storage remain strictly on your device.',
    privacyBody: 'SlipSense processes images locally using device-based OCR. No photos, amounts, or merchant information ever leave your phone.',
    badgeOffline: '100% Offline',
    badgeOfflineDesc: 'Works with zero internet',
    badgeNoCloud: 'No Cloud Server',
    badgeNoCloudDesc: 'Zero external databases',
    badgeSafeGallery: 'Safe Photo Storage',
    badgeSafeGalleryDesc: 'Original photos are never modified or deleted',
    autoScanStartup: 'Auto-scan on App Launch',
    autoScanStartupDesc: 'Check new gallery photos automatically when launching',
    dataManagement: 'Data & Backup',
    exportCsvLabel: 'Export CSV File',
    exportCsvNote: 'UTF-8 with BOM for Excel, Google Sheets, or financial tools',
    exportBackupLabel: 'Export JSON Backup',
    exportBackupNote: 'Save a full backup of all transactions and category rules',
    importBackupLabel: 'Import JSON Backup',
    importBackupNote: 'Restore data from a previously saved backup file',
    clearAllData: 'Clear All App Data',
    clearAllDataDesc: 'Removes local transactions while keeping your phone gallery intact',
    resetApp: 'Reset All Settings',
    aboutApp: 'About SlipSense',
    aboutDescription: 'SlipSense is a privacy-first, on-device smart slip scanner and financial tracking tool with worldwide receipt recognition.',

    // Install Banner
    installTitle: 'Install SlipSense APK for Android',
    installDesc: 'Install the native Android build for automated on-device background scanning.',
    downloadApk: 'Download APK',

    // Statuses
    savedSuccessfully: 'Saved successfully',
    deletedSuccessfully: 'Deleted successfully',
    backupImported: 'Backup restored successfully',
    invalidBackupFile: 'Invalid backup file format',
  },

  th: {
    // Brand
    brandName: 'SlipSense',
    brandTagline: 'จดรายจ่าย On-Device บนเครื่อง ปลอดภัย 100%',
    noTrackBadge: 'No-Track',
    versionBadge: 'v2.2.0',
    appSubtitle: 'สแกนสลิปทั่วโลก • ทำงานออฟไลน์ 100%',

    // Nav
    tabHome: 'ภาพรวม',
    tabAnalytics: 'วิเคราะห์',
    tabBudgets: 'งบประมาณ',
    tabHistory: 'ประวัติ',
    tabSettings: 'ตั้งค่า',

    // Months
    months: [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ],
    prevMonth: 'เดือนก่อนหน้า',
    nextMonth: 'เดือนถัดไป',
    currentMonthTip: 'แตะเพื่อกลับมาเดือนปัจจุบัน',

    // Overview & Summary
    totalExpenses: 'ยอดรวมรายจ่าย',
    dailyAverage: 'เฉลี่ยต่อวัน',
    dayStreak: 'บันทึกต่อเนื่อง',
    totalRecords: 'รายการ',
    noTransactionsYet: 'ยังไม่มีรายการบันทึกในเดือนนี้',
    recentTransactions: 'รายการล่าสุด',
    viewAll: 'ดูทั้งหมด',
    today: 'วันนี้',
    yesterday: 'เมื่อวาน',
    daysCount: 'วัน',

    // Mascot Widget
    mascotName: 'น้องปิ๊กมี่',
    hungerBar: 'ความอิ่มท้อง',
    streakDays: 'วันติดกัน',
    feedMascot: 'ป้อนสลิป',
    mascotFull: 'อิ่มแปล้',
    mascotHungry: 'หิวสลิปแล้ว',
    mascotTip: 'บันทึกรายจ่ายสม่ำเสมอเพื่อสร้างวินัยทางการเงินที่ดี',

    // Quick Actions
    autoScanGallery: 'ตรวจรูปในเครื่อง',
    autoScanDesc: 'ค้นหาสลิปจากโฟลเดอร์ทั้งหมด',
    pickFolder: 'เลือกโฟลเดอร์',
    manualAdd: 'จดเอง',
    quickScanTip: 'รองรับสลิปธนาคารและใบเสร็จสากลทั่วโลก',

    // Scan & Review Modal
    reviewTitle: 'ตรวจสอบสลิปที่ตรวจพบ',
    reviewSubtitle: 'ตรวจทานความถูกต้องก่อนบันทึกลงระบบ',
    saveSelected: 'บันทึกสลิปที่เลือก',
    cancel: 'ยกเลิก',
    save: 'บันทึก',
    duplicateWarning: 'พบสลิปซ้ำกับที่มีอยู่แล้ว',
    fieldAmount: 'จำนวนเงิน',
    fieldCurrency: 'สกุลเงิน',
    fieldDate: 'วันที่',
    fieldTime: 'เวลา',
    fieldBank: 'ธนาคาร / ช่องทาง',
    fieldCategory: 'หมวดหมู่',
    fieldPayee: 'ผู้รับเงิน / ร้านค้า',
    fieldSender: 'ผู้โอน',
    fieldRef: 'รหัสอ้างอิง',
    autoDetected: 'ตรวจจับอัตโนมัติ',
    noSlipsFound: 'ไม่พบสลิปที่เข้าเงื่อนไขในชุดนี้',
    scanningTitle: 'กำลังตรวจรูปภาพในเครื่อง',
    scanningProgress: 'ตรวจแล้ว {scanned} จาก {total} รูป...',

    // Manual Add Modal
    manualAddTitle: 'บันทึกรายการเอง',
    amountPlaceholder: '0.00',
    notePlaceholder: 'บันทึกช่วยจำ (ไม่บังคับ)',
    selectCategory: 'เลือกหมวดหมู่',
    selectBank: 'เลือกวิธีชำระ / ธนาคาร',

    // Details Modal
    detailTitle: 'รายละเอียดรายการ',
    editTransaction: 'แก้ไขรายการ',
    deleteTransaction: 'ลบรายการ',
    deleteConfirm: 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?',
    close: 'ปิด',

    // Analytics View
    analyticsTitle: 'สถิติและภาพรวมรายจ่าย',
    dailySpendingTrend: 'แนวโน้มรายจ่ายรายวัน',
    categoryDistribution: 'สัดส่วนตามหมวดหมู่',
    bankDistribution: 'สัดส่วนตามธนาคารและกระเป๋าเงิน',
    topMerchants: '10 อันดับร้านค้าที่จ่ายสูงสุด',
    highestSpendingDay: 'วันที่จ่ายสูงสุด',
    noDataForMonth: 'ไม่มีข้อมูลในเดือนนี้',

    // Budgets View
    budgetsTitle: 'งบประมาณรายเดือน',
    totalMonthlyBudget: 'งบประมาณรวมทั้งเดือน',
    budgetUsed: 'ใช้ไปแล้ว',
    budgetRemaining: 'คงเหลือ',
    setBudgetPrompt: 'กำหนดงบประมาณรายจ่าย',
    categoryLimits: 'งบแยกตามหมวดหมู่',
    overBudgetWarning: 'ใช้เกินงบไปแล้ว',

    // History View
    historyTitle: 'ประวัติรายการ',
    searchPlaceholder: 'ค้นหาชื่อร้าน, ธนาคาร หรือรหัสอ้างอิง...',
    filterAll: 'ทั้งหมด',
    exportCsvButton: 'ส่งออก CSV',
    itemsCount: 'รายการ',
    noMatchingRecords: 'ไม่พบรายการที่ค้นหา',

    // Settings View
    settingsTitle: 'ตั้งค่า & ความเป็นส่วนตัว',
    languageSection: 'ภาษาของแอป (Language)',
    languageDesc: 'เลือกภาษาที่ต้องการให้แสดงผล',
    currencySection: 'สกุลเงินหลักที่แสดงผล',
    currencyDesc: 'เลือกสกุลเงินหลักสำหรับหน้าสรุปผล',
    autoDetectCurrency: 'อัตโนมัติ (ตามสลิป)',
    privacyHeading: 'ความเป็นส่วนตัว On-Device 100%',
    privacySubheading: 'การประมวลผลและการเก็บข้อมูลทั้งหมดอยู่ในเครื่องของคุณเท่านั้น',
    privacyBody: 'SlipSense ใช้ระบบอ่านข้อความ OCR ในเครื่องโดยตรง ไม่มีการส่งรูปภาพ ยอดเงิน หรือข้อมูลร้านค้าออกนอกเครื่องอย่างเด็ดขาด',
    badgeOffline: '🔒 ออฟไลน์ 100%',
    badgeOfflineDesc: 'ไม่ต้องเชื่อมต่ออินเทอร์เน็ต',
    badgeNoCloud: '🚫 ไร้คลาวด์',
    badgeNoCloudDesc: 'ไม่มีเซิร์ฟเวอร์ภายนอก',
    badgeSafeGallery: '🛡️ ปลอดภัยต่อรูปจริง',
    badgeSafeGalleryDesc: 'ไม่แก้ไขหรือลบรูปใดๆ ในเครื่อง',
    autoScanStartup: 'ตรวจสลิปอัตโนมัติเมื่อเปิดแอป',
    autoScanStartupDesc: 'เริ่มตรวจรูปภาพใหม่ในเครื่องทันทีเมื่อเปิดแอป',
    dataManagement: 'การจัดการข้อมูล & สำรองไฟล์',
    exportCsvLabel: 'ส่งออกไฟล์ CSV',
    exportCsvNote: 'UTF-8 with BOM เปิดใน Excel หรือ Sheets ได้ทันทีโดยสระไม่เพี้ยน',
    exportBackupLabel: 'สำรองข้อมูล (JSON Backup)',
    exportBackupNote: 'บันทึกข้อมูลธุรกรรมและกฎจัดหมวดหมู่ทั้งหมดเก็บไว้',
    importBackupLabel: 'นำเข้าข้อมูลสำรอง',
    importBackupNote: 'กู้คืนข้อมูลจากไฟล์ JSON ที่สำรองไว้',
    clearAllData: 'ล้างข้อมูลรายการในแอป',
    clearAllDataDesc: 'ลบรายการบันทึกในแอป แต่ไม่แตะต้องรูปถ่ายในเครื่อง',
    resetApp: 'รีเซ็ตการตั้งค่าทั้งหมด',
    aboutApp: 'เกี่ยวกับ SlipSense',
    aboutDescription: 'SlipSense คือแอปบันทึกรายจ่ายส่วนบุคคลแบบ On-Device ที่รองรับการสแกนสลิปธนาคารและใบเสร็จสากลจากทั่วโลก',

    // Install Banner
    installTitle: 'ติดตั้ง SlipSense สำหรับ Android (.apk)',
    installDesc: 'ติดตั้งเพื่อเปิดใช้ระบบสแกนสลิปอัตโนมัติในเครื่องทันที',
    downloadApk: 'โหลด APK',

    // Statuses
    savedSuccessfully: 'บันทึกข้อมูลเรียบร้อยแล้ว',
    deletedSuccessfully: 'ลบรายการเรียบร้อยแล้ว',
    backupImported: 'นำเข้าข้อมูลสำรองเรียบร้อยแล้ว',
    invalidBackupFile: 'ไฟล์ข้อมูลสำรองไม่ถูกต้อง',
  },

  zh: {
    // Brand
    brandName: 'SlipSense',
    brandTagline: '纯本地隐私账本与票据识别',
    noTrackBadge: '无追踪',
    versionBadge: 'v2.2.0',
    appSubtitle: '全球票据识别 • 100% 离线运行',

    // Nav
    tabHome: '概览',
    tabAnalytics: '分析',
    tabBudgets: '预算',
    tabHistory: '明细',
    tabSettings: '设置',

    // Months
    months: [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'
    ],
    prevMonth: '上个月',
    nextMonth: '下个月',
    currentMonthTip: '点击返回当前月份',

    // Overview & Summary
    totalExpenses: '本月支出',
    dailyAverage: '日均消费',
    dayStreak: '连续记账',
    totalRecords: '笔交易',
    noTransactionsYet: '本月暂无记账明细',
    recentTransactions: '最近明细',
    viewAll: '查看全部',
    today: '今天',
    yesterday: '昨天',
    daysCount: '天',

    // Mascot Widget
    mascotName: '小羊皮格米',
    hungerBar: '饱食度',
    streakDays: '天连续',
    feedMascot: '投喂票据',
    mascotFull: '已吃饱',
    mascotHungry: '快投喂票据',
    mascotTip: '坚持每日记账，养成良好财务习惯。',

    // Quick Actions
    autoScanGallery: '相册识别',
    autoScanDesc: '扫描本地相册中的转账及收据',
    pickFolder: '选择相册',
    manualAdd: '手动记账',
    quickScanTip: '支持全球银行转账单、支付宝、微信与各类收据',

    // Scan & Review Modal
    reviewTitle: '核对识别票据',
    reviewSubtitle: '确认金额与收付款方后保存入账',
    saveSelected: '保存已确认票据',
    cancel: '取消',
    save: '保存',
    duplicateWarning: '已存在相同交易记录',
    fieldAmount: '金额',
    fieldCurrency: '币种',
    fieldDate: '日期',
    fieldTime: '时间',
    fieldBank: '支付方式 / 机构',
    fieldCategory: '支出类别',
    fieldPayee: '收款方 / 商户',
    fieldSender: '付款方',
    fieldRef: '交易单号',
    autoDetected: '自动识别',
    noSlipsFound: '未在该批次中发现有效票据',
    scanningTitle: '正在识别设备图片',
    scanningProgress: '已扫描 {scanned} / {total} 张图片...',

    // Manual Add Modal
    manualAddTitle: '手动添加支出',
    amountPlaceholder: '0.00',
    notePlaceholder: '备注说明（可选）',
    selectCategory: '选择类别',
    selectBank: '选择支付方式',

    // Details Modal
    detailTitle: '交易明细',
    editTransaction: '编辑交易',
    deleteTransaction: '删除记录',
    deleteConfirm: '确定要删除这条交易记录吗？',
    close: '关闭',

    // Analytics View
    analyticsTitle: '支出图表与洞察',
    dailySpendingTrend: '每日支出趋势',
    categoryDistribution: '分类支出占比',
    bankDistribution: '支付渠道分布',
    topMerchants: '支出最高商户前十',
    highestSpendingDay: '单日最高支出',
    noDataForMonth: '本月尚无支出数据',

    // Budgets View
    budgetsTitle: '月度预算管理',
    totalMonthlyBudget: '月度总预算',
    budgetUsed: '已用预算',
    budgetRemaining: '剩余预算',
    setBudgetPrompt: '设置月度支出上限',
    categoryLimits: '分类预算明细',
    overBudgetWarning: '已超出预算',

    // History View
    historyTitle: '所有明细记录',
    searchPlaceholder: '搜索商户、渠道或单号...',
    filterAll: '全部',
    exportCsvButton: '导出 CSV',
    itemsCount: '笔明细',
    noMatchingRecords: '未找到符合条件的交易',

    // Settings View
    settingsTitle: '系统设置与隐私',
    languageSection: '界面语言 (Language)',
    languageDesc: '切换 SlipSense 的显示语言',
    currencySection: '展示货币',
    currencyDesc: '选择主界面统计所使用的默认货币',
    autoDetectCurrency: '自动（随单据）',
    privacyHeading: '100% 本地端离线隐私',
    privacySubheading: '所有识别算法与数据完全在您的本地设备运行',
    privacyBody: 'SlipSense 使用端侧 OCR 本地解析图片，绝不会向任何第三方云端传输您的照片、金额或财务隐私。',
    badgeOffline: '🔒 100% 离线',
    badgeOfflineDesc: '无网络状态正常可用',
    badgeNoCloud: '🚫 无云端',
    badgeNoCloudDesc: '没有中心数据库',
    badgeSafeGallery: '🛡️ 保护相册',
    badgeSafeGalleryDesc: '绝不修改或删除您相册的原图',
    autoScanStartup: '启动时自动检测相册',
    autoScanStartupDesc: '打开应用时自动检索新拍票据',
    dataManagement: '数据管理与备份',
    exportCsvLabel: '导出 CSV 文件',
    exportCsvNote: '带 BOM 的 UTF-8 编码，可直接在 Excel 和 Sheets 打开',
    exportBackupLabel: '导出 JSON 备份',
    exportBackupNote: '备份全部账目数据与商户分类规则',
    importBackupLabel: '导入 JSON 备份',
    importBackupNote: '从之前的备份文件中恢复全部记录',
    clearAllData: '清空应用账目数据',
    clearAllDataDesc: '仅清空应用内部数据，不影响设备原图',
    resetApp: '重置所有设置',
    aboutApp: '关于 SlipSense',
    aboutDescription: 'SlipSense 是一款隐私至上的端侧智能账本，支持全球多国银行转账单与发票收据识别。',

    // Install Banner
    installTitle: '安装 SlipSense Android 原生版 (.apk)',
    installDesc: '安装原生应用以启用更快速的端侧相册扫描功能。',
    downloadApk: '下载 APK',

    // Statuses
    savedSuccessfully: '保存成功',
    deletedSuccessfully: '删除成功',
    backupImported: '备份已恢复成功',
    invalidBackupFile: '无效的备份文件',
  },

  ja: {
    // Brand
    brandName: 'SlipSense',
    brandTagline: '完全オフライン・端末完結型スマート家計簿',
    noTrackBadge: '追跡なし',
    versionBadge: 'v2.2.0',
    appSubtitle: '世界各国の明細読取 • 100% オフライン稼働',

    // Nav
    tabHome: 'ホーム',
    tabAnalytics: '分析',
    tabBudgets: '予算',
    tabHistory: '履歴',
    tabSettings: '設定',

    // Months
    months: [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ],
    prevMonth: '前月',
    nextMonth: '翌月',
    currentMonthTip: 'タップして今月に戻る',

    // Overview & Summary
    totalExpenses: '今月の支出合計',
    dailyAverage: '1日平均',
    dayStreak: '連続記録',
    totalRecords: '件数',
    noTransactionsYet: '今月の支出はまだありません',
    recentTransactions: '最近の取引',
    viewAll: 'すべて表示',
    today: '今日',
    yesterday: '昨日',
    daysCount: '日',

    // Mascot Widget
    mascotName: 'ピグミーヤギ',
    hungerBar: '満腹度',
    streakDays: '日連続',
    feedMascot: 'レシートをあげる',
    mascotFull: '満腹',
    mascotHungry: 'レシート募集中',
    mascotTip: '毎日の支出を記録して、健全なお金の使い方を身につけましょう。',

    // Quick Actions
    autoScanGallery: 'アルバム一括読取',
    autoScanDesc: '端末内の振込票やレシートを検出',
    pickFolder: 'フォルダ選択',
    manualAdd: '手入力',
    quickScanTip: '世界各国の銀行振込票や電子決済レシートに対応',

    // Scan & Review Modal
    reviewTitle: '検出明細の確認',
    reviewSubtitle: '保存する前に金額や受取先を確認してください',
    saveSelected: '確認した明細を保存',
    cancel: 'キャンセル',
    save: '保存',
    duplicateWarning: '重複する取引が検出されました',
    fieldAmount: '金額',
    fieldCurrency: '通貨',
    fieldDate: '日付',
    fieldTime: '時間',
    fieldBank: '決済手段 / 金融機関',
    fieldCategory: 'カテゴリ',
    fieldPayee: '受取人 / 店舗名',
    fieldSender: 'ご依頼人',
    fieldRef: '取引照会番号',
    autoDetected: '自動検出',
    noSlipsFound: '対象となる明細が見つかりませんでした',
    scanningTitle: '画像を解析中',
    scanningProgress: '{total}枚中 {scanned}枚 解析完了...',

    // Manual Add Modal
    manualAddTitle: '取引の手入力',
    amountPlaceholder: '0.00',
    notePlaceholder: 'メモ（任意）',
    selectCategory: 'カテゴリを選択',
    selectBank: '決済方法を選択',

    // Details Modal
    detailTitle: '取引の詳細',
    editTransaction: '取引を編集',
    deleteTransaction: '取引を削除',
    deleteConfirm: 'この取引を削除してもよろしいですか？',
    close: '閉じる',

    // Analytics View
    analyticsTitle: '支出の分析と傾向',
    dailySpendingTrend: '日別支出推移',
    categoryDistribution: 'カテゴリ別内訳',
    bankDistribution: '決済手段・銀行別内訳',
    topMerchants: '支出上位の店舗・受取先',
    highestSpendingDay: '最高支出日',
    noDataForMonth: 'この月のデータはありません',

    // Budgets View
    budgetsTitle: '月間予算の管理',
    totalMonthlyBudget: '月間総予算',
    budgetUsed: '支出済',
    budgetRemaining: '残り予算',
    setBudgetPrompt: '月間支出限度額を設定',
    categoryLimits: 'カテゴリ別予算',
    overBudgetWarning: '予算超過',

    // History View
    historyTitle: '取引履歴一覧',
    searchPlaceholder: '受取先、金融機関、番号で検索...',
    filterAll: 'すべて',
    exportCsvButton: 'CSV出力',
    itemsCount: '件',
    noMatchingRecords: '該当する取引はありません',

    // Settings View
    settingsTitle: '設定とプライバシー',
    languageSection: '表示言語 (Language)',
    languageDesc: 'アプリの言語を選択します',
    currencySection: '表示通貨',
    currencyDesc: 'ダッシュボードの表示通貨を設定します',
    autoDetectCurrency: '自動（明細に基づく）',
    privacyHeading: '100% 端末内プライバシー保護',
    privacySubheading: 'すべての画像解析とデータ保存はお使いの端末内でのみ実行されます',
    privacyBody: 'SlipSenseは完全ローカルのOCRエンジンを使用し、写真や金額、取引相手の情報が外部サーバーへ送信されることは一切ありません。',
    badgeOffline: '🔒 100% オフライン',
    badgeOfflineDesc: '通信なしで安心動作',
    badgeNoCloud: '🚫 クラウド不要',
    badgeNoCloudDesc: '外部DBへの保存なし',
    badgeSafeGallery: '🛡️ 写真の保護',
    badgeSafeGalleryDesc: '端末内の元画像を加工・削除しません',
    autoScanStartup: '起動時の自動スキャン',
    autoScanStartupDesc: 'アプリ起動時に端末内の新しい明細を自動検出',
    dataManagement: 'データ管理とバックアップ',
    exportCsvLabel: 'CSVファイルの書き出し',
    exportCsvNote: 'ExcelやGoogleスプレッドシートで文字化けしないUTF-8 BOM形式',
    exportBackupLabel: 'JSONバックアップの保存',
    exportBackupNote: '全取引データと仕分けルールを一括保存',
    importBackupLabel: 'バックアップの復元',
    importBackupNote: '保存済みJSONファイルからデータを復元',
    clearAllData: 'アプリ内データの消去',
    clearAllDataDesc: '記録のみを消去し、端末の写真には影響しません',
    resetApp: 'すべての設定をリセット',
    aboutApp: 'SlipSense について',
    aboutDescription: 'SlipSenseは、世界中の振込票やレシートを完全ローカルで安全に管理できるプライバシー重視の家計簿アプリです。',

    // Install Banner
    installTitle: 'SlipSense Android版 (.apk) のインストール',
    installDesc: 'より高速なローカル画像スキャンが利用できます。',
    downloadApk: 'APKをダウンロード',

    // Statuses
    savedSuccessfully: '保存しました',
    deletedSuccessfully: '削除しました',
    backupImported: 'バックアップを復元しました',
    invalidBackupFile: '無効なバックアップファイルです',
  },

  es: {
    // Brand
    brandName: 'SlipSense',
    brandTagline: 'Gestor de Gastos Privado en el Dispositivo',
    noTrackBadge: 'Sin Rastreo',
    versionBadge: 'v2.2.0',
    appSubtitle: 'Escáner Global de Recibos • 100% Fuera de Línea',

    // Nav
    tabHome: 'Inicio',
    tabAnalytics: 'Análisis',
    tabBudgets: 'Presupuestos',
    tabHistory: 'Historial',
    tabSettings: 'Ajustes',

    // Months
    months: [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ],
    prevMonth: 'Mes anterior',
    nextMonth: 'Mes siguiente',
    currentMonthTip: 'Toca para volver al mes actual',

    // Overview & Summary
    totalExpenses: 'Gastos Totales',
    dailyAverage: 'Promedio Diario',
    dayStreak: 'Racha de Registro',
    totalRecords: 'Registros',
    noTransactionsYet: 'No hay gastos registrados este mes',
    recentTransactions: 'Movimientos Recientes',
    viewAll: 'Ver todos',
    today: 'Hoy',
    yesterday: 'Ayer',
    daysCount: 'días',

    // Mascot Widget
    mascotName: 'Mascota Pigmea',
    hungerBar: 'Nivel de Apetito',
    streakDays: 'días seguidos',
    feedMascot: 'Alimentar Recibo',
    mascotFull: 'Bien Alimentado',
    mascotHungry: 'Requiere Recibos',
    mascotTip: 'Registra tus gastos diarios para mantener finanzas saludables.',

    // Quick Actions
    autoScanGallery: 'Escanear Galería',
    autoScanDesc: 'Detectar comprobantes en las carpetas del móvil',
    pickFolder: 'Elegir Carpeta',
    manualAdd: 'Añadir Manual',
    quickScanTip: 'Compatible con recibos y transferencias bancarias de todo el mundo',

    // Scan & Review Modal
    reviewTitle: 'Revisar Comprobantes',
    reviewSubtitle: 'Verifica los detalles antes de guardarlos',
    saveSelected: 'Guardar Comprobantes Confirmados',
    cancel: 'Cancelar',
    save: 'Guardar',
    duplicateWarning: 'Comprobante duplicado detectado',
    fieldAmount: 'Monto',
    fieldCurrency: 'Moneda',
    fieldDate: 'Fecha',
    fieldTime: 'Hora',
    fieldBank: 'Banco / Plataforma',
    fieldCategory: 'Categoría',
    fieldPayee: 'Destinatario / Comercio',
    fieldSender: 'Remitente',
    fieldRef: 'No. de Referencia',
    autoDetected: 'Detectado automáticamente',
    noSlipsFound: 'No se encontraron comprobantes válidos en este lote',
    scanningTitle: 'Escaneando Imágenes del Dispositivo',
    scanningProgress: 'Analizadas {scanned} de {total} imágenes...',

    // Manual Add Modal
    manualAddTitle: 'Añadir Transacción',
    amountPlaceholder: '0.00',
    notePlaceholder: 'Nota o concepto (opcional)',
    selectCategory: 'Seleccionar Categoría',
    selectBank: 'Seleccionar Medio de Pago',

    // Details Modal
    detailTitle: 'Detalle de la Transacción',
    editTransaction: 'Editar Transacción',
    deleteTransaction: 'Eliminar Transacción',
    deleteConfirm: '¿Estás seguro de que deseas eliminar esta transacción?',
    close: 'Cerrar',

    // Analytics View
    analyticsTitle: 'Estadísticas y Análisis',
    dailySpendingTrend: 'Tendencia de Gasto Diario',
    categoryDistribution: 'Distribución por Categorías',
    bankDistribution: 'Medios de Pago y Bancos',
    topMerchants: 'Comercios con Mayor Gasto',
    highestSpendingDay: 'Día con Mayor Gasto',
    noDataForMonth: 'Sin datos registrados para este mes',

    // Budgets View
    budgetsTitle: 'Presupuestos Mensuales',
    totalMonthlyBudget: 'Presupuesto Total Mensual',
    budgetUsed: 'Gastado',
    budgetRemaining: 'Restante',
    setBudgetPrompt: 'Fijar Límite de Gasto Mensual',
    categoryLimits: 'Asignaciones por Categoría',
    overBudgetWarning: 'Excedido por',

    // History View
    historyTitle: 'Historial de Transacciones',
    searchPlaceholder: 'Buscar por comercio, banco o referencia...',
    filterAll: 'Todos',
    exportCsvButton: 'Exportar CSV',
    itemsCount: 'movimientos',
    noMatchingRecords: 'No se encontraron transacciones coincidentes',

    // Settings View
    settingsTitle: 'Configuración y Privacidad',
    languageSection: 'Idioma de la Aplicación',
    languageDesc: 'Selecciona tu idioma preferido',
    currencySection: 'Moneda Predeterminada',
    currencyDesc: 'Formato de moneda en las estadísticas',
    autoDetectCurrency: 'Automático (según comprobante)',
    privacyHeading: '100% Privacidad en tu Dispositivo',
    privacySubheading: 'Todo el procesamiento y almacenamiento permanecen exclusivamente en tu móvil.',
    privacyBody: 'SlipSense analiza los comprobantes usando OCR local. Ninguna fotografía, importe o dato financiero sale jamás de tu teléfono.',
    badgeOffline: '🔒 100% Fuera de Línea',
    badgeOfflineDesc: 'Funciona sin conexión a internet',
    badgeNoCloud: '🚫 Cero Nube',
    badgeNoCloudDesc: 'Sin servidores ni bases de datos externas',
    badgeSafeGallery: '🛡️ Galería Protegida',
    badgeSafeGalleryDesc: 'Tus fotos originales nunca se modifican ni se eliminan',
    autoScanStartup: 'Escanear al Iniciar la App',
    autoScanStartupDesc: 'Verifica nuevas fotos al abrir la aplicación',
    dataManagement: 'Gestión y Copias de Seguridad',
    exportCsvLabel: 'Exportar Archivo CSV',
    exportCsvNote: 'Codificado en UTF-8 con BOM para Excel y Google Sheets',
    exportBackupLabel: 'Exportar Copia de Seguridad JSON',
    exportBackupNote: 'Guarda todas las transacciones y reglas de categorización',
    importBackupLabel: 'Restaurar Copia de Seguridad',
    importBackupNote: 'Restaura datos desde un archivo JSON previamente guardado',
    clearAllData: 'Borrar Datos de la App',
    clearAllDataDesc: 'Elimina las transacciones sin alterar las fotos de tu teléfono',
    resetApp: 'Restablecer Ajustes',
    aboutApp: 'Acerca de SlipSense',
    aboutDescription: 'SlipSense es una aplicación inteligente y privada para el control de gastos personales con reconocimiento mundial de recibos.',

    // Install Banner
    installTitle: 'Instalar SlipSense para Android (.apk)',
    installDesc: 'Instala la versión nativa para habilitar el escaneo automático en segundo plano.',
    downloadApk: 'Descargar APK',

    // Statuses
    savedSuccessfully: 'Guardado correctamente',
    deletedSuccessfully: 'Eliminado correctamente',
    backupImported: 'Copia de seguridad restaurada con éxito',
    invalidBackupFile: 'Archivo de copia de seguridad no válido',
  }
};
