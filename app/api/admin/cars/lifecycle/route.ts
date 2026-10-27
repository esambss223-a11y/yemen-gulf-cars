import { authorizeStaffRequest } from '@/lib/server/staff-auth';

const errors: Record<string, string> = {
  CAR_HAS_HISTORY: 'للسيارة سجل حجوزات محفوظ. استخدم الأرشفة بعد إنهاء الحجوزات المفتوحة.',
  CAR_HAS_OPEN_BOOKINGS: 'يجب إلغاء الطلبات والحجوزات غير المنفذة، واستلام السيارة وإغلاق العقود الجارية قبل الأرشفة.',
  BOOKING_NOT_CANCELLABLE: 'تغيّرت حالة الحجز. العقد الجاري يُغلق بإجراء الاستلام، ولا يُلغى من هنا.',
  SETTLEMENT_REQUIRED: 'للحجز مبالغ مدفوعة أو تأمين محتجز. يجب مراجعة وتسوية المبالغ مع المحاسب قبل الإلغاء؛ لم تُغيّر الفاتورة أو المدفوعات.',
  REASON_REQUIRED: 'اكتب سبب الإلغاء من 3 إلى 300 حرف.',
  CAR_NOT_FOUND: 'السيارة غير موجودة. حدّث الصفحة.',
  CAR_NOT_ARCHIVED: 'السيارة ليست مؤرشفة. حدّث الصفحة.',
  ADMIN_REQUIRED: 'هذه العملية متاحة للمدير فقط.',
};
export async function POST(request: Request) {
  const auth = await authorizeStaffRequest(request, true);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'طلب غير صالح.' }, { status: 400 }); }
  if (!body || typeof body.carId !== 'string' || !body.carId.trim() || body.carId.length > 200 ||
    !['archive', 'restore', 'delete', 'cancel_booking'].includes(body.action) ||
    (body.action === 'cancel_booking' && (typeof body.bookingId !== 'string' || !body.bookingId || body.bookingId.length > 200 ||
      typeof body.reason !== 'string' || body.reason.trim().length < 3 || body.reason.trim().length > 300))) {
    return Response.json({ error: 'تحقق من بيانات العملية وسبب الإلغاء.' }, { status: 400 });
  }
  const { data, error } = await auth.admin.rpc('fleet_car_action', {
    p_actor: auth.staff.id, p_car_id: body.carId.trim(), p_action: body.action,
    p_booking_id: body.action === 'cancel_booking' ? body.bookingId : null,
    p_reason: body.action === 'cancel_booking' ? body.reason.trim() : null,
  });
  if (error) {
    if (error.code === 'PGRST202') return Response.json({ code: 'LIFECYCLE_NOT_INSTALLED',
      error: 'تحديث الأرشفة والإلغاء الآمن لم يُفعّل في قاعدة البيانات بعد. اطلب من المبرمج تفعيله؛ لم تُغيّر بياناتك.' }, { status: 503 });
    const code = Object.keys(errors).find((key) => error.message.includes(key));
    if (code) return Response.json({ code, error: errors[code] }, { status: 409 });
    console.error('[car-lifecycle:FAILED]', error.code);
    return Response.json({ error: 'لم تكتمل العملية. حدّث الصفحة وأعد المحاولة؛ لم يُعتمد تغيير جزئي.' }, { status: 503 });
  }
  return Response.json(data);
}
