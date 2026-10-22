import { NextRequest, NextResponse } from 'next/server';
import { authorizeStaffRequest } from '@/lib/server/staff-auth';

const COUPON_CODE = /^[A-Z0-9_-]{2,40}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// 1. استرجاع جميع أكواد الخصم
export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeStaffRequest(request, true);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const admin = auth.admin;
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
    const auth = await authorizeStaffRequest(req, true);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'بيانات الكوبون غير صالحة' }, { status: 400 });
    }
    const { code, discountType, discountValue, expiresAt, maxUsage } = body as Record<string, unknown>;

    const cleanCode = typeof code === 'string' ? code.trim().toUpperCase() : '';
    if (!COUPON_CODE.test(cleanCode)) {
      return NextResponse.json({ error: 'استخدم حروفًا إنجليزية أو أرقامًا أو - أو _ في رمز الكوبون (2 إلى 40 حرفًا).' }, { status: 400 });
    }

    const val = Number(discountValue);
    if (!Number.isFinite(val) || val <= 0 || (discountType === 'percentage' && val > 100) || (discountType === 'fixed_egp' && val > 10_000_000) || !['percentage', 'fixed_egp'].includes(String(discountType))) {
      return NextResponse.json({ error: 'نوع الخصم أو قيمته غير صالح.' }, { status: 400 });
    }
    const normalizedExpiry = expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const normalizedMaxUsage = Number(maxUsage ?? 100);
    if (!isValidDate(normalizedExpiry) || !Number.isInteger(normalizedMaxUsage) || normalizedMaxUsage < 1 || normalizedMaxUsage > 1_000_000) {
      return NextResponse.json({ error: 'تاريخ الانتهاء أو عدد مرات الاستخدام غير صالح.' }, { status: 400 });
    }

    const admin = auth.admin;

    // التحقق من عدم تكرار الكود
    const { data: existing, error: existingError } = await admin
      .from('coupons')
      .select('id')
      .eq('code', cleanCode)
      .maybeSingle();

    if (existingError) return NextResponse.json({ error: 'تعذر التحقق من تكرار الرمز.' }, { status: 503 });
    if (existing) {
      return NextResponse.json({ error: 'رمز كود الخصم هذا موجود مسبقاً، اختر رمزاً آخر' }, { status: 409 });
    }

    const newId = `cp-${Date.now()}`;
    const payload = {
      id: newId,
      code: cleanCode,
      discount_type: discountType === 'fixed_egp' ? 'fixed_egp' : 'percentage',
      discount_value: val,
      expires_at: normalizedExpiry,
      max_usage: normalizedMaxUsage,
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
    const auth = await authorizeStaffRequest(req, true);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'بيانات الكوبون غير صالحة' }, { status: 400 });
    }
    const { id, code, discountType, discountValue, expiresAt, maxUsage, active } = body as Record<string, unknown>;

    if (typeof id !== 'string' || !id.trim()) {
      return NextResponse.json({ error: 'معرف الكود مطلوب' }, { status: 400 });
    }

    const admin = auth.admin;
    const payload: Record<string, any> = {};
    let existingDiscountType: unknown;

    if (discountValue !== undefined && discountType === undefined) {
      const { data: existingCoupon, error: existingError } = await admin
        .from('coupons')
        .select('discount_type')
        .eq('id', id)
        .maybeSingle();
      if (existingError) return NextResponse.json({ error: 'تعذر التحقق من نوع الخصم الحالي.' }, { status: 503 });
      if (!existingCoupon) return NextResponse.json({ error: 'الكوبون غير موجود.' }, { status: 404 });
      existingDiscountType = existingCoupon.discount_type;
    }

    if (code !== undefined) {
      if (typeof code !== 'string' || !COUPON_CODE.test(code.trim().toUpperCase())) return NextResponse.json({ error: 'رمز الكوبون غير صالح.' }, { status: 400 });
      payload.code = code.trim().toUpperCase();
    }
    if (discountType !== undefined) {
      if (discountType !== 'percentage' && discountType !== 'fixed_egp') return NextResponse.json({ error: 'نوع الخصم غير صالح.' }, { status: 400 });
      payload.discount_type = discountType;
    }
    if (discountValue !== undefined) {
      const value = Number(discountValue);
      const effectiveType = payload.discount_type || discountType || existingDiscountType;
      if (!Number.isFinite(value) || value <= 0 || (effectiveType === 'percentage' && value > 100) || (effectiveType === 'fixed_egp' && value > 10_000_000)) return NextResponse.json({ error: 'قيمة الخصم غير صالحة.' }, { status: 400 });
      payload.discount_value = value;
    }
    if (expiresAt !== undefined) {
      if (!isValidDate(expiresAt)) return NextResponse.json({ error: 'تاريخ الانتهاء غير صالح.' }, { status: 400 });
      payload.expires_at = expiresAt;
    }
    if (maxUsage !== undefined) {
      const value = Number(maxUsage);
      if (!Number.isInteger(value) || value < 1 || value > 1_000_000) return NextResponse.json({ error: 'عدد مرات الاستخدام غير صالح.' }, { status: 400 });
      payload.max_usage = value;
    }
    if (active !== undefined) {
      if (typeof active !== 'boolean') return NextResponse.json({ error: 'حالة الكوبون غير صالحة.' }, { status: 400 });
      payload.active = active;
    }
    if (!Object.keys(payload).length) return NextResponse.json({ error: 'لا توجد تعديلات للحفظ.' }, { status: 400 });

    const { data, error } = await admin.from('coupons').update(payload).eq('id', id).select().maybeSingle();
    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'الكوبون غير موجود.' }, { status: error ? 500 : 404 });
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
    const auth = await authorizeStaffRequest(req, true);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'معرف الكود مطلوب' }, { status: 400 });
    }

    const admin = auth.admin;
    const { data, error } = await admin.from('coupons').delete().eq('id', id).select('id').maybeSingle();
    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'الكوبون غير موجود.' }, { status: error ? 500 : 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete coupon' }, { status: 500 });
  }
}
