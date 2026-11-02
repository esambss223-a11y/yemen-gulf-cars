'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { 
  X, 
  CalendarDays, 
  Check, 
  FileText, 
  Gauge, 
  KeyRound, 
  Phone, 
  Search, 
  ShieldCheck, 
  UserRound, 
  Wrench, 
  Pencil, 
  Settings2,
  Clock,
  CarFront,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize2,
  Minimize2,
  Camera
} from 'lucide-react';
import type { Booking, Car, StaffUser, VehicleOwner } from '@/types/fleet';
import { getCarImages } from '@/lib/car-images';
import { BOOKING_STATUS_LABELS, carHistory, carRentalTotals } from '@/lib/car-record';
import { carRentalPrices, rentalQuote } from '@/lib/car-pricing';

const num = (n: number) => (Number.isFinite(n) ? n.toLocaleString('ar-EG') : '—');

const formatDate = (value?: string) => {
  if (!value) return 'غير مسجل';
  const d = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};

const carStatusLabels: Record<Car['status'], { label: string; dot: string }> = {
  available: { label: 'متاحة للتأجير', dot: 'bg-emerald-500' },
  rented: { label: 'مؤجرة حالياً', dot: 'bg-amber-500' },
  maintenance: { label: 'تحت الصيانة', dot: 'bg-rose-500' },
  cleaning: { label: 'تجهيز وغسيل', dot: 'bg-sky-500' },
  archived: { label: 'مؤرشفة', dot: 'bg-slate-400' },
};

const categoryMap: Record<string, string> = {
  vip: 'VIP فاخرة',
  suv: 'دفع رباعي (SUV)',
  luxury_sedan: 'سيدان فاخرة',
  economy: 'اقتصادية وعملية',
};

interface Props {
  car: Car;
  bookings: Booking[];
  owner?: VehicleOwner;
  currentStaff: StaffUser;
  onClose: () => void;
  onEdit: (step?: number) => void;
  onOpenContract: (booking: Booking) => void;
  onManage?: () => void;
}

