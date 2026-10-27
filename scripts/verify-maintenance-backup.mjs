// Round-trip a downloaded backup in memory. This script has no network access code.
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { PGlite } from '../.private/maintenance-test-runtime/node_modules/@electric-sql/pglite/dist/index.js';

const [backupPath, schemaPath] = process.argv.slice(2);
if (!backupPath || !schemaPath) throw new Error('Pass the operational backup and its OpenAPI schema inventory paths.');
const backup = JSON.parse(await readFile(backupPath, 'utf8'));
const inventory = JSON.parse(await readFile(schemaPath, 'utf8'));
const tables = ['owners', 'cars', 'customers', 'coupons', 'bookings', 'invoices', 'site_visits', 'permission_requests', 'audit_logs'];
const allowedTypes = { text: 'text', numeric: 'numeric', int32: 'integer', int64: 'bigint', boolean: 'boolean', uuid: 'uuid',
  jsonb: 'jsonb', json: 'json', date: 'date', 'timestamp with time zone': 'timestamptz', 'timestamp without time zone': 'timestamp' };
const identifier = (name) => { if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error('Invalid schema identifier'); return `"${name}"`; };
const db = new PGlite();
try {
  await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE SCHEMA auth; CREATE TABLE auth.users(id UUID PRIMARY KEY,raw_app_meta_data JSONB DEFAULT '{}',encrypted_password TEXT);");
  const schema = await readFile(new URL('../supabase-schema.sql', import.meta.url), 'utf8');
  await db.exec(schema.split('CREATE OR REPLACE FUNCTION public.is_active_staff()')[0] + '\nCOMMIT;');
  // Project installations can predate columns present in the checked-in schema.
  // Match actual column names/types only in this isolated database, never in Supabase.
  const differences = [];
  for (const table of tables) {
    const properties = inventory.definitions[table]?.properties;
    if (!properties || !Array.isArray(backup.tables[table])) throw new Error('Incomplete schema/backup inventory');
    const existing = (await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1", [table])).rows.map((r) => r.column_name);
    for (const column of existing) {
      if (!(column in properties)) { await db.exec(`ALTER TABLE ${identifier(table)} DROP COLUMN ${identifier(column)}`); differences.push(`${table}.${column}`); }
    }
    for (const [column, definition] of Object.entries(properties)) {
      if (!existing.includes(column)) {
        const type = allowedTypes[definition.format || definition.type];
        if (!type) throw new Error('Unsupported schema type');
        await db.exec(`ALTER TABLE ${identifier(table)} ADD COLUMN ${identifier(column)} ${type}`);
        differences.push(`${table}.${column}`);
      }
    }
  }
  await db.exec(await readFile(new URL('../supabase/migrations/20261026_maintenance.sql', import.meta.url), 'utf8'));
  const actor = '00000000-0000-4000-8000-000000000001';
  const staffIds = new Set([actor]);
  for (const row of backup.tables.permission_requests) { staffIds.add(row.staff_id); if (row.reviewed_by) staffIds.add(row.reviewed_by); }
  for (const id of staffIds) {
    await db.query('INSERT INTO auth.users VALUES ($1,$2,$3)', [id, id === actor ? { maintenance_access: true } : {}, 'isolated-password-hash']);
    await db.query("INSERT INTO staff(id,name,username,role) VALUES ($1,'Isolated Test',$2,'super_admin')", [id, `test-${id}`]);
  }
  const state = (await db.query('SELECT maintenance_snapshot() AS value')).rows[0].value;
  await db.query("SELECT maintenance_apply('restore',$1,$2,$3,$4,$5)", [state.fingerprint, state.staffFingerprint, randomUUID(), actor, backup.tables]);
  const restored = (await db.query('SELECT maintenance_snapshot() AS value')).rows[0].value;
  assert.deepEqual(restored.data, backup.tables);
  assert.equal(restored.staffFingerprint, state.staffFingerprint);
  console.log(JSON.stringify({ isolatedRestoreVerified: true, tables: tables.length,
    records: Object.values(restored.data).reduce((sum, rows) => sum + rows.length, 0),
    localTestSchemaAdjustedToActualColumns: differences, productionDatabaseModified: false }, null, 2));
} finally { await db.close(); }
