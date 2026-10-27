import test from 'node:test';
import assert from 'node:assert/strict';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadUiModule } from './load-ui-module.mjs';
import { contractFixture } from './contract-print-fixture.mjs';

const { calculateReturnSettlement: calculate } = loadUiModule('lib/return-settlement.ts');
const base = { deposit: 10000, dailyRate: 1000, hasDelay: false, lateNoticeGiven: true, lateHours: 1, cleanlinessFee: 0, hasDamages: false, damageFee: 0 };
test('return settlement preserves hourly penalties, daily penalties, cleaning and damage deductions', () => {
  assert.equal(calculate(base).netRefundableDeposit, 10000);
  const withNotice = calculate({ ...base, hasDelay: true, lateHours: 3, cleanlinessFee: 250, hasDamages: true, damageFee: 500 });
  assert.equal(withNotice.penaltyFee, 600); assert.equal(withNotice.totalDeductions, 1350); assert.equal(withNotice.netRefundableDeposit, 8650);
  const noNotice = calculate({ ...base, hasDelay: true, lateNoticeGiven: false, lateHours: 3 });
  assert.equal(noNotice.penaltyFee, 1000);
  const extra = calculate({ ...base, deposit: 100, hasDamages: true, damageFee: 500 });
  assert.equal(extra.netRefundableDeposit, 0); assert.equal(extra.clientOwesExtra, 400);
  assert.equal(calculate({ ...base, damageFee: 500 }).actualDamageFee, 0);
  assert.equal(calculate({ ...base, hasDamages: true, damageFee: -50 }).actualDamageFee, 0);
});
test('return inspection retains all existing services and exposes save errors inside the dialog', () => {
  const Form = loadUiModule('components/admin/modals/ReturnCarModal.tsx').default;
  const props = { booking: contractFixture, onClose() {}, onSubmit() {}, returnKmInput: '12300', setReturnKmInput() {}, operationError: 'TEST-SAVE-ERROR' };
  const html = renderToStaticMarkup(React.createElement(Form, props));
  for (const label of ['قراءة العداد', 'المواعيد والتأخير', 'غسيل عميق', 'يوجد أضرار', 'تقييم العميل', 'قائمة سوداء', 'ملاحظات الموظف', 'اعتماد الاستلام وإغلاق العقد']) assert.ok(html.includes(label), label);
  assert.match(html, /role="alert">TEST-SAVE-ERROR/); assert.match(html, /٣٠٠ كم/); assert.match(html, /١٠٬٠٠٠/);
  assert.equal(renderToStaticMarkup(React.createElement(Form, { ...props, booking: null })), '');
});
test('print document retains customer, vehicle, sums, all four terms, notes and company contact', () => {
  const { default: Document, RENTAL_TERMS } = loadUiModule('components/admin/contracts/RentalContractDocument.tsx');
  const html = renderToStaticMarkup(React.createElement(Document, { booking: contractFixture }));
  for (const value of ['TEST-2026-A4', 'PASSPORT-TEST-2026', 'LICENSE-TEST-2026', 'Toyota Camry 2026', '01117461373', '٢٬٨٥٠', '١٠٬٠٠٠', contractFixture.notes]) assert.ok(html.includes(value), value);
  assert.equal(RENTAL_TERMS.length, 4); for (const term of RENTAL_TERMS) assert.ok(html.includes(term));
  assert.match(html, /توقيع المستأجر/); assert.match(html, /توقيع وختم الشركة/);
  assert.doesNotMatch(html, /01000000001|class="admin-/);
});
test('notes are escaped and the contract view keeps an explicit A4 preview and print action', () => {
  const Document = loadUiModule('components/admin/contracts/RentalContractDocument.tsx').default;
  const html = renderToStaticMarkup(React.createElement(Document, { booking: { ...contractFixture, notes: '<script>NOT-EXECUTABLE</script>' } }));
  assert.match(html, /&lt;script&gt;NOT-EXECUTABLE/); assert.doesNotMatch(html, /<script>/);
  const View = loadUiModule('components/admin/RentalContractModal.tsx').default;
  const view = renderToStaticMarkup(React.createElement(View, { booking: contractFixture, onClose() {} }));
  assert.match(view, /معاينة العقد A4/); assert.match(view, /طباعة العقد/); assert.match(view, /تفاصيل الحجز/);
});
