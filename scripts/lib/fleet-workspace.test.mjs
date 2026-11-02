import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadUiModule } from './load-ui-module.mjs';

const { summarizeFleetBookings } = loadUiModule('lib/fleet-booking-summary.ts');
const Row = loadUiModule('components/admin/tabs/FleetCarRow.tsx').default;
const car = { id: 'test-car', make: 'Toyota', model: 'Test', plateNumber: 'TEST', year: 2026, status: 'available', dailyPriceEGP: 1000, weeklyPriceEGP: 5500, monthlyPriceEGP: 19000, currentKm: 0, minRentalDays: 7, ownership: 'company', rentalPriceTiers: [{ days: 7, totalEGP: 5500, originalTotalEGP: 7000 }, { days: 14, totalEGP: 10000, originalTotalEGP: 14000 }] };
const booking = (id, status, startDate = '2026-11-01', carId = car.id) => ({ id, carId, status, startDate, endDate: '2026-11-11', customer: { fullName: `Customer ${id}` } });
const callbacks = { onDetails() {}, onBook() {}, onEdit() {}, onManage() {} };

test('fleet summary prioritizes actual rentals, keeps all history counts and never mutates bookings', () => {
  const rows = [booking('confirmed', 'confirmed'), booking('old','completed'), booking('active','active'), booking('pending','pending_approval'), booking('other','active','2026-11-01','other')];
  const before = JSON.stringify(rows); const summary = summarizeFleetBookings(rows).get(car.id);
  assert.equal(summary.total,4); assert.equal(summary.open,3); assert.equal(summary.next.id,'active');
  assert.equal(JSON.stringify(rows),before);
  assert.equal(summarizeFleetBookings([booking('late','confirmed','2026-12-01'),booking('early','confirmed','2026-11-01')]).get(car.id).next.id,'early');
});

test('compact car record shows its minimum booking price and keeps all period prices discoverable', () => {
  const html = renderToStaticMarkup(React.createElement(Row,{car,admin:true,canBook:true,open:false,...callbacks}));
  for (const label of ['أقل حجز · 7 أيام','٥٬٥٠٠','كل الأسعار','الأسبوعان','١٠٬٠٠٠','التفاصيل','تعديل','إدارة']) assert.ok(html.includes(label),label);
  assert.match(html,/<details class="fleet-unit-prices"/);
  assert.doesNotMatch(html,/حذف السيارة نهائيًا/);
});

test('rental context is visible without opening another window and readonly roles have no creation or management action', () => {
  const history = summarizeFleetBookings([booking('active','active')]).get(car.id);
  const html = renderToStaticMarkup(React.createElement(Row,{car,history,admin:false,canBook:false,open:false,...callbacks}));
  assert.match(html,/Customer active/); assert.match(html,/عقد جارٍ/);
  const buttons = html.match(/<button\b[\s\S]*?<\/button>/g) || [];
  assert.equal(buttons.some(button=>/حجز<\/button>|تعديل<\/button>|إدارة<\/button>/.test(button)),false);
});

test('editing is direct and cars outside the available state retain disabled booking actions', () => {
  const calls=[];
  const tree=Row({car:{...car,status:'maintenance'},admin:true,canBook:true,open:false,...callbacks,onEdit:()=>calls.push('edit')});
  const nodes=[]; const visit=node=>{if(Array.isArray(node)){node.forEach(visit);return;}if(!node?.props)return;nodes.push(node);visit(node.props.children);};visit(tree);
  const edit=nodes.find(node=>node.type==='button'&&Array.isArray(node.props.children)&&node.props.children.includes('تعديل'));
  edit.props.onClick();assert.deepEqual(calls,['edit']);
  const book=nodes.find(node=>node.type==='button'&&Array.isArray(node.props.children)&&node.props.children.includes('حجز'));
  assert.equal(book.props.disabled,true);
});
