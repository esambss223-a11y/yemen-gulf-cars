import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '../.private/maintenance-test-runtime/node_modules/@electric-sql/pglite/dist/index.js';
const db = new PGlite();
try {
  await db.exec("CREATE ROLE authenticated; CREATE ROLE service_role; CREATE TABLE bookings(id text PRIMARY KEY, amount numeric); INSERT INTO bookings VALUES ('existing',100); GRANT SELECT,INSERT,UPDATE ON bookings TO authenticated,service_role;");
  const sql = await readFile('supabase/migrations/20261028_rental_contract.sql', 'utf8'); await db.exec(sql); await db.exec(sql);
  assert.equal((await db.query("SELECT contract_record FROM bookings WHERE id='existing'")).rows[0].contract_record, null);
  await db.exec('SET ROLE authenticated');
  await assert.rejects(db.exec("UPDATE bookings SET contract_record='{}' WHERE id='existing'"), /CONTRACT_SERVER_REQUIRED/);
  await db.exec("UPDATE bookings SET amount=110 WHERE id='existing'");
  await db.exec("INSERT INTO bookings(id,amount) VALUES ('ordinary',200)");
  await db.exec('RESET ROLE; SET ROLE service_role');
  await db.exec("UPDATE bookings SET contract_record='{\"revision\":\"initial\",\"details\":{},\"attachments\":[]}' WHERE id='existing'");
  const first = await db.query("UPDATE bookings SET contract_record='{\"revision\":\"new\",\"details\":{},\"attachments\":[]}' WHERE id='existing' AND contract_record->>'revision'='initial' RETURNING id");
  const stale = await db.query("UPDATE bookings SET contract_record='{\"revision\":\"lost-update\"}' WHERE id='existing' AND contract_record->>'revision'='initial' RETURNING id");
  assert.equal(first.rows.length, 1); assert.equal(stale.rows.length, 0);
  console.log('PASS PostgreSQL: additive/idempotent migration; direct document writes blocked; ordinary bookings preserved; service writes permitted; concurrent stale writes rejected. No production connection.');
} finally { await db.close(); }
