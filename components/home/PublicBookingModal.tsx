'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Car } from '@/types/fleet';
import { X, Calendar, CheckCircle2, ArrowLeft, XCircle, LoaderCircle, CircleAlert } from 'lucide-react';

function dateAfterDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

interface PublicBookingModalProps {
  car: Car;
  onClose: () => void;
}

export default function PublicBookingModal({ car, onClose }: PublicBookingModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [startDate, setStartDate] = useState(() => dateAfterDays(1));
  const [endDate, setEndDate] = useState(() => dateAfterDays(4));
  const [discountCode, setDiscountCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [couponStatus, setCouponStatus] = useState<'idle' | 'checking' | 'active' | 'inactive' | 'error'>('idle');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');

  // حساب الأيام والمبالغ
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const totalRent = days * car.dailyPriceEGP;

  const handleApplyCoupon = async () => {
    const code = discountCode.trim();
    if (!code) {
      setCouponStatus('inactive');
      setCouponMessage('أدخل كود الخصم أولًا.');
      return;
    }

    setCouponStatus('checking');
    setCouponMessage('جارٍ التحقق من الكود...');
    try {
      const response = await fetch('/api/public/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'تعذر التحقق من كود الخصم.');
      setCouponStatus(result.valid ? 'active' : 'inactive');
      setCouponMessage(result.message || (result.valid ? 'الكود فعّال.' : 'الكود غير فعّال.'));
    } catch (error) {
      setCouponStatus('error');
      setCouponMessage(error instanceof Error ? error.message : 'تعذر التحقق من كود الخصم.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/public/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: car.id, customerName, customerPhone, startDate, endDate,
          discountCode: discountCode.trim(), notes,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        const errorPrefix = result.code ? `[${result.code}] ` : '';
        throw new Error(`${errorPrefix}${result.error || 'تعذر إرسال طلب الحجز.'}`);
      }

      const booking = result.booking;
      const whatsappMsg = encodeURIComponent(
        `مرحباً شركة اليمن والخليج، أرسلت طلب حجز عبر الموقع.\n\n` +
        `رقم الطلب: ${booking.bookingNumber}\nالسيارة: ${booking.carName}\n` +
        `الاسم: ${customerName}\nالهاتف: ${customerPhone}\n` +
        `المدة: ${booking.daysCount} أيام (من ${startDate} إلى ${endDate})\n` +
        `الإجمالي: ${Number(booking.finalTotalEGP).toLocaleString()} ج.م\n` +
        `التأمين المسترد: ${Number(booking.securityDepositEGP).toLocaleString()} ج.م\n` +
        (notes ? `ملاحظات: ${notes}\n` : '') +
        `\nأرجو التواصل معي لتأكيد الطلب.`
      );
      setWhatsappUrl(`https://wa.me/201034025211?text=${whatsappMsg}`);
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'تعذر إرسال طلب الحجز.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-arabic">
      
      <div className="bg-[#080d1a] border border-[#c5a059]/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative my-auto">
        
        {/* شريط الإغلاق والعنوان */}
        <div className="p-4 bg-[#0c1426] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#c5a059]" />
            <h3 className="text-sm font-bold text-white">
              حجز سيارة سريعة — <span className="text-[#f3e5ab]">{car.make} {car.model}</span>
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-lg font-black text-white">تم استلام طلب حجزك بنجاح!</h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              تم استلام طلبك وهو بانتظار مراجعة الإدارة. يمكنك إرسال تفاصيل الطلب إلى خدمة العملاء عبر واتساب.
            </p>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-500">
              متابعة عبر واتساب
            </a>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-[#c5a059] text-black font-black text-xs hover:bg-[#d4af37]"
            >
              إغلاق النافذة
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            
            {/* ملخص السيارة والسعر */}
            <div className="p-3 bg-[#0d162a] rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="w-16 h-12 relative rounded-lg overflow-hidden bg-slate-900 shrink-0">
                <Image src={car.coverImage || car.images[0] || '/car-mercedes.jpg'} alt={car.model} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{car.make} {car.model} {car.year}</h4>
                <div className="flex items-center justify-between text-[11px] mt-1">
                  <span className="text-slate-400">السعر اليومي:</span>
                  <span className="font-mono font-bold text-[#c5a059]">{car.dailyPriceEGP.toLocaleString()} ج.م / يوم</span>
                </div>
              </div>
            </div>

            {/* بيانات العميل */}
            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">الاسم الكامل:</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: عبد الله أحمد المنصوري"
                  className="w-full bg-[#0d162a] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">رقم الهاتف / الواتساب:</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="مثال: 01012345678 أو +966500000000"
                  className="w-full bg-[#0d162a] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">تاريخ الاستلام:</label>
                  <input
                    type="date"
                    required
                    min={dateAfterDays(0)}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#0d162a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">تاريخ الإرجاع:</label>
                  <input
                    type="date"
                    required
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#0d162a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              {/* كود الخصم */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">هل لديك كود خصم؟</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value);
                      setCouponStatus('idle');
                      setCouponMessage('');
                    }}
                    placeholder="مثال: VIP2026 أو GULF10"
                    className="flex-1 bg-[#0d162a] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 uppercase focus:outline-none focus:border-[#c5a059]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponStatus === 'checking'}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-[#c5a059] hover:text-black text-slate-300 text-xs font-bold transition-all"
                  >
                    {couponStatus === 'checking' ? 'جارٍ التحقق...' : 'تحقق'}
                  </button>
                </div>
                {couponMessage && (
                  <div
                    role={couponStatus === 'inactive' || couponStatus === 'error' ? 'alert' : 'status'}
                    aria-live="polite"
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-bold mt-2 ${
                      couponStatus === 'active'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : couponStatus === 'checking'
                        ? 'border-slate-600 bg-slate-800/60 text-slate-300'
                        : 'border-red-500/30 bg-red-500/10 text-red-300'
                    }`}
                  >
                    {couponStatus === 'active' ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                      : couponStatus === 'checking' ? <LoaderCircle className="w-4 h-4 shrink-0 animate-spin" />
                      : couponStatus === 'error' ? <XCircle className="w-4 h-4 shrink-0" />
                      : <CircleAlert className="w-4 h-4 shrink-0" />}
                    <span>{couponMessage}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">ملاحظات أو مكان الاستلام المطلوب:</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: استلام مطار القاهرة صالة 3"
                  className="w-full bg-[#0d162a] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>

            {/* الحسبة المالية النهائية */}
            <div className="p-3.5 bg-gradient-to-r from-[#0d162a] to-[#131f38] rounded-xl border border-[#c5a059]/30 space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-300 text-xs">
                <span className="font-arabic">إجمالي الإيجار ({days} أيام):</span>
                <span>{totalRent.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between text-white font-black text-sm pt-1 border-t border-slate-700">
                <span className="font-arabic">المبلغ الصافي المستحق:</span>
                <span className="text-[#f3e5ab]">{totalRent.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between text-[11px] text-cyan-300 pt-1">
                <span className="font-arabic">مبلغ التأمين المسترد (الضمان):</span>
                <span>{car.securityDepositEGP.toLocaleString()} ج.م</span>
              </div>
            </div>

            {submitError && (
              <div role="alert" aria-live="assertive" className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-300 font-bold">
                <CircleAlert className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* زر تأكيد الحجز */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#96793e] hover:from-[#d4af37] hover:to-[#a98845] disabled:opacity-60 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#c5a059]/20 transition-all cursor-pointer"
            >
              <span>{isSubmitting ? 'جارٍ إرسال طلب الحجز...' : 'إرسال طلب الحجز'}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

          </form>
        )}

      </div>

    </div>
  );
}
