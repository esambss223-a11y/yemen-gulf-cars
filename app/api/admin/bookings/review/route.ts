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

function cairoNowMinute() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}

export async function POST(request: Request) {
  const auth = await authorizeStaffRequest(request, true);
  if (!auth.ok) return Response.json({ code: 'NOT_AUTHORIZED', error: auth.error }, { status: auth.status });

  const body = await readBody(request);
  const id = typeof body?.id === 'string' ? body.id.trim() : '';
  const decision = body?.decision;
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
  if (!id || (decision !== 'approved' && decision !== 'rejected' && decision !== 'activate')) {
    return Response.json({ code: 'INVALID_REVIEW', error: 'بيانات مراجعة الطلب غير صالحة.' }, { status: 400 });
  }

  if (decision === 'activate') {
    const { data: booking, error: bookingError } = await auth.admin
      .from('bookings').select('*').eq('id', id).eq('status', 'confirmed').maybeSingle();
    if (bookingError) return Response.json({ code: 'BOOKING_LOOKUP_FAILED', error: 'تعذر تحميل الحجز المؤكد.' }, { status: 503 });
    if (!booking) return Response.json({ code: 'BOOKING_NOT_CONFIRMED', error: 'الحجز غير موجود أو ليس بحالة مؤكد.' }, { status: 409 });
    if (`${booking.start_date}T${String(booking.start_time || '14:00').slice(0, 5)}` > cairoNowMinute()) {
      return Response.json({ code: 'BOOKING_STARTS_LATER', error: 'لا يمكن بدء العقد قبل تاريخ الاستلام.' }, { status: 409 });
    }

    const { data: activeConflicts, error: conflictError } = await auth.admin.from('bookings')
      .select('id').eq('car_id', booking.car_id).neq('id', id).in('status', ['confirmed', 'active'])
      .lt('start_date', booking.end_date).gt('end_date', booking.start_date).limit(1);
    if (conflictError) return Response.json({ code: 'AVAILABILITY_CHECK_FAILED', error: 'تعذر التحقق من توفر السيارة.' }, { status: 503 });
    if (activeConflicts?.length) return Response.json({ code: 'BOOKING_CONFLICT', error: 'للسيارة عقد نشط يتعارض مع هذا الحجز.' }, { status: 409 });

    const { data: activated, error: activationError } = await auth.admin.from('bookings')
      .update({ status: 'active' }).eq('id', id).eq('status', 'confirmed').select('*').maybeSingle();
    if (activationError || !activated) return Response.json({ code: 'BOOKING_ACTIVATE_FAILED', error: 'تعذر بدء العقد؛ حدّث الصفحة وحاول مجددًا.' }, { status: 503 });

    const { data: updatedCar, error: carError } = await auth.admin.from('cars')
      .update({ status: 'rented' }).eq('id', booking.car_id).eq('status', 'available').select('id').maybeSingle();
    if (carError || !updatedCar) {
      const { error: rollbackError } = await auth.admin.from('bookings')
        .update({ status: 'confirmed' }).eq('id', id).eq('status', 'active');
      if (rollbackError) {
        console.error('[booking-activate:ROLLBACK_FAILED]', rollbackError.code || 'UNKNOWN');
        return Response.json({
          code: 'BOOKING_CAR_SYNC_FAILED',
          error: 'تعذر تحديث حالة السيارة والتراجع عن حالة الحجز. أعد تحميل الصفحة وتحقق من حالة الحجز والسيارة قبل أي تعديل.',
        }, { status: 503 });
      }
      return Response.json({ code: 'CAR_STATUS_UPDATE_FAILED', error: 'السيارة ليست متاحة للتسليم؛ لم يبدأ العقد.' }, { status: 409 });
    }

    return Response.json({ booking: activated });
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
    if (typeof booking.discount_code === 'string' && booking.discount_code.trim()) {
      const { data: coupon, error: couponLookupError } = await auth.admin.from('coupons')
        .select('id, used_count').eq('code', booking.discount_code.trim()).maybeSingle();
      if (couponLookupError) {
        console.error('[booking-reject:COUPON_LOOKUP_FAILED]', couponLookupError.code || 'UNKNOWN');
      } else if (coupon && Number(coupon.used_count) > 0) {
        const { error: couponReleaseError } = await auth.admin.from('coupons')
          .update({ used_count: Number(coupon.used_count) - 1 }).eq('id', coupon.id);
        if (couponReleaseError) console.error('[booking-reject:COUPON_RELEASE_FAILED]', couponReleaseError.code || 'UNKNOWN');
      }
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
    .in('status', ['confirmed', 'active'])
    .lt('start_date', endDate).gt('end_date', startDate).limit(1);
  if (conflictError) {
    return Response.json({ code: 'AVAILABILITY_CHECK_FAILED', error: 'تعذر التحقق من توفر السيارة.' }, { status: 503 });
  }
  if (conflicts?.length) {
    return Response.json({ code: 'BOOKING_CONFLICT', error: 'السيارة مرتبطة بطلب آخر خلال هذه المدة.' }, { status: 409 });
  }

  const { data: targetCar, error: targetCarError } = await auth.admin
    .from('cars').select('id, status').eq('id', booking.car_id).maybeSingle();
  if (targetCarError) return Response.json({ code: 'CAR_LOOKUP_FAILED', error: 'تعذر التحقق من حالة السيارة.' }, { status: 503 });
  if (!targetCar || targetCar.status !== 'available') {
    return Response.json({ code: 'CAR_UNAVAILABLE', error: 'السيارة غير متاحة للاعتماد في الوقت الحالي.' }, { status: 409 });
  }

  const daysCount = Math.max(1, Math.ceil((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000));
  const totalRent = dailyRate * daysCount;
  if (discount > totalRent) {
    return Response.json({ code: 'DISCOUNT_TOO_LARGE', error: 'الخصم لا يمكن أن يتجاوز إجمالي الإيجار.' }, { status: 400 });
  }
  let approvedDiscount = discount;
  let approvedDiscountCode: string | null = null;
  const submittedCouponCode = typeof booking.discount_code === 'string' ? booking.discount_code.trim().toUpperCase() : '';
  if (submittedCouponCode) {
    // The public booking RPC has already reserved/incremented this coupon use.
    // Keep that verified discount for this request, even if it consumed the last use
    // or the coupon was disabled after the customer submitted the request.
    if (Number(booking.discount_amount_egp || 0) > 0) {
      approvedDiscountCode = submittedCouponCode;
    } else {
      const { data: coupon, error: couponError } = await auth.admin.from('coupons')
        .select('active, expires_at').eq('code', submittedCouponCode).maybeSingle();
      if (couponError) return Response.json({ code: 'COUPON_LOOKUP_FAILED', error: 'تعذر التحقق من كود الخصم؛ لم يعتمد الطلب.' }, { status: 503 });
      const couponIsCurrent = Boolean(
        coupon &&
        coupon.active &&
        (!coupon.expires_at || String(coupon.expires_at).slice(0, 10) >= cairoNowMinute().slice(0, 10))
      );
      if (couponIsCurrent) approvedDiscountCode = submittedCouponCode;
      else approvedDiscount = 0;
    }
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
  const finalTotal = totalRent - approvedDiscount;
  const notes = [booking.notes, `تم اعتماد الطلب بواسطة ${auth.staff.name}`].filter(Boolean).join('\n');

  const startsInFuture = `${startDate}T${startTime.slice(0, 5)}` > cairoNowMinute();
  const approvedStatus = startsInFuture ? 'confirmed' : 'active';
  const { data: updated, error: updateError } = await auth.admin.from('bookings').update({
    customer: reviewedCustomer,
    start_date: startDate,
    start_time: startTime,
    end_date: endDate,
    end_time: endTime,
    days_count: daysCount,
    daily_rate_egp: dailyRate,
    total_rent_egp: totalRent,
    discount_code: approvedDiscountCode,
    discount_amount_egp: approvedDiscount,
    final_total_egp: finalTotal,
    security_deposit_egp: deposit,
    status: approvedStatus,
    staff_id: auth.staff.id,
    staff_name: auth.staff.name,
    notes,
  }).eq('id', id).eq('status', 'pending_approval').select('*').maybeSingle();
  if (updateError || !updated) {
    return Response.json({ code: 'BOOKING_APPROVE_FAILED', error: 'تعذر اعتماد الطلب؛ حدّث الصفحة وحاول مجددًا.' }, { status: 503 });
  }

  if (approvedStatus === 'active') {
    const { data: updatedCar, error: carError } = await auth.admin.from('cars').update({ status: 'rented' })
      .eq('id', booking.car_id).eq('status', 'available').select('id').maybeSingle();
    if (carError || !updatedCar) {
      const { error: rollbackError } = await auth.admin.from('bookings')
        .update({ status: 'pending_approval' }).eq('id', id).eq('status', 'active');
      if (rollbackError) {
        console.error('[booking-approve:ROLLBACK_FAILED]', rollbackError.code || 'UNKNOWN');
        return Response.json({
          code: 'BOOKING_CAR_SYNC_FAILED',
          error: 'تعذر تحديث حالة السيارة والتراجع عن اعتماد الحجز. أعد تحميل الصفحة وتحقق من حالة الحجز والسيارة قبل أي تعديل.',
        }, { status: 503 });
      }
      return Response.json({ code: 'CAR_STATUS_UPDATE_FAILED', error: 'تعذر تحديث حالة السيارة؛ لم يكتمل الاعتماد. حاول مجددًا.' }, { status: 503 });
    }
  }

  if (typeof reviewedCustomer.id === 'string' && reviewedCustomer.phone) {
    const { error: customerError } = await auth.admin.from('customers').update({
      national_id: nationalId,
      license_number: licenseNumber,
      identity_verified: true,
    }).eq('id', reviewedCustomer.id);
    if (customerError) console.error('[booking-review:CUSTOMER_DOCUMENT_SYNC_FAILED]', customerError.code || 'UNKNOWN');
  }

  return Response.json({ booking: updated });
}
