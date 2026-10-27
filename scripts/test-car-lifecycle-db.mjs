// Isolated PostgreSQL only. No Supabase connection or production mutations.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { PGlite } from '../.private/maintenance-test-runtime/node_modules/@electric-sql/pglite/dist/index.js';

const db = new PGlite();
await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY, raw_app_meta_data jsonb);');
const schema = await readFile(new URL('../supabase-schema.sql', import.meta.url), 'utf8');
await db.exec(schema.split('CREATE OR REPLACE FUNCTION public.is_active_staff()')[0] + '\nCOMMIT;');
const migration = await readFile(new URL('../supabase/migrations/20261027_car_lifecycle.sql', import.meta.url), 'utf8');
await db.exec(migration);
await db.exec(migration); // Idempotent installation.
const actor = '00000000-0000-4000-8000-000000000001';
const agent = '00000000-0000-4000-8000-000000000002';
await db.query("INSERT INTO auth.users VALUES ($1,'{}'),($2,'{}')", [actor, agent]);
await db.query("INSERT INTO staff(id,name,username,role) VALUES ($1,'Manager','test-manager','super_admin'),($2,'Agent','test-agent','rental_agent')", [actor, agent]);
const action = async (car, operation, booking = null, reason = null, user = actor) =>
  (await db.query('SELECT public.fleet_car_action($1,$2,$3,$4,$5) AS result', [user, car, operation, booking, reason])).rows[0].result;
