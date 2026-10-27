import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const nativeRequire = createRequire(import.meta.url);
function load(relative, overrides = {}) {
  const source = readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, Buffer, URL, Date, console, process: { env: { SUPABASE_SERVICE_ROLE_KEY: 'server-test-key' } },
    require(name) {
      if (name in overrides) return overrides[name];
      if (name === '@/types/maintenance') return load('types/maintenance.ts');
      if (name.startsWith('node:')) return nativeRequire(name);
      throw new Error(`Unexpected dependency ${name}`);
    } });
  return exports;
}
const format = load('lib/server/maintenance-format.ts');
const types = load('types/maintenance.ts');
const snapshot = { data: Object.fromEntries(types.MAINTENANCE_TABLES.map((table) => [table, []])), fingerprint: 'abc', staffFingerprint: 'def' };
const secret = 'local-test-signature-secret';
test('signed operational backup round-trips', () => {
  const backup = format.makeBackup(snapshot, 'test-project', secret);
  assert.equal(format.validateBackup(backup, 'test-project', secret).checksum, backup.checksum);
});
test('modified, cross-project and wrong-key backups are refused', () => {
  const backup = format.makeBackup(snapshot, 'test-project', secret);
  assert.throws(() => format.validateBackup(backup, 'another-project', secret), /INVALID_BACKUP/);
  assert.throws(() => format.validateBackup(backup, 'test-project', 'different-key'), /SIGNATURE/);
  backup.tables.cars.push({ id: 'tampered' });
  assert.throws(() => format.validateBackup(backup, 'test-project', secret), /SIGNATURE/);
});
test('backups cannot introduce account tables', () => {
  const backup = format.makeBackup(snapshot, 'test-project', secret);
  backup.tables.staff = [{ role: 'super_admin' }];
  assert.throws(() => format.validateBackup(backup, 'test-project', secret), /INVALID_BACKUP/);
});
test('confirmation tickets are signed and bound to actor and project', () => {
  const ticket = format.makeTicket('developer', 'test-project', 'reset', snapshot, null, secret);
  assert.equal(format.readTicket(ticket, 'developer', 'test-project', secret).operation, 'reset');
  assert.throws(() => format.readTicket(ticket, 'someone-else', 'test-project', secret), /INVALID_TICKET/);
  assert.throws(() => format.readTicket(ticket, 'developer', 'another-project', secret), /INVALID_TICKET/);
  assert.throws(() => format.readTicket(ticket + '0', 'developer', 'test-project', secret), /INVALID_TICKET/);
});

function authFixture({ role = 'super_admin', active = true, app = {}, metadata = {} } = {}) {
  const staff = { id: 'staff-id', name: 'Test', username: 'developer', role, active };
  const admin = { from() { return { select() { return { eq() { return { async maybeSingle() { return { data: staff, error: null }; } }; } }; } }; } };
  const auth = { auth: { async getUser() { return { data: { user: { id: staff.id, app_metadata: app, user_metadata: metadata } }, error: null }; } } };
  return load('lib/server/staff-auth.ts', {
    'server-only': {}, '@supabase/supabase-js': { createClient: (_url, key) => key === 'server-test-key' ? admin : auth },
    '@/lib/supabase-config': { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_PUBLIC_KEY: 'public-test-key' },
  });
}
const request = () => new Request('https://test/api/admin/maintenance', { headers: { Authorization: 'Bearer test-token' } });
test('user-editable metadata and username cannot grant maintenance access', async () => {
  const auth = authFixture({ metadata: { maintenance_access: true } });
  const result = await auth.authorizeStaffRequest(request(), true);
  assert.equal(result.ok, true); assert.equal(result.staff.maintenanceAccess, false);
});
test('only active administrator with server-managed flag receives maintenance access', async () => {
  const allowed = await authFixture({ app: { maintenance_access: true } }).authorizeStaffRequest(request(), true);
  assert.equal(allowed.staff.maintenanceAccess, true);
  const ordinary = await authFixture().authorizeStaffRequest(request(), true);
  assert.equal(ordinary.staff.maintenanceAccess, false);
  for (const role of ['rental_agent', 'accountant']) {
    const result = await authFixture({ role, app: { maintenance_access: true } }).authorizeStaffRequest(request(), true);
    assert.equal(result.ok, false); assert.equal(result.status, 403);
  }
  const inactive = await authFixture({ active: false, app: { maintenance_access: true } }).authorizeStaffRequest(request(), true);
  assert.equal(inactive.ok, false);
});

