import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTextToSlipFields as parse, canImportSlip } from '../src/utils/slipFields.js';

test('Global slip: PayPal transfer in USD', () => {
  const text = `
PayPal
Nov 10, 2026 14:35
You sent a payment
To: Coffee Roasters Inc
Amount: $45.50 USD
Fee: $0.00
Transaction ID: 8XY1234567890123
  `;
  const res = parse(text);
  assert.equal(res.amount, 45.50);
  assert.equal(res.currency, 'USD');
  assert.equal(res.date, '2026-11-10');
  assert.equal(res.time, '14:35');
  assert.equal(res.payee, 'Coffee Roasters Inc');
  assert.equal(res.refCode, '8XY1234567890123');
  assert.equal(res.bankId, 'PAYPAL');
  assert.equal(canImportSlip(res), true);
});

test('Global slip: Wise transfer in EUR', () => {
  const text = `
Wise
10 Nov 2026 09:15
Transfer sent
Recipient: John Doe
Amount: 120.00 EUR
Fee: 1.50 EUR
Ref: WISE987654321
  `;
  const res = parse(text);
  assert.equal(res.amount, 120);
  assert.equal(res.currency, 'EUR');
  assert.equal(res.date, '2026-11-10');
  assert.equal(res.time, '09:15');
  assert.equal(res.payee, 'John Doe');
  assert.equal(res.refCode, 'WISE987654321');
  assert.equal(res.bankId, 'WISE');
  assert.equal(canImportSlip(res), true);
});

test('Global slip: Revolut transfer in GBP with 12h time', () => {
  const text = `
Revolut
08 Nov 2026 02:45 PM
To: Sarah Jenkins
Total: £85.20
Reference: REV-20261108-994
  `;
  const res = parse(text);
  assert.equal(res.amount, 85.20);
  assert.equal(res.currency, 'GBP');
  assert.equal(res.date, '2026-11-08');
  assert.equal(res.time, '14:45');
  assert.equal(res.payee, 'Sarah Jenkins');
  assert.equal(res.refCode, 'REV-20261108-994');
  assert.equal(res.bankId, 'REVOLUT');
  assert.equal(canImportSlip(res), true);
});

test('Global slip: Chinese Alipay receipt in CNY', () => {
  const text = `
Alipay
2026年11月09日 18:20
商户: 喜茶
实付款: 28.00 元
交易单号: 2026110922001456789
  `;
  const res = parse(text);
  assert.equal(res.amount, 28);
  assert.equal(res.currency, 'CNY');
  assert.equal(res.date, '2026-11-09');
  assert.equal(res.time, '18:20');
  assert.equal(res.payee, '喜茶');
  assert.equal(res.refCode, '2026110922001456789');
  assert.equal(res.bankId, 'ALIPAY');
  assert.equal(canImportSlip(res), true);
});

test('Global slip: Spanish bank receipt (Santander)', () => {
  const text = `
Santander
10 nov 2026 11:30
Destinatario: Mercado Central
Importe: 64.90 €
Comisión: 0.00 €
Referencia: SANTA-987654321
  `;
  const res = parse(text);
  assert.equal(res.amount, 64.90);
  assert.equal(res.currency, 'EUR');
  assert.equal(res.date, '2026-11-10');
  assert.equal(res.time, '11:30');
  assert.equal(res.payee, 'Mercado Central');
  assert.equal(res.bankId, 'SANTANDER');
  assert.equal(canImportSlip(res), true);
});

test('Global slip: Generic POS Payment Receipt in USD', () => {
  const text = `
Payment Receipt
Date: 2026-11-10
Time: 12:45
Merchant: Tokyo Supermarket
Grand Total: $142.75
Receipt #: REC-20261110-0012
  `;
  const res = parse(text);
  assert.equal(res.amount, 142.75);
  assert.equal(res.currency, 'USD');
  assert.equal(res.date, '2026-11-10');
  assert.equal(res.time, '12:45');
  assert.equal(res.payee, 'Tokyo Supermarket');
  assert.equal(res.refCode, 'REC-20261110-0012');
  assert.equal(res.bankId, 'GLOBAL_RECEIPT');
  assert.equal(canImportSlip(res), true);
});
