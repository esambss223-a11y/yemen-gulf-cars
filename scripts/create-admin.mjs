/**
 * أداة إنشاء/تحديث حسابات موظفي لوحة الإدارة
 * ---------------------------------------------
 * تنشئ المستخدم في Supabase Auth (مع تأكيد البريد) وتربطه بسجل في جدول staff.
 * تعمل بمفتاح الخدمة (SUPABASE_SERVICE_ROLE_KEY) من .env.local — وهو مفتاح
 * سري لا يُستخدم أبداً داخل مكونات العميل.
 *
 * الاستخدام:
 *   npm run create:admin -- --email admin@yemen-gulf-cars.com --password "كلمة المرور" --name "المدير العام" --role super_admin
 *   npm run create:admin -- --email admin@yemen-gulf-cars.com --update-password "كلمة المرور الجديدة"
 *
 * الأدوار المتاحة: super_admin | rental_agent | accountant
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const VALID_ROLES = ['super_admin', 'rental_agent', 'accountant'];

function loadEnvFile(filePath) {
  const parsed = {};
  if (!fs.existsSync(filePath)) return parsed;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const env = { ...loadEnvFile(path.join(process.cwd(), '.env.local')), ...process.env };

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ مفقود NEXT_PUBLIC_SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY في .env.local');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

const email = (args.email || '').trim().toLowerCase();
const password = args.password || args['update-password'];
const name = args.name || 'موظف';
const username = args.username || email.split('@')[0];
const role = args.role || 'rental_agent';
const phone = args.phone || '';

if (!email || !password) {
  console.error('❌ يلزم تمرير --email و --password (أو --update-password لتغيير كلمة المرور فقط)');
  process.exit(1);
}

if (!VALID_ROLES.includes(role)) {
  console.error(`❌ الدور يجب أن يكون واحداً من: ${VALID_ROLES.join(' | ')}`);
  process.exit(1);
}

async function findUserByEmail(targetEmail) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return (data?.users || []).find(
    (user) => (user.email || '').toLowerCase() === targetEmail.toLowerCase()
  );
}

async function ensureStaffRow(userId, staffData) {
  const { data, error } = await admin
    .from('staff')
    .upsert(
      {
        id: userId,
        name: staffData.name,
        username: staffData.username,
        role: staffData.role,
        phone: staffData.phone,
        active: true,
      },
      { onConflict: 'id' }
    )
    .select('id, name, username, role, active')
    .single();

  if (error) throw error;
  return data;
}

async function main() {
  console.log(`\n🔐 إعداد حساب لوحة الإدارة: ${email}\n`);

  let user = await findUserByEmail(email);

  if (user) {
    console.log('ℹ️  المستخدم موجود مسبقاً — سيتم تحديث كلمة المرور وتفعيل الحساب.');
    const { data, error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error) throw error;
    user = data.user;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error) throw error;
    user = data.user;
    console.log('✅ تم إنشاء المستخدم في Supabase Auth (تم تأكيد البريد).');
  }

  const staffRow = await ensureStaffRow(user.id, { name, username, role, phone });
  console.log('✅ تم ربطه بسجل الموظف في جدول staff:');
  console.table([staffRow]);

  if (anonKey) {
    const publicClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws },
    });
    const { data: session, error: signInError } = await publicClient.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      console.error(`\n⚠️  فشل التحقق من تسجيل الدخول: ${signInError.message}`);
      process.exit(1);
    }
    console.log(`\n✅ تم التحقق من تسجيل الدخول بنجاح (المستخدم: ${session.user.email}).`);
  }

  console.log(`\n📋 بيانات الدخول:
  البريد:       ${email}
  كلمة المرور:  ${password}
  الدور:        ${role}
  معرّف المستخدم: ${user.id}

  افتح /admin وسجّل الدخول بهذه البيانات.\n`);
}

main().catch((error) => {
  console.error(`\n❌ فشل التنفيذ: ${error?.message || error}`);
  process.exit(1);
});
