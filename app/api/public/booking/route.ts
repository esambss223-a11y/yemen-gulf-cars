import { createServiceClient } from '@/lib/server/staff-auth';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const PHONE = /^[+0-9 ()-]{7,24}$/;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid request body');
    body = parsed as Record<string, unknown>;
  } catch {
    return Response.json({ code: 'INVALID_REQUEST', error: 'بيانات الطلب غير صالحة.' }, { status: 400 });
  }

  const carId = typeof body.carId === 'string' ? body.carId.trim() : '';
  const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
  const customerPhone = typeof body.customerPhone === 'string' ? body.customerPhone.trim() : '';
  const startDate = typeof body.startDate === 'string' ? body.startDate : '';
  const endDate = typeof body.endDate === 'string' ? body.endDate : '';
  const discountCode = typeof body.discountCode === 'string' ? body.discountCode.trim().toUpperCase() : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';

  if (!carId || customerName.length < 2 || customerName.length > 120 || !PHONE.test(customerPhone) ||
      !ISO_DATE.test(startDate) || !ISO_DATE.test(endDate) || discountCode.length > 40 || notes.length > 500) {
    return Response.json({ code: 'INVALID_INPUT', error: 'تحقق من الاسم والهاتف والتواريخ والبيانات المدخلة.' }, { status: 400 });
  }
  const isRealDate = (value: string) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };
  if (!isRealDate(startDate) || !isRealDate(endDate)) {
    return Response.json({ code: 'INVALID_INPUT', error: 'أحد التواريخ المدخلة غير صحيح.' }, { status: 400 });
  }

  const admin = createServiceClient();
  if (!admin) {
    return Response.json({ code: 'BOOKING_SERVICE_UNAVAILABLE', error: 'خدمة الحجز غير متاحة حاليًا.' }, { status: 503 });
  }

  const { data, error } = await admin.rpc('submit_public_booking', {
    p_car_id: carId,
    p_customer_name: customerName,
    p_customer_phone: customerPhone,
    p_start_date: startDate,
    p_end_date: endDate,
    p_coupon_code: discountCode || null,
    p_notes: notes || null,
  });

  if (error) {
    const reason = error.message || '';
    const errorCode = error.code || 'UNKNOWN';
    if (reason.includes('CAR_UNAVAILABLE')) {
      return Response.json({ code: 'CAR_UNAVAILABLE', error: 'السيارة لم تعد متاحة. اختر سيارة أخرى.' }, { status: 409 });
    }
    if (reason.includes('BOOKING_CONFLICT')) {
      return Response.json({ code: 'BOOKING_CONFLICT', error: 'السيارة مرتبطة بطلب آخر في هذه التواريخ.' }, { status: 409 });
    }
    if (reason.includes('COUPON_EXPIRED') || reason.includes('COUPON_INVALID') || reason.includes('COUPON_EXHAUSTED')) {
      return Response.json({ code: reason.includes('COUPON_EXPIRED') ? 'COUPON_EXPIRED' : 'COUPON_INVALID', error: 'كود الخصم غير صالح أو منتهي أو استُخدم بالكامل.' }, { status: 400 });
    }
    if (reason.includes('INVALID_BOOKING_DATES') || reason.includes('INVALID_CUSTOMER_DATA')) {
      return Response.json({ code: 'INVALID_INPUT', error: 'تحقق من بيانات العميل وتواريخ الحجز.' }, { status: 400 });
    }
    if (errorCode === 'PGRST202' || /submit_public_booking.*(not found|schema cache)/i.test(reason)) {
      console.error('[public-booking:RPC_NOT_INSTALLED]', errorCode);
      return Response.json({
        code: 'BOOKING_RPC_NOT_INSTALLED',
        error: 'تحديث قاعدة بيانات الحجز غير مطبق على Supabase. شغّل ملف supabase-schema.sql على المشروع الصحيح ثم أعد المحاولة.',
      }, { status: 503 });
    }
    if (errorCode === '42501') {
      console.error('[public-booking:RPC_PERMISSION_DENIED]', errorCode);
      return Response.json({
        code: 'BOOKING_RPC_PERMISSION_DENIED',
        error: 'صلاحية تنفيذ الحجز غير مكتملة في قاعدة البيانات. راجع صلاحية service_role لدالة الحجز.',
      }, { status: 503 });
    }
    console.error('[public-booking:CREATE_FAILED]', JSON.stringify({ code: errorCode, message: reason.slice(0, 300) }));
    return Response.json({
      code: `BOOKING_DATABASE_ERROR_${errorCode}`,
      error: `تعذر تسجيل الطلب بسبب خطأ في قاعدة البيانات (${errorCode}). أرسل هذا الرمز للدعم.`,
    }, { status: 500 });
  }

  return Response.json({ booking: data }, { status: 201 });
}
