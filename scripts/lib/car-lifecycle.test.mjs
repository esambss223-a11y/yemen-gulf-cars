import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
function load(path, mocks = {}) {
  const source = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
  const exports = {};
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, Date, Intl, Response, console, require(name) {
    if (name in mocks) return mocks[name];
    if (name.endsWith('.css')) return {};
    if (name === 'next/image') return { __esModule: true, default: ({ src, alt }) => React.createElement('img', { src, alt }) };
    if (name === '@/lib/car-lifecycle') return load('lib/car-lifecycle.ts');
    if (name === '@/lib/car-record') return load('lib/car-record.ts');
    if (name === './CarRemovalPanel') return load('components/admin/tabs/CarRemovalPanel.tsx');
    return require(name);
  } });
  return exports;
}
const Panel = load('components/admin/tabs/CarRemovalPanel.tsx').default;
const Fleet = load('components/admin/tabs/FleetCarsTab.tsx').default;
const car = { id: 'car-a', make: 'Test', model: 'Car', year: 2026, status: 'maintenance', dailyPriceEGP: 100, currentKm: 0 };
const booking = (id, status, carId = car.id) => ({ id, carId, status, bookingNumber: id, customer: { fullName: `Customer-${id}` }, startDate: '2026-01-01', endDate: '2026-01-03' });
const callbacks = { onArchive() {}, onCancelBooking() {}, onReturnBooking() {}, onContract() {}, onHistory() {} };
test('removal UI names only this car’s open renters and exposes closing versus cancellation correctly', () => {
  const html = renderToStaticMarkup(React.createElement(Panel, { car, bookings: [booking('A', 'active'), booking('P', 'pending_approval'), booking('OTHER', 'active', 'car-other')], ...callbacks }));
  assert.match(html, /Customer-A/); assert.match(html, /Customer-P/); assert.doesNotMatch(html, /Customer-OTHER/);
  assert.match(html, /استلام وإغلاق العقد/); assert.match(html, /إلغاء الطلب/);
  assert.doesNotMatch(html, /أرشفة السيارة وحفظ سجلها/);
});
test('completed historical records allow archive and a full history link', () => {
  const html = renderToStaticMarkup(React.createElement(Panel, { car, bookings: [booking('C', 'completed'), booking('X', 'cancelled')], ...callbacks }));
  assert.match(html, /أرشفة السيارة وحفظ سجلها/); assert.match(html, /عرض سجل المستأجرين كاملًا/);
  assert.doesNotMatch(html, /استلام وإغلاق العقد/);
});
test('archived cars offer restoration without pretending they are available for rent', () => {
  const html = renderToStaticMarkup(React.createElement(Panel, { car: { ...car, status: 'archived' }, bookings: [], ...callbacks }));
  assert.match(html, /إعادة من الأرشيف/); assert.match(html, /مخفية عن الزبائن والحجز الجديد/);
});
test('staff roles cannot reveal the administrative cancellation and archive controls', () => {
  const common = { cars: [car], filteredCars: [car], bookings: [booking('A', 'active')], carFilter: 'all', managementId: car.id, availableCarsCount: 0, rentedCarsCount: 0, searchQuery: '' };
  for (const role of ['accountant', 'rental_agent']) {
    const html = renderToStaticMarkup(React.createElement(Fleet, { ...common, currentStaff: { role } }));
    assert.doesNotMatch(html, /الحجوزات المرتبطة وإزالة السيارة/); assert.doesNotMatch(html, /حذف السيارة نهائيًا/);
    assert.doesNotMatch(html, /إضافة سيارة/);
  }
});
test('lifecycle API refuses unauthorized users and malformed input before the database action', async () => {
  let calls = 0;
  const route = (ok) => load('app/api/admin/cars/lifecycle/route.ts', { '@/lib/server/staff-auth': { authorizeStaffRequest: async () => ok
    ? { ok: true, staff: { id: 'real-actor' }, admin: { rpc: async () => { calls++; return { data: {} }; } } }
    : { ok: false, status: 403, error: 'Denied' } } });
  const request = (body) => new Request('http://localhost/api/admin/cars/lifecycle', { method: 'POST', body: JSON.stringify(body) });
  assert.equal((await route(false).POST(request({ carId: 'a', action: 'archive' }))).status, 403);
  assert.equal((await route(true).POST(request({ carId: 'a', action: 'cancel_booking', reason: '' }))).status, 400);
  assert.equal((await route(true).POST(request({ carId: 'a', action: 'bad' }))).status, 400);
  assert.equal(calls, 0);
});
test('lifecycle API uses the authenticated actor and makes a missing database migration explicit', async () => {
  let args;
  const { POST } = load('app/api/admin/cars/lifecycle/route.ts', { '@/lib/server/staff-auth': { authorizeStaffRequest: async () => ({ ok: true,
    staff: { id: 'actual-actor' }, admin: { rpc: async (_name, values) => { args = values; return { error: { code: 'PGRST202', message: 'Missing RPC' } }; } } }) } });
  const response = await POST(new Request('http://localhost/api/admin/cars/lifecycle', { method: 'POST', body: JSON.stringify({ carId: 'car-a', action: 'archive', actor: 'forged-actor' }) }));
  assert.equal(args.p_actor, 'actual-actor'); assert.equal(response.status, 503); assert.equal((await response.json()).code, 'LIFECYCLE_NOT_INSTALLED');
});
