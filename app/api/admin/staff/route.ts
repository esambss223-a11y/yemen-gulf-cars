import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olpjfipferziqtzrbbbt.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 1. استرجاع قائمة جميع الموظفين
export async function GET() {
  try {
    if (!SERVICE_KEY) {
      return NextResponse.json({ staff: [] });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: staffList, error } = await admin
      .from('staff')
      .select('id, name, username, role, phone, active, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ staff: staffList || [] });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch staff list' }, { status: 500 });
  }
}

// 2. إضافة موظف جديد وإنشاء حسابه السحابي
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, username, password, role, phone } = body;

    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanName = (name || '').trim();
    const cleanPhone = (phone || '').trim();
    const cleanRole = role || 'rental_agent';
    const cleanPassword = password && password.length >= 6 ? password : 'admin123';

    if (!cleanUsername || !cleanName) {
      return NextResponse.json({ error: 'اسم الموظف واسم المستخدم مطلوبان' }, { status: 400 });
    }

    if (!SERVICE_KEY) {
      return NextResponse.json({
        staff: {
          id: `staff-${Date.now()}`,
          name: cleanName,
          username: cleanUsername,
          role: cleanRole,
          phone: cleanPhone,
          active: true,
        }
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // توليد بريد داخلي للموظف لربطه في Supabase Auth
    const authDomain = new URL(SUPABASE_URL).hostname;
    const authEmail = `${cleanUsername}@${authDomain}`;

    // إنشاء حساب Auth للموظف
    let userId: string | null = null;
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: authEmail,
      password: cleanPassword,
      email_confirm: true,
      user_metadata: {
        name: cleanName,
        username: cleanUsername,
        role: cleanRole,
        phone: cleanPhone,
      },
    });

    if (!authErr && authData?.user) {
      userId = authData.user.id;
    } else {
      // إذا كان الحساب موجوداً بالفعل في Auth
      const { data: users } = await admin.auth.admin.listUsers();
      const existing = users?.users?.find(u => u.email === authEmail);
      if (existing) {
        userId = existing.id;
        // تحديث كلمة المرور للحساب الموجود
        await admin.auth.admin.updateUserById(userId, {
          password: cleanPassword,
          user_metadata: { name: cleanName, username: cleanUsername, role: cleanRole, phone: cleanPhone }
        });
      }
    }

    const finalId = userId || `staff-${Date.now()}`;

    // إدراج الموظف في جدول staff
    const { data: staffRow, error: staffErr } = await admin
      .from('staff')
      .upsert({
        id: finalId,
        name: cleanName,
        username: cleanUsername,
        role: cleanRole,
        phone: cleanPhone,
        active: true,
      })
      .select()
      .maybeSingle();

    if (staffErr) {
      console.warn('Insert staff DB notice:', staffErr);
    }

    return NextResponse.json({
      staff: staffRow || {
        id: finalId,
        name: cleanName,
        username: cleanUsername,
        role: cleanRole,
        phone: cleanPhone,
        active: true,
      }
    });
  } catch (err: any) {
    console.error('Create staff route error:', err);
    return NextResponse.json({ error: 'تعذر إنشاء حساب الموظف' }, { status: 500 });
  }
}

// 3. حذف موظف
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'معرف الموظف مطلوب' }, { status: 400 });
    }

    if (SERVICE_KEY) {
      const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      await admin.from('staff').delete().eq('id', id);
      try {
        await admin.auth.admin.deleteUser(id);
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'تعذر حذف الموظف' }, { status: 500 });
  }
}
