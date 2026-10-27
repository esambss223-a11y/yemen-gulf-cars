import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
function load(path) {
  const exports = {};
  const source = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, Date, Intl, require(name) {
    if (name.endsWith('.css')) return {};
    if (name === 'next/image') return { __esModule: true, default: ({ src, alt }) => React.createElement('img', { src, alt }) };
    if (name === './FleetDialog') return load('components/admin/modals/FleetDialog.tsx');
    if (name === './booking-form/BookingSummary') return load('components/admin/modals/booking-form/BookingSummary.tsx');
    return require(name);
  } });
  return exports;
}
const Form = load('components/admin/modals/AddBookingModal.tsx').default;
const car = { id: 'car-a', make: 'Test', model: 'Car', plateNumber: 'FAKE', status: 'available', dailyPriceEGP: 1000, securityDepositEGP: 10000, coverImage: '/fake.jpg', year: 2026 };
const draft = { carId: car.id, customerName: '', customerPhone: '', nationalId: '', licenseNumber: '', nationality: 'مصري', startDate: '2026-10-27', endDate: '2026-10-30', startTime: '14:00', endTime: '14:00', discountCode: 'FAKE', promoDiscountEGP: 100, loyaltyDiscountEGP: 50, loyaltyPointsRedeemed: 50, notes: '' };
const props = { isOpen: true, onClose() {}, onSubmit() {}, setNewBooking() {}, cars: [car], customers: [], coupons: [], newBooking: draft };
test('the redesigned summary preserves rental and discount totals while keeping the deposit separate', () => {
  const html = renderToStaticMarkup(React.createElement(Form, props));
  assert.match(html, /٣٬٠٠٠/); assert.match(html, /٢٬٨٥٠/); assert.match(html, /١٠٬٠٠٠/);
  assert.match(html, /التأمين المسترد منفصل عن صافي الإيجار/);
  for (const label of ['اسم العميل بالكامل', 'الجنسية', 'رقم الهاتف', 'جواز السفر', 'رخصة القيادة', 'تاريخ الاستلام', 'وقت الاستلام', 'تاريخ الإرجاع', 'وقت الإرجاع', 'ملاحظات التسليم']) assert.ok(html.includes(label));
});
test('customer matching, loyalty controls and valid coupons remain available; archived cars stay excluded', () => {
  const html = renderToStaticMarkup(React.createElement(Form, { ...props,
    cars: [car, { ...car, id: 'archived', status: 'archived', model: 'SHOULD-NOT-BE-OFFERED' }],
    newBooking: { ...draft, customerPhone: '00001111' },
    customers: [{ id: 'fake-customer', fullName: 'Fake existing customer', phone: '00001111', nationalId: 'FAKE-ID', licenseNumber: 'FAKE-LIC', loyaltyPoints: 80, tier: 'vip_gold' }],
    coupons: [{ code: 'VALID-COUPON', active: true, usedCount: 0, maxUsage: 5, discountValue: 5, discountType: 'percentage' }, { code: 'EXHAUSTED-COUPON', active: true, usedCount: 5, maxUsage: 5 }],
  }));
  assert.match(html, /Fake existing customer/); assert.match(html, /تعبئة بيانات العميل المسجلة/); assert.match(html, /تطبيق خصم نقاط الولاء/);
  assert.match(html, /VALID-COUPON/); assert.doesNotMatch(html, /EXHAUSTED-COUPON|SHOULD-NOT-BE-OFFERED/);
});
test('save errors are visible in the dialog without dismissing or discarding the draft', () => {
  const html = renderToStaticMarkup(React.createElement(Form, { ...props, operationError: 'TEST DATABASE ERROR', newBooking: { ...draft, notes: 'Draft handover notes' } }));
  assert.match(html, /role="alert">TEST DATABASE ERROR/); assert.match(html, /Draft handover notes/);
  assert.match(html, /aria-labelledby="new-booking-title"/);
  assert.match(html, /تأكيد الحجز والتسليم/);
  assert.equal(renderToStaticMarkup(React.createElement(Form, { ...props, isOpen: false })), '');
});
