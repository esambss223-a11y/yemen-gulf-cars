import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authorizeStaffRequest } from '@/lib/server/staff-auth';
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from '@/lib/supabase-config';
import { makeBackup, makeTicket, readTicket, validateBackup, MAX_MAINTENANCE_BYTES } from '@/lib/server/maintenance-format';
import { MAINTENANCE_TABLES, MAINTENANCE_PHRASES, type MaintenanceHealth, type MaintenanceOperation, type MaintenanceSnapshot } from '@/types/maintenance';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers });
const project = () => new URL(SUPABASE_URL).hostname.split('.')[0];
const secret = () => {
  const key = process.env.MAINTENANCE_BACKUP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error('NOT_CONFIGURED');
  return key;
};
const messages: Record<string, string> = {
  INVALID_BACKUP: 'الملف ليس نسخة بيانات تشغيل صالحة لهذا المشروع.',
  INVALID_BACKUP_SIGNATURE: 'تعذر التحقق من توقيع النسخة. الملف تغيّر أو مفتاح توقيعه تغيّر؛ لم تُعدّل البيانات.',
  BACKUP_TOO_LARGE: 'حجم النسخة يتجاوز الحد المتاح هنا. استخدم النسخ الكامل من Supabase.',
  INVALID_TICKET: 'انتهت صلاحية التأكيد أو تغيّر الطلب. جهّز نسخة جديدة وأعد المحاولة.',
  DATA_CHANGED_RETRY_BACKUP: 'تغيّرت البيانات منذ أخذ النسخة. لم تنفّذ العملية؛ نزّل نسخة جديدة أولًا.',
  ENGINE_NOT_READY: 'يلزم تثبيت ملف إعداد مركز الصيانة في Supabase قبل استخدام هذه العملية.',
  INVALID_REQUEST: 'طلب الصيانة غير صالح.',
};
function failed(error: unknown) {
  const code = error instanceof Error ? error.message : 'UNKNOWN';
  return json({ error: messages[code] || 'تعذر إكمال العملية. لم تُنفّذ عملية حذف جزئية؛ أعد الفحص لمعرفة حالة النظام.' }, code === 'ENGINE_NOT_READY' ? 503 : 400);
}
async function developer(request: Request) {
  const auth = await authorizeStaffRequest(request, true);
  if (!auth.ok) return { response: json({ error: auth.error }, auth.status) };
  if (!auth.staff.maintenanceAccess) return { response: json({ error: 'هذا القسم مخصص لحساب المبرمج.' }, 403) };
  return { auth };
}
async function readBody(request: Request) {
  const declared = Number(request.headers.get('content-length'));
  if (declared > MAX_MAINTENANCE_BYTES || !request.body) throw new Error('BACKUP_TOO_LARGE');
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_MAINTENANCE_BYTES) { await reader.cancel(); throw new Error('BACKUP_TOO_LARGE'); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(parts).toString('utf8'));
}

export async function GET(request: Request) {
  const result = await developer(request);
  if (!result.auth) return result.response;
  const { admin } = result.auth;
  const start = Date.now();
  const [staff, authUsers, storage, engine, ...tables] = await Promise.all([
    admin.from('staff').select('id', { head: true, count: 'exact' }),
    admin.auth.admin.listUsers({ page: 1, perPage: 1 }), admin.storage.listBuckets(),
    admin.rpc('maintenance_info'),
    ...MAINTENANCE_TABLES.map((table) => admin.from(table).select('id', { head: true, count: 'exact' })),
  ]);
  const counts: MaintenanceHealth['counts'] = {};
  const errors: string[] = [];
  tables.forEach((table, index) => { if (table.error) errors.push(`تعذرت قراءة جدول ${MAINTENANCE_TABLES[index]}`); else counts[MAINTENANCE_TABLES[index]] = table.count ?? 0; });
  if (staff.error) errors.push('تعذر فحص دليل الموظفين');
  if (authUsers.error) errors.push('تعذر فحص خدمة حسابات الدخول');
  if (storage.error) errors.push('تعذر فحص خدمة الملفات');
  const ready = !engine.error && engine.data?.version === 1;
  const data: MaintenanceHealth = { checkedAt: new Date().toISOString(), project: project(),
    database: !staff.error && !tables.some((t) => t.error), auth: !authUsers.error, storage: !storage.error,
    latencyMs: Date.now() - start, staffCount: staff.count, authCount: authUsers.error ? null : authUsers.data.total,
    buckets: storage.data?.length ?? null, engineReady: ready, counts,
    issues: ready ? [{ label: 'سيارات متاحة رغم وجود عقد نشط', count: Number(engine.data.repairableCars) },
      { label: 'حجوزات مرتبطة بسيارات غير موجودة', count: Number(engine.data.orphanBookings) }] : [],
    errors, history: ready && Array.isArray(engine.data.history) ? engine.data.history : [] };
  return json(data);
}

