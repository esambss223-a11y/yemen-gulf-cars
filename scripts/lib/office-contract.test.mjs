import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadUiModule } from './load-ui-module.mjs';
import { contractFixture } from './contract-print-fixture.mjs';
const require = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL('../../' + file, import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { exports, Response, URL, Buffer, console, require(name) {
    if (name in mocks) return mocks[name];
    if (name.startsWith('@/')) return load(name.slice(2) + '.ts', mocks);
    return require(name);
  } });
  return exports;
}
const { validateContractDetails } = load('lib/rental-contract.ts');
test('contract details reject impossible dates, reversed expiry, unexpected fields and overstated payments', () => {
  for (const details of [{ licenseIssuedAt: '2026-02-30' }, { licenseIssuedAt: '2026-13-01' }, { licenseIssuedAt: '2030-01-01', licenseExpiresAt: '2029-01-01' }, { rentPaidEGP: '3001' }, { rentPaidEGP: '-1' }, { rentPaidEGP: '12.345' }, { status: 'completed' }, { toString: 'bad' }]) assert.throws(() => validateContractDetails(details, 3000));
  assert.equal(validateContractDetails({ tenantAddress: '  Test address  ', rentPaidEGP: '0' }, 3000).tenantAddress, 'Test address');
});
test('secondary contact is optional, normalizes Arabic digits, and survives saved contract and print output', async () => {
  assert.equal(validateContractDetails({ secondaryPhone: '' }, 2000).secondaryPhone, '');
  assert.equal(validateContractDetails({ secondaryPhone: '٠١١ ١١١١ ١١١١' }, 2000).secondaryPhone, '01111111111');
  assert.throws(() => validateContractDetails({ secondaryPhone: 'not-a-phone' }, 2000));
  const f = creationFixture(); const input = creationPayload(); input.details.secondaryPhone = '01111111111';
  const response = await f.POST(createRequest(input)); assert.equal(response.status, 200);
  const { record } = await response.json(); assert.equal(record.details.secondaryPhone, '01111111111'); assert.equal(f.writes[0].customer.phone, input.booking.customer.phone);
  const Doc = loadUiModule('components/admin/contracts/RentalContractDocument.tsx').default;
  const printed = renderToStaticMarkup(React.createElement(Doc, { booking: { ...contractFixture, contractRecord: record } }));
  assert.match(printed, /الهاتف الأساسي \/ الإضافي/); assert.ok(printed.includes('01111111111')); assert.ok(printed.includes(contractFixture.customer.phone));
});
const record = { revision: 'rev-a', details: {}, attachments: [], updatedBy: 'Test', updatedAt: '2026-10-28' };
function fixture({ role = 'super_admin', denied = false, missing = false, conflict = false, dbError = false, storageError = false, previous = null } = {}) {
  const writes = []; const uploads = []; const removed = []; const signed = [];
  const admin = {
    from(table) { let writing = false; return {
      select() { return this; }, update(value) { writes.push(value); writing = true; return this; },
      eq() { return this; }, is() { return this; },
      async maybeSingle() {
        if (table === 'cars') return { data: { year: 2026, vin: 'TEST', color: 'white' } };
        if (missing) return { error: { code: '42703' } };
        if (writing) return dbError ? { error: { code: 'NETWORK' } } : { data: conflict ? null : { id: 'booking-a' } };
        return { data: { id: 'booking-a', final_total_egp: 3000, booking_number: 'TEST', car_id: 'car-a', contract_record: previous } };
      },
    }; },
    storage: { from(bucket) { assert.equal(bucket, 'rental-contracts'); return {
      async upload(path, bytes) { uploads.push({ path, bytes }); return { error: storageError ? {} : null }; },
      async remove(paths) { removed.push(...paths); return { error: null }; },
      async createSignedUrl(path, seconds, options) { signed.push({ path, seconds, options }); return { data: { signedUrl: 'https://example.supabase.co/private-token' } }; },
    }; } },
  };
  const route = load('app/api/admin/contracts/route.ts', { '@/lib/server/staff-auth': { authorizeStaffRequest: async () => denied ? { ok: false, status: 401, error: 'Denied' } : { ok: true, admin, staff: { id: 'actor', name: 'Employee', role } } } });
  return { ...route, writes, uploads, removed, signed };
}
function json(details = {}, revision) { return new Request('http://localhost/api/admin/contracts', { method: 'POST', body: JSON.stringify({ bookingId: 'booking-a', details, revision }), headers: { 'Content-Type': 'application/json' } }); }
function fileRequest(revision, bad = false) {
  const body = new FormData(); body.set('bookingId', 'booking-a'); body.set('revision', revision || '');
  body.set('file', new Blob([bad ? 'not a PDF' : '%PDF-test'], { type: 'application/pdf' }), 'scan.pdf');
  return new Request('http://localhost/api/admin/contracts', { method: 'POST', body });
}
test('only authenticated active staff can read and accountants cannot change or upload contracts', async () => {
  const denied = fixture({ denied: true }); assert.equal((await denied.GET(new Request('http://localhost?bookingId=booking-a'))).status, 401);
  assert.equal((await denied.POST(json())).status, 401);
  const accountant = fixture({ role: 'accountant' }); assert.equal((await accountant.POST(json())).status, 403); assert.equal(accountant.writes.length, 0);
});
test('missing migration is explicit and a save only changes the supplementary document column', async () => {
  const missing = await fixture({ missing: true }).POST(json()); assert.equal(missing.status, 503); assert.equal((await missing.json()).code, 'CONTRACT_SETUP_REQUIRED');
  const f = fixture(); assert.equal((await f.POST(json({ tenantAddress: 'Test' }))).status, 200);
  assert.deepEqual(Object.keys(f.writes[0]), ['contract_record']); assert.equal(f.writes[0].contract_record.details.tenantAddress, 'Test');
});
test('stale revisions and invalid file signatures never create a file', async () => {
  const f = fixture({ previous: record }); assert.equal((await f.POST(json({}, 'old-revision'))).status, 409);
  assert.equal((await f.POST(fileRequest('rev-a', true))).status, 400); assert.equal(f.uploads.length, 0);
});
test('concurrent attachment races remove only this request’s new unlinked object; ambiguous failures retain it', async () => {
  const f = fixture({ conflict: true, previous: record }); assert.equal((await f.POST(fileRequest('rev-a'))).status, 409);
  assert.equal(f.removed.length, 1); assert.equal(f.removed[0], f.uploads[0].path); assert.match(f.removed[0], /^contracts\/booking-a\/[a-f0-9-]+\.pdf$/);
  const ambiguous = fixture({ dbError: true }); assert.equal((await ambiguous.POST(fileRequest())).status, 503); assert.equal(ambiguous.removed.length, 0);
  const failed = fixture({ storageError: true }); assert.equal((await failed.POST(fileRequest())).status, 503); assert.equal(failed.writes.length, 0);
});
test('downloads require a file belonging to this booking and issue only a 60-second attachment URL', async () => {
  const previous = { ...record, attachments: [{ id: 'file-a', path: 'contracts/booking-a/file-a.pdf', type: 'application/pdf' }] };
  const f = fixture({ previous }); assert.equal((await f.GET(new Request('http://localhost?bookingId=booking-a&fileId=file-a'))).status, 200);
  assert.equal(f.signed[0].seconds, 60); assert.ok(f.signed[0].options.download);
  assert.equal((await f.GET(new Request('http://localhost?bookingId=booking-a&fileId=other'))).status, 404);
  const forged = fixture({ previous: { ...previous, attachments: [{ ...previous.attachments[0], path: 'contracts/other/file-a.pdf' }] } });
  assert.equal((await forged.GET(new Request('http://localhost?bookingId=booking-a&fileId=file-a'))).status, 404);
});
test('paper form and print contain full office fields, paid/balance, blank writing lines and optional original scan upload', () => {
  const Doc = loadUiModule('components/admin/contracts/RentalContractDocument.tsx').default;
  const html = renderToStaticMarkup(React.createElement(Doc, { booking: contractFixture }));
  for (const value of ['TEST-VIN-2026', 'TEST-ENGINE-2026', 'TEST-DRIVER-LICENSE', '٨٥٠', 'توقيع المستأجر بالقلم', 'rd-blank']) assert.ok(html.includes(value), value);
  const Editor = loadUiModule('components/admin/contracts/ContractOfficeEditor.tsx').default;
  const props = { booking: contractFixture, record: contractFixture.contractRecord, defaults: {}, canEdit: true, busy: false, onBusy() {}, onDirty() {}, onSaved() {} };
  const office = renderToStaticMarkup(React.createElement(Editor, props));
  assert.match(office, /اختياري/); assert.match(office, /type="file"/); assert.doesNotMatch(office, /type="file"[^>]*required/);
  const readonly = renderToStaticMarkup(React.createElement(Editor, { ...props, canEdit: false })); assert.match(readonly, /fieldset disabled/); assert.doesNotMatch(readonly, /type="file"/);
});

