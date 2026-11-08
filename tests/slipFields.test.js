import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTextToSlipFields as parse, isDuplicateSlip, canImportSlip, parseSlipVerifyQR } from '../src/utils/slipFields.js';

for (const [name, text, expected] of [
  ['fee before transfer', 'ค่าธรรมเนียม 10.00 บาท\nจำนวนเงิน 1,250.75 บาท', 1250.75],
  ['label on separate line', 'Amount\n2,569.00\nFee 10.00', 2569],
  ['Thai digits', 'จำนวนเงิน ๑๒๓.๔๕ บาท', 123.45],
  ['small transfer', 'Amount 0.50 THB', 0.5],
  ['integer amount', 'จำนวนเงิน 250 บาท', 250],
  ['date and time only', '08.11.2026\n12.45 น.\nRef 20261108123456', null],
  ['account only', 'Account 1234567890\nค่าธรรมเนียม 10.00', null],
  ['conflicting amounts', 'Amount 100.00\nAmount 200.00', null],
  ['repeated amount', 'Amount 100.00\nAmount 100.00', 100],
  ['year is a valid monetary value', 'Amount 2026.00', 2026],
  ['fee label then amount', 'Fee\n10.00\nAmount\n250.00', 250],
]) test(name, () => assert.equal(parse(text).amount, expected));

test('Thai date, names, reference and brand', () => {
  const fields = parse('MAKE by KBank\n8 พ.ย. 2569 09:35\nผู้รับเงิน: ร้านกาแฟ\nจาก: คุณสมชาย\nจำนวนเงิน 75.00\nเลขที่อ้างอิง: ABCD1234567890');
  assert.equal(fields.date, '2026-11-08');
  assert.equal(fields.time, '09:35');
  assert.equal(fields.payee, 'ร้านกาแฟ');
  assert.equal(fields.sender, 'คุณสมชาย');
  assert.equal(fields.refCode, 'ABCD1234567890');
  assert.equal(fields.bankId, 'MAKE');
});
test('invalid calendar dates and hours stay missing', () => {
  assert.equal(parse('31/02/2569').date, null);
  assert.equal(parse('29/02/2567').date, '2024-02-29');
  assert.equal(parse('29:45').time, null);
  assert.equal(parse('2026-11-08').date, '2026-11-08');
});
test('bank scoped references and conservative fallback duplicates', () => {
  const a = { bankId: 'KBANK', ref: 'ABC123456789', amount: 10, date: '2026-11-08', time: '12:00', payee: 'Cafe' };
  assert.equal(isDuplicateSlip(a, [{ ...a }]), true);
  assert.equal(isDuplicateSlip(a, [{ ...a, bankId: 'SCB' }]), false);
  assert.equal(isDuplicateSlip(a, [{ ...a, ref: 'DIFFERENT123' }]), false);
  assert.equal(isDuplicateSlip({ ...a, ref: '' }, [{ ...a, ref: '', payee: 'Other shop' }]), false);
  assert.equal(isDuplicateSlip({ ...a, ref: '' }, [{ ...a, ref: '', payee: ' cafe ' }]), true);
});
test('incomplete data cannot be imported', () => {
  const item = { bankId: 'KBANK', amount: 20, date: '2026-11-08', time: '12:00', payee: 'Cafe' };
  assert.equal(canImportSlip(item), true);
  for (const field of ['amount', 'date', 'time', 'payee']) assert.equal(canImportSlip({ ...item, [field]: '' }), false);
  assert.equal(canImportSlip({ ...item, amount: Infinity }), false);
});
test('QR lengths and nesting are parsed structurally', () => {
  const tlv = (tag, value) => tag + String(value.length).padStart(2, '0') + value;
  const flat = tlv('01', '004') + tlv('02', 'ABC010300612345');
  assert.equal(parseSlipVerifyQR(flat).transRef, 'ABC010300612345');
  assert.equal(parseSlipVerifyQR(tlv('00', tlv('00', '01') + flat)).bankCode, 'KBANK');
  assert.equal(parseSlipVerifyQR(flat.slice(0, -1)), null);
  assert.equal(parseSlipVerifyQR('https://example.com/01030040212ABC123456789'), null);
  assert.equal(parseSlipVerifyQR(tlv('01', '004') + tlv('54', '100.00')), null);
});

test('English month and standalone recipient label', () => {
  const fields = parse('8 Nov 2026 14:05\nผู้รับ\nร้านกาแฟ\nAmount 20.00');
  assert.equal(fields.date, '2026-11-08');
  assert.equal(fields.payee, 'ร้านกาแฟ');
  assert.equal(parse('Fee\n10.00').amount, null);
});

test('bank must be identified before importing a transfer', () => {
  const item = { amount: 20, date: '2026-11-08', time: '12:00', payee: 'Cafe' };
  for (const bankId of ['', 'OTHER', 'CASH', 'missing']) assert.equal(canImportSlip({ ...item, bankId }), false);
  assert.equal(canImportSlip({ ...item, bankId: 'GSB' }), true);
});
test('whole-baht shorthand and fullwidth digits', () => {
  assert.equal(parse('จำนวนเงิน 125.- บาท').amount, 125);
  assert.equal(parse('Amount １２５.５０ THB').amount, 125.5);
});