export default function CarDetailsView({
  car,
  bookings,
  owner,
  currentStaff,
  onClose,
  onEdit,
  onOpenContract,
  onManage,
}: Props) {
  const [activeImage, setActiveImage] = useState(0);
  const [imageFitMode, setImageFitMode] = useState<'contain' | 'cover'>('contain');
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'technical'>('overview');
  const [bookingSearch, setBookingSearch] = useState('');
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const images = getCarImages(car);
  const currentImageSrc = images[Math.min(activeImage, images.length - 1)] || '/car-mercedes.jpg';

  const prevImage = () => {
    setActiveImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const nextImage = () => {
    setActiveImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  const prices = carRentalPrices(car);
  const minDays = Number.isFinite(car.minRentalDays) && car.minRentalDays! > 0 ? Math.ceil(car.minRentalDays!) : 1;
  const quote = rentalQuote(car, minDays);
  const statusInfo = carStatusLabels[car.status] || carStatusLabels.available;
  const ownerName = owner?.name || car.ownerName || (car.ownership === 'company' ? 'أسطول الشركة' : 'غير مسجل');
  const code = car.carCode || `YG-${car.id.slice(-3).toUpperCase()}`;

  const history = useMemo(() => carHistory(bookings, car.id), [bookings, car.id]);
  const totals = useMemo(() => carRentalTotals(history), [history]);

  const filteredBookings = useMemo(() => {
    if (!bookingSearch.trim()) return history;
    const q = bookingSearch.trim().toLowerCase();
    return history.filter(b => 
      b.customer.fullName.toLowerCase().includes(q) ||
      b.bookingNumber.toLowerCase().includes(q) ||
      b.customer.phone.includes(q)
    );
  }, [history, bookingSearch]);

  const activeBooking = history.find(b => b.status === 'active');
  const nextBooking = [...history].reverse().find(b => b.status === 'confirmed');
  const currentBookingNotice = activeBooking || nextBooking;

  useEffect(() => {
    closeBtnRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      dir="rtl"
    >
      <div 
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="car-details-title"
      >
        {/* 1. Header (Deep Slate & Crisp White - Luxury Automotive Tone) */}
        <header className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
              {code}
            </span>
            <div className="truncate">
              <h2 id="car-details-title" className="text-base font-extrabold truncate">
                {car.make} {car.model}
              </h2>
              <span className="text-xs text-slate-400 block truncate">
                موديل {car.year} · {categoryMap[car.category] || car.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* License plate in header */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-mono font-bold tracking-wider text-slate-200">
              <span className="text-[10px] text-slate-400">مصر</span>
              <span>{car.plateNumber || 'غير مسجلة'}</span>
            </div>

            {currentStaff.role === 'super_admin' && (
              <button
                type="button"
                onClick={() => onEdit()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                title="تعديل بيانات وأسعار السيارة"
              >
                <Pencil size={13} />
                <span className="hidden md:inline">تعديل</span>
              </button>
            )}

            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg grid place-items-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="إغلاق"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* 2. Unified Navigation Tabs (Subtle & Compact) */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-200 bg-slate-50/70 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-slate-900 text-slate-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CarFront size={14} />
            <span>نظرة عامة والأسعار</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'bookings'
                ? 'border-slate-900 text-slate-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays size={14} />
            <span>سجل الحجوزات ({history.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('technical')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'technical'
                ? 'border-slate-900 text-slate-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wrench size={14} />
            <span>الملكية والصيانة</span>
          </button>
        </div>

        {/* 3. Modal Body (Compact, Fast, Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* TAB 1: OVERVIEW & PRICING */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Photo & Essential Specs Strip */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                
                {/* Visual Gallery (5 cols) - Smart Adaptive Studio Stage */}
                <div className="md:col-span-5 space-y-2">
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-950 group shadow-inner">
                    {/* 1. Ambient Blurred Backdrop Layer for off-ratio / portrait photos */}
                    <Image
                      src={currentImageSrc}
                      alt=""
                      fill
                      sizes="100px"
                      aria-hidden="true"
                      className="object-cover scale-125 blur-2xl opacity-45 brightness-75 pointer-events-none transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] pointer-events-none" />

                    {/* 2. Crisp Foreground Vehicle Image */}
                    <div className="relative w-full h-full flex items-center justify-center p-1.5">
                      <Image
                        src={currentImageSrc}
                        alt={`${car.make} ${car.model}`}
                        fill
                        className={`${imageFitMode === 'contain' ? 'object-contain' : 'object-cover'} transition-all duration-300 drop-shadow-md`}
                        sizes="(max-width: 768px) 100vw, 380px"
                      />
                    </div>

                    {/* 3. Top Badges & Actions */}
                    <div className="absolute top-2 inset-x-2 flex items-center justify-between gap-1.5 pointer-events-none">
                      {/* Fit Mode Switcher Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFitMode(m => m === 'contain' ? 'cover' : 'contain');
                        }}
                        className="pointer-events-auto flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/85 hover:bg-slate-900 text-white backdrop-blur-md text-[10px] font-bold border border-white/20 transition-all cursor-pointer shadow-sm active:scale-95"
                        title={imageFitMode === 'contain' ? 'تبديل إلى ملء الإطار' : 'تبديل إلى رؤية السيارة كاملة بدون أي قص'}
                      >
                        {imageFitMode === 'contain' ? <Maximize2 size={11} className="text-amber-400" /> : <Minimize2 size={11} className="text-amber-400" />}
                        <span>{imageFitMode === 'contain' ? 'رؤية كاملة' : 'ملء الإطار'}</span>
                      </button>

                      {/* Status Badge */}
                      <div className="px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-xs border border-slate-200/80 shadow-xs flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                        <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                        <span>{statusInfo.label}</span>
                      </div>
                    </div>

                    {/* 4. Left/Right Direct Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); prevImage(); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md transition-all cursor-pointer shadow-md opacity-80 group-hover:opacity-100 active:scale-95"
                          title="الصورة السابقة"
                          aria-label="الصورة السابقة"
                        >
                          <ChevronRight size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); nextImage(); }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md transition-all cursor-pointer shadow-md opacity-80 group-hover:opacity-100 active:scale-95"
                          title="الصورة التالية"
                          aria-label="الصورة التالية"
                        >
                          <ChevronLeft size={15} />
                        </button>

                        {/* Image Counter Pill */}
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono font-bold text-white pointer-events-none">
                          {activeImage + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  {images.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                      {images.map((src, idx) => (
                        <button
                          key={src}
                          type="button"
                          onClick={() => setActiveImage(idx)}
                          className={`relative w-14 h-10 rounded-lg overflow-hidden border transition-all flex-shrink-0 bg-slate-950 ${
                            activeImage === idx
                              ? 'border-amber-500 ring-2 ring-amber-500/30 scale-105'
                              : 'border-slate-200 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <Image
                            src={src}
                            alt=""
                            fill
                            sizes="30px"
                            aria-hidden="true"
                            className="object-cover scale-125 blur-md opacity-40 pointer-events-none"
                          />
                          <Image src={src} alt="" fill className="object-contain" sizes="56px" />
                        </button>
                      ))}
                    </div>
                  )}

                  {currentStaff.role === 'super_admin' && onEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEdit(2);
                      }}
                      className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold border border-slate-700 shadow-xs transition-all cursor-pointer"
                      title="فتح معرض الصور ورفع وحذف الصور مباشرة بدون المرور بالخطوات"
                    >
                      <Camera size={14} className="text-[#c5a059]" />
                      <span>إدارة وتعديل صور السيارة (مباشر)</span>
                    </button>
                  )}
                </div>

                {/* Identity & Specs Cards (7 cols) */}
                <div className="md:col-span-7 space-y-3">
                  
                  {/* Current Booking Alert (if any) */}
                  {currentBookingNotice ? (
                    <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-950 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[10px] text-amber-700 font-bold block">
                          {activeBooking ? 'العقد الجاري حالياً' : 'الحجز المؤكد القادم'}
                        </span>
                        <strong className="text-xs font-extrabold truncate block">
                          {currentBookingNotice.customer.fullName}
                        </strong>
                        <span className="text-[11px] text-amber-800 block mt-0.5">
                          {formatDate(currentBookingNotice.startDate)} إلى {formatDate(currentBookingNotice.endDate)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenContract(currentBookingNotice)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-colors whitespace-nowrap shadow-xs"
                      >
                        عرض العقد
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2 text-slate-600">
                      <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0" />
                      <div>
                        <strong className="block text-slate-800">جاهزة للتشغيل والتأجير الفوري</strong>
                        <span className="text-[11px] text-slate-500">لا توجد حجوزات متداخلة تعيق التسليم الآن.</span>
                      </div>
                    </div>
                  )}

                  {/* Quick Passport Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
                      <span className="text-[10px] text-slate-500 block">الجهة المالكة</span>
                      <strong className="font-bold text-slate-900 truncate block mt-0.5">{ownerName}</strong>
                    </div>

                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
                      <span className="text-[10px] text-slate-500 block">قراءة العداد الحالية</span>
                      <strong className="font-bold text-slate-900 block mt-0.5">
                        {car.currentKm ? `${car.currentKm.toLocaleString('ar-EG')} كم` : 'جديدة 0 كم'}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
                      <span className="text-[10px] text-slate-500 block">ناقل الحركة والوقود</span>
                      <strong className="font-bold text-slate-900 block mt-0.5">
                        {car.transmission === 'automatic' ? 'أوتوماتيك' : 'يدوي'} · {car.fuelType || 'بنزين'}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60">
                      <span className="text-[10px] text-slate-500 block">اللون وعدد المقاعد</span>
                      <strong className="font-bold text-slate-900 block mt-0.5">
                        {car.color || 'أبيض'} · {car.seats || 5} مقاعد
                      </strong>
                    </div>
                  </div>

                  {/* Owner Financial & Security Details (Strictly Super Admin Only) */}
                  {owner && currentStaff.role === 'super_admin' && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">بيانات المالك المالية</span>
                        <span className="text-[11px] text-slate-500">
                          قيمة عقود التأجير: <strong>{totals.contractValue.toLocaleString('ar-EG')} ج.م</strong>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div><span className="text-slate-400">الحساب البنكي:</span> <span className="font-mono">{owner.bankAccount}</span></div>
                        <div><span className="text-slate-400">الرقم القومي:</span> <span className="font-mono">{owner.nationalId}</span></div>
                        <div><span className="text-slate-400">الهاتف:</span> <span className="font-mono">{owner.phone}</span></div>
                        {owner.notes && <div><span className="text-slate-400">ملاحظات:</span> <span>{owner.notes}</span></div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Unified Pricing Ribbon (Clear, Flat, Space-Efficient) */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80">
                <span className="text-xs font-bold text-slate-700 block mb-2.5">
                  باقة أسعار التأجير المعتمدة
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block">الإيجار اليومي</span>
                    <strong className="text-sm font-extrabold text-slate-900 block mt-0.5">
                      {prices.daily.toLocaleString('ar-EG')} <small className="text-[10px] font-normal text-slate-500">ج.م</small>
                    </strong>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block">الإيجار الأسبوعي</span>
                    <strong className="text-sm font-extrabold text-slate-900 block mt-0.5">
                      {prices.weekly.toLocaleString('ar-EG')} <small className="text-[10px] font-normal text-slate-500">ج.م</small>
                    </strong>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block">الإيجار الشهري</span>
                    <strong className="text-sm font-extrabold text-slate-900 block mt-0.5">
                      {prices.monthly.toLocaleString('ar-EG')} <small className="text-[10px] font-normal text-slate-500">ج.م</small>
                    </strong>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block">التأمين المسترد</span>
                    <strong className="text-sm font-extrabold text-slate-900 block mt-0.5">
                      {car.securityDepositEGP ? `${car.securityDepositEGP.toLocaleString('ar-EG')} ج.م` : 'بدون تأمين'}
                    </strong>
                  </div>
                </div>

                {minDays > 1 && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="flex items-center gap-1 font-semibold text-amber-800">
                      <Clock size={12} className="text-amber-600" />
                      أقل مدة تعاقد مسموحة: {minDays} أيام
                    </span>
                    <span>إجمالي أقل حجز: <b>{quote.totalEGP.toLocaleString('ar-EG')} ج.م</b></span>
                  </div>
                )}
              </div>

              {/* Car Features Pills */}
              {car.features && car.features.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {car.features.map((feat, idx) => (
                    <span
                      key={`${feat}-${idx}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] bg-slate-100 text-slate-700 border border-slate-200/80 font-medium"
                    >
                      <Check size={11} className="text-emerald-600" />
                      {feat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BOOKINGS HISTORY */}
          {activeTab === 'bookings' && (
            <div className="space-y-3">
              {/* Search input in bookings */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="البحث باسم المستأجر، رقم الهاتف، أو رقم العقد…"
                    className="w-full h-9 pr-9 pl-3 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  />
                </div>
                <div className="text-xs text-slate-500 whitespace-nowrap">
                  إجمالي العقود: <strong>{history.length}</strong>
                </div>
              </div>

              {/* Bookings List */}
              {filteredBookings.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                  <CalendarDays size={24} className="mx-auto mb-2 text-slate-400" />
                  <p className="font-bold">لا توجد حجوزات مسجلة تطابق البحث</p>
                  <p className="text-[11px] text-slate-400 mt-1">ستظهر هنا تفاصيل العقود والمستأجرين فور تسجيل أي حجز.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredBookings.map((b) => (
                    <div 
                      key={b.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {b.bookingNumber}
                          </span>
                          <strong className="text-slate-900 font-bold truncate">
                            {b.customer.fullName}
                          </strong>
                          <span className="text-[10px] text-slate-500">
                            ({b.daysCount} أيام)
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span>{formatDate(b.startDate)} ← {formatDate(b.endDate)}</span>
                          {b.customer.phone && (
                            <span className="hidden md:inline font-mono text-[10px]">{b.customer.phone}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-bold text-slate-900">
                          {num(b.finalTotalEGP)} <small className="text-[10px] font-normal text-slate-500">ج.م</small>
                        </span>

                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {BOOKING_STATUS_LABELS[b.status] || b.status}
                        </span>

                        <button
                          type="button"
                          onClick={() => onOpenContract(b)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                          title="عرض العقد"
                        >
                          <FileText size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TECHNICAL & OWNERSHIP */}
          {activeTab === 'technical' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Ownership Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <KeyRound size={14} className="text-amber-600" />
                  بيانات الملكية والتعاقد
                </span>
                
                <div className="space-y-1.5 pt-1 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">طبيعة الملكية</span>
                    <strong className="text-slate-800">{car.ownership === 'company' ? 'ملك الشركة' : 'شريك / مستثمر'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">اسم المالك</span>
                    <strong className="text-slate-800">{ownerName}</strong>
                  </div>
                  {owner?.phone && currentStaff.role === 'super_admin' && (
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500">هاتف المالك</span>
                      <strong className="text-slate-800 font-mono">{owner.phone}</strong>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">تاريخ دخول الأسطول</span>
                    <strong className="text-slate-800">{formatDate(car.fleetEntryDate)}</strong>
                  </div>
                </div>
              </div>

              {/* Maintenance & Licenses Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Wrench size={14} className="text-amber-600" />
                  الصيانة والتراخيص الدورية
                </span>
                
                <div className="space-y-1.5 pt-1 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">انتهاء رخصة السيارة</span>
                    <strong className="text-slate-800">{formatDate(car.licenseExpiryDate)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">انتهاء التأمين</span>
                    <strong className="text-slate-800">{formatDate(car.insuranceExpiryDate)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">موعد الصيانة الدورية القادمة</span>
                    <strong className="text-slate-800">{formatDate(car.nextServiceDate)}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">المسؤول عن الصيانة</span>
                    <strong className="text-slate-800">{car.serviceResponsibleParty === 'owner' ? 'المالك' : 'الشركة'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Footer (Unified Clean Actions) */}
        <footer className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-200 flex-shrink-0">
          <span className="text-[11px] text-slate-500">
            كود النظام: <b className="font-mono text-slate-700">{car.id}</b>
          </span>

          <div className="flex items-center gap-2">
            {currentStaff.role === 'super_admin' && onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors"
              >
                تعديل البيانات
              </button>
            )}

            {currentStaff.role === 'super_admin' && onManage && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onManage();
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
              >
                إدارة التشغيل والأرشفة
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
            >
              إغلاق
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
