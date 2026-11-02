import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const data = { carId: 'car-a', carName: 'Test car', carPlate: 'TEST', customer: { id: 'first-client-id', fullName: 'Test', phone: '000', nationalId: 'ID', licenseNumber: 'LICENSE' }, startDate: '2026-10-28', startTime: '14:00', endDate: '2026-10-30', endTime: '14:00', daysCount: 2, dailyRateEGP: 1000, totalRentEGP: 2000, discountAmountEGP: 0, finalTotalEGP: 2000, securityDepositEGP: 10000, depositStatus: 'held', startKm: 0, status: 'active', staffId: 'staff', staffName: 'Employee', contractRecord: { revision: '', details: { tenantAddress: 'Test address' }, attachments: [], updatedAt: '', updatedBy: '' } };
function fixture(fetch) {
  let rows = []; const effects = []; const errors = [];
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL('../../context/fleet/useFleetBookings.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, Date, fetch, console: { warn() {} }, require(name) {
    if (name === 'react') return { useState: () => [rows, update => { rows = typeof update === 'function' ? update(rows) : update; }], useCallback: fn => fn, useRef: current => ({ current }) };
    if (name === '@/lib/supabase') return { supabase: { auth: { getSession: async () => ({ data: { session: { access_token: 'test-token' } } }) }, from() { throw new Error('Office contracts must not use a second client-side insert'); } } };
    if (name === './fleetStorage') return { reportFleetWriteError: text => errors.push(text) };
    if (name === '@/lib/car-lifecycle-client') return {};
    throw new Error('Unexpected import: ' + name);
  } });
  const hook = exports.useFleetBookings({ cars: [{ id: 'car-a', status: 'available' }], customers: [], updateCar: async () => { effects.push('car'); }, setCarStatus() {}, addCustomer: async () => { effects.push('customer'); }, updateCustomer() {}, addInvoice: async () => { effects.push('invoice'); }, logAction() {} });
  return { hook, rows: () => rows, effects, errors };
}
const success = body => ({ ok: true, json: async () => ({ record: { ...data.contractRecord, revision: 'saved-revision', details: body.details } }) });
test('an interrupted office save keeps the same booking/customer identity on retry and runs dependent operations only after success', async () => {
  const requests = []; let attempt = 0; let created;
  const f = fixture(async (_url, options) => { const body = JSON.parse(options.body); requests.push(body); if (attempt++ === 0) throw new Error('Network interruption'); return success(body); });
  assert.equal(await f.hook.addBooking(data), false); assert.equal(f.rows().length, 0); assert.equal(f.effects.length, 0);
  assert.equal(await f.hook.addBooking({ ...data, customer: { ...data.customer, id: 'generated-again-on-retry' } }, booking => { created = booking; }), true);
  assert.equal(requests[0].booking.id, requests[1].booking.id); assert.equal(requests[0].booking.customer.id, requests[1].booking.customer.id);
  assert.equal(f.rows().length, 1); assert.equal(created.contractRecord.revision, 'saved-revision'); assert.deepEqual(f.effects, ['car', 'customer', 'invoice']);
});
test('simultaneous submit attempts do not duplicate booking side effects', async () => {
  let complete; let requests = 0;
  const f = fixture((_url, options) => { requests++; return new Promise(resolve => { complete = () => resolve(success(JSON.parse(options.body))); }); });
  const pending = f.hook.addBooking(data);
  assert.equal(await f.hook.addBooking(data), false);
  complete(); assert.equal(await pending, true); assert.equal(requests, 1); assert.equal(f.effects.filter(value => value === 'invoice').length, 1);
});