function routeFixture({ allowed = true, passwordValid = true, databaseError = null } = {}) {
  const calls = [];
  const route = load('app/api/admin/maintenance/route.ts', {
    'next/server': { NextResponse: { json: Response.json.bind(Response) } },
    '@/lib/server/staff-auth': { async authorizeStaffRequest() { return { ok: true, staff: { maintenanceAccess: allowed },
      user: { id: 'developer', email: 'test@example.com' }, admin: { async rpc(name, input) {
        calls.push({ name, input }); return { data: { affected: 0, accountsPreserved: true }, error: databaseError };
      } } }; } },
    '@/lib/server/maintenance-format': format,
    '@/lib/supabase-config': { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_PUBLIC_KEY: 'public-test-key' },
    '@supabase/supabase-js': { createClient() { return { auth: {
      async signInWithPassword() { calls.push('password-check'); return passwordValid
        ? { data: { user: { id: 'developer' } }, error: null } : { data: {}, error: { message: 'bad password' } }; },
      async signOut(options) { assert.equal(options.scope, 'local'); calls.push('close-test-session'); return { error: null }; },
    } }; } },
  });
  return { route, calls };
}
const applyBody = () => ({ action: 'apply', ticket: format.makeTicket('developer', 'test', 'reset', snapshot, null, 'server-test-key'),
  confirmation: types.MAINTENANCE_PHRASES.reset, password: 'test-password', backupSaved: true });
const post = (body) => new Request('https://test/api/admin/maintenance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
test('maintenance API denies ordinary managers before reading or mutating data', async () => {
  const f = routeFixture({ allowed: false });
  assert.equal((await f.route.POST(post(applyBody()))).status, 403);
  assert.equal((await f.route.GET(request())).status, 403);
  assert.deepEqual(f.calls, []);
});
test('operation phrase and saved-backup confirmation are mandatory', async () => {
  for (const invalid of [{ confirmation: 'wrong' }, { backupSaved: false }, { password: '' }]) {
    const f = routeFixture();
    assert.equal((await f.route.POST(post({ ...applyBody(), ...invalid }))).status, 400);
    assert.deepEqual(f.calls, []);
  }
});
test('wrong password prevents the database mutation RPC', async () => {
  const f = routeFixture({ passwordValid: false });
  assert.equal((await f.route.POST(post(applyBody()))).status, 401);
  assert.deepEqual(f.calls, ['password-check']);
});
test('verified operation invokes one atomic RPC after password verification', async () => {
  const f = routeFixture();
  assert.equal((await f.route.POST(post(applyBody()))).status, 200);
  assert.equal(f.calls[0], 'password-check'); assert.equal(f.calls[1], 'close-test-session');
  assert.equal(f.calls[2].name, 'maintenance_apply');
  assert.equal(f.calls[2].input.operation_name, 'reset');
  assert.equal(f.calls[2].input.actor, 'developer');
  assert.equal(f.calls.length, 3);
});
test('safeupdate rejection reports the specific migration requirement', async () => {
  const f = routeFixture({ databaseError: { code: '21000', message: 'DELETE requires a WHERE clause' } });
  const response = await f.route.POST(post(applyBody()));
  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.code, 'MAINTENANCE_SAFEUPDATE');
  assert.match(body.error, /تحديث وظائف/);
});
