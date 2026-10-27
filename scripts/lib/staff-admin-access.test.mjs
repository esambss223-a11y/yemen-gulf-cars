import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../../app/api/admin/staff/route.ts', import.meta.url), 'utf8');
function loadRoute(role) {
  const writes = [];
  const admin = {
    from() { return {
      select() { return { eq() { return { async maybeSingle() { return { data: null, error: null }; } }; } }; },
      upsert(row) { writes.push(['directory', row]); return { select() { return { async single() { return { data: row, error: null }; } }; } }; },
    }; },
    auth: { admin: { async createUser(input) { writes.push(['auth', input]); return { data: { user: { id: 'new-manager' } }, error: null }; } } },
  };
  const exports = {};
  const authorizeStaffRequest = async (_request, requireAdmin) => {
    assert.equal(requireAdmin, true);
    return role === 'super_admin'
      ? { ok: true, admin, user: { id: 'developer-id' }, staff: { role } }
      : { ok: false, status: role ? 403 : 401, error: 'Denied' };
  };
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, URL, process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co' } },
    console, require(name) {
      if (name === 'next/server') return { NextResponse: { json: Response.json.bind(Response) } };
      if (name === '@/lib/server/staff-auth') return { authorizeStaffRequest };
      throw new Error('Unexpected dependency');
    } });
  return { handlers: exports, writes };
}
const request = () => new Request('https://example.com/api/admin/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'New manager', username: 'new_manager', password: 'test-password-only', role: 'super_admin' }) });

test('administrator provisioning endpoint accepts another manager role', async () => {
  const { handlers, writes } = loadRoute('super_admin');
  const response = await handlers.POST(request());
  assert.equal(response.status, 201);
  assert.equal((await response.json()).staff.role, 'super_admin');
  assert.equal(writes[0][1].user_metadata.role, 'super_admin');
  assert.equal(writes[1][1].role, 'super_admin');
});
for (const [role, expected] of [[null, 401], ['rental_agent', 403], ['accountant', 403]]) {
  test(`${role || 'anonymous'} cannot create a manager`, async () => {
    const { handlers, writes } = loadRoute(role);
    const response = await handlers.POST(request());
    assert.equal(response.status, expected);
    assert.deepEqual(writes, []);
  });
}
