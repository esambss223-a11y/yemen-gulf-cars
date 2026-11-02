import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '../.private/maintenance-test-runtime/node_modules/@electric-sql/pglite/dist/index.js';
const db = new PGlite();
try {
  await db.exec("CREATE TABLE cars(id text primary key); INSERT INTO cars VALUES ('old');");
  await db.exec(await readFile(new URL('../supabase/migrations/20261031_car_duration_prices.sql', import.meta.url), 'utf8'));
  await db.exec(`UPDATE cars SET rental_price_tiers='[{"days":10,"totalEGP":7500}]'`);
  const sql = await readFile(new URL('../supabase/migrations/20261031_car_period_offers.sql', import.meta.url), 'utf8');
  await db.exec(sql); await db.exec(sql);
  assert.equal((await db.query('SELECT rental_price_tiers FROM cars')).rows[0].rental_price_tiers[0].totalEGP,7500);
  const offers = [{days:7,totalEGP:5500,originalTotalEGP:7000},{days:14,totalEGP:10000,originalTotalEGP:14000},{days:30,totalEGP:19000,originalTotalEGP:24000}];
  await db.query('UPDATE cars SET rental_price_tiers=$1::jsonb',[JSON.stringify(offers)]);
  assert.deepEqual((await db.query('SELECT rental_price_tiers FROM cars')).rows[0].rental_price_tiers,offers);
  for (const price of [9000,10000,null]) await assert.rejects(db.query('UPDATE cars SET rental_price_tiers=$1::jsonb',[JSON.stringify([{days:14,totalEGP:10000,originalTotalEGP:price}])]));
  await db.exec('UPDATE cars SET rental_price_tiers=NULL');
  console.log('PASS: standalone/idempotent offer upgrade, existing tiers preserved, independent originals retained, invalid discount rejected. Local database only.');
} finally { await db.close(); }
