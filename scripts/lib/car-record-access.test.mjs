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
  const source = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
  const exports = {};
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, Date, Intl, require(name) {
    if (name.endsWith('.css')) return {};
    if (name === 'react') return { ...React, useSyncExternalStore: () => ({}) };
    if (name === 'react-dom') return { createPortal: (children) => children };
    if (name === 'next/image') return { __esModule: true, default: ({ src, alt }) => React.createElement('img', { src, alt }) };
    if (name === '@/lib/car-images') return load('lib/car-images.ts');
    if (name === '@/lib/car-record') return load('lib/car-record.ts');
    return require(name);
  } });
  return exports;
}
const Component = load('components/admin/tabs/CarDetailsView.tsx').default;
const props = { car: { id: 'car-a', make: 'Test', model: 'Car', year: 2026, category: 'vip', plateNumber: 'TEST', color: 'White', currentKm: 0,
  dailyPriceEGP: 100, securityDepositEGP: 0, status: 'available', images: [], coverImage: '/test.jpg', transmission: 'automatic', fuelType: 'petrol', seats: 5, ownership: 'investor', features: [] },
owner: { id: 'owner-a', name: 'Public owner name', phone: 'PRIVATE-OWNER-PHONE', bankAccount: 'PRIVATE-BANK-ACCOUNT', nationalId: 'PRIVATE-OWNER-ID', commissionModel: 'percentage', ownerSharePercent: 75, notes: 'PRIVATE-OWNER-NOTES' },
bookings: [], onClose() {}, onEdit() {}, onOpenContract() {} };
for (const role of ['super_admin', 'accountant', 'rental_agent']) {
  test(`${role} only sees owner financial details permitted for its role`, () => {
    const html = renderToStaticMarkup(React.createElement(Component, { ...props, currentStaff: { id: 'test-user', name: 'Test', role, active: true } }));
    assert.match(html, /Public owner name/);
    for (const privateValue of ['PRIVATE-BANK-ACCOUNT', 'PRIVATE-OWNER-ID', 'PRIVATE-OWNER-PHONE', 'PRIVATE-OWNER-NOTES']) {
      assert.equal(html.includes(privateValue), role !== 'rental_agent');
    }
    assert.equal(html.includes('قيمة عقود التأجير'), role !== 'rental_agent');
    const editButton = [...html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)].some(([, content]) => content.includes('تعديل البيانات'));
    assert.equal(editButton, role === 'super_admin');
  });
}
