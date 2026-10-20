import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/server/staff-auth';

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const admin = createServiceClient();
  if (!url || !anonKey || !admin) {
    return Response.json({
      code: 'SERVER_CONFIG_MISSING',
      error: 'إعداد الخادم ناقص: تحقق من متغيرات Supabase في بيئة تشغيل التطبيق.',
    }, { status: 500 });
  }

  let username: string;
  let password: string;
  try {
    const body = await request.json();
    username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return Response.json({ code: 'INVALID_REQUEST', error: 'تعذر قراءة بيانات الدخول المرسلة.' }, { status: 400 });
  }

  if (!/^[a-z0-9._-]{1,64}$/.test(username) || password.length < 1 || password.length > 256) {
    return Response.json({
      code: 'INVALID_INPUT_FORMAT',
      error: 'صيغة اسم المستخدم غير صحيحة. استخدم الأحرف الإنجليزية والأرقام والنقطة أو الشرطة فقط.',
    }, { status: 400 });
  }

  try {
    const { data: staff, error: staffError } = await admin
      .from('staff')
      .select('id, name, username, role, phone, active')
      .eq('username', username)
      .maybeSingle();

    if (staffError) {
      console.error('[admin-login:STAFF_DATABASE_LOOKUP_FAILED]', staffError.code || 'unknown');
      return Response.json({
        code: 'STAFF_DATABASE_LOOKUP_FAILED',
        error: 'تعذر البحث في جدول الموظفين. تحقق من اتصال قاعدة البيانات ووجود جدول staff وسياسات RLS.',
      }, { status: 503 });
    }
    if (!staff) {
      return Response.json({
        code: 'STAFF_NOT_FOUND',
        error: 'اسم المستخدم غير موجود في جدول الموظفين. لم يتم فحص كلمة المرور.',
      }, { status: 401 });
    }
    if (!staff.active) {
      return Response.json({
        code: 'STAFF_INACTIVE',
        error: 'حساب الموظف موجود لكنه غير نشط. فعّله من إدارة الموظفين ثم أعد المحاولة. لم يتم فحص كلمة المرور.',
      }, { status: 403 });
    }

    const { data: userResult, error: userError } = await admin.auth.admin.getUserById(staff.id);
    const authUser = userResult?.user;
    const email = authUser?.email;
    if (userError) {
      console.error('[admin-login:AUTH_ADMIN_LOOKUP_FAILED]', userError.status || 'unknown');
      return Response.json({
        code: 'AUTH_ADMIN_LOOKUP_FAILED',
        error: 'تعذر فحص حساب الموظف في Supabase Authentication. تحقق من مفتاح الخادم واتصال Supabase.',
      }, { status: 503 });
    }
    if (!authUser || !email) {
      return Response.json({
        code: 'AUTH_ACCOUNT_NOT_LINKED',
        error: 'سجل الموظف موجود، لكن حسابه غير موجود أو غير مرتبط في Supabase Authentication. يجب أن يتطابق UUID في الجدولين.',
      }, { status: 409 });
    }
    if (!authUser.email_confirmed_at) {
      return Response.json({
        code: 'AUTH_EMAIL_NOT_CONFIRMED',
        error: 'حساب Supabase Authentication غير مؤكّد. أكّد الحساب من Authentication → Users ثم حاول مجددًا.',
      }, { status: 403 });
    }

    const authClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: authResult, error: authError } = await authClient.auth.signInWithPassword({ email, password });
    if (authError || !authResult.session) {
      const code = authError?.code?.toLowerCase() || '';
      const message = authError?.message?.toLowerCase() || '';
      if (code.includes('invalid_credentials') || message.includes('invalid login credentials')) {
        return Response.json({
          code: 'AUTH_CREDENTIALS_REJECTED',
          error: 'تم العثور على الموظف وربط حسابه، لكن كلمة المرور غير صحيحة. أدخل كلمة المرور المسجلة في Supabase Auth.',
        }, { status: 401 });
      }
      if (code.includes('email_not_confirmed') || message.includes('email not confirmed')) {
        return Response.json({
          code: 'AUTH_EMAIL_NOT_CONFIRMED',
          error: 'حساب Supabase Authentication غير مؤكّد. أكّد الحساب من Authentication → Users ثم حاول مجددًا.',
        }, { status: 403 });
      }
      if (authError?.status === 429) {
        return Response.json({
          code: 'AUTH_RATE_LIMITED',
          error: 'تم تجاوز محاولات الدخول المسموحة مؤقتًا. انتظر قليلًا ثم حاول مجددًا.',
        }, { status: 429 });
      }
      if ((authError?.status || 0) >= 500 || message.includes('fetch') || message.includes('network')) {
        console.error('[admin-login:AUTH_PROVIDER_UNAVAILABLE]', authError?.status || 'unknown');
        return Response.json({
          code: 'AUTH_PROVIDER_UNAVAILABLE',
          error: 'تعذر الاتصال بخدمة Supabase Authentication. تحقق من اتصال المشروع وحالته.',
        }, { status: 503 });
      }
      return Response.json({
        code: 'SUPABASE_AUTH_FAILED',
        error: 'تعذر إكمال التحقق من Supabase Authentication. راجع حالة مزود Email/Password وإعدادات المشروع.',
      }, { status: 502 });
    }

    return Response.json({
      session: authResult.session,
      staff: {
        id: staff.id,
        name: staff.name,
        username: staff.username,
        role: staff.role,
        phone: staff.phone,
        active: staff.active,
      },
    });
  } catch (error) {
    console.error('[admin-login:LOGIN_SERVER_ERROR]', error instanceof Error ? error.message : 'unknown');
    return Response.json({
      code: 'LOGIN_SERVER_ERROR',
      error: 'حدث خطأ داخل مسار تسجيل الدخول على الخادم. راجع سجلات التطبيق لمعرفة التفاصيل.',
    }, { status: 500 });
  }
}
