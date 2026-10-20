import { createInterface } from 'node:readline/promises';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { stdin, stdout } from 'node:process';
import { join } from 'node:path';
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('إعدادات Supabase غير مكتملة. يلزم NEXT_PUBLIC_SUPABASE_URL وSUPABASE_SERVICE_ROLE_KEY في .env.local.');
  process.exit(1);
}

const projectUrl = new URL(url);
const projectRef = projectUrl.hostname.split('.')[0];
const internalDomain = projectUrl.hostname;
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

const terminal = createInterface({ input: stdin, output: stdout });

async function listAllAuthUsers() {
  const users = [];
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`تعذر جرد حسابات Auth (HTTP ${error.status || 'unknown'}).`);
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
  throw new Error('تجاوز عدد حسابات Auth الحد الآمن للجرد؛ لم يبدأ الحذف.');
}

async function deleteAuthUser(id) {
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error && error.status !== 404 && error.code !== 'user_not_found') {
    throw new Error(`تعذر حذف حساب Auth (${error.code || error.status || 'unknown'}). توقف التنظيف لتجنب إكماله جزئيًا.`);
  }
}

try {
  stdout.write(`المشروع المستهدف: ${projectRef}\nاسم الدخول الإداري سيكون: admin\nتأكد أن بيئة الموقع المنشور تستخدم هذا المشروع نفسه.\nسيُحذف موظفو هذا المشروع فقط، وتبقى السيارات والعملاء والحجوزات كما هي.\n`);
  const typedProject = (await terminal.question('اكتب معرّف المشروع أعلاه للمتابعة: ')).trim();
  if (typedProject !== projectRef) throw new Error('معرّف المشروع غير مطابق؛ لم يبدأ أي حذف.');

  const adminName = ((await terminal.question('اسم المدير الظاهر في اللوحة (الافتراضي: Administrator): ')).trim() || 'Administrator');
  const credentialsPath = join(process.cwd(), '.staff-admin-credentials.txt');
  let password;

  stdin.resume();
  terminal.resume();
  const confirmation = (await terminal.question('هذا حذف نهائي لكل حسابات موظفي التطبيق في هذا المشروع. اكتب DELETE STAFF USERS للمتابعة: ')).trim();
  if (confirmation !== 'DELETE STAFF USERS') throw new Error('تم الإلغاء؛ لم يبدأ الحذف.');

  try {
    const savedCredentials = await readFile(credentialsPath, 'utf8');
    password = savedCredentials.match(/^كلمة المرور المؤقتة: (.+)$/m)?.[1];
    const savedProject = savedCredentials.match(/^المشروع: (.+)$/m)?.[1];
    if (!password) throw new Error('ملف بيانات الدخول موجود لكن تعذر قراءة كلمة المرور. انقله لمكان آمن ثم أعد التشغيل.');
    if (savedProject !== projectRef) throw new Error('ملف بيانات الدخول يعود إلى مشروع آخر. انقله لمكان آمن ثم أعد التشغيل.');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    password = randomBytes(24).toString('base64url');
    await writeFile(credentialsPath, `اسم المستخدم: admin\nكلمة المرور المؤقتة: ${password}\nالمشروع: ${projectRef}\n`, { flag: 'wx', mode: 0o600 });
  }

  const { data: staffRows, error: staffReadError } = await admin
    .from('staff')
    .select('id, username');
  if (staffReadError) throw new Error(`تعذر قراءة جدول staff (${staffReadError.code || 'unknown'}). لم يبدأ الحذف.`);

  const internalEmail = `admin@${internalDomain}`;
  let authUsers = await listAllAuthUsers();
  let adminUser = authUsers.find((user) => user.email?.toLowerCase() === internalEmail.toLowerCase());

  if (!adminUser) {
    const { data, error } = await admin.auth.admin.createUser({
      email: internalEmail,
      password,
      email_confirm: true,
      user_metadata: { name: adminName, username: 'admin', role: 'super_admin' },
    });
    if (error || !data.user) throw new Error(`تعذر إنشاء حساب Auth الإداري (${error?.code || error?.status || 'unknown'}). لم تُحذف الحسابات القديمة.`);
    adminUser = data.user;
  } else {
    const { data, error } = await admin.auth.admin.updateUserById(adminUser.id, {
      password,
      email_confirm: true,
      user_metadata: { ...adminUser.user_metadata, name: adminName, username: 'admin', role: 'super_admin' },
    });
    if (error || !data.user) throw new Error(`تعذر تحديث حساب admin (${error?.code || error?.status || 'unknown'}). لم تُحذف الحسابات القديمة.`);
    adminUser = data.user;
  }

  for (const row of staffRows || []) {
    if (row.id !== adminUser.id && row.username === 'admin') {
      await deleteAuthUser(row.id);
    }
  }

  const { data: adminStaff, error: upsertError } = await admin
    .from('staff')
    .upsert({
      id: adminUser.id,
      name: adminName,
      username: 'admin',
      role: 'super_admin',
      phone: '',
      active: true,
    }, { onConflict: 'id' })
    .select('id')
    .single();
  if (upsertError || !adminStaff) {
    throw new Error(`تعذر ربط admin بجدول staff (${upsertError?.code || 'unknown'}). حساب Auth الإداري أُنشئ؛ لم يبدأ حذف بقية الحسابات.`);
  }

  const remainingAuthUsers = await listAllAuthUsers();
  const staffIds = new Set((staffRows || []).map((row) => row.id));
  const employeeAuthUsers = remainingAuthUsers.filter((user) =>
    user.id !== adminUser.id && (
      staffIds.has(user.id) || user.email?.toLowerCase().endsWith(`@${internalDomain}`)
    ),
  );
  for (const user of employeeAuthUsers) await deleteAuthUser(user.id);

  const { error: deleteStaffError } = await admin
    .from('staff')
    .delete()
    .neq('id', adminUser.id);
  if (deleteStaffError) throw new Error(`تعذر حذف بعض سجلات staff (${deleteStaffError.code || 'unknown'}). حساب admin موجود، لكن التنظيف يحتاج مراجعة.`);

  const { data: finalStaff, error: verifyError } = await admin.from('staff').select('id, username, role, active');
  if (verifyError || finalStaff?.length !== 1 || finalStaff[0]?.id !== adminUser.id || finalStaff[0]?.username !== 'admin' || finalStaff[0]?.role !== 'super_admin' || !finalStaff[0]?.active) {
    throw new Error('تعذر تأكيد أن admin هو سجل الموظفين الوحيد. راجع جدول staff قبل المتابعة.');
  }

  console.log(`اكتمل التنظيف في المشروع ${projectRef}. بيانات الدخول محفوظة محليًا في .staff-admin-credentials.txt. افتح الملف بعد تشغيل الأمر وسجّل الدخول ثم غيّر كلمة المرور.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'فشلت العملية.');
  process.exitCode = 1;
} finally {
  terminal.close();
}
