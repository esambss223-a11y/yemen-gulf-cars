'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Star, Calendar, Fuel, Users, Gauge, MessageCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import type { Car } from '@/types/fleet';
import { carRentalPrices } from '@/lib/car-pricing';
import { getCarImages } from '@/lib/car-images';
import { COMPANY_CONTACT } from '@/lib/company-contact';

interface MobileCarDrawerProps {
  car: Car;
  onClose: () => void;
  onBookWebsite: () => void;
}

export default function MobileCarDrawer({ car, onClose, onBookWebsite }: MobileCarDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const images = getCarImages(car);
  const prices = carRentalPrices(car);
  const isAvailable = car.status === 'available';

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const whatsappMessage = encodeURIComponent(
    `مرحباً شركة اليمن والخليج، أرغب في حجز سيارة ${car.make} ${car.model} (${car.year}) بسعر ${prices.daily.toLocaleString()} ج.م/يوم.`
  );
  const whatsappCarUrl = `${COMPANY_CONTACT.whatsappUrl}&text=${whatsappMessage}`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-drawer-title"
    >
      {/* Backdrop listener */}
      <div className="absolute inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      {/* Drawer Container */}
      <div 
        ref={drawerRef}
        className="bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 w-full max-h-[88vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 pb-safe"
      >
        {/* Top Handle & Dismiss Button */}
        <div className="pt-2.5 pb-2 px-4 flex items-center justify-between border-b border-slate-100">
          <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto" />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 space-y-4">
          
          {/* Main Photo (Studio Aspect Ratio) */}
          <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-950 shadow-inner">
            <Image
              src={images[0]}
              alt=""
              fill
              sizes="80px"
              aria-hidden="true"
              className="object-cover scale-125 blur-xl opacity-40 brightness-75 pointer-events-none"
            />
            <Image
              src={images[0]}
              alt={`${car.make} ${car.model}`}
              fill
              className="object-contain p-2"
              sizes="(max-width: 768px) 100vw, 400px"
            />

            {/* Availability Pill */}
            <div className="absolute top-3 right-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-sm ${
                isAvailable
                  ? 'bg-white/95 text-emerald-800 border border-slate-200/80'
                  : 'bg-slate-900/85 text-white'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <span>{isAvailable ? 'متاحة فوراً' : 'محجوزة'}</span>
              </span>
            </div>
          </div>

          {/* Title & Category */}
          <div className="text-right">
            <div className="flex items-center justify-between gap-2">
              <h3 id="mobile-drawer-title" className="text-xl font-black text-slate-900 tracking-tight">
                {car.make} {car.model}
              </h3>
              <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                <span>4.98</span>
                <span className="text-slate-400 font-mono">({car.year})</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {car.category === 'vip' ? 'سيدان VIP فاخرة' : car.category === 'suv' ? 'دفع رباعي فاخر SUV' : 'سيارة فارهة'}
              {' '}· تسليم فوري في مطار القاهرة وحدائق أكتوبر
            </p>
          </div>

          {/* Quick Specs Grid (App-like pills) */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 block mb-0.5">ناقل الحركة</span>
              <span className="font-bold text-slate-800">{car.transmission === 'manual' ? 'يدوي' : 'أوتوماتيك'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 block mb-0.5">عدد الركاب</span>
              <span className="font-bold text-slate-800">{car.seats || 5} مقاعد</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 block mb-0.5">الوقود</span>
              <span className="font-bold text-slate-800">{car.fuelType === 'diesel' ? 'ديزل' : 'بنزين'}</span>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
            <div className="text-right">
              <span className="text-[11px] font-bold text-amber-900/80 block">سعر الإيجار اليومي</span>
              <span className="text-xl font-black text-slate-900">{prices.daily.toLocaleString()} ج.م</span>
            </div>
            <div className="text-left">
              <span className="text-[11px] font-bold text-amber-900/80 block">الأسبوعي / الشهري</span>
              <span className="text-xs font-bold text-slate-700">{prices.weekly.toLocaleString()} ج.م / أسبوع</span>
            </div>
          </div>

        </div>

        {/* Sticky Action Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-white flex items-center gap-2">
          {/* Direct WhatsApp Instant Booking */}
          <a
            href={whatsappCarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl public-gold-button bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all text-center"
          >
            <MessageCircle size={15} />
            <span>حجز فوري عبر واتساب</span>
          </a>

          {/* Website Booking Form */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onBookWebsite();
            }}
            className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center gap-1"
          >
            <span>طلب حجز</span>
            <ArrowLeft size={13} />
          </button>
        </div>

      </div>
    </div>
  );
}