function creationFixture({ role = 'rental_agent', denied = false, missing = false, duplicate = false, minimum = 1, tiers = [] } = {}) {
  const writes = []; let stored;
  const route = load('app/api/admin/contracts/create/route.ts', { '@/lib/server/staff-auth': { authorizeStaffRequest: async () => denied ? { ok: false, status: 401, error: 'Denied' } : { ok: true, staff: { id: 'verified-actor', name: 'Actual employee', role }, admin: {
    from(table) { if (table === 'cars') return { select() { return this; }, eq() { return this; }, async maybeSingle() { return { data: { id: 'car-a', daily_price_egp: 1000, rental_price_tiers: tiers, min_rental_days: minimum } }; } }; assert.equal(table, 'bookings'); return {
      insert(row) { writes.push(row); if (!stored) stored = row; return { select() { return { single: async () => missing ? { error: { code: '42703' } } : duplicate || writes.length > 1 ? { error: { code: '23505' } } : { data: { contract_record: row.contract_record } } }; } }; },
      select() { return this; }, eq() { return this; }, async maybeSingle() { return { data: stored }; },
    }; },
  } } } });
  return { ...route, writes };
}
const creationPayload = () => ({ booking: { id: 'bk-retry', booking_number: 'TEST-1', car_id: 'car-a', car_name: 'Test car', car_plate: 'FAKE', customer: { id: 'customer-a', fullName: 'Fake Customer', phone: '00000000000', nationalId: 'TEST-ID', licenseNumber: 'TEST-LICENSE' }, start_date: '2026-10-28', start_time: '14:00', end_date: '2026-10-30', end_time: '14:00', days_count: 2, daily_rate_egp: 1000, total_rent_egp: 2000, discount_amount_egp: 0, final_total_egp: 2000, security_deposit_egp: 10000, start_km: 1000, status: 'active', deposit_status: 'held', staff_id: 'forged', contract_record: { revision: 'forged' } }, details: { tenantAddress: 'Fake address', vin: 'TEST-VIN' } });
const createRequest = body => new Request('http://localhost/api/admin/contracts/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
test('unified creation authorizes staff and inserts booking plus document in a single write with verified employee attribution', async () => {
  assert.equal((await creationFixture({ denied: true }).POST(createRequest(creationPayload()))).status, 401);
  const accountant = creationFixture({ role: 'accountant' }); assert.equal((await accountant.POST(createRequest(creationPayload()))).status, 403); assert.equal(accountant.writes.length, 0);
  const f = creationFixture(); const response = await f.POST(createRequest(creationPayload())); assert.equal(response.status, 200); assert.equal(f.writes.length, 1);
  assert.equal(f.writes[0].staff_id, 'verified-actor'); assert.equal(f.writes[0].contract_record.updatedBy, 'Actual employee'); assert.equal(f.writes[0].contract_record.details.tenantAddress, 'Fake address'); assert.notEqual(f.writes[0].contract_record.revision, 'forged');
});
test('unified creation rejects incomplete data, invalid dates or document errors before writing a booking', async () => {
  for (const edit of [data => { data.booking.customer.licenseNumber = ''; }, data => { data.booking.end_date = '2026-10-01'; }, data => { data.booking.final_total_egp = 1; }, data => { data.details.rentPaidEGP = '99999'; }]) {
    const f = creationFixture(); const input = creationPayload(); edit(input); assert.equal((await f.POST(createRequest(input))).status, 400); assert.equal(f.writes.length, 0);
  }
  assert.equal((await creationFixture().POST(createRequest(null))).status, 400);
});
test('retrying the same creation returns its saved document while a changed duplicate is rejected', async () => {
  const f = creationFixture(); const first = await f.POST(createRequest(creationPayload())); const original = await first.json();
  const retry = await f.POST(createRequest(creationPayload())); assert.equal(retry.status, 200); assert.equal((await retry.json()).record.revision, original.record.revision);
  const changed = creationPayload(); changed.details.tenantAddress = 'Different'; assert.equal((await f.POST(createRequest(changed))).status, 409);
  assert.equal((await creationFixture({ missing: true }).POST(createRequest(creationPayload()))).status, 503);
});

test('office creation enforces the saved car minimum and rejects forged duration before inserting', async () => {
  const limited = creationFixture({ minimum: 7 });
  assert.equal((await limited.POST(createRequest(creationPayload()))).status, 400);
  assert.equal(limited.writes.length, 0);
  const fixture = creationFixture(); const payload = creationPayload(); payload.booking.days_count = 99;
  assert.equal((await fixture.POST(createRequest(payload))).status, 400);
  assert.equal(fixture.writes.length, 0);
});

test('office quote verifies an independent ten-day price and refuses client price changes', async () => {
  const fixture = creationFixture({ tiers: [{ days: 10, totalEGP: 7500 }] });
  const body = creationPayload(); Object.assign(body.booking, { end_date: '2026-11-07', days_count: 10, daily_rate_egp: 750, total_rent_egp: 7500, final_total_egp: 7500 });
  assert.equal((await fixture.POST(createRequest(body))).status, 200);
  const wrong = creationPayload(); wrong.booking.total_rent_egp = 10; wrong.booking.final_total_egp = 10;
  assert.equal((await fixture.POST(createRequest(wrong))).status, 409);
  assert.equal(fixture.writes.length, 1);
});
