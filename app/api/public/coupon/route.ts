import { createServiceClient } from '@/lib/server/staff-auth';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ code: 'INVALID_REQUEST', valid: false, message: 'بيانات التحقق غير صالحة.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json({ code: 'INVALID_REQUEST', valid: false, message: 'بيانات التحقق غير صالحة.' }, { status: 400 });
  }

  const codeValue = (body as Record<string, unknown>).code;
  const code = typeof codeValue === 'string' ? codeValue.trim().toUpperCase() : '';
  if (code.length < 2 || code.length > 40) {
    return Response.json({ code: 'INVALID_COUPON_CODE', valid: false, message: 'أدخل كود خصم صحيحًا.' }, { status: 400 });
  }

  const admin = createServiceClient();
  if (!admin) {
    return Response.json({ code: 'COUPON_SERVICE_UNAVAILABLE', valid: false, message: 'تعذر التحقق من كود الخصم حاليًا.' }, { status: 503 });
  }

  const { data: coupon, error } = await admin
    .from('coupons')
    .select('active, expires_at, max_usage, used_count')
    .eq('code', code)
    .maybeSingle();

  if (error) {
    console.error('[public-coupon:LOOKUP_FAILED]', error.code || 'UNKNOWN');
    return Response.json({ code: 'COUPON_LOOKUP_FAILED', valid: false, message: 'تعذر التحقق من كود الخصم حاليًا.' }, { status: 503 });
  }

  if (!coupon) {
    return Response.json({ code: 'COUPON_NOT_FOUND', valid: false, message: 'كود الخصم غير صحيح.' });
  }
  if (!coupon.active) {
    return Response.json({ code: 'COUPON_INACTIVE', valid: false, message: 'كود الخصم غير مفعّل حاليًا.' });
  }
  if (coupon.expires_at < new Date().toISOString().slice(0, 10)) {
    return Response.json({ code: 'COUPON_EXPIRED', valid: false, message: 'انتهت صلاحية كود الخصم.' });
  }
  if (coupon.used_count >= coupon.max_usage) {
    return Response.json({ code: 'COUPON_EXHAUSTED', valid: false, message: 'اكتمل عدد مرات استخدام كود الخصم.' });
  }

  return Response.json({ code: 'COUPON_ACTIVE', valid: true, message: 'كود الخصم فعّال ويمكن استخدامه.' });
}
