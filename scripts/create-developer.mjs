import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { provisionStaff } from './lib/provision-staff.mjs';

const project = 'olpjfipferziqtzrbbbt';
const args = process.argv.slice(2);
const apply = args.length === 2 && args[0] === '--create-for' && args[1] === project;
if (args.length && !apply) {
  console.error(`Usage: node scripts/create-developer.mjs [--create-for ${project}]`);
  process.exit(1);
}
nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key || !publicKey || new URL(url).hostname !== `${project}.supabase.co`) {
  console.error('Missing configuration or unexpected Supabase project; stopped.');
  process.exit(1);
}
const options = { auth: { persistSession: false, autoRefreshToken: false }, realtime: { transport: ws } };
const admin = createClient(url, key, options);
const privateDir = join(process.cwd(), '.private');
const credentialsPath = join(privateDir, 'developer-credentials.json');
const snapshotPath = join(privateDir, 'staff-before-developer.json');

try {
  if (!apply) {
    const { data, error } = await admin.from('staff').select('username, role, active');
    if (error) throw new Error('Could not inspect staff.');
    console.log(JSON.stringify({ project, mode: 'read-only', staffCount: data.length,
      usernameAvailable: !data.some((row) => row.username === 'developer'),
      newAccount: { username: 'developer', role: 'super_admin', name: 'حساب المبرمج' },
      scope: 'Create an additional account only. No data reset or existing-account changes.' }, null, 2));
  } else {
    const password = randomBytes(24).toString('base64url');
    let credentials;
    const result = await provisionStaff(admin, {
      username: 'developer', name: 'حساب المبرمج', password,
      beforeCreate: async ({ existingStaff, existingAuthIds, email }) => {
        await mkdir(privateDir, { recursive: true, mode: 0o700 });
        const createdAt = new Date().toISOString();
        await writeFile(snapshotPath, JSON.stringify({ project, createdAt, staff: existingStaff,
          authIds: existingAuthIds, scope: 'Staff snapshot only; not a full database/Auth backup.' }, null, 2),
        { flag: 'wx', mode: 0o600 });
        credentials = { project, username: 'developer', password, email, role: 'super_admin',
          createdAt, status: 'pending', note: 'Existing administrator role; backup/restore tools are not implemented yet.' };
        await writeFile(credentialsPath, JSON.stringify(credentials, null, 2), { flag: 'wx', mode: 0o600 });
      },
    });

    const { data: after, error: afterError } = await admin.from('staff').select('*');
    if (afterError) throw new Error('Created account, but staff preservation check could not complete.');
    const canonical = (value) => JSON.stringify(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
    if (result.existingStaff.some((old) => canonical(old) !== canonical(after.find((row) => row.id === old.id) || {}))) {
      throw new Error('Existing staff changed during provisioning; review snapshot. No existing accounts were written by this script.');
    }
    for (const id of result.existingAuthIds) {
      const { data, error } = await admin.auth.admin.getUserById(id);
      if (error || data.user?.id !== id) throw new Error('Created account, but existing sign-in account check failed.');
    }
    const client = createClient(url, publicKey, options);
    const { data: signedIn, error: loginError } = await client.auth.signInWithPassword({ email: result.email, password });
    if (loginError || signedIn.user?.id !== result.staff.id) throw new Error('Created account, but sign-in verification failed.');
    const { data: accessibleStaff, error: accessError } = await client.from('staff').select('id, role').eq('id', result.staff.id).single();
    if (accessError || accessibleStaff.role !== 'super_admin') throw new Error('Created account, but signed-in profile access failed.');
    const { error: signOutError } = await client.auth.signOut({ scope: 'local' });
    if (signOutError) throw new Error('Created account, but test-session sign-out failed.');
    credentials.status = 'verified';
    credentials.id = result.staff.id;
    await writeFile(credentialsPath, JSON.stringify(credentials, null, 2), { mode: 0o600 });
    console.log(JSON.stringify({ project, created: true, username: result.staff.username, role: result.staff.role,
      signInVerified: true, existingStaffUnchanged: result.existingStaff.length,
      existingAuthAccountsPresent: result.existingAuthIds.length, credentialsPath,
      resetPerformed: false }, null, 2));
  }
} catch (error) {
  // Supabase errors are not dumped: they can contain request details.
  console.error(error.message);
  console.error(`If creation started, inspect ${credentialsPath}; rerunning never resets a password.`);
  process.exitCode = 1;
}
