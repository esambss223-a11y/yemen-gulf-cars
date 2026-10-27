import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/server/staff-auth';
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from '@/lib/supabase-config';

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

  if (!/^[a-z0-9._-]{1,64}$/.test(username) || password.length < 1 || password.length > 256) {
    return Response.json({ code: 'INVALID_INPUT', error: 'يرجى إدخال اسم الموظف وكلمة المرور' }, { status: 400 });
  }
  const admin = createServiceClient();
  if (!admin) {
    return Response.json({ code: 'AUTH_SERVICE_UNAVAILABLE', error: 'خدمة التحقق من الموظفين غير مهيأة' }, { status: 503 });
  }

  // Username is resolved from the staff directory; users still authenticate through Supabase Auth.
  const { data: staff, error: staffError } = await admin
    .from('staff')
    .select('id, name, username, role, phone, active')
    .eq('username', username)
    .maybeSingle();

  if (staffError) {
    return Response.json({ code: 'STAFF_DIRECTORY_UNAVAILABLE', error: 'تعذر التحقق من سجل الموظف' }, { status: 503 });
  }
  if (!staff) {
    return Response.json({ code: 'STAFF_NOT_FOUND', error: 'اسم المستخدم غير موجود في جدول الموظفين.' }, { status: 404 });
  }
  if (!staff.active) {
    return Response.json({ code: 'STAFF_INACTIVE', error: 'حساب الموظف غير نشط.' }, { status: 403 });
  }

  const { data: authUserResult, error: authUserError } = await admin.auth.admin.getUserById(staff.id);
  const authEmail = authUserResult.user?.email;
  if (authUserError || !authEmail) {
    return Response.json({ code: 'AUTH_ACCOUNT_UNAVAILABLE', error: 'حساب الدخول المرتبط بالموظف غير متاح' }, { status: 503 });
  }

  const authClient = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authResult, error: authError } = await authClient.auth.signInWithPassword({
    email: authEmail,
    password,
  });

  if (authError || !authResult.session || !authResult.user) {
    return Response.json({
      code: 'AUTH_CREDENTIALS_REJECTED',
      error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
    }, { status: 401 });
  }

  if (authResult.user.id !== staff.id) {
    return Response.json({ code: 'AUTH_ACCOUNT_MISMATCH', error: 'حساب الدخول لا يطابق سجل الموظف' }, { status: 403 });
  }

  return Response.json({ session: authResult.session, staff: {
    ...staff,
    maintenanceAccess: staff.role === 'super_admin' && authResult.user.app_metadata?.maintenance_access === true,
  } });
}
