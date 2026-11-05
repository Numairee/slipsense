// UTF-8 BOM CSV Exporter for Pygmy
// Opens flawlessly in Microsoft Excel, Google Sheets, Numbers, and AI tools without Thai font mojibake

import { getBankById } from '../data/banks';
import { getCategoryById } from '../data/defaultCategories';

export function exportTransactionsToCSV(transactions, categories) {
  const headers = [
    'วันที่',
    'เวลา',
    'ธนาคาร',
    'ร้านค้า / ผู้รับเงิน',
    'ผู้โอน',
    'หมวดหมู่',
    'จำนวนเงิน (บาท)',
    'บันทึกช่วยจำ',
    'รหัสอ้างอิง (Ref)'
  ];

  const escapeCSV = (str) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = transactions.map(tx => {
    const bank = getBankById(tx.bankId);
    const category = getCategoryById(categories, tx.categoryId);
    return [
      escapeCSV(tx.date || ''),
      escapeCSV(tx.time || ''),
      escapeCSV(bank ? bank.fullName : tx.bankId),
      escapeCSV(tx.payee || ''),
      escapeCSV(tx.sender || ''),
      escapeCSV(category ? category.name : tx.categoryId),
      Number(tx.amount || 0).toFixed(2),
      escapeCSV(tx.note || ''),
      escapeCSV(tx.ref || '')
    ].join(',');
  });

  // Prepend UTF-8 Byte Order Mark (BOM) \uFEFF so Excel displays Thai correctly
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date();
  const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', `Pygmy_Expenses_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
