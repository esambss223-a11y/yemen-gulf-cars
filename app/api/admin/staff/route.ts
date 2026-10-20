import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olpjfipferziqtzrbbbt.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 1. استرجاع قائمة جميع الموظفين من جدول staff
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

// 2. إضافة موظف جديد
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

    const authDomain = new URL(SUPABASE_URL).hostname;
    const authEmail = `${cleanUsername}@${authDomain}`;

    let userId: string | null = null;

    // محاولة إنشاء حساب Auth
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
      // إذا كان مسجلاً مسبقاً، نأخذ معرفه ونحدث كلمة مروره
      const { data: users } = await admin.auth.admin.listUsers();
      const existing = users?.users?.find(u => u.email === authEmail);
      if (existing) {
        userId = existing.id;
        await admin.auth.admin.updateUserById(userId, {
          password: cleanPassword,
          user_metadata: { name: cleanName, username: cleanUsername, role: cleanRole, phone: cleanPhone }
        });
      }
    }

    const finalId = userId || `staff-${Date.now()}`;

    // إدراج أو تحديث في جدول staff
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
      console.warn('Insert staff DB warning:', staffErr);
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
    console.error('Create staff error:', err);
    return NextResponse.json({ error: 'تعذر إنشاء حساب الموظف' }, { status: 500 });
  }
}

// 3. تعديل موظف وصلاحيته
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, username, password, role, phone } = body;

    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanName = (name || '').trim();
    const cleanPhone = (phone || '').trim();
    const cleanRole = role;

    if (!SERVICE_KEY) {
      return NextResponse.json({ success: true });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const payload: Record<string, unknown> = {};
    if (cleanName) payload.name = cleanName;
    if (cleanUsername) payload.username = cleanUsername;
    if (cleanPhone) payload.phone = cleanPhone;
    if (cleanRole) payload.role = cleanRole;

    // تحديث جدول staff بالمعرف أو باسم المستخدم
    let matchedId = id;
    if (id && id.length > 20) {
      await admin.from('staff').update(payload).eq('id', id);
    } else if (cleanUsername) {
      const { data: matched } = await admin
        .from('staff')
        .update(payload)
        .eq('username', cleanUsername)
        .select()
        .maybeSingle();
      if (matched?.id) matchedId = matched.id;
    }

    // إذا كانت هناك كلمة مرور جديدة، نحدثها في Auth
    if (password && password.length >= 6) {
      try {
        if (matchedId && matchedId.length > 20) {
          await admin.auth.admin.updateUserById(matchedId, {
            password,
            user_metadata: { name: cleanName, username: cleanUsername, role: cleanRole, phone: cleanPhone }
          });
        }
      } catch (authErr) {
        console.warn('Update password notice:', authErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Update staff error:', err);
    return NextResponse.json({ error: 'تعذر تحديث بيانات الموظف' }, { status: 500 });
  }
}

// 4. حذف موظف
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const username = searchParams.get('username')?.trim().toLowerCase();

    if (!id && !username) {
      return NextResponse.json({ error: 'معرف الموظف أو اسم المستخدم مطلوب' }, { status: 400 });
    }

    if (SERVICE_KEY) {
      const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      let staffIdToDelete = id;

      // إذا كان المعرف ليس UUID، نجلب الموظف بالاسم
      if ((!staffIdToDelete || staffIdToDelete.startsWith('staff-')) && username) {
        const { data: found } = await admin
          .from('staff')
          .select('id')
          .eq('username', username)
          .maybeSingle();
        if (found?.id) staffIdToDelete = found.id;
      }

      // حذف من جدول staff
      if (staffIdToDelete && staffIdToDelete.length > 20) {
        await admin.from('staff').delete().eq('id', staffIdToDelete);
        try {
          await admin.auth.admin.deleteUser(staffIdToDelete);
        } catch {
          // ignore
        }
      } else if (username) {
        await admin.from('staff').delete().eq('username', username);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'تعذر حذف الموظف' }, { status: 500 });
  }
}
