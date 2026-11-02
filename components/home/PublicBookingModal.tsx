'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Car } from '@/types/fleet';
import { COMPANY_CONTACT } from '@/lib/company-contact';
import { OFFICE_LOCATION } from '@/lib/office-location';
import { 
  X, 
  Calendar, 
  CheckCircle2, 
  ArrowLeft, 
  XCircle, 
  LoaderCircle, 
  CircleAlert, 
  MapPin, 
  MessageCircle, 
  ArrowUpRight,
  Clock,
  Sparkles
} from 'lucide-react';

function dateAfterDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function addDaysToDate(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatDaysLabel(days: number): string {
  if (days <= 1) return 'يوم واحد';
  if (days === 2) return 'يومين';
  if (days >= 3 && days <= 10) return `${days} أيام`;
  return `${days} يوماً`;
}

interface PublicBookingModalProps {
  car: Car;
  onClose: () => void;
}

export default function PublicBookingModal({ car, onClose }: PublicBookingModalProps) {
  const minDays = car.minRentalDays && car.minRentalDays > 1 ? car.minRentalDays : 1;
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [startDate, setStartDate] = useState(() => dateAfterDays(1));
  const [endDate, setEndDate] = useState(() => dateAfterDays(1 + Math.max(minDays, 2)));
  const [discountCode, setDiscountCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [couponStatus, setCouponStatus] = useState<'idle' | 'checking' | 'active' | 'inactive' | 'error'>('idle');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [submittedBookingNumber, setSubmittedBookingNumber] = useState('');

  // حساب الأيام والمبالغ بدقة
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const rawDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const days = Math.max(1, rawDays);

  const totalRent = (() => {
    if (days >= 30 && car.monthlyPriceEGP) {
      const months = Math.floor(days / 30);
      const remDays = days % 30;
      return (months * car.monthlyPriceEGP) + (remDays * car.dailyPriceEGP);
    }
    if (days >= 7 && car.weeklyPriceEGP) {
      const weeks = Math.floor(days / 7);
      const remDays = days % 7;
      return (weeks * car.weeklyPriceEGP) + (remDays * car.dailyPriceEGP);
    }
    return days * car.dailyPriceEGP;
  })();

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

  const buildWhatsappUrl = (bookingNumber: string) => {
    const text = encodeURIComponent(
      `مرحباً شركة اليمن والخليج للسيارات،\nأرسلت طلب حجز عبر الموقع:\n\n` +
      `• رقم الحجز: ${bookingNumber}\n` +
      `• السيارة: ${car.make} ${car.model} (${car.year})\n` +
      `• الاسم: ${customerName}\n` +
      `• الهاتف: ${customerPhone}\n` +
      `• المدة: ${days} أيام (من ${startDate} إلى ${endDate})\n` +
      `• الإجمالي: ${totalRent.toLocaleString()} ج.م\n` +
      `• التأمين المسترد: ${(car.securityDepositEGP || 0).toLocaleString()} ج.م\n` +
      (notes ? `• ملاحظات الاستلام: ${notes}\n` : '') +
      `\nأرجو تأكيد الحجز ومتابعة تفاصيل الاستلام.`
    );
    return `${COMPANY_CONTACT.whatsappUrl}?text=${text}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (days < minDays) {
      setSubmitError(`الحد الأدنى لحجز هذه السيارة هو ${formatDaysLabel(minDays)}.`);
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const verifiedDiscountCode = couponStatus === 'active' ? discountCode.trim() : '';
      const response = await fetch('/api/public/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: car.id,
          customerName,
          customerPhone,
          startDate,
          endDate,
          discountCode: verifiedDiscountCode,
          notes,
        }),
      });

      const result = await response.json();
      let bookingNum = `YGC-${Date.now().toString().slice(-6)}`;

      if (response.ok && result.booking) {
        bookingNum = result.booking.bookingNumber || bookingNum;
      }

      setSubmittedBookingNumber(bookingNum);
      setWhatsappUrl(buildWhatsappUrl(bookingNum));
      setIsSubmitted(true);
    } catch {
      // In case of network error, generate fallback reference so the customer can still confirm via WhatsApp
      const fallbackNum = `YGC-${Date.now().toString().slice(-6)}`;
      setSubmittedBookingNumber(fallbackNum);
      setWhatsappUrl(buildWhatsappUrl(fallbackNum));
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#071726] border border-[#ddbd80]/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl shadow-black/90 relative my-auto">
        
        {/* Header Bar */}
        <div className="px-5 py-4 bg-[#040c17] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#ddbd80]/15 border border-[#ddbd80]/30 flex items-center justify-center text-[#ddbd80]">
              <Calendar size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                حجز سيارة — <span className="text-[#ddbd80]">{car.make} {car.model}</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">اليمن والخليج لتأجير وتوريد السيارات</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>

        {/* 1. SUCCESS STATE (تم الحجز بنجاح + تأكيد الواتساب + موقع المكتب) */}
        {isSubmitted ? (
          <div className="p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-300">
            
            {/* Glowing Success Ring */}
            <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_50px_rgba(52,211,153,0.2)]">
              <span className="absolute inset-1.5 rounded-full border border-emerald-300/20 animate-ping opacity-25" />
              <CheckCircle2 size={40} className="text-emerald-400" strokeWidth={1.8} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ddbd80]/10 border border-[#ddbd80]/30 text-[#ddbd80] text-[11px] font-bold mb-2">
              <Sparkles size={12} className="text-[#ddbd80]" />
              <span>تم تسجيل طلب حجزك بنجاح!</span>
            </div>

            <h4 className="text-xl sm:text-2xl font-black text-white mb-2">
              شكراً لثقتك بنا
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto mb-5">
              سجّلنا طلب حجز <span className="font-bold text-white">{car.make} {car.model}</span>. يرجى تأكيد الحجز فوراً عبر واتساب، أو زيارة مقرنا للاستلام.
            </p>

            {/* Booking Details Card */}
            <div className="rounded-2xl border border-white/10 bg-[#040c17] p-4 text-right mb-6 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-slate-400">رقم متابعة الطلب:</span>
                <span className="font-mono font-bold text-[#ddbd80] text-sm" dir="ltr">#{submittedBookingNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">فترة الإيجار:</span>
                <span className="text-white font-bold">{days} أيام ({startDate} إلى {endDate})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">إجمالي المبلغ المقدر:</span>
                <span className="text-[#ddbd80] font-black font-mono text-sm">{totalRent.toLocaleString()} ج.م</span>
              </div>
            </div>

            {/* ACTION 1: Direct Instant WhatsApp Confirmation */}
            <div className="space-y-2.5">
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
              >
                <MessageCircle size={18} />
                <span>تأكيد فوري عبر واتساب ومتابعة الاستلام</span>
                <ArrowUpRight size={16} />
              </a>

              {/* ACTION 2: Direct Google Maps Location to Office */}
              <a 
                href={OFFICE_LOCATION.directionsUrl || OFFICE_LOCATION.mapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#ddbd80]/40 bg-[#ddbd80]/10 hover:bg-[#ddbd80]/20 text-[#ddbd80] font-bold text-xs sm:text-sm transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
              >
                <MapPin size={16} />
                <span>موقع المكتب على خرائط جوجل لاستلام السيارة</span>
                <ArrowUpRight size={14} />
              </a>

              {/* ACTION 3: Back to Site */}
              <button 
                type="button"
                onClick={onClose} 
                className="w-full pt-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                العودة إلى الموقع وتصفح الأسطول
              </button>
            </div>

          </div>
        ) : (
          
          /* 2. BOOKING FORM */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
            
            {/* Car Summary Strip */}
            <div className="p-3 bg-[#040c17] rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-16 h-12 relative rounded-xl overflow-hidden bg-[#102234] shrink-0 border border-white/10">
                <Image 
                  src={car.coverImage || car.images[0] || '/car-mercedes.jpg'} 
                  alt={car.model} 
                  fill 
                  className="object-cover" 
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-white truncate">{car.make} {car.model} ({car.year})</h4>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-[#ddbd80] font-black font-mono">{car.dailyPriceEGP.toLocaleString()} ج.م / يوم</span>
                  <span className="text-[11px] text-slate-400">أقل مدة: <strong className="text-white">{formatDaysLabel(minDays)}</strong></span>
                </div>
              </div>
            </div>

            {/* Customer Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">الاسم الكامل:</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: محمد عبد الله"
                  className="w-full bg-[#040c17] border border-white/15 focus:border-[#ddbd80] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">رقم الهاتف / الواتساب:</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="مثال: 01012345678 أو +966500000000"
                  className="w-full bg-[#040c17] border border-white/15 focus:border-[#ddbd80] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none transition-colors"
                />
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">تاريخ الاستلام:</label>
                  <input
                    type="date"
                    required
                    min={dateAfterDays(0)}
                    value={startDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setStartDate(newStart);
                      const minEnd = addDaysToDate(newStart, minDays);
                      if (endDate < minEnd) setEndDate(minEnd);
                    }}
                    className="w-full bg-[#040c17] border border-white/15 focus:border-[#ddbd80] rounded-xl px-3 py-2 text-white text-xs focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">تاريخ الإرجاع:</label>
                  <input
                    type="date"
                    required
                    min={addDaysToDate(startDate, minDays)}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#040c17] border border-white/15 focus:border-[#ddbd80] rounded-xl px-3 py-2 text-white text-xs focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Min Days Notice */}
              {minDays > 1 && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#ddbd80]/10 border border-[#ddbd80]/25 text-[#ddbd80] text-xs">
                  <Clock size={13} className="shrink-0 text-[#ddbd80]" />
                  <span>الحد الأدنى لحجز هذه السيارة هو: <strong className="text-white font-bold">{formatDaysLabel(minDays)}</strong>.</span>
                </div>
              )}

              {/* Optional Coupon */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">هل لديك كود خصم؟</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value);
                      setCouponStatus('idle');
                      setCouponMessage('');
                    }}
                    placeholder="أدخل كود الخصم إن وجد"
                    className="flex-1 bg-[#040c17] border border-white/15 focus:border-[#ddbd80] rounded-xl px-3 py-2 text-white placeholder-slate-500 uppercase text-xs focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponStatus === 'checking'}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-[#ddbd80] hover:text-[#071726] text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    {couponStatus === 'checking' ? '...' : 'تطبيق'}
                  </button>
                </div>
                {couponMessage && (
                  <p className={`text-[11px] font-bold mt-1.5 ${couponStatus === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {couponMessage}
                  </p>
                )}
              </div>

              {/* Delivery location or Notes */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">ملاحظات أو مكان الاستلام المطلوب:</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: الاستلام في مطار القاهرة أو مقر الإقامة"
                  className="w-full bg-[#040c17] border border-white/15 focus:border-[#ddbd80] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 text-xs focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-3.5 bg-[#040c17] rounded-2xl border border-[#ddbd80]/30 space-y-2">
              <div className="flex justify-between items-center text-slate-300 text-xs">
                <span>إجمالي الإيجار ({days} أيام):</span>
                <span className="font-mono font-bold text-white">{totalRent.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between items-center text-white font-black text-sm pt-2 border-t border-white/10">
                <span>المبلغ المستحق:</span>
                <span className="text-[#ddbd80] font-mono text-base">{totalRent.toLocaleString()} ج.م</span>
              </div>
            </div>

            {submitError && (
              <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-300 font-bold text-xs">
                <CircleAlert size={14} className="shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl public-gold-button bg-[#ddbd80] hover:bg-[#ecd5a9] disabled:opacity-60 text-[#071726] font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#ddbd80]/20 transition-all active:scale-95 cursor-pointer"
            >
              <span>{isSubmitting ? 'جارٍ إرسال طلب الحجز...' : 'تأكيد وإرسال طلب الحجز الآن'}</span>
              <ArrowLeft size={16} />
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
