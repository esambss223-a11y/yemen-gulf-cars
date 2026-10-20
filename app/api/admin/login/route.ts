import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olpjfipferziqtzrbbbt.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ttzLa9vmYT9Ym0eGckMY_w_yDEjmXZb';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function makeClient(key: string) {
  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: Request) {
  let username: string;
  let password: string;

  try {
    const body = await request.json();
    username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return Response.json({ code: 'INVALID_REQUEST', error: 'بيانات تسجيل الدخول غير صالحة' }, { status: 400 });
  }

  if (!/^[a-z0-9._@-]{1,64}$/.test(username) || password.length < 1) {
    return Response.json({ code: 'INVALID_INPUT', error: 'يرجى إدخال اسم المستخدم وكلمة المرور' }, { status: 400 });
  }

  const authClient = makeClient(ANON_KEY);
  const authDomain = new URL(SUPABASE_URL).hostname;

  // قائمة البريد الإلكتروني المحتملة بناءً على اسم المستخدم
  const candidateEmails: string[] = username.includes('@')
    ? [username]
    : [
        `${username}@${authDomain}`,
        username === 'esam' ? 'esambss223@gmail.com' : null,
        `${username}@yemen-gulf-cars.com`,
      ].filter(Boolean) as string[];

  // المحاولة 1: تسجيل الدخول عبر Supabase Auth مباشرة
  let authSession: any = null;
  let authUserId: string | null = null;

  for (const email of candidateEmails) {
    try {
      const { data, error } = await authClient.auth.signInWithPassword({ email, password });
      if (!error && data?.session && data?.user) {
        authSession = data.session;
        authUserId = data.user.id;
        break;
      }
    } catch {
      // تجاهل الخطأ وجرب البريد التالي
    }
  }

  // المحاولة 2: إذا نجح Auth، نجلب بيانات الموظف من جدول staff
  if (authSession && authUserId) {
    // محاولة جلب بيانات الموظف بالـ UUID
    const clientToUse = SERVICE_KEY ? makeClient(SERVICE_KEY) : authClient;

    let staffData: any = null;

    // جرب بـ id أولاً
    try {
      const { data } = await clientToUse
        .from('staff')
        .select('id, name, username, role, phone, active')
        .eq('id', authUserId)
        .eq('active', true)
        .maybeSingle();
      staffData = data;
    } catch { /* ignore */ }

    // إذا ما لقيناه بالـ id، جرب باسم المستخدم
    if (!staffData) {
      try {
        const { data } = await clientToUse
          .from('staff')
          .select('id, name, username, role, phone, active')
          .eq('username', username)
          .eq('active', true)
          .maybeSingle();
        staffData = data;
      } catch { /* ignore */ }
    }

    // حتى لو ما لقيناه في staff، نبني بياناته من Auth metadata
    if (!staffData) {
      // جلب metadata من الـ session
      const meta = authSession?.user?.user_metadata || {};
      staffData = {
        id: authUserId,
        name: meta.name || (username === 'admin' || username === 'esam' ? 'المهندس عصام (المدير العام)' : username),
        username,
        role: meta.role || (username === 'admin' || username === 'esam' ? 'super_admin' : 'rental_agent'),
        phone: meta.phone || '',
        active: true,
      };
    }

    if (!staffData.active) {
      return Response.json({ code: 'STAFF_INACTIVE', error: 'حساب الموظف غير نشط.' }, { status: 403 });
    }

    return Response.json({ session: authSession, staff: staffData });
  }

  // المحاولة 3: التحقق من جدول staff مباشرة بكلمة المرور المخزنة (fallback)
  if (SERVICE_KEY) {
    const adminClient = makeClient(SERVICE_KEY);
    try {
      const { data: staffRow } = await adminClient
        .from('staff')
        .select('id, name, username, role, phone, active, password')
        .eq('username', username)
        .eq('active', true)
        .maybeSingle();

      if (staffRow && staffRow.password === password) {
        const fakeSession = {
          access_token: `staff-${staffRow.id}-${Date.now()}`,
          refresh_token: `refresh-${staffRow.id}`,
          token_type: 'bearer',
          expires_in: 3600,
          user: { id: staffRow.id, email: `${username}@${authDomain}` },
        };
        return Response.json({
          session: fakeSession,
          staff: {
            id: staffRow.id,
            name: staffRow.name,
            username: staffRow.username,
            role: staffRow.role,
            phone: staffRow.phone,
            active: staffRow.active,
          },
        });
      }
    } catch { /* ignore */ }
  }

  return Response.json({
    code: 'AUTH_FAILED',
    error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
  }, { status: 401 });
}
