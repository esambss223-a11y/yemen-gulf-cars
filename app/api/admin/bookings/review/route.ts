import { authorizeStaffRequest } from '@/lib/server/staff-auth';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json();
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function validDate(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return DATE.test(value) && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export async function POST(request: Request) {
  const auth = await authorizeStaffRequest(request, true);
  if (!auth.ok) return Response.json({ code: 'NOT_AUTHORIZED', error: auth.error }, { status: auth.status });

  const body = await readBody(request);
  const id = typeof body?.id === 'string' ? body.id.trim() : '';
  const decision = body?.decision;
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
  if (!id || (decision !== 'approved' && decision !== 'rejected')) {
    return Response.json({ code: 'INVALID_REVIEW', error: 'بيانات مراجعة الطلب غير صالحة.' }, { status: 400 });
  }

  const { data: booking, error: bookingError } = await auth.admin
    .from('bookings').select('*').eq('id', id).eq('status', 'pending_approval').maybeSingle();
  if (bookingError) {
    return Response.json({ code: 'BOOKING_LOOKUP_FAILED', error: 'تعذر تحميل طلب الحجز.' }, { status: 503 });
  }
  if (!booking) {
    return Response.json({ code: 'BOOKING_NOT_PENDING', error: 'الطلب غير موجود أو تمت مراجعته مسبقًا.' }, { status: 409 });
  }

  if (decision === 'rejected') {
    if (reason.length < 3 || reason.length > 300) {
      return Response.json({ code: 'REJECTION_REASON_REQUIRED', error: 'اكتب سبب الرفض (من 3 إلى 300 حرف).' }, { status: 400 });
    }
    const notes = [booking.notes, `رفض الطلب بواسطة ${auth.staff.name}: ${reason}`].filter(Boolean).join('\n');
    const { data, error } = await auth.admin.from('bookings')
      .update({ status: 'cancelled', notes }).eq('id', id).eq('status', 'pending_approval').select('*').maybeSingle();
    if (error || !data) {
      return Response.json({ code: 'BOOKING_REJECT_FAILED', error: 'تعذر رفض الطلب؛ حدّث الصفحة وحاول مجددًا.' }, { status: 503 });
    }
    return Response.json({ booking: data });
  }

  const startDate = typeof body?.startDate === 'string' ? body.startDate : '';
  const endDate = typeof body?.endDate === 'string' ? body.endDate : '';
  const startTime = typeof body?.startTime === 'string' ? body.startTime : '';
  const endTime = typeof body?.endTime === 'string' ? body.endTime : '';
  const dailyRate = Number(body?.dailyRateEGP);
  const discount = Number(body?.discountAmountEGP);
  const deposit = Number(body?.securityDepositEGP);
  const nationalId = typeof body?.nationalId === 'string' ? body.nationalId.trim() : '';
  const licenseNumber = typeof body?.licenseNumber === 'string' ? body.licenseNumber.trim() : '';
  const identityVerified = body?.identityVerified === true;
  const licenseVerified = body?.licenseVerified === true;

  if (!validDate(startDate) || !validDate(endDate) || endDate <= startDate ||
      !TIME.test(startTime) || !TIME.test(endTime) ||
      !Number.isFinite(dailyRate) || dailyRate < 0 || dailyRate > 10_000_000 ||
      !Number.isFinite(discount) || discount < 0 || discount > 10_000_000 ||
      !Number.isFinite(deposit) || deposit < 0 || deposit > 10_000_000 ||
      nationalId.length < 4 || nationalId.length > 40 || licenseNumber.length < 4 || licenseNumber.length > 40) {
    return Response.json({ code: 'INVALID_REVIEW_DETAILS', error: 'تحقق من التواريخ والأوقات والمبالغ وأرقام الوثائق.' }, { status: 400 });
  }
  if (!identityVerified || !licenseVerified) {
    return Response.json({ code: 'DOCUMENTS_NOT_VERIFIED', error: 'أكد مراجعة البطاقة والرخصة قبل الاعتماد.' }, { status: 400 });
  }

  const { data: conflicts, error: conflictError } = await auth.admin.from('bookings')
    .select('id').eq('car_id', booking.car_id).neq('id', id)
    .in('status', ['pending_approval', 'confirmed', 'active'])
    .lt('start_date', endDate).gt('end_date', startDate).limit(1);
  if (conflictError) {
    return Response.json({ code: 'AVAILABILITY_CHECK_FAILED', error: 'تعذر التحقق من توفر السيارة.' }, { status: 503 });
  }
  if (conflicts?.length) {
    return Response.json({ code: 'BOOKING_CONFLICT', error: 'السيارة مرتبطة بطلب آخر خلال هذه المدة.' }, { status: 409 });
  }

  const daysCount = Math.max(1, Math.ceil((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000));
  const totalRent = dailyRate * daysCount;
  if (discount > totalRent) {
    return Response.json({ code: 'DISCOUNT_TOO_LARGE', error: 'الخصم لا يمكن أن يتجاوز إجمالي الإيجار.' }, { status: 400 });
  }
  const customer = typeof booking.customer === 'string' ? JSON.parse(booking.customer) : (booking.customer || {});
  const reviewedCustomer = {
    ...customer,
    nationalId,
    licenseNumber,
    identityVerified: true,
    licenseVerified: true,
    documentsVerifiedAt: new Date().toISOString(),
    documentsVerifiedBy: auth.staff.name,
  };
  const finalTotal = totalRent - discount;
  const notes = [booking.notes, `تم اعتماد الطلب بواسطة ${auth.staff.name}`].filter(Boolean).join('\n');

  const { data: updated, error: updateError } = await auth.admin.from('bookings').update({
    customer: reviewedCustomer,
    start_date: startDate,
    start_time: startTime,
    end_date: endDate,
    end_time: endTime,
    days_count: daysCount,
    daily_rate_egp: dailyRate,
    total_rent_egp: totalRent,
    discount_amount_egp: discount,
    final_total_egp: finalTotal,
    security_deposit_egp: deposit,
    status: 'active',
    staff_id: auth.staff.id,
    staff_name: auth.staff.name,
    notes,
  }).eq('id', id).eq('status', 'pending_approval').select('*').maybeSingle();
  if (updateError || !updated) {
    return Response.json({ code: 'BOOKING_APPROVE_FAILED', error: 'تعذر اعتماد الطلب؛ حدّث الصفحة وحاول مجددًا.' }, { status: 503 });
  }

  const { error: carError } = await auth.admin.from('cars').update({ status: 'rented' }).eq('id', booking.car_id);
  if (carError) {
    await auth.admin.from('bookings').update({ status: 'pending_approval' }).eq('id', id).eq('status', 'active');
    return Response.json({ code: 'CAR_STATUS_UPDATE_FAILED', error: 'تعذر تحديث حالة السيارة؛ لم يكتمل الاعتماد. حاول مجددًا.' }, { status: 503 });
  }

  if (reviewedCustomer.phone) {
    const { error: customerError } = await auth.admin.from('customers').update({
      national_id: nationalId,
      license_number: licenseNumber,
    }).eq('phone', reviewedCustomer.phone);
    if (customerError) console.error('[booking-review:CUSTOMER_DOCUMENT_SYNC_FAILED]', customerError.code || 'UNKNOWN');
  }

  return Response.json({ booking: updated });
}
