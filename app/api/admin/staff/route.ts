import { NextRequest, NextResponse } from 'next/server';
import { authorizeStaffRequest } from '@/lib/server/staff-auth';

const STAFF_FIELDS = 'id, name, username, role, phone, active, created_at';
const VALID_ROLES = new Set(['super_admin', 'rental_agent', 'accountant']);

function describeAuthCreateError(error: { code?: string; status?: number; message?: string }) {
  const code = error.code || 'AUTH_CREATE_FAILED';
  const message = error.message?.toLowerCase() || '';
  if (message.includes('already') || message.includes('registered') || code.toLowerCase().includes('already')) {
    return { code: 'AUTH_USER_ALREADY_EXISTS', error: 'تعذر إنشاء الحساب: يوجد حساب دخول سابق مرتبط باسم المستخدم هذا. جرّب اسم مستخدم مختلفًا؛ لم يتم تغيير كلمة مرور الحساب السابق.' };
  }
  if (message.includes('password') && (message.includes('weak') || message.includes('short') || message.includes('characters'))) {
    return { code: 'AUTH_PASSWORD_REJECTED', error: 'رفض Supabase كلمة المرور. اختر كلمة مرور أقوى وأطول، ثم أعد المحاولة.' };
  }
  if (message.includes('email') || message.includes('provider')) {
    return { code: 'AUTH_PROVIDER_OR_EMAIL_ERROR', error: 'رفض Supabase إنشاء حساب الدخول. تحقّق من تفعيل مزوّد Email في إعدادات Authentication بالمشروع.' };
  }
  if (message.includes('database error') || code.toLowerCase() === 'unexpected_failure') {
    return { code: 'AUTH_DATABASE_WRITE_FAILED', error: 'وصل طلب إنشاء الحساب إلى Supabase Auth، لكن حفظه في قاعدة بيانات المصادقة فشل. هذا غالبًا خطأ داخلي أو trigger في auth.users؛ راجع سجل Auth في Supabase، ولا تعدّل جدول staff.' };
  }
  if ((error.status || 0) >= 500) {
    return { code: 'AUTH_PROVIDER_INTERNAL_ERROR', error: `أعاد Supabase Authentication خطأً داخليًا (HTTP ${error.status}, ${code}). لم يُنشأ الموظف. هذا لا يعني بالضرورة أن الخدمة متوقفة؛ راجع سجل Auth في Supabase.` };
  }
  return { code, error: 'رفض Supabase إنشاء حساب الموظف. راجع إعدادات Authentication؛ لم يُضف الموظف.' };
}

