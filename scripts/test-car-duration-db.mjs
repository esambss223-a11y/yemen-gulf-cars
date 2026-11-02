import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '../.private/maintenance-test-runtime/node_modules/@electric-sql/pglite/dist/index.js';
const db = new PGlite();
try {
  await db.exec("CREATE TABLE cars(id text primary key, daily_price_egp numeric); INSERT INTO cars VALUES ('old',1000);");
  const sql = await readFile(new URL('../supabase/migrations/20261031_car_duration_prices.sql', import.meta.url), 'utf8');
  await db.exec(sql); await db.exec(sql);
  assert.deepEqual((await db.query('SELECT * FROM cars')).rows, [{ id: 'old', daily_price_egp: '1000', rental_price_tiers: null }]);
  await db.exec(`UPDATE cars SET rental_price_tiers='[{"days":10,"totalEGP":7500}]'`);
  for (const invalid of ['{}', '[{"days":7,"totalEGP":10}]', '[{"days":10,"totalEGP":-1}]', '[{"days":10,"totalEGP":1},{"days":10,"totalEGP":2}]']) {
    await assert.rejects(db.query('UPDATE cars SET rental_price_tiers=$1::jsonb', [invalid]));
  }
  await db.exec("UPDATE cars SET rental_price_tiers=NULL");
  console.log('PASS: idempotent duration migration, old car retained, invalid prices rejected, nullable legacy restore supported. Local database only.');
} finally { await db.close(); }
