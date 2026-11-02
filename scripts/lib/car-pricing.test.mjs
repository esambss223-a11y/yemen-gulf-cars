import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { loadUiModule } from './load-ui-module.mjs';

const Pricing = loadUiModule('components/admin/modals/car-form/CarPricingSection.tsx').default;
const { carRentalPrices, rentalQuote, validateRentalPriceTiers } = loadUiModule('lib/car-pricing.ts');
test('daily edits preserve independent weekly, monthly, fortnight and deposit prices', () => {
  const { updateCarPeriodOffer, carPeriodOffer } = loadUiModule('lib/car-offers.ts');
  let draft = { dailyPriceEGP: 1000, weeklyPriceEGP: 5700, monthlyPriceEGP: 19000, securityDepositEGP: 0, rentalPriceTiers: [{ days: 14, totalEGP: 10000 }] };
  draft = updateCarPeriodOffer(draft, 1, { price: 1234.5 });
  assert.equal(draft.dailyPriceEGP,1234.5); assert.equal(draft.weeklyPriceEGP,5700); assert.equal(draft.monthlyPriceEGP,19000); assert.equal(carPeriodOffer(draft,14).price,10000); assert.equal(draft.securityDepositEGP,0);
  const html = renderToStaticMarkup(createElement(Pricing,{carForm:draft,setCarForm(){}}));
  for (const label of ['اليوم','الأسبوع','الأسبوعان','الشهر','السعر الأساسي','تفعيل عرض','أقل مدة للإيجار']) assert.ok(html.includes(label),label);
});

