import test from 'node:test';
import assert from 'node:assert/strict';
import { provisionStaff } from './provision-staff.mjs';

function fixture({ duplicateStaff = false, duplicateAuth = false, insertFails = false, rollbackFails = false } = {}) {
  const writes = [];
  const staff = [{ id: 'old-staff', username: duplicateStaff ? 'developer' : 'saleh', role: 'super_admin', active: true }];
  const users = [{ id: 'old-auth', email: duplicateAuth ? 'developer@example.supabase.co' : 'old@example.com' }];
  const client = {
    supabaseUrl: 'https://example.supabase.co',
    from(table) {
      assert.equal(table, 'staff');
      return {
        async select() { return { data: staff, error: null }; },
        insert(row) {
          writes.push(['insert', row]);
          return { select() { return { async single() { return insertFails
            ? { data: null, error: { code: 'failed' } } : { data: row, error: null }; } }; } };
        },
      };
    },
    auth: { admin: {
      async listUsers() { return { data: { users }, error: null }; },
      async createUser(input) { writes.push(['create', input]); return { data: { user: { id: 'new-auth' } }, error: null }; },
      async deleteUser(id) { writes.push(['delete', id]); return { error: rollbackFails ? { code: 'failed' } : null }; },
    } },
  };
  return { client, writes, staff };
}
const input = { username: 'developer', name: 'Programmer', password: 'generated-long-random-password', beforeCreate: async () => {} };

test('adds an administrator without updating existing accounts', async () => {
  const f = fixture();
  const original = structuredClone(f.staff);
  const result = await provisionStaff(f.client, input);
  assert.equal(result.staff.role, 'super_admin');
  assert.deepEqual(f.staff, original);
  assert.deepEqual(f.writes.map(([operation]) => operation), ['create', 'insert']);
});
for (const option of ['duplicateStaff', 'duplicateAuth']) {
  test(`${option} never overwrites or resets an account`, async () => {
    const f = fixture({ [option]: true });
    await assert.rejects(provisionStaff(f.client, input), /already exists/);
    assert.deepEqual(f.writes, []);
  });
}
test('backup/credential persistence failure prevents account creation', async () => {
  const f = fixture();
  await assert.rejects(provisionStaff(f.client, { ...input, beforeCreate: async () => { throw new Error('disk full'); } }), /disk full/);
  assert.deepEqual(f.writes, []);
});
test('directory failure rolls back only the newly created account', async () => {
  const f = fixture({ insertFails: true });
  await assert.rejects(provisionStaff(f.client, input), /rolled back/);
  assert.deepEqual(f.writes.at(-1), ['delete', 'new-auth']);
});
test('rollback failure reports recovery requirement', async () => {
  const f = fixture({ insertFails: true, rollbackFails: true });
  await assert.rejects(provisionStaff(f.client, input), /manual recovery/);
  assert.deepEqual(f.writes.at(-1), ['delete', 'new-auth']);
});
