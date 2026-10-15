'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useFleet } from '@/context/FleetContext';
import { Car } from '@/types/fleet';
import { X, Calendar, CheckCircle2, ArrowLeft } from 'lucide-react';

interface PublicBookingModalProps {
  car: Car;
  onClose: () => void;
}

export default function PublicBookingModal({ car, onClose }: PublicBookingModalProps) {
  const { addBooking, coupons } = useFleet();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [startDate, setStartDate] = useState('2026-10-14');
  const [endDate, setEndDate] = useState('2026-10-17');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [discountSuccessMsg, setDiscountSuccessMsg] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // حساب الأيام والمبالغ
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const totalRent = days * car.dailyPriceEGP;
  const finalTotal = Math.max(0, totalRent - appliedDiscount);

  const handleApplyCoupon = () => {
    if (!discountCode.trim()) return;
    const found = coupons.find(c => c.code.toUpperCase() === discountCode.trim().toUpperCase() && c.active);
    if (found) {
      const discount = found.discountType === 'percentage' 
        ? Math.round((totalRent * found.discountValue) / 100)
        : found.discountValue;
      setAppliedDiscount(discount);
      setDiscountSuccessMsg(`تم تطبيق الخصم بنجاح: وفرت ${discount.toLocaleString()} ج.م ✓`);
    } else {
      alert('كود الخصم غير صحيح أو منتهي الصلاحية');
      setAppliedDiscount(0);
      setDiscountSuccessMsg('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      alert('يرجى كتابة الاسم ورقم الهاتف/الواتساب');
      return;
    }

    // 1. تسجيل الحجز في قاعدة بيانات النظام
    addBooking({
      carId: car.id,
      carName: `${car.make} ${car.model} ${car.year}`,
      carPlate: car.plateNumber,
      customer: {
        id: `cust-${Date.now()}`,
        fullName: customerName,
        phone: customerPhone,
        whatsapp: customerPhone,
        nationalId: 'طلب حجز إلكتروني',
        licenseNumber: 'طلب حجز إلكتروني',
      },
      startDate,
      startTime: '14:00',
      endDate,
      endTime: '14:00',
      daysCount: days,
      dailyRateEGP: car.dailyPriceEGP,
      totalRentEGP: totalRent,
      discountCode: appliedDiscount > 0 ? discountCode : undefined,
      discountAmountEGP: appliedDiscount,
      finalTotalEGP: finalTotal,
      securityDepositEGP: car.securityDepositEGP,
      depositStatus: 'pending',
      startKm: car.currentKm,
      status: 'active',
      staffId: 'online-portal',
      staffName: 'بوابة الحجز الإلكتروني',
      notes: notes || 'تم الحجز عبر الموقع الإلكتروني',
    });

    setIsSubmitted(true);

    // 2. إرسال البيانات مباشرة إلى واتساب الشركة
    const whatsappMsg = encodeURIComponent(
      `مرحباً شركة اليمن والخليج،\nأرغب بتأكيد حجز سيارة عبر الموقع:\n\n` +
      `🚗 السيارة: ${car.make} ${car.model} ${car.year}\n` +
      `👤 الاسم: ${customerName}\n` +
      `📱 الهاتف: ${customerPhone}\n` +
      `📅 المدة: ${days} أيام (من ${startDate} إلى ${endDate})\n` +
      `💰 الإجمالي: ${finalTotal.toLocaleString()} ج.م\n` +
      `🛡️ التأمين المسترد: ${car.securityDepositEGP.toLocaleString()} ج.م\n` +
      (appliedDiscount > 0 ? `🏷️ كود الخصم: ${discountCode} (تم توفير ${appliedDiscount.toLocaleString()} ج.م)\n` : '') +
      (notes ? `📝 ملاحظات: ${notes}\n` : '') +
      `\nيرجى التواصل معي لتأكيد استلام السيارة.`
    );

    setTimeout(() => {
      window.open(`https://wa.me/201034025211?text=${whatsappMsg}`, '_blank');
    }, 1500);
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
              تم تسجيل حجزك في نظامنا، ويجري تحويلك الآن إلى محادثة واتساب الرسمية مع خدمة عملاء شركة اليمن والخليج لتأكيد موقع التسليم فوراً.
            </p>
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
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="مثال: VIP2026 أو GULF10"
                    className="flex-1 bg-[#0d162a] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 uppercase focus:outline-none focus:border-[#c5a059]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-[#c5a059] hover:text-black text-slate-300 text-xs font-bold transition-all"
                  >
                    تطبيق
                  </button>
                </div>
                {discountSuccessMsg && (
                  <p className="text-[11px] text-emerald-400 font-bold mt-1">{discountSuccessMsg}</p>
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
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 text-xs">
                  <span className="font-arabic">الخصم المطبق:</span>
                  <span>-{appliedDiscount.toLocaleString()} ج.م</span>
                </div>
              )}
              <div className="flex justify-between text-white font-black text-sm pt-1 border-t border-slate-700">
                <span className="font-arabic">المبلغ الصافي المستحق:</span>
                <span className="text-[#f3e5ab]">{finalTotal.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between text-[11px] text-cyan-300 pt-1">
                <span className="font-arabic">مبلغ التأمين المسترد (الضمان):</span>
                <span>{car.securityDepositEGP.toLocaleString()} ج.م</span>
              </div>
            </div>

            {/* زر تأكيد الحجز */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#96793e] hover:from-[#d4af37] hover:to-[#a98845] text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#c5a059]/20 transition-all cursor-pointer"
            >
              <span>تأكيد الحجز والتواصل عبر واتساب</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

          </form>
        )}

      </div>

    </div>
  );
}
