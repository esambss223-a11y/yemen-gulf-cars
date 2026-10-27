import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source = readFileSync(new URL('../../lib/car-record.ts', import.meta.url), 'utf8');
const exports = {};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, Intl, Date });
const { carHistory, filterCarHistory, carRentalTotals, calendarMonth, bookingsOnDay, cairoToday } = exports;
const booking = (id, changes = {}) => ({ id, carId: 'car-a', status: 'completed', startDate: '2026-10-01', endDate: '2026-10-05', startTime: '14:00', daysCount: 4, finalTotalEGP: 1000, ...changes });
test('a vehicle file never mixes contracts from another car', () => {
  const records = carHistory([booking('1'), booking('2', { carId: 'car-b' }), booking('3', { startDate: '2026-10-15' })], 'car-a');
  assert.equal(records.length, 2); assert.equal(records[0].id, '3'); assert.equal(records[1].id, '1');
});
test('period search includes contracts that started before the chosen period', () => {
  const records = [booking('overlap'), booking('outside', { endDate: '2026-09-29', startDate: '2026-09-25' })];
  const result = filterCarHistory(records, '2026-10-03', '2026-10-04', 'all');
  assert.equal(result.length, 1); assert.equal(result[0].id, 'overlap');
});
test('date boundaries are inclusive and invalid ranges produce no misleading results', () => {
  assert.equal(filterCarHistory([booking('1')], '2026-10-05', '2026-10-05', 'all').length, 1);
  assert.equal(filterCarHistory([booking('1')], '2026-10-06', '2026-10-02', 'all').length, 0);
});
test('cancelled, pending and future confirmed bookings are not actual rental counts or revenue', () => {
  const rows = ['active', 'completed', 'confirmed', 'pending_approval', 'cancelled'].map((status) => booking(status, { status }));
  const totals = carRentalTotals(rows);
  assert.equal(totals.rentals, 2); assert.equal(totals.days, 8); assert.equal(totals.contractValue, 2000);
  assert.equal(totals.confirmed, 1); assert.equal(totals.completed, 1);
  assert.equal(filterCarHistory(rows, '', '', 'cancelled').length, 1);
});
test('calendar ignores cancelled bookings but preserves requests as distinct records', () => {
  const rows = [booking('cancelled', { status: 'cancelled' }), booking('request', { status: 'pending_approval' })];
  const day = bookingsOnDay(rows, '2026-10-03');
  assert.equal(day.length, 1); assert.equal(day[0].status, 'pending_approval');
  assert.equal(bookingsOnDay(rows, '2026-11-03').length, 0);
});
test('calendar handles leap years, month boundaries and Saturday-first layout', () => {
  const leap = calendarMonth(2028, 1); assert.equal(leap.dates.length, 29);
  assert.equal(leap.dates[28].date, '2028-02-29');
  const october = calendarMonth(2026, 9); assert.equal(october.offset, 5); assert.equal(october.dates[0].date, '2026-10-01');
  assert.equal(calendarMonth(2026, 12).dates[0].date, '2027-01-01');
});
test('the operating day uses Cairo rather than the server timezone', () => {
  assert.equal(cairoToday(new Date('2026-07-01T22:30:00Z')), '2026-07-02');
});
