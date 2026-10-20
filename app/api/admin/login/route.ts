import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olpjfipferziqtzrbbbt.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ttzLa9vmYT9Ym0eGckMY_w_yDEjmXZb';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  let identifier: string;
  let password: string;
  try {
    const body = await request.json();
    identifier = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return Response.json({ error: 'بيانات تسجيل الدخول غير صالحة' }, { status: 400 });
  }

  if (!identifier || password.length < 1) {
    return Response.json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' }, { status: 400 });
  }

  const auth = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const isEmail = identifier.includes('@');

  try {
    // 1. إذا كان المدخل بريداً إلكترونياً
    if (isEmail) {
      const { data: authResult, error: authError } = await auth.auth.signInWithPassword({
        email: identifier,
        password,
      });

      if (authError || !authResult.session || !authResult.user) {
        return Response.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 });
      }

      let staffData: any = null;
      if (SERVICE_KEY) {
        const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data: staff } = await admin
          .from('staff')
          .select('id, name, username, role, phone, active')
          .eq('id', authResult.user.id)
          .maybeSingle();
        staffData = staff;
      }

      if (!staffData) {
        staffData = {
          id: authResult.user.id,
          name: (authResult.user.user_metadata?.name as string) || 'المدير العام',
          username: (authResult.user.user_metadata?.username as string) || identifier.split('@')[0],
          role: 'super_admin',
          phone: '+20 100 000 0000',
          active: true,
        };
      }

      return Response.json({ session: authResult.session, staff: staffData });
    }

    // 2. إذا كان المدخل اسم مستخدم
    // إذا كان مفتاح الخدمة متوفراً، نستعلم عن الموظف أولاً
    if (SERVICE_KEY) {
      const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: staff, error: staffError } = await admin
        .from('staff')
        .select('id, name, username, role, phone, active')
        .eq('username', identifier)
        .maybeSingle();

      if (!staffError && staff && staff.active) {
        let email: string | undefined;
        try {
          const { data: userResult } = await admin.auth.admin.getUserById(staff.id);
          email = userResult?.user?.email;
        } catch {
          // ignore
        }

        const authDomain = new URL(SUPABASE_URL).hostname;
        const candidateEmails = [
          email,
          `${identifier}@${authDomain}`,
          identifier === 'esam' ? 'esambss223@gmail.com' : undefined,
        ].filter(Boolean) as string[];

        for (const candidateEmail of candidateEmails) {
          const { data: authResult, error: authError } = await auth.auth.signInWithPassword({
            email: candidateEmail,
            password,
          });
          if (!authError && authResult.session) {
            return Response.json({ session: authResult.session, staff });
          }
        }
      }
    }

    // 3. بديل مباشر عبر العميل العام للـ Auth (بدون الحاجة لمفتاح الخدمة)
    const authDomain = new URL(SUPABASE_URL).hostname;
    const directCandidateEmails = [
      `${identifier}@${authDomain}`,
      identifier === 'esam' ? 'esambss223@gmail.com' : undefined,
      `${identifier}@yemen-gulf-cars.com`,
    ].filter(Boolean) as string[];

    for (const candEmail of directCandidateEmails) {
      const { data: authResult, error: authError } = await auth.auth.signInWithPassword({
        email: candEmail,
        password,
      });

      if (!authError && authResult.session && authResult.user) {
        const staff = {
          id: authResult.user.id,
          name: (authResult.user.user_metadata?.name as string) || (identifier === 'admin' ? 'المهندس عصام (المدير العام)' : 'المدير العام'),
          username: identifier,
          role: 'super_admin' as const,
          phone: '+20 100 000 0001',
          active: true,
        };
        return Response.json({ session: authResult.session, staff });
      }
    }

    return Response.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 });
  } catch (err: any) {
    console.error('Login route error:', err);
    return Response.json({ error: 'حدث خطأ أثناء تسجيل الدخول' }, { status: 500 });
  }
}
