import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/server/staff-auth';

function getAdmin() {
  const admin = createServiceClient();
  if (!admin) {
    throw new Error('Supabase client not initialized');
  }
  return admin;
}

// 1. استرجاع جميع أكواد الخصم
export async function GET() {
  try {
    const admin = getAdmin();
    const { data, error } = await admin
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mapped = (data || []).map((c: any) => ({
      id: c.id,
      code: c.code,
      discountType: c.discount_type || 'percentage',
      discountValue: Number(c.discount_value || 0),
      expiresAt: c.expires_at || '',
      maxUsage: Number(c.max_usage || 100),
      usedCount: Number(c.used_count || 0),
      active: Boolean(c.active),
    }));

    return NextResponse.json({ coupons: mapped });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch coupons' }, { status: 500 });
  }
}

// 2. إنشاء كود خصم جديد
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, discountType, discountValue, expiresAt, maxUsage } = body;

    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 2) {
      return NextResponse.json({ error: 'رمز كود الخصم مطلوب ويجب أن يتكون من حرفين على الأقل' }, { status: 400 });
    }

    const val = Number(discountValue);
    if (isNaN(val) || val <= 0) {
      return NextResponse.json({ error: 'قيمة الخصم يجب أن تكون أكبر من صفر' }, { status: 400 });
    }

    const admin = getAdmin();

    // التحقق من عدم تكرار الكود
    const { data: existing } = await admin
      .from('coupons')
      .select('id')
      .eq('code', cleanCode)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'رمز كود الخصم هذا موجود مسبقاً، اختر رمزاً آخر' }, { status: 409 });
    }

    const newId = `cp-${Date.now()}`;
    const payload = {
      id: newId,
      code: cleanCode,
      discount_type: discountType === 'fixed_egp' ? 'fixed_egp' : 'percentage',
      discount_value: val,
      expires_at: expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      max_usage: Number(maxUsage) || 100,
      used_count: 0,
      active: true,
    };

    const { data, error } = await admin.from('coupons').insert(payload).select().single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      coupon: {
        id: data.id,
        code: data.code,
        discountType: data.discount_type,
        discountValue: Number(data.discount_value),
        expiresAt: data.expires_at,
        maxUsage: Number(data.max_usage),
        usedCount: Number(data.used_count || 0),
        active: Boolean(data.active),
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create coupon' }, { status: 500 });
  }
}

// 3. تعديل كود الخصم (تفعيل/تعطيل أو تعديل القيمة وتاريخ الانتهاء)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, code, discountType, discountValue, expiresAt, maxUsage, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'معرف الكود مطلوب' }, { status: 400 });
    }

    const admin = getAdmin();
    const payload: Record<string, any> = {};

    if (code !== undefined) payload.code = code.trim().toUpperCase();
    if (discountType !== undefined) payload.discount_type = discountType;
    if (discountValue !== undefined) payload.discount_value = Number(discountValue);
    if (expiresAt !== undefined) payload.expires_at = expiresAt;
    if (maxUsage !== undefined) payload.max_usage = Number(maxUsage);
    if (active !== undefined) payload.active = Boolean(active);

    const { data, error } = await admin.from('coupons').update(payload).eq('id', id).select().single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      coupon: {
        id: data.id,
        code: data.code,
        discountType: data.discount_type,
        discountValue: Number(data.discount_value),
        expiresAt: data.expires_at,
        maxUsage: Number(data.max_usage),
        usedCount: Number(data.used_count || 0),
        active: Boolean(data.active),
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update coupon' }, { status: 500 });
  }
}

// 4. حذف كود الخصم
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'معرف الكود مطلوب' }, { status: 400 });
    }

    const admin = getAdmin();
    const { error } = await admin.from('coupons').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete coupon' }, { status: 500 });
  }
}
