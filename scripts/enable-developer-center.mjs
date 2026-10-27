import { readFile, writeFile } from 'node:fs/promises';
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const project = 'olpjfipferziqtzrbbbt';
if (process.argv[2] !== '--enable-for' || process.argv[3] !== project || process.argv.length !== 4) {
  console.error(`Usage: node scripts/enable-developer-center.mjs --enable-for ${project}`); process.exit(1);
}
try {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || new URL(url).hostname !== `${project}.supabase.co` || !key) throw new Error('Unexpected configuration.');
  const credentials = JSON.parse(await readFile('.private/developer-credentials.json', 'utf8'));
  if (credentials.project !== project || credentials.username !== 'developer' || !credentials.id) throw new Error('Unexpected developer identity.');
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, realtime: { transport: ws } });
  const { data: staff, error } = await admin.from('staff').select('id,username,role,active').eq('id', credentials.id).single();
  if (error || staff.username !== 'developer' || staff.role !== 'super_admin' || !staff.active) throw new Error('Developer profile check failed.');
  const current = await admin.auth.admin.getUserById(staff.id);
  if (current.error || !current.data.user) throw new Error('Could not read developer account.');
  if (current.data.user.app_metadata?.maintenance_access === true) { console.log('Developer center already enabled; no changes.'); }
  else {
    await writeFile('.private/developer-access-before.json', JSON.stringify({ project, id: staff.id, app_metadata: current.data.user.app_metadata }, null, 2), { flag: 'wx', mode: 0o600 });
    const updated = await admin.auth.admin.updateUserById(staff.id, { app_metadata: { ...current.data.user.app_metadata, maintenance_access: true } });
    if (updated.error || updated.data.user?.app_metadata?.maintenance_access !== true) throw new Error('Could not enable developer center.');
    console.log(JSON.stringify({ project, username: 'developer', maintenanceAccess: true, passwordChanged: false, staffRoleChanged: false, resetPerformed: false }));
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