function authFailure(result: Extract<Awaited<ReturnType<typeof authorizeStaffRequest>>, { ok: false }>) {
  return NextResponse.json({ error: result.error }, { status: result.status });
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeStaffRequest(request, true);
    if (!auth.ok) return authFailure(auth);

    const { data, error } = await auth.admin
      .from('staff')
      .select(STAFF_FIELDS)
      .order('created_at', { ascending: true });
    if (error) return NextResponse.json({ error: 'تعذر تحميل قائمة الموظفين' }, { status: 500 });
    return NextResponse.json({ staff: data || [] });
  } catch {
    return NextResponse.json({ error: 'تعذر تحميل قائمة الموظفين' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeStaffRequest(request, true);
    if (!auth.ok) return authFailure(auth);

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const role = typeof body.role === 'string' ? body.role : 'rental_agent';

    if (!name || !/^[a-z0-9._-]{1,64}$/.test(username) || password.length < 8 || password.length > 256 || !VALID_ROLES.has(role)) {
      return NextResponse.json({ error: 'أدخل الاسم واسم مستخدم إنجليزيًا وكلمة مرور من 8 أحرف على الأقل ودورًا صالحًا' }, { status: 400 });
    }

    const { data: existing, error: existingError } = await auth.admin
      .from('staff')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (existingError) return NextResponse.json({ error: 'تعذر التحقق من اسم المستخدم' }, { status: 500 });
    if (existing) return NextResponse.json({ error: 'اسم المستخدم مستخدم بالفعل' }, { status: 409 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const internalEmail = `${username}@${new URL(supabaseUrl).hostname}`;
    const userMetadata = { name, username, role, phone };
    const { data: created, error: createError } = await auth.admin.auth.admin.createUser({
      email: internalEmail,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    });
    let authUserId = created.user?.id;
    let createdAuthUser = Boolean(authUserId);
    if (createError || !created.user) {
      if (createError) {
        const errorMessage = createError.message.toLowerCase();
        const isExistingAuthUser = errorMessage.includes('already') || errorMessage.includes('registered') ||
          createError.code?.toLowerCase().includes('already');
        if (isExistingAuthUser) {
          // Repair accounts left behind by the old endpoint, which could create Auth users
          // while silently failing to insert the matching staff row.
          let orphanUser: { id: string; email?: string } | undefined;
          for (let page = 1; page <= 20 && !orphanUser; page += 1) {
            const { data, error } = await auth.admin.auth.admin.listUsers({ page, perPage: 1000 });
            if (error) break;
            orphanUser = data.users.find((user) => user.email?.toLowerCase() === internalEmail);
            if (data.users.length < 1000) break;
          }
          if (orphanUser) {
            const { data: linkedStaff, error: linkedStaffError } = await auth.admin
              .from('staff')
              .select('id')
              .eq('id', orphanUser.id)
              .maybeSingle();
            if (!linkedStaffError && !linkedStaff) {
              const { error: repairError } = await auth.admin.auth.admin.updateUserById(orphanUser.id, {
                password,
                email_confirm: true,
                user_metadata: userMetadata,
              });
              if (!repairError) {
                authUserId = orphanUser.id;
                createdAuthUser = false;
              }
            }
          }
        }
        if (authUserId) {
          // The orphan account has been recovered; continue by linking it below.
        } else {
        console.error('[admin-staff:AUTH_CREATE_FAILED]', createError.code || 'unknown', createError.status || 'unknown', createError.message.slice(0, 200));
        const diagnosis = describeAuthCreateError(createError);
        return NextResponse.json(diagnosis, { status: createError.status === 429 ? 429 : 400 });
        }
      } else {
        return NextResponse.json({ code: 'AUTH_USER_MISSING', error: 'لم يُرجع Supabase حساب دخول بعد الإنشاء؛ لم يُضف الموظف.' }, { status: 502 });
      }
    }

    if (!authUserId) {
      return NextResponse.json({ code: 'AUTH_USER_MISSING', error: 'لم يُرجع Supabase حساب دخول بعد الإنشاء؛ لم يُضف الموظف.' }, { status: 502 });
    }
    const staff = {
      id: authUserId,
      name,
      username,
      role,
      phone,
      active: true,
    };
    const { data: inserted, error: insertError } = await auth.admin
      .from('staff')
      .upsert(staff, { onConflict: 'id' })
      .select(STAFF_FIELDS)
      .single();

    if (insertError || !inserted) {
      const { error: rollbackError } = createdAuthUser
        ? await auth.admin.auth.admin.deleteUser(authUserId)
        : { error: null };
      console.error('[admin-staff:DIRECTORY_INSERT_FAILED]', insertError?.code || 'unknown', rollbackError?.code || 'rollback-ok');
      return NextResponse.json({ code: createdAuthUser ? 'STAFF_DIRECTORY_SAVE_FAILED' : 'STAFF_DIRECTORY_REPAIR_FAILED', error: 'تعذر حفظ الموظف في جدول staff. لم يكتمل الإصلاح؛ افحص إعدادات قاعدة البيانات وصلاحية الخدمة.' }, { status: 500 });
    }

    return NextResponse.json({ staff: inserted }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'تعذر إنشاء الموظف' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authorizeStaffRequest(request, true);
    if (!auth.ok) return authFailure(auth);

    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) return NextResponse.json({ error: 'معرف الموظف مطلوب' }, { status: 400 });

    const { data: target, error: targetError } = await auth.admin
      .from('staff')
      .select('id, role, active')
      .eq('id', id)
      .maybeSingle();
    if (targetError || !target) return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 });

    const name = typeof body.name === 'string' ? body.name.trim() : undefined;
    const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : undefined;
    const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined;
    const role = typeof body.role === 'string' ? body.role : undefined;
    const active = typeof body.active === 'boolean' ? body.active : undefined;
    const password = typeof body.password === 'string' ? body.password : '';
    if (username !== undefined && !/^[a-z0-9._-]{1,64}$/.test(username)) {
      return NextResponse.json({ error: 'اسم المستخدم يجب أن يكون بالإنجليزية' }, { status: 400 });
    }
    if (role !== undefined && !VALID_ROLES.has(role)) {
      return NextResponse.json({ error: 'الدور المحدد غير صالح' }, { status: 400 });
    }
    if (password && password.length < 8) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 });
    }

    if (target.id === auth.user.id && active === false) {
      return NextResponse.json({ error: 'لا يمكنك تعطيل الحساب الذي تستخدمه الآن' }, { status: 409 });
    }

    if (target.role === 'super_admin' && target.active && ((role !== undefined && role !== 'super_admin') || active === false)) {
      const { count } = await auth.admin
        .from('staff')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'super_admin')
        .eq('active', true);
      if ((count || 0) <= 1) {
        return NextResponse.json({ error: 'لا يمكن خفض صلاحية آخر مدير عام' }, { status: 409 });
      }
    }

    if (username) {
      const { data: duplicate } = await auth.admin
        .from('staff')
        .select('id')
        .eq('username', username)
        .neq('id', id)
        .maybeSingle();
      if (duplicate) return NextResponse.json({ error: 'اسم المستخدم مستخدم بالفعل' }, { status: 409 });
    }

    if (password) {
      const { error } = await auth.admin.auth.admin.updateUserById(id, { password });
      if (error) return NextResponse.json({ error: 'تعذر تغيير كلمة مرور الموظف' }, { status: 400 });
    }

    const updates: Record<string, string | boolean> = {};
    if (name !== undefined) updates.name = name;
    if (username !== undefined) updates.username = username;
    if (phone !== undefined) updates.phone = phone;
    if (role !== undefined) updates.role = role;
    if (active !== undefined) updates.active = active;

    let updated;
    let updateError;
    if (Object.keys(updates).length) {
      const result = await auth.admin.from('staff').update(updates).eq('id', id).select(STAFF_FIELDS).single();
      updated = result.data;
      updateError = result.error;
    } else {
      const result = await auth.admin.from('staff').select(STAFF_FIELDS).eq('id', id).single();
      updated = result.data;
      updateError = result.error;
    }
    if (updateError || !updated) return NextResponse.json({ error: 'تعذر تحديث بيانات الموظف' }, { status: 500 });

    return NextResponse.json({ staff: updated });
  } catch {
    return NextResponse.json({ error: 'تعذر تحديث الموظف' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authorizeStaffRequest(request, true);
    if (!auth.ok) return authFailure(auth);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || '';
    const username = searchParams.get('username')?.trim().toLowerCase() || '';
    const query = auth.admin.from('staff').select('id, role, active');
    const { data: target, error: targetError } = await (id ? query.eq('id', id) : query.eq('username', username)).maybeSingle();
    if (targetError || !target) return NextResponse.json({ error: 'الموظف غير موجود' }, { status: 404 });
    if (target.id === auth.user.id) return NextResponse.json({ error: 'لا يمكنك حذف حسابك أثناء تسجيل الدخول' }, { status: 409 });

    if (target.role === 'super_admin' && target.active) {
      const { count } = await auth.admin
        .from('staff')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'super_admin')
        .eq('active', true);
      if ((count || 0) <= 1) return NextResponse.json({ error: 'لا يمكن حذف آخر مدير عام' }, { status: 409 });
    }

    const { error: dbError } = await auth.admin.from('staff').delete().eq('id', target.id);
    if (dbError) return NextResponse.json({ error: 'تعذر حذف الموظف من قاعدة البيانات' }, { status: 500 });

    try {
      await auth.admin.auth.admin.deleteUser(target.id);
    } catch {
      // ignore if not present in auth.users
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'تعذر حذف الموظف' }, { status: 500 });
  }
}