export async function POST(request: Request) {
  const result = await developer(request);
  if (!result.auth) return result.response;
  const { admin, user } = result.auth;
  try {
    const body = await readBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('INVALID_REQUEST');
    if (body.action === 'inspect') {
      const backup = validateBackup(body.backup, project(), secret());
      return json({ createdAt: backup.createdAt, counts: Object.fromEntries(MAINTENANCE_TABLES.map((table) => [table, backup.tables[table].length])) });
    }
    if (body.action === 'backup' || body.action === 'prepare') {
      const operation = body.operation as MaintenanceOperation;
      if (body.action === 'prepare' && !['reset', 'restore', 'repair'].includes(operation)) throw new Error('INVALID_REQUEST');
      const restore = operation === 'restore' ? validateBackup(body.backup, project(), secret()) : null;
      const snapshot = await admin.rpc('maintenance_snapshot');
      if (snapshot.error || !snapshot.data?.data) throw new Error('ENGINE_NOT_READY');
      const state = snapshot.data as MaintenanceSnapshot;
      const backup = makeBackup(state, project(), secret());
      const ticket = body.action === 'prepare' ? makeTicket(user.id, project(), operation, state, restore?.checksum ?? null, secret()) : null;
      const response = { backup, ticket, expiresInSeconds: 300 };
      if (Buffer.byteLength(JSON.stringify(response)) > MAX_MAINTENANCE_BYTES - 10_000) throw new Error('BACKUP_TOO_LARGE');
      return json(response);
    }
    if (body.action !== 'apply') throw new Error('INVALID_REQUEST');
    const ticket = readTicket(body.ticket, user.id, project(), secret());
    if (body.confirmation !== MAINTENANCE_PHRASES[ticket.operation] || body.backupSaved !== true ||
      typeof body.password !== 'string' || body.password.length < 1 || body.password.length > 256 || !user.email) throw new Error('INVALID_REQUEST');
    const restore = ticket.operation === 'restore' ? validateBackup(body.backup, project(), secret()) : null;
    if ((restore?.checksum ?? null) !== ticket.restoreChecksum) throw new Error('INVALID_BACKUP');
    // Supabase validates the password again; a copied/stale UI ticket is not enough.
    const verifier = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const checked = await verifier.auth.signInWithPassword({ email: user.email, password: body.password });
    if (checked.error || checked.data.user?.id !== user.id) return json({ error: 'كلمة مرور حساب المبرمج غير صحيحة.' }, 401);
    const logout = await verifier.auth.signOut({ scope: 'local' });
    if (logout.error) return json({ error: 'تعذر إنهاء جلسة التحقق. لم تبدأ العملية.' }, 503);
    const applied = await admin.rpc('maintenance_apply', { operation_name: ticket.operation,
      expected_fingerprint: ticket.fingerprint, expected_staff_fingerprint: ticket.staffFingerprint,
      ticket_id: ticket.id, actor: user.id, restore_data: restore?.tables ?? null });
    if (applied.error) {
      if (applied.error.message.includes('DATA_CHANGED_RETRY_BACKUP')) throw new Error('DATA_CHANGED_RETRY_BACKUP');
      if (applied.error.code === '23505') throw new Error('INVALID_TICKET');
      if (applied.error.code === 'PGRST202') throw new Error('ENGINE_NOT_READY');
      console.error('[maintenance:database-rejected]', { operation: ticket.operation, code: applied.error.code });
      if (applied.error.code === '21000' && /requires a WHERE clause/i.test(applied.error.message)) {
        return json({ code: 'MAINTENANCE_SAFEUPDATE', error: 'حماية قاعدة البيانات رفضت أمرًا بلا شرط حذف. يلزم تحديث وظائف مركز الصيانة؛ لم تُحذف البيانات.' }, 409);
      }
      if (applied.error.code === '23503') {
        return json({ code: 'MAINTENANCE_FOREIGN_KEY', error: 'توجد ارتباطات في قاعدة البيانات تمنع العملية. تراجعت التغييرات كاملة؛ يلزم مراجعة الارتباطات قبل المحاولة مجددًا.' }, 409);
      }
      if (applied.error.code === '42501') {
        return json({ code: 'MAINTENANCE_PERMISSION', error: 'صلاحيات وظائف الصيانة في قاعدة البيانات غير مكتملة. لم تُنفّذ العملية؛ يلزم مراجعة إعداد الوظائف.' }, 409);
      }
      return json({ error: 'رفضت قاعدة البيانات العملية وتراجعت عن تغييراتها. افحص النسخة والارتباطات ثم أعد المحاولة.' }, 409);
    }
    return json({ success: true, ...applied.data });
  } catch (error) { return failed(error); }
}
