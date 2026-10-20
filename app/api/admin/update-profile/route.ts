import { authorizeStaffRequest } from '@/lib/server/staff-auth';

export async function POST(request: Request) {
  try {
    const auth = await authorizeStaffRequest(request);
    if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    if (body.id && body.id !== auth.user.id) {
      return Response.json({ error: 'لا يمكنك تعديل حساب موظف آخر من هذه الخدمة' }, { status: 403 });
    }

    const updates: Record<string, string> = {};
    if (typeof body.name === 'string') {
      const name = body.name.trim();
      if (!name) return Response.json({ error: 'الاسم مطلوب' }, { status: 400 });
      updates.name = name;
    }
    if (typeof body.username === 'string') {
      const username = body.username.trim().toLowerCase();
      if (!/^[a-z0-9._-]{1,64}$/.test(username)) {
        return Response.json({ error: 'اسم المستخدم يجب أن يكون بالإنجليزية' }, { status: 400 });
      }
      const { data: duplicate } = await auth.admin
        .from('staff')
        .select('id')
        .eq('username', username)
        .neq('id', auth.user.id)
        .maybeSingle();
      if (duplicate) return Response.json({ error: 'اسم المستخدم مستخدم بالفعل' }, { status: 409 });
      updates.username = username;
    }
    if (typeof body.phone === 'string') updates.phone = body.phone.trim();

    if (Object.keys(updates).length) {
      const { error } = await auth.admin.from('staff').update(updates).eq('id', auth.user.id);
      if (error) return Response.json({ error: 'تعذر تحديث بيانات الحساب' }, { status: 500 });
    }

    if (typeof body.password === 'string' && body.password.length > 0) {
      if (body.password.length < 8 || body.password.length > 256) {
        return Response.json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 });
      }
      const { error } = await auth.admin.auth.admin.updateUserById(auth.user.id, { password: body.password });
      if (error) return Response.json({ error: 'تعذر تغيير كلمة المرور' }, { status: 400 });
    }

    const { data: staff, error } = await auth.admin
      .from('staff')
      .select('id, name, username, role, phone, active')
      .eq('id', auth.user.id)
      .single();
    if (error || !staff) return Response.json({ error: 'تعذر تحميل بيانات الحساب' }, { status: 500 });
    return Response.json({ success: true, staff });
  } catch {
    return Response.json({ error: 'تعذر حفظ التعديلات' }, { status: 500 });
  }
}
