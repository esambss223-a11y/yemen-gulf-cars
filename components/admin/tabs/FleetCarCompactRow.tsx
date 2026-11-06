'use client';

import Image from 'next/image';
import { CalendarDays, CalendarPlus, FileText, Gauge, Pencil, Settings2, UserRound, Clock, ShieldCheck, Camera } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Car } from '@/types/fleet';
import type { FleetBookingSummary } from '@/lib/fleet-booking-summary';
import { BOOKING_STATUS_LABELS } from '@/lib/car-record';
import { carRentalPrices, rentalQuote } from '@/lib/car-pricing';

const statusLabels: Record<Car['status'], { label: string; dot: string; bg: string }> = {
  available: { label: 'متاحة', dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  rented: { label: 'مؤجرة', dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  maintenance: { label: 'صيانة', dot: 'bg-rose-500', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
  cleaning: { label: 'تجهيز', dot: 'bg-sky-500', bg: 'bg-sky-50 text-sky-800 border-sky-200' },
  archived: { label: 'مؤرشفة', dot: 'bg-slate-400', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const formatDate = (val?: string) => {
  if (!val) return '—';
  const d = new Date(`${val.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? val : d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
};

interface Props {
  car: Car;
  history?: FleetBookingSummary;
  admin: boolean;
  canBook: boolean;
  open: boolean;
  onDetails: () => void;
  onBook: () => void;
  onEdit: () => void;
  onEditImages?: () => void;
  onManage: () => void;
  children?: ReactNode;
}

export default function FleetCarCompactRow({
  car,
  history,
  admin,
  canBook,
  open,
  onDetails,
  onBook,
  onEdit,
  onEditImages,
  onManage,
  children,
}: Props) {
  const minDays = Number.isFinite(car.minRentalDays) && car.minRentalDays! > 0 ? Math.ceil(car.minRentalDays!) : 1;
  const quote = rentalQuote(car, minDays);
  const prices = carRentalPrices(car);
  const next = history?.next;
  const statusInfo = statusLabels[car.status] || statusLabels.available;
  const owner = car.ownerName || (car.ownership === 'company' ? 'أسطول الشركة' : 'غير مسجل');
  const code = car.carCode || `YG-${car.id.slice(-3).toUpperCase()}`;

  return (
    <div className={`transition-all duration-150 border rounded-xl overflow-hidden ${
      open ? 'border-slate-800 ring-1 ring-slate-800/20 bg-slate-50/50' : 'border-slate-200 bg-white hover:border-slate-300'
    }`}>
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-between p-2.5 gap-2.5 md:gap-3 text-xs">
        {/* 1. Photo & Basic Info */}
        <div className="flex items-center gap-2.5 min-w-[220px] flex-1">
          <button
            type="button"
            onClick={onDetails}
            className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-950 flex-shrink-0 group focus:outline-none focus:ring-1 focus:ring-slate-900"
            title="عرض التفاصيل"
          >
            <Image
              src={car.coverImage || car.images?.[0] || '/car-mercedes.jpg'}
              alt=""
              fill
              sizes="30px"
              aria-hidden="true"
              className="object-cover scale-125 blur-md opacity-40 brightness-75 pointer-events-none"
            />
            <Image
              src={car.coverImage || car.images?.[0] || '/car-mercedes.jpg'}
              alt=""
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-200"
              sizes="48px"
            />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {code}
              </span>
              <button
                type="button"
                onClick={onDetails}
                className="font-bold text-xs text-slate-900 hover:text-slate-700 truncate transition-colors text-right"
              >
                {car.make} {car.model}
              </button>
              <span className="text-[10px] text-slate-500">({car.year})</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
              <span className="truncate max-w-[110px] flex items-center gap-1" title={owner}>
                <UserRound size={11} className="text-slate-400 flex-shrink-0" />
                {owner}
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1" title="قراءة العداد">
                <Gauge size={11} className="text-slate-400 flex-shrink-0" />
                {car.currentKm ? `${car.currentKm.toLocaleString('ar-EG')} كم` : 'جديدة'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Official License Plate Badge */}
        <div className="flex-shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-slate-300 bg-slate-50 shadow-2xs">
            <span className="text-[9px] font-bold text-slate-400 border-l border-slate-300 pl-1.5">مصر</span>
            <span className="font-mono font-bold text-slate-800 text-[11px] tracking-wider" dir="auto">
              {car.plateNumber || 'غير مسجلة'}
            </span>
          </div>
        </div>

        {/* 3. Operational Status Badge */}
        <div className="flex flex-col gap-0.5 items-start min-w-[100px] flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
            {statusInfo.label}
          </span>
          {minDays > 1 && (
            <span className="text-[10px] text-slate-500 font-medium">
              أقل حجز: {minDays} أيام
            </span>
          )}
        </div>

        {/* 4. Compact Pricing Strip */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 flex-shrink-0">
          <div className="text-center px-1.5">
            <span className="text-[9px] text-slate-500 block">يومي</span>
            <span className="font-bold text-slate-900 text-xs">{prices.daily.toLocaleString('ar-EG')}</span>
          </div>
          <div className="w-px h-5 bg-slate-200" />
          <div className="text-center px-1.5">
            <span className="text-[9px] text-slate-500 block">أسبوعي</span>
            <span className="font-bold text-slate-900 text-xs">{prices.weekly.toLocaleString('ar-EG')}</span>
          </div>
          <div className="w-px h-5 bg-slate-200" />
          <div className="text-center px-1.5">
            <span className="text-[9px] text-slate-500 block">شهري</span>
            <span className="font-bold text-slate-900 text-xs">{prices.monthly.toLocaleString('ar-EG')}</span>
          </div>
        </div>

        {/* 5. Booking status / Upcoming */}
        <div className="min-w-[140px] flex-shrink-0 hidden xl:block text-[11px]">
          {next ? (
            <div className="flex items-center gap-1.5 text-amber-900 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
              <CalendarDays size={12} className="text-amber-600 flex-shrink-0" />
              <div className="truncate">
                <span className="font-bold block truncate">{next.customer.fullName}</span>
                <span className="text-[10px] text-amber-700">حتى {formatDate(next.endDate)}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-700">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span>جاهزة للتسليم</span>
            </div>
          )}
        </div>

        {/* 6. Rapid Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0 mr-auto lg:mr-0">
          <button
            type="button"
            onClick={onDetails}
            className="inline-flex items-center justify-center gap-1 py-1 px-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-colors shadow-2xs"
          >
            <FileText size={12} />
            <span>تفاصيل</span>
          </button>

          {canBook && (
            <button
              type="button"
              onClick={onBook}
              disabled={car.status !== 'available'}
              className="inline-flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-colors shadow-2xs"
              title={car.status === 'available' ? 'حجز سريع' : 'غير متاحة حالياً'}
            >
              <CalendarPlus size={12} />
              <span className="hidden sm:inline">حجز</span>
            </button>
          )}

          {admin && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center justify-center p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs transition-colors"
              title="تعديل بيانات وأسعار السيارة"
              aria-label="تعديل السيارة"
            >
              <Pencil size={12} />
            </button>
          )}

          {admin && onEditImages && (
            <button
              type="button"
              onClick={onEditImages}
              className="inline-flex items-center justify-center p-1 rounded-lg border border-amber-300/60 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs transition-colors"
              title="انتقال مباشر لمعرض وصور السيارة"
              aria-label="تعديل صور السيارة"
            >
              <Camera size={12} className="text-amber-600" />
            </button>
          )}

          {admin && (
            <button
              type="button"
              onClick={onManage}
              aria-expanded={open}
              aria-controls={`fleet-manage-${car.id}`}
              className={`inline-flex items-center justify-center p-1 rounded-lg border text-xs transition-colors ${
                open ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
              }`}
              title="إدارة الحالة"
              aria-label="إدارة السيارة"
            >
              <Settings2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Management Drawer */}
      {open && children && (
        <div className="border-t border-slate-200 bg-slate-50 p-3">
          {children}
        </div>
      )}
    </div>
  );
}