const get = async (table, id) => (await db.query(`SELECT * FROM ${table} WHERE id = $1`, [id])).rows[0];
const seed = async (id, status) => {
  await db.query("INSERT INTO cars(id,make,model,year,plate_number,daily_price_egp) VALUES ($1,'Fake','Car',2026,$1,100)", [id]);
  if (status) await db.query(`INSERT INTO bookings(id,booking_number,car_id,car_name,car_plate,customer,start_date,end_date,
    daily_rate_egp,total_rent_egp,final_total_egp,security_deposit_egp,deposit_status,status)
    VALUES ($1,$1,$2,'Fake','FAKE','{"fullName":"Fake Customer"}','2000-01-01','2000-01-02',100,100,100,0,'pending',$3)`, [`b-${id}`, id, status]);
};
let tests = 0;
const test = async (label, run) => { await run(); tests++; process.stdout.write(`PASS ${label}\n`); };
try {
  await test('only service_role can execute and the actor must be an active administrator', async () => {
    const rights = (await db.query("SELECT has_function_privilege('anon','public.fleet_car_action(uuid,text,text,text,text)','EXECUTE') AS a, has_function_privilege('authenticated','public.fleet_car_action(uuid,text,text,text,text)','EXECUTE') AS b, has_function_privilege('service_role','public.fleet_car_action(uuid,text,text,text,text)','EXECUTE') AS c")).rows[0];
    assert.deepEqual(rights, { a: false, b: false, c: true });
    await seed('auth'); await assert.rejects(action('auth', 'archive', null, null, agent), /ADMIN_REQUIRED/);
    await db.query('UPDATE staff SET active = false WHERE id = $1', [actor]);
    await assert.rejects(action('auth', 'archive'), /ADMIN_REQUIRED/);
    await db.query('UPDATE staff SET active = true WHERE id = $1', [actor]);
  });
  await test('overdue active, confirmed, pending and unknown states block archive regardless of car status', async () => {
    for (const status of ['active', 'confirmed', 'pending_approval', 'unknown-state']) {
      await seed(status, status);
      await db.query("UPDATE cars SET status = 'maintenance' WHERE id = $1", [status]);
      await assert.rejects(action(status, 'archive'), /CAR_HAS_OPEN_BOOKINGS/);
      assert.equal((await get('cars', status)).status, 'maintenance');
    }
    await assert.rejects(action('active', 'cancel_booking', 'b-active', 'Fake reason'), /BOOKING_NOT_CANCELLABLE/);
  });
  await test('cancelling a pending request records the reason and releases its coupon exactly once', async () => {
    await db.exec("INSERT INTO coupons(id,code,discount_value,expires_at,used_count) VALUES ('coupon','FAKE',5,'2030-01-01',2); UPDATE bookings SET discount_code = 'FAKE' WHERE id = 'b-pending_approval';");
    await assert.rejects(action('pending_approval', 'cancel_booking', 'b-confirmed', 'Fake reason'), /BOOKING_NOT_CANCELLABLE/);
    await assert.rejects(action('pending_approval', 'cancel_booking', 'b-pending_approval', ' '), /REASON_REQUIRED/);
    const result = await action('pending_approval', 'cancel_booking', 'b-pending_approval', 'Customer changed plans');
    assert.equal(result.booking.status, 'cancelled'); assert.match(result.booking.notes, /Customer changed plans/);
    assert.equal((await get('coupons', 'coupon')).used_count, 1);
    await assert.rejects(action('pending_approval', 'cancel_booking', 'b-pending_approval', 'Again'), /BOOKING_NOT_CANCELLABLE/);
    assert.equal((await get('coupons', 'coupon')).used_count, 1);
  });
  await test('a confirmed reservation without collected funds can be cancelled without deleting its record', async () => {
    await action('confirmed', 'cancel_booking', 'b-confirmed', 'Customer cancelled');
    assert.equal((await get('bookings', 'b-confirmed')).status, 'cancelled');
  });
  await test('paid invoices and held deposits block cancellation and keep all amounts and statuses intact', async () => {
    await seed('paid', 'confirmed'); await seed('deposit', 'confirmed');
    await db.exec(`INSERT INTO invoices(id,invoice_number,booking_id,customer_name,customer_phone,car_details,total_amount_egp,deposit_amount_egp,issued_at,issued_by)
      VALUES ('invoice','I-TEST','b-paid','Fake','000','Fake',100,0,'2026-01-01','Fake');
      UPDATE bookings SET security_deposit_egp = 50, deposit_status = 'held' WHERE id = 'b-deposit';`);
    const before = JSON.stringify(await get('invoices', 'invoice'));
    for (const id of ['paid', 'deposit']) await assert.rejects(action(id, 'cancel_booking', `b-${id}`, 'Fake reason'), /SETTLEMENT_REQUIRED/);
    assert.equal(JSON.stringify(await get('invoices', 'invoice')), before);
    assert.equal((await get('bookings', 'b-deposit')).deposit_status, 'held');
    assert.equal((await get('bookings', 'b-paid')).status, 'confirmed');
  });
  await test('completed and cancelled history remains intact after archive, including paid invoices', async () => {
    await seed('closed', 'completed');
    await db.exec(`INSERT INTO invoices(id,invoice_number,booking_id,customer_name,customer_phone,car_details,total_amount_egp,deposit_amount_egp,issued_at,issued_by)
      VALUES ('closed-invoice','I-CLOSED','b-closed','Fake','000','Fake',100,0,'2026-01-01','Fake');`);
    const booking = JSON.stringify(await get('bookings', 'b-closed'));
    const invoice = JSON.stringify(await get('invoices', 'closed-invoice'));
    await action('closed', 'archive'); await action('pending_approval', 'archive');
    assert.equal((await get('cars', 'closed')).status, 'archived');
    assert.equal(JSON.stringify(await get('bookings', 'b-closed')), booking);
    assert.equal(JSON.stringify(await get('invoices', 'closed-invoice')), invoice);
  });
  await test('database guards stop a new request or reactivation on an archived car', async () => {
    await assert.rejects(db.exec("UPDATE bookings SET status = 'active' WHERE id = 'b-closed'"), /CAR_ARCHIVED/);
    await assert.rejects(db.exec(`INSERT INTO bookings SELECT 'new-b','NEW-B',car_id,car_name,car_plate,customer,start_date,start_time,end_date,end_time,
      actual_return_date,days_count,daily_rate_egp,total_rent_egp,discount_code,discount_amount_egp,final_total_egp,security_deposit_egp,deposit_status,
      start_km,return_km,'pending_approval',staff_id,staff_name,notes,created_at FROM bookings WHERE id = 'b-closed'`), /CAR_ARCHIVED/);
  });
  await test('restore requires the explicit action and returns to maintenance, never auto-available', async () => {
    await assert.rejects(db.exec("UPDATE cars SET status = 'available' WHERE id = 'closed'"), /CAR_ARCHIVED/);
    await action('closed', 'restore'); assert.equal((await get('cars', 'closed')).status, 'maintenance');
    await assert.rejects(action('closed', 'restore'), /CAR_NOT_ARCHIVED/);
  });
  await test('a car with any historical record cannot be physically deleted, including direct SQL', async () => {
    await assert.rejects(action('closed', 'delete'), /CAR_HAS_HISTORY/);
    await assert.rejects(db.exec("DELETE FROM cars WHERE id = 'closed'"), /CAR_HAS_HISTORY/);
    assert.ok(await get('bookings', 'b-closed')); assert.ok(await get('invoices', 'closed-invoice'));
    await seed('empty'); assert.equal((await action('empty', 'delete')).deleted, true); assert.equal(await get('cars', 'empty'), undefined);
  });
  await test('failed audit recording rolls the complete mutation back', async () => {
    await seed('rollback');
    await db.exec("CREATE FUNCTION fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'FAKE_AUDIT_FAILURE'; END $$; CREATE TRIGGER fail_audit BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION fail_audit();");
    await assert.rejects(action('rollback', 'archive'), /FAKE_AUDIT_FAILURE/);
    assert.equal((await get('cars', 'rollback')).status, 'available');
    await db.exec('DROP TRIGGER fail_audit ON audit_logs;');
  });
  await test('operational backup restore preserves archived cars with the new guards installed', async () => {
    await db.exec(await readFile(new URL('../supabase/migrations/20261026_maintenance.sql', import.meta.url), 'utf8'));
    await db.exec(await readFile(new URL('../supabase/migrations/20261026_maintenance_safeupdate.sql', import.meta.url), 'utf8'));
    await db.query("UPDATE auth.users SET raw_app_meta_data = '{\"maintenance_access\":true}' WHERE id = $1", [actor]);
    const snapshot = (await db.query('SELECT public.maintenance_snapshot() AS value')).rows[0].value;
    await db.query('SELECT public.maintenance_apply($1,$2,$3,$4,$5,$6)', ['restore', snapshot.fingerprint, snapshot.staffFingerprint,
      '00000000-0000-4000-8000-000000000009', actor, snapshot.data]);
    assert.equal((await get('cars', 'pending_approval')).status, 'archived');
    assert.equal((await get('bookings', 'b-pending_approval')).status, 'cancelled');
    assert.ok(await get('invoices', 'closed-invoice'));
  });
  process.stdout.write(`${tests} isolated PostgreSQL lifecycle checks passed. No live data modified.\n`);
} finally { await db.close(); }
