import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadUiModule } from './load-ui-module.mjs';
const require = createRequire(import.meta.url);
function load(path) {
  const exports = {};
  const source = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, Date, Intl, require(name) {
    if (name.endsWith('.css')) return {};
    if (name === 'next/image') return { __esModule: true, default: ({ src, alt }) => React.createElement('img', { src, alt }) };
    if (name === './FleetDialog') return load('components/admin/modals/FleetDialog.tsx');
    if (name === '@/lib/car-pricing') return loadUiModule('lib/car-pricing.ts');
    if (name === '@/lib/booking-dates') return loadUiModule('lib/booking-dates.ts');
    if (name === './booking-form/BookingFields') return loadUiModule('components/admin/modals/booking-form/BookingFields.tsx');
    if (name === './booking-form/BookingSummary') return load('components/admin/modals/booking-form/BookingSummary.tsx');
    if (name === '../contracts/ContractFields') return loadUiModule('components/admin/contracts/ContractFields.tsx');
    if (name === '@/lib/rental-contract') return loadUiModule('lib/rental-contract.ts');
    return require(name);
  } });
  return exports;
}
const Form = load('components/admin/modals/AddBookingModal.tsx').default;
const car = { id: 'car-a', make: 'Test', model: 'Car', plateNumber: 'FAKE', status: 'available', dailyPriceEGP: 1000, securityDepositEGP: 10000, coverImage: '/fake.jpg', year: 2026 };
const draft = { carId: car.id, customerName: '', customerPhone: '', nationalId: '', licenseNumber: '', nationality: 'مصري', startDate: '2026-10-27', endDate: '2026-10-30', startTime: '14:00', endTime: '14:00', discountCode: 'FAKE', promoDiscountEGP: 100, loyaltyDiscountEGP: 50, loyaltyPointsRedeemed: 50, notes: '' };
const props = { isOpen: true, onClose() {}, onSubmit() {}, setNewBooking() {}, cars: [car], customers: [], coupons: [], newBooking: draft };

test('zero deposit stays zero and declared rental payments do not become collection totals', () => {
  const Summary = load('components/admin/modals/booking-form/BookingSummary.tsx').default;
  const render = rentPaid => renderToStaticMarkup(React.createElement(Summary, {
    car: { ...car, securityDepositEGP: 0 }, days: 3, baseRent: 3000, promoDiscount: 100,
    loyaltyDiscount: 50, loyaltyPoints: 50, discountCode: 'FAKE', total: 2850, rentPaid,
  }));
  const html = render('1000');
  assert.match(html, /إجمالي الإيجار والتأمين/);
  assert.match(html, /١٬٨٥٠/);
  assert.doesNotMatch(html, /١٠٬٠٠٠|المطلوب تحصيله الآن/);
  assert.doesNotMatch(render(''), /المتبقي من الإيجار حسب البيان/);
  assert.doesNotMatch(render('99999'), /المتبقي من الإيجار حسب البيان/);
});

test('license number belongs to the license section and the second customer phone is optional', () => {
  const html = renderToStaticMarkup(React.createElement(Form, { ...props, newBooking: { ...draft, contractDetails: { secondaryPhone: '01111111111' } } }));
  const sections = html.match(/<section\b[\s\S]*?<\/section>/g);
  const license = sections.find(section => section.includes('>تفاصيل رخصة القيادة</h3>'));
  const customer = sections.find(section => section.includes('>بيانات العميل</h3>'));
  assert.ok(license.includes('name="licenseNumber"')); assert.ok(!customer.includes('name="licenseNumber"'));
  assert.equal(html.match(/name="licenseNumber"/g).length, 1);
  const second = customer.match(/<input[^>]*name="secondaryPhone"[^>]*>/)[0];
  assert.match(second, /type="tel"/); assert.match(second, /value="01111111111"/); assert.doesNotMatch(second, /required/);
});
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
  assert.match(html, /التالي/);
  for (const label of ['العميل والرخصة', 'السيارة والتسليم', 'المراجعة والحفظ', 'عنوان المنزل', 'تاريخ انتهاء الرخصة', 'رقم الشاسيه', 'السائق الإضافي']) assert.ok(html.includes(label), label);
  assert.equal(renderToStaticMarkup(React.createElement(Form, { ...props, isOpen: false })), '');
});