test('catalog defaults never replace an explicitly saved period price', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(carRentalPrices({ dailyPriceEGP: 1000, weeklyPriceEGP: 5700, monthlyPriceEGP: 19000 }))), { daily: 1000, weekly: 5700, monthly: 19000 });
  assert.equal(carRentalPrices({ dailyPriceEGP: 1000 }).monthly, 24000);
  assert.equal(carRentalPrices({ dailyPriceEGP: 1000, weeklyPriceEGP: 0, monthlyPriceEGP: 0 }).monthly, 0);
});
test('car save sends the edited name and all prices, then displays the returned database row', async () => {
  let state = []; let sent;
  const returned = { id: 'c', make: 'Updated make', model: 'Updated model', daily_price_egp: 1234.5, weekly_price_egp: 5700, monthly_price_egp: 21500, year: 2026, status: 'available' };
  const exports = {};
  const source = readFileSync(new URL('../../context/fleet/useFleetCars.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mock = { from: () => ({ update: (payload) => { sent = payload; return { eq: () => ({ select: () => ({ maybeSingle: async () => ({ data: returned, error: null }) }) }) }; } }) };
  vm.runInNewContext(code, { exports, console, require(name) {
    if (name === 'react') return { useState: () => [state, (next) => { state = typeof next === 'function' ? next(state) : next; }], useCallback: (fn) => fn };
    if (name === '@/lib/car-offers') return loadUiModule('lib/car-offers.ts');
    if (name === '@/lib/car-pricing') return loadUiModule('lib/car-pricing.ts');
    if (name === '@/lib/car-mapping') return loadUiModule('lib/car-mapping.ts');
    if (name === '@/lib/supabase') return { supabase: mock };
    if (name === './fleetStorage') return { reportFleetWriteError: (error) => { throw new Error(error); } };
    if (name === '@/lib/car-lifecycle-client') return {};
    throw new Error('Unexpected dependency: ' + name);
  } });
  const hook = exports.useFleetCars({ logAction() {} });
  hook.setCars([{ id: 'c', make: 'Old make', model: 'Old model' }]);
  assert.equal(await hook.updateCar('c', { make: 'Updated make', model: 'Updated model', dailyPriceEGP: 1234.5, weeklyPriceEGP: 5700, monthlyPriceEGP: 21500 }), true);
  assert.equal(sent.make, 'Updated make'); assert.equal(sent.model, 'Updated model'); assert.equal(sent.monthly_price_egp, 21500);
  assert.equal(state[0].make, 'Updated make'); assert.equal(state[0].model, 'Updated model'); assert.equal(state[0].monthlyPriceEGP, 21500);
  assert.equal(hook.mapCloudCar({ ...returned, monthly_price_egp: 0 }).monthlyPriceEGP, 0);
  assert.equal(hook.mapCloudCar({ ...returned, security_deposit_egp: 0 }).securityDepositEGP, 0);
});

test('each exact duration uses its independent total without week mixing or prorating', () => {
  const car = { dailyPriceEGP: 1000, weeklyPriceEGP: 6000, monthlyPriceEGP: 20000, rentalPriceTiers: [{ days: 10, totalEGP: 7500 }] };
  assert.equal(rentalQuote(car, 10).totalEGP, 7500);
  assert.equal(rentalQuote(car, 10).dailyRateEGP, 750);
  assert.equal(rentalQuote(car, 7).totalEGP, 6000);
  assert.equal(rentalQuote(car, 30).totalEGP, 20000);
  assert.equal(rentalQuote(car, 11).totalEGP, 11000);
  for (const tiers of [[{ days: 10, totalEGP: -1 }], [{ days: 10, totalEGP: 1, originalTotalEGP: 0.5 }], [{ days: 10, totalEGP: 1 }, { days: 10, totalEGP: 2 }]]) assert.throws(() => validateRentalPriceTiers(tiers));
});

test('minimum duration rejects reversed dates and preserves legacy cars', () => {
  const { validateRentalDuration } = loadUiModule('lib/booking-dates.ts');
  assert.equal(validateRentalDuration('2026-10-01','2026-10-11',10),10);
  assert.throws(() => validateRentalDuration('2026-10-01','2026-10-03',10));
  assert.throws(() => validateRentalDuration('2026-10-03','2026-10-01'));
  assert.throws(() => validateRentalDuration('2026-02-30','2026-03-03'));
  const { normalizeDurationPriceBackup } = loadUiModule('lib/maintenance-contract-compat.ts');
  const old = { cars: [{ id: 'old' }], bookings: [] };
  assert.equal(normalizeDurationPriceBackup(old).cars[0].rental_price_tiers,null);
  assert.equal('rental_price_tiers' in old.cars[0],false);
});

test('each offer persists its own original amount and disabling restores the base price', () => {
 const { updateCarPeriodOffer, carPeriodOffer, validateCarOffers }=loadUiModule('lib/car-offers.ts');
 let draft={dailyPriceEGP:1000,weeklyPriceEGP:6000,monthlyPriceEGP:20000,rentalPriceTiers:[{days:10,totalEGP:7500}]};
 draft=updateCarPeriodOffer(draft,7,{original:7000,price:5500});
 draft=updateCarPeriodOffer(draft,14,{original:14000,price:10000});
 draft=updateCarPeriodOffer(draft,30,{original:24000,price:19000});
 validateCarOffers(draft);
 assert.equal(carPeriodOffer(draft,7).original,7000);assert.equal(carPeriodOffer(draft,14).price,10000);assert.equal(carPeriodOffer(draft,30).original,24000);
 draft=updateCarPeriodOffer(draft,1,{original:1500,price:900});
 assert.equal(carPeriodOffer(draft,7).price,5500);assert.equal(carPeriodOffer(draft,30).price,19000);
 assert.equal(rentalQuote(draft,7).totalEGP,5500);assert.equal(rentalQuote(draft,14).totalEGP,10000);
 draft=updateCarPeriodOffer(draft,7,{price:7000,original:null});
 assert.equal(carPeriodOffer(draft,7).original,undefined);assert.equal(carPeriodOffer(draft,7).price,7000);
 assert.equal(draft.rentalPriceTiers.find(t=>t.days===10).totalEGP,7500);
 assert.throws(()=>validateCarOffers({...draft,originalDailyPriceEGP:800}));
 assert.throws(()=>validateRentalPriceTiers([{days:14,totalEGP:10000,originalTotalEGP:9000}]));
});
