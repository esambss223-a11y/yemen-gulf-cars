'use client';

import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Booking, BookingReviewInput, PromoCoupon } from '@/types/fleet';
import { CalendarClock, CheckCircle2, CreditCard, FileCheck2, LoaderCircle, Phone, X } from 'lucide-react';

interface BookingReviewModalProps {
  booking: Booking;
  coupons: PromoCoupon[];
  onClose: () => void;
  onApprove: (details: BookingReviewInput) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100';
const documentPlaceholder = 'طلب حجز إلكتروني';
const subscribeToPortal = () => () => {};
const getPortalContainer = () => document.body;
const getServerPortalContainer = () => null;

export default function BookingReviewModal({ booking, coupons, onClose, onApprove, onReject }: BookingReviewModalProps) {
  const portalContainer = useSyncExternalStore(subscribeToPortal, getPortalContainer, getServerPortalContainer);
  useEffect(() => {
    const containers = [document.documentElement, document.body, ...document.querySelectorAll<HTMLElement>('.admin-content')];
    const previousOverflow = containers.map((element) => element.style.overflow);
    containers.forEach((element) => { element.style.overflow = 'hidden'; });
    return () => containers.forEach((element, index) => { element.style.overflow = previousOverflow[index]; });
  }, []);
  const originalCode = booking.discountCode?.trim().toUpperCase() || '';
  const today = new Date().toISOString().slice(0, 10);
  const hasActiveCoupon = originalCode !== '' && coupons.some((coupon) =>
    coupon.code.trim().toUpperCase() === originalCode && coupon.active &&
    (!coupon.expiresAt || coupon.expiresAt >= today),
  );
  const couponWasAppliedToRequest = Boolean(originalCode && booking.discountAmountEGP > 0);
  const [startDate, setStartDate] = useState(booking.startDate);
  const [startTime, setStartTime] = useState(booking.startTime || '14:00');
  const [endDate, setEndDate] = useState(booking.endDate);
  const [endTime, setEndTime] = useState(booking.endTime || '14:00');
  const [dailyRate, setDailyRate] = useState(String(booking.dailyRateEGP));
  const [discount, setDiscount] = useState(String(couponWasAppliedToRequest || hasActiveCoupon ? booking.discountAmountEGP || 0 : 0));
  const [deposit, setDeposit] = useState(String(booking.securityDepositEGP || 0));
  const [nationalId, setNationalId] = useState(booking.customer.nationalId === documentPlaceholder ? '' : booking.customer.nationalId || '');
  const [licenseNumber, setLicenseNumber] = useState(booking.customer.licenseNumber === documentPlaceholder ? '' : booking.customer.licenseNumber || '');
  const [identityVerified, setIdentityVerified] = useState(Boolean(booking.customer.identityVerified));
  const [licenseVerified, setLicenseVerified] = useState(Boolean(booking.customer.licenseVerified));
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const days = useMemo(() => {
    const start = Date.parse(`${startDate}T00:00:00`);
    const end = Date.parse(`${endDate}T00:00:00`);
    return Number.isFinite(start) && Number.isFinite(end) ? Math.max(1, Math.ceil((end - start) / 86_400_000)) : 0;
  }, [startDate, endDate]);
  const total = Math.max(0, Number(dailyRate || 0) * days);
  const discountAmount = Math.max(0, Number(discount || 0));
  const finalTotal = Math.max(0, total - discountAmount);

  const approve = async () => {
    setBusy(true);
    setError('');
    try {
      await onApprove({
        startDate, startTime, endDate, endTime,
        dailyRateEGP: Number(dailyRate), discountAmountEGP: discountAmount,
        securityDepositEGP: Number(deposit), nationalId: nationalId.trim(),
        licenseNumber: licenseNumber.trim(), identityVerified, licenseVerified,
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر اعتماد الطلب.');
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    setBusy(true);
    setError('');
    try {
      await onReject(rejectReason.trim());
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر رفض الطلب.');
    } finally {
      setBusy(false);
    }
  };

  if (!portalContainer) return null;

  return createPortal(
    <div className="admin-ui booking-review-root">
    <div className="booking-review-overlay fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 sm:p-6 font-arabic" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="booking-review-title" className="booking-review-dialog my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-slate-50 shadow-2xl">
        <header className="booking-review-header flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <button onClick={onClose} disabled={busy} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="إغلاق"><X className="h-5 w-5" /></button>
          <div className="text-right">
            <h2 id="booking-review-title" className="text-base font-black text-slate-900">مراجعة طلب الحجز</h2>
            <p className="mt-1 text-xs text-slate-500">{booking.bookingNumber} · {booking.carName} · {booking.carPlate}</p>
          </div>
        </header>

        <div className="booking-review-body max-h-[76vh] space-y-5 overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><span>{booking.customer.fullName}</span><FileCheck2 className="h-4 w-4 text-slate-400" /></div>
            <div className="flex items-center gap-2 text-sm text-slate-700"><span dir="ltr">{booking.customer.phone}</span><Phone className="h-4 w-4 text-slate-400" /></div>
            <p className="text-xs text-slate-500">وصل الطلب: {booking.createdAt}</p>
            <p className="text-xs text-slate-500">
              كود الخصم: {!originalCode ? 'لا يوجد' : couponWasAppliedToRequest ? `${originalCode} (تم التحقق منه وتثبيته عند تقديم الطلب)` : hasActiveCoupon ? `${originalCode} (فعال)` : `${originalCode} (غير فعّال)`}
            </p>
            {booking.notes && <p className="text-xs text-slate-600 sm:col-span-2">ملاحظات العميل: {booking.notes}</p>}
            <p className="text-[11px] text-amber-800 sm:col-span-2">لم تُرفق صور البطاقة أو الرخصة مع الطلب. أدخل الرقمين من الوثائق التي راجعتها مع العميل.</p>
          </div>

          <section className="space-y-3">
            <h3 className="flex items-center justify-end gap-2 text-sm font-black text-slate-800"><CalendarClock className="h-4 w-4 text-amber-600" /> موعد الاستلام والإرجاع</h3>
            <div className="booking-review-dates grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="text-xs font-bold text-slate-600">تاريخ الاستلام<input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`${fieldClass} mt-1`} /></label>
              <label className="text-xs font-bold text-slate-600">وقت الاستلام<input type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} className={`${fieldClass} mt-1`} /></label>
              <label className="text-xs font-bold text-slate-600">تاريخ الإرجاع<input type="date" required min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`${fieldClass} mt-1`} /></label>
              <label className="text-xs font-bold text-slate-600">وقت الإرجاع<input type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className={`${fieldClass} mt-1`} /></label>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="flex items-center justify-end gap-2 text-sm font-black text-slate-800"><CreditCard className="h-4 w-4 text-amber-600" /> التحقق من الهوية ورخصة القيادة</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-600">رقم البطاقة / الهوية<input value={nationalId} onChange={(e) => setNationalId(e.target.value)} className={`${fieldClass} mt-1`} maxLength={40} /></label>
              <label className="text-xs font-bold text-slate-600">رقم رخصة القيادة<input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className={`${fieldClass} mt-1`} maxLength={40} /></label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700"><input type="checkbox" checked={identityVerified} onChange={(e) => setIdentityVerified(e.target.checked)} className="h-4 w-4 accent-emerald-600" /> راجعت البطاقة/الهوية وطابقت بياناتها</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700"><input type="checkbox" checked={licenseVerified} onChange={(e) => setLicenseVerified(e.target.checked)} className="h-4 w-4 accent-emerald-600" /> راجعت رخصة القيادة وتأكدت من صلاحيتها</label>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-right text-sm font-black text-slate-800">السعر والتأمين</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-bold text-slate-600">السعر اليومي (ج.م)<input type="number" min="0" step="1" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} className={`${fieldClass} mt-1`} /></label>
              <label className="text-xs font-bold text-slate-600">الخصم (ج.م)<input type="number" min="0" step="1" value={discount} onChange={(e) => setDiscount(e.target.value)} className={`${fieldClass} mt-1`} /></label>
              <label className="text-xs font-bold text-slate-600">التأمين المسترد (ج.م)<input type="number" min="0" step="1" value={deposit} onChange={(e) => setDeposit(e.target.value)} className={`${fieldClass} mt-1`} /></label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
              <span>
                {days} أيام × {Number(dailyRate || 0).toLocaleString()}
                {discountAmount > 0 ? ` − خصم ${discountAmount.toLocaleString()}` : ' — بدون خصم'}
                {' = '}<strong className="text-amber-300">{finalTotal.toLocaleString()} ج.م</strong>
              </span>
              <span className="text-xs text-slate-300">التأمين: {Number(deposit || 0).toLocaleString()} ج.م</span>
            </div>
          </section>

          <section className="space-y-2 border-t border-slate-200 pt-4">
            <h3 className="text-right text-sm font-black text-rose-800">رفض الطلب</h3>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} maxLength={300} placeholder="اكتب سبب الرفض للرجوع إليه لاحقًا" className={`${fieldClass} flex-1`} />
              <button onClick={() => void reject()} disabled={busy || rejectReason.trim().length < 3} className="rounded-xl bg-rose-100 px-4 py-2 text-xs font-black text-rose-800 disabled:opacity-50">رفض الطلب</button>
            </div>
          </section>

          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-right text-xs font-bold text-rose-800">{error}</p>}
        </div>

        <footer className="booking-review-footer flex flex-col-reverse gap-2 border-t border-slate-200 bg-white p-4 sm:flex-row sm:justify-between">
          <button onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">إغلاق</button>
          <button onClick={() => void approve()} disabled={busy || !identityVerified || !licenseVerified || nationalId.trim().length < 4 || licenseNumber.trim().length < 4 || days < 1 || discountAmount > total} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} اعتماد الحجز بعد المراجعة
          </button>
        </footer>
      </section>
    </div>
    </div>,
    portalContainer,
  );
}
