// Uses only an in-memory PostgreSQL instance. Never connects to Supabase.
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { PGlite } from '../.private/maintenance-test-runtime/node_modules/@electric-sql/pglite/dist/index.js';

const db = new PGlite();
const actor = '00000000-0000-4000-8000-000000000001';
const manager = '00000000-0000-4000-8000-000000000002';
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
  CREATE SCHEMA auth; CREATE TABLE auth.users (id UUID PRIMARY KEY, raw_app_meta_data JSONB DEFAULT '{}', encrypted_password TEXT);`);
const schema = await readFile(new URL('../supabase-schema.sql', import.meta.url), 'utf8');
await db.exec(schema.split('CREATE OR REPLACE FUNCTION public.is_active_staff()')[0] + '\nCOMMIT;');
const migration = await readFile(new URL('../supabase/migrations/20261026_maintenance.sql', import.meta.url), 'utf8');
// PGlite does not ship Supabase's safeupdate module. Guard its exact SQL requirement here.
const deletions = [...migration.matchAll(/DELETE\s+FROM\s+public\.(\w+)([^;]*);/gi)];
assert.equal(deletions.length, 9);
for (const [, table, predicate] of deletions) {
  assert.match(predicate.trim(), /^WHERE id IS NOT NULL$/i, `Missing explicit reset predicate for ${table}`);
  assert.ok(!['staff', 'users', 'maintenance_events'].includes(table));
}
assert.doesNotMatch(migration, /SET\s+(?:LOCAL\s+)?safeupdate\.enabled\s*(?:=|TO)\s*(?:0|off|false)/i);
await db.exec(migration);
await db.exec(await readFile(new URL('../supabase/migrations/20261026_maintenance_safeupdate.sql', import.meta.url), 'utf8'));
await db.exec('GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;');
await db.query("INSERT INTO auth.users VALUES ($1, '{\"maintenance_access\":true}', 'unchanged-secret-hash-1'), ($2, '{}', 'unchanged-secret-hash-2')", [actor, manager]);
await db.query("INSERT INTO staff (id,name,username,role) VALUES ($1,'Developer','developer','super_admin'), ($2,'Manager','manager','super_admin')", [actor, manager]);
await db.exec(`INSERT INTO owners(id,name,phone) VALUES ('o','Fake Owner','000');
 INSERT INTO cars(id,make,model,year,plate_number,daily_price_egp,owner_id) VALUES ('c','Test','Car',2026,'FAKE',10,'o');
 INSERT INTO customers(id,full_name,phone,national_id,license_number) VALUES ('u','Fake Customer','000','FAKE','FAKE');
 INSERT INTO coupons(id,code,discount_value,expires_at) VALUES ('p','FAKE',10,'2030-01-01');
 INSERT INTO bookings(id,booking_number,car_id,car_name,car_plate,customer,start_date,end_date,daily_rate_egp,total_rent_egp,final_total_egp,security_deposit_egp)
 VALUES ('b','TEST-B','c','Test Car','FAKE','{"id":"u"}','2026-01-01','2026-01-02',10,10,10,0);
 INSERT INTO invoices(id,invoice_number,booking_id,customer_name,customer_phone,car_details,total_amount_egp,deposit_amount_egp,issued_at,issued_by)
 VALUES ('i','TEST-I','b','Fake','000','Test',10,0,'2026-01-01','Fake');
 INSERT INTO audit_logs(id,action,staff_name,staff_role,timestamp,details) VALUES ('a','Fake','Fake','super_admin','2026-01-01','Fake activity');
 INSERT INTO site_visits(session_id) VALUES ('fake-session');`);
await db.query("INSERT INTO permission_requests(staff_id,requested_role,reason) VALUES ($1,'accountant','Fake request')", [manager]);
const snap = async () => (await db.query('SELECT maintenance_snapshot() AS value')).rows[0].value;
const accounts = async () => ({ staff: (await db.query('SELECT * FROM staff ORDER BY id')).rows, auth: (await db.query('SELECT * FROM auth.users ORDER BY id')).rows });
const apply = async (operation, state, data = null, id = randomUUID(), who = actor) =>
  (await db.query('SELECT maintenance_apply($1,$2,$3,$4,$5,$6) AS value', [operation, state.fingerprint, state.staffFingerprint, id, who, data])).rows[0].value;
let checks = 0;
const check = (label) => { checks++; console.log(`PASS ${label}`); };
try {
  const access = await db.query("SELECT has_function_privilege('authenticated','maintenance_snapshot()','EXECUTE') AS snapshot, has_function_privilege('anon','maintenance_apply(text,text,text,uuid,uuid,jsonb)','EXECUTE') AS apply");
  assert.equal(access.rows[0].snapshot, false); assert.equal(access.rows[0].apply, false); check('browser roles cannot invoke maintenance functions');
  const original = await snap(); const preserved = await accounts();
  await assert.rejects(apply('reset', original, null, randomUUID(), manager), /DEVELOPER_REQUIRED/); check('ordinary manager cannot run destructive maintenance');
  await db.exec("INSERT INTO site_visits(session_id) VALUES ('changed-after-backup')");
  await assert.rejects(apply('reset', original), /DATA_CHANGED_RETRY_BACKUP/); check('changed data invalidates prepared reset');
  const current = await snap();
  const invalid = structuredClone(current.data); invalid.cars[0].owner_id = 'missing-owner';
  await assert.rejects(apply('restore', current, invalid), /foreign key/);
  assert.deepEqual((await snap()).data, current.data);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM maintenance_events')).rows[0].n, 0); check('failed restore rolls back deletions, inserts and operation log');
  const ticket = randomUUID();
  await apply('reset', current, null, ticket);
  const empty = await snap(); assert.ok(Object.values(empty.data).every((rows) => rows.length === 0));
  assert.deepEqual(await accounts(), preserved); check('reset empties all nine business tables and preserves accounts/password hashes');
  await assert.rejects(apply('reset', empty, null, ticket), /duplicate key/); check('a consumed ticket cannot be replayed');
  await apply('restore', empty, current.data);
  assert.deepEqual((await snap()).data, current.data); assert.deepEqual(await accounts(), preserved); check('restore exactly reconstructs all business rows while preserving accounts');
  const state = await snap(); await apply('repair', state);
  assert.equal((await db.query("SELECT status FROM cars WHERE id='c'")).rows[0].status, 'rented');
  assert.deepEqual(await accounts(), preserved); check('targeted repair resolves active-contract/available-car mismatch');
  await db.exec("UPDATE cars SET status='maintenance' WHERE id='c'");
  await apply('repair', await snap());
  assert.equal((await db.query("SELECT status FROM cars WHERE id='c'")).rows[0].status, 'maintenance'); check('repair preserves maintenance states');
  console.log(`${checks} PostgreSQL transaction checks passed; no production connection was used.`);
} finally { await db.close(); }
