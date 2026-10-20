import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return Response.json({ error: 'إعدادات تسجيل الدخول غير مكتملة على الخادم' }, { status: 500 });
  }

  let username: string;
  let password: string;
  try {
    const body = await request.json();
    username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return Response.json({ error: 'بيانات تسجيل الدخول غير صالحة' }, { status: 400 });
  }

  if (!/^[a-z0-9._-]{1,64}$/.test(username) || password.length < 1 || password.length > 256) {
    return Response.json({ error: 'اسم الموظف أو كلمة المرور غير صحيحة' }, { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const auth = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: staff, error: staffError } = await admin
    .from('staff')
    .select('id, name, username, role, phone, active')
    .eq('username', username)
    .maybeSingle();

  if (staffError || !staff?.active) {
    return Response.json({ error: 'اسم الموظف أو كلمة المرور غير صحيحة' }, { status: 401 });
  }

  const { data: userResult, error: userError } = await admin.auth.admin.getUserById(staff.id);
  const email = userResult?.user?.email;
  if (userError || !email) {
    return Response.json({ error: 'تعذر التحقق من حساب الموظف' }, { status: 401 });
  }

  const { data: authResult, error: authError } = await auth.auth.signInWithPassword({ email, password });
  if (authError || !authResult.session) {
    return Response.json({ error: 'اسم الموظف أو كلمة المرور غير صحيحة' }, { status: 401 });
  }

  return Response.json({ session: authResult.session, staff });
}
