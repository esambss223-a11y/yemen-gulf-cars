import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olpjfipferziqtzrbbbt.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, username, phone, role, password } = body;

    if (!id && !username) {
      return Response.json({ error: 'معرف الموظف غير محدد' }, { status: 400 });
    }

    if (SERVICE_KEY) {
      const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const payload: Record<string, unknown> = {};
      if (name) payload.name = name.trim();
      if (username) payload.username = username.trim().toLowerCase();
      if (phone) payload.phone = phone.trim();
      if (role) payload.role = role;

      // تحديث في جدول staff
      if (Object.keys(payload).length > 0) {
        if (id) {
          await admin.from('staff').update(payload).eq('id', id);
        } else if (username) {
          await admin.from('staff').update(payload).eq('username', username);
        }
      }

      // تحديث كلمة المرور في Supabase Auth إذا تم تمريرها
      if (id && password && password.trim().length >= 6) {
        try {
          await admin.auth.admin.updateUserById(id, {
            password: password.trim(),
            user_metadata: { name: payload.name, username: payload.username, phone: payload.phone }
          });
        } catch (authErr) {
          console.warn('Auth password update notice:', authErr);
        }
      }
    }

    return Response.json({ success: true });
  } catch (err: any) {
    console.error('Update profile error:', err);
    return Response.json({ error: 'تعذر حفظ التعديلات' }, { status: 500 });
  }
}
