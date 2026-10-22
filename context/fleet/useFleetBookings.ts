'use client';

import { useState, useCallback } from 'react';
import { Booking, BookingReviewInput, ReturnInspectionPayload, Customer, Invoice, Car } from '@/types/fleet';
import { supabase } from '@/lib/supabase';
import { reportFleetWriteError } from './fleetStorage';

interface UseFleetBookingsProps {
  cars: Car[];
  updateCar: (id: string, partial: Partial<Car>) => Promise<boolean>;
  setCarStatus: (id: string, status: Car['status']) => void;
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer | null>;
  updateCustomer: (id: string, partial: Partial<Customer>) => Promise<boolean>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'issuedAt'>) => Promise<boolean>;
  logAction: (action: string, details: string) => void;
  currentStaffName?: string;
}

export function useFleetBookings({
  cars,
  updateCar,
  setCarStatus,
  customers,
  addCustomer,
  updateCustomer,
  addInvoice,
  logAction,
  currentStaffName,
}: UseFleetBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const mapCloudBooking = useCallback((b: Record<string, any>): Booking => ({
    id: String(b.id),
    bookingNumber: String(b.booking_number),
    carId: String(b.car_id),
    carName: String(b.car_name),
    carPlate: String(b.car_plate),
    customer: typeof b.customer === 'string' ? JSON.parse(b.customer) : b.customer,
    startDate: String(b.start_date),
    startTime: b.start_time || '14:00',
    endDate: String(b.end_date),
    endTime: b.end_time || '14:00',
    actualReturnDate: b.actual_return_date,
    daysCount: Number(b.days_count || 1),
    dailyRateEGP: Number(b.daily_rate_egp),
    totalRentEGP: Number(b.total_rent_egp),
    discountCode: b.discount_code,
    discountAmountEGP: Number(b.discount_amount_egp || 0),
    finalTotalEGP: Number(b.final_total_egp),
    securityDepositEGP: Number(b.security_deposit_egp),
    depositStatus: b.deposit_status || 'held',
    startKm: Number(b.start_km || 0),
    returnKm: b.return_km ? Number(b.return_km) : undefined,
    status: b.status || 'active',
    staffId: b.staff_id || 'online',
    staffName: b.staff_name || 'النظام',
    notes: b.notes,
    createdAt: b.created_at || new Date().toLocaleString('ar-EG'),
  }), []);

  const addBooking = async (bookingData: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt'>): Promise<boolean> => {
    const seq = bookings.length + 1;
    const bookingNumber = `BK-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;
    const newBooking: Booking = {
      ...bookingData,
      id: `bk-${Date.now()}`,
      bookingNumber,
      createdAt: new Date().toLocaleString('ar-EG'),
    };
    try {
      const { error } = await supabase.from('bookings').insert({
        id: newBooking.id,
        booking_number: newBooking.bookingNumber,
        car_id: newBooking.carId,
        car_name: newBooking.carName,
        car_plate: newBooking.carPlate,
        customer: newBooking.customer,
        start_date: newBooking.startDate,
        start_time: newBooking.startTime,
        end_date: newBooking.endDate,
        end_time: newBooking.endTime,
        days_count: newBooking.daysCount,
        daily_rate_egp: newBooking.dailyRateEGP,
        total_rent_egp: newBooking.totalRentEGP,
        discount_code: newBooking.discountCode,
        discount_amount_egp: newBooking.discountAmountEGP,
        final_total_egp: newBooking.finalTotalEGP,
        security_deposit_egp: newBooking.securityDepositEGP,
        deposit_status: newBooking.depositStatus,
        start_km: newBooking.startKm,
        status: newBooking.status,
        staff_id: newBooking.staffId,
        staff_name: newBooking.staffName,
        notes: newBooking.notes,
      });
      if (error) throw error;
    } catch (error) {
      console.warn('Cloud booking insert failed:', error);
      reportFleetWriteError('تعذر حفظ الحجز في قاعدة البيانات؛ لم يُسجل الحجز.');
      return false;
    }

    setBookings((prev) => [newBooking, ...prev]);

    // Update dependent records only after the booking itself has been saved.
    if (newBooking.status === 'active') await updateCar(newBooking.carId, { status: 'rented' });

    const existingCust = customers.find(
      (c) => (newBooking.customer.nationalId && c.nationalId === newBooking.customer.nationalId) ||
        c.phone === newBooking.customer.phone
    );
    const earnedPoints = Math.round(newBooking.finalTotalEGP / 100);
    if (existingCust) {
      const newTotalSpent = (existingCust.totalSpentEGP || 0) + newBooking.finalTotalEGP;
      const newRentalsCount = (existingCust.totalRentalsCount || 0) + 1;
      const newPoints = Math.max(0, (existingCust.loyaltyPoints || 0) - (newBooking.loyaltyPointsRedeemed || 0) + earnedPoints);
      let dynamicTier = existingCust.tier || 'regular';
      if (dynamicTier !== 'blacklist') {
        if (newTotalSpent >= 60000 || newRentalsCount >= 5) dynamicTier = 'vip_gold';
        else if (newTotalSpent >= 25000 || newRentalsCount >= 2) dynamicTier = 'vip_silver';
      }
      await updateCustomer(existingCust.id, {
        totalRentalsCount: newRentalsCount,
        totalSpentEGP: newTotalSpent,
        loyaltyPoints: newPoints,
        tier: dynamicTier,
        trustScore: Math.min(100, (existingCust.trustScore || 80) + 3),
        nationality: newBooking.customer.nationality || existingCust.nationality || 'مصري',
      });
    } else {
      await addCustomer({
        fullName: newBooking.customer.fullName,
        phone: newBooking.customer.phone,
        whatsapp: newBooking.customer.whatsapp || newBooking.customer.phone,
        nationalId: newBooking.customer.nationalId,
        licenseNumber: newBooking.customer.licenseNumber,
        nationality: newBooking.customer.nationality || 'مصري',
        tier: 'regular',
        riskStatus: 'safe',
        trustScore: 88,
        loyaltyPoints: earnedPoints + 50,
        totalRentalsCount: 1,
        totalSpentEGP: newBooking.finalTotalEGP,
        notes: 'تم تسجيله وتوثيقه تلقائياً عبر حجز جديد',
      });
    }

    await addInvoice({
      bookingId: newBooking.id,
      customerName: newBooking.customer.fullName,
      customerPhone: newBooking.customer.phone,
      carDetails: `${newBooking.carName} (${newBooking.carPlate})`,
      totalAmountEGP: newBooking.finalTotalEGP,
      depositAmountEGP: newBooking.securityDepositEGP,
      paymentMethod: 'cash',
      paid: true,
      issuedBy: newBooking.staffName,
    });

    logAction(
      'إنشاء حجز وفاتورة جديدة',
      `تم حجز ${newBooking.carName} للعميل ${newBooking.customer.fullName} بقيمة ${newBooking.finalTotalEGP.toLocaleString()} ج.م`
    );
    return true;
  };

  const updateBookingStatus = async (
    id: string,
    status: Booking['status'],
    returnKm?: number,
    delayDetails?: ReturnInspectionPayload
  ): Promise<boolean> => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return false;

    const penaltyFee = delayDetails?.penaltyFee || 0;
    const cleanlinessFee = delayDetails?.cleanlinessFee || 0;
    const damageFee = delayDetails?.damageFee || 0;
    const totalDeductions = penaltyFee + cleanlinessFee + damageFee;

    const { data: savedBooking, error: bookingSaveError } = await supabase.from('bookings').update({
      status,
      return_km: returnKm || booking.startKm,
      deposit_status: status === 'completed'
        ? totalDeductions >= booking.securityDepositEGP
          ? 'pending'
          : totalDeductions > 0 ? 'refunded_partial' : 'refunded_full'
        : booking.depositStatus,
    }).eq('id', id).select('id').maybeSingle();
    if (bookingSaveError || !savedBooking) {
      console.warn('Cloud booking status update failed:', bookingSaveError);
      reportFleetWriteError('تعذر حفظ حالة الحجز في قاعدة البيانات؛ لم يُعتمد التغيير.');
      return false;
    }

    setBookings((prev) => prev.map((b) => {
        if (b.id === id) {
          return {
            ...b,
            status,
            returnKm: returnKm || b.returnKm,
            actualReturnDate: status === 'completed' ? new Date().toISOString().split('T')[0] : b.actualReturnDate,
            depositStatus:
              status === 'completed'
                ? totalDeductions >= b.securityDepositEGP
                  ? ('pending' as const)
                  : totalDeductions > 0
                  ? ('refunded_partial' as const)
                  : ('refunded_full' as const)
                : b.depositStatus,
            lateNoticeGiven: delayDetails?.lateNoticeGiven ?? b.lateNoticeGiven,
            lateHoursCount: delayDetails?.lateHours ?? b.lateHoursCount,
            latePenaltyFeeEGP: penaltyFee > 0 ? penaltyFee : b.latePenaltyFeeEGP,
            cleanlinessFeeEGP: cleanlinessFee > 0 ? cleanlinessFee : b.cleanlinessFeeEGP,
            cleanlinessScore: delayDetails?.cleanlinessScore ?? b.cleanlinessScore,
            damageFeeEGP: damageFee > 0 ? damageFee : b.damageFeeEGP,
            damageDescription: delayDetails?.damageDescription ?? b.damageDescription,
            customerRatingStars: delayDetails?.customerRatingStars ?? b.customerRatingStars,
            customerRecommendation: delayDetails?.customerRecommendation ?? b.customerRecommendation,
            returnInspectionStaff: delayDetails?.staffName || b.returnInspectionStaff || currentStaffName,
            approvedByStaffName: delayDetails?.staffName || b.approvedByStaffName,
          };
        }
        return b;
      }));

    // لا تُحجز السيارة فعليًا حتى تعتمد الإدارة الطلب العام.
    if (status === 'active' && (booking.status === 'pending_approval' || booking.status === 'confirmed')) {
      await updateCar(booking.carId, { status: 'rented' });
    }

    // تحديث حالة السيارة عند الإرجاع
    if (status === 'completed') {
      const nextCarStatus =
        cleanlinessFee > 0
          ? 'cleaning'
          : damageFee > 0
          ? 'maintenance'
          : 'available';

      await updateCar(booking.carId, {
        status: nextCarStatus,
        ...(returnKm ? { currentKm: returnKm } : {}),
      });

      // تحديث ملف العميل وسلوكه
      const existingCust = customers.find(
        (c) =>
          (booking.customer.nationalId && c.nationalId === booking.customer.nationalId) ||
          c.phone === booking.customer.phone
      );

      if (existingCust) {
        const prevRating = existingCust.starRating || 5;
        const prevCount = existingCust.ratingCount || 1;
        const inputStars = delayDetails?.customerRatingStars || 5;
        const newRatingCount = prevCount + 1;
        const newStarRating = Number(((prevRating * prevCount + inputStars) / newRatingCount).toFixed(1));

        const newDamagesCount = (existingCust.damagesCount || 0) + (damageFee > 0 ? 1 : 0);

        let dynamicTier = existingCust.tier || 'regular';
        let dynamicRisk = existingCust.riskStatus || 'safe';
        let newTrustScore = existingCust.trustScore ?? 85;

        if (delayDetails?.customerRecommendation === 'blacklist') {
          dynamicTier = 'blacklist';
          dynamicRisk = 'high_risk';
          newTrustScore = Math.max(0, newTrustScore - 40);
        } else if (delayDetails?.customerRecommendation === 'caution' || damageFee > 2000) {
          dynamicRisk = 'medium';
          newTrustScore = Math.max(30, newTrustScore - 15);
        } else {
          newTrustScore = Math.min(100, newTrustScore + 2);
        }

        let updatedNotes = existingCust.notes || '';
        if (delayDetails?.inspectionNotes) {
          const notePrefix = `\n[فحص ${booking.bookingNumber}]: `;
          updatedNotes = updatedNotes ? `${updatedNotes}${notePrefix}${delayDetails.inspectionNotes}` : delayDetails.inspectionNotes;
        }

        await updateCustomer(existingCust.id, {
          starRating: newStarRating,
          ratingCount: newRatingCount,
          cleanlinessScore: delayDetails?.cleanlinessScore || existingCust.cleanlinessScore || 'clean',
          damagesCount: newDamagesCount,
          tier: dynamicTier,
          riskStatus: dynamicRisk,
          trustScore: newTrustScore,
          notes: updatedNotes,
        });
      }

      const logSummary = [
        `تم استلام ${booking.carName} (عداد: ${returnKm || booking.startKm} كم)`,
        penaltyFee > 0 ? `غرامة تأخير: ${penaltyFee.toLocaleString()} ج.م` : null,
        cleanlinessFee > 0 ? `غسيل: ${cleanlinessFee.toLocaleString()} ج.م` : null,
        damageFee > 0 ? `أضرار: ${damageFee.toLocaleString()} ج.م` : null,
        `حالة السيارة: ${
          nextCarStatus === 'available'
            ? 'جاهزة ومتاحة'
            : nextCarStatus === 'cleaning'
            ? 'تحت الغسيل'
            : 'تحت الصيانة'
        }`,
      ]
        .filter(Boolean)
        .join(' | ');

      logAction('استلام سيارة وتقييم العميل', logSummary);
    }

    return true;
  };

  const reviewPendingBooking = async (
    booking: Booking,
    decision: 'approved' | 'rejected',
    details?: BookingReviewInput,
    reason?: string,
  ) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('انتهت جلسة الدخول. سجّل الدخول مجددًا.');

    const response = await fetch('/api/admin/bookings/review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ id: booking.id, decision, ...(details || {}), reason }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'تعذرت مراجعة طلب الحجز.');

    const reviewed = mapCloudBooking(result.booking);
    setBookings((previous) => previous.map((item) => item.id === reviewed.id ? reviewed : item));
    if (decision === 'approved' && reviewed.customer.id) {
      await updateCustomer(reviewed.customer.id, {
        nationalId: reviewed.customer.nationalId,
        licenseNumber: reviewed.customer.licenseNumber,
        identityVerified: true,
      });
    }
    if (reviewed.status === 'active') setCarStatus(booking.carId, 'rented');
    logAction(
      decision === 'approved' ? 'اعتماد طلب حجز' : 'رفض طلب حجز',
      `${booking.bookingNumber} — ${booking.customer.fullName}${reason ? ` — ${reason}` : ''}`,
    );
  };

  const activateConfirmedBooking = async (booking: Booking) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('انتهت جلسة الدخول. سجّل الدخول مجددًا.');

    const response = await fetch('/api/admin/bookings/review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ id: booking.id, decision: 'activate' }),
    });
    const result = await response.json();
    if (!response.ok || !result.booking) throw new Error(result.error || 'تعذر بدء العقد.');

    const activated = mapCloudBooking(result.booking);
    setBookings((previous) => previous.map((item) => item.id === activated.id ? activated : item));
    setCarStatus(booking.carId, 'rented');
    logAction('بدء عقد وتسليم سيارة', `${booking.bookingNumber} — ${booking.carName} — ${booking.customer.fullName}`);
  };

  return {
    bookings,
    setBookings,
    mapCloudBooking,
    addBooking,
    updateBookingStatus,
    reviewPendingBooking,
    activateConfirmedBooking,
  };
}
