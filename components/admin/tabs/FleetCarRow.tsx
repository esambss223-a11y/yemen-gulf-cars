'use client';

import Image from 'next/image';
import { CalendarDays, CalendarPlus, FileText, Gauge, Pencil, Settings2, UserRound, Clock, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Car } from '@/types/fleet';
import type { FleetBookingSummary } from '@/lib/fleet-booking-summary';
import { BOOKING_STATUS_LABELS } from '@/lib/car-record';
import { carRentalPrices, rentalQuote } from '@/lib/car-pricing';

const statusLabels: Record<Car['status'], { label: string; dot: string; bg: string }> = {
  available: { label: 'متاحة', dot: 'bg-emerald-400', bg: 'bg-emerald-950/80 text-emerald-200 border-emerald-500/30' },
  rented: { label: 'مؤجرة', dot: 'bg-amber-400', bg: 'bg-amber-950/80 text-amber-200 border-amber-500/30' },
  maintenance: { label: 'صيانة', dot: 'bg-rose-400', bg: 'bg-rose-950/80 text-rose-200 border-rose-500/30' },
  cleaning: { label: 'تجهيز', dot: 'bg-sky-400', bg: 'bg-sky-950/80 text-sky-200 border-sky-500/30' },
  archived: { label: 'مؤرشفة', dot: 'bg-slate-400', bg: 'bg-slate-900/80 text-slate-300 border-slate-700' },
};

const formatDate = (value?: string) => {
  if (!value) return 'غير محدد';
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', timeZone: 'UTC' });
};

const getPeriodLabel = (days: number) => {
  if (days === 1) return 'اليوم';
  if (days === 7) return 'الأسبوع';
  if (days === 14) return 'الأسبوعان';
  if (days === 30) return 'الشهر';
  return `${days} أيام`;
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
  onManage: () => void;
  children?: ReactNode;
}

export default function FleetCarRow({
  car,
  history,
  admin,
  canBook,
  open,
  onDetails,
  onBook,
  onEdit,
  onManage,
  children,
}: Props) {
  const minDays = Number.isFinite(car.minRentalDays) && car.minRentalDays! > 0 ? Math.ceil(car.minRentalDays!) : 1;
  const quote = rentalQuote(car, minDays);
  const prices = carRentalPrices(car);
  const next = history?.next;
  const owner = car.ownerName || (car.ownership === 'company' ? 'أسطول الشركة' : 'غير مسجل');
  const code = car.carCode || `YG-${car.id.slice(-3).toUpperCase()}`;
  const statusInfo = statusLabels[car.status] || statusLabels.available;

  return (
    <article
      className={`group flex flex-col bg-white rounded-xl border transition-all duration-200 overflow-hidden shadow-2xs hover:shadow-sm ${
        open ? 'border-slate-800 ring-1 ring-slate-800/20' : 'border-slate-200 hover:border-slate-300'
      }`}
      aria-label={`${car.make} ${car.model} — ${car.plateNumber}`}
    >
      {/* 1. Cinematic Vehicle Photo Stage (Smart Adaptive Studio) */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
        <button
          type="button"
          className="w-full h-full relative cursor-pointer focus:outline-none block"
          onClick={onDetails}
          aria-label={`عرض تفاصيل ${car.make} ${car.model}`}
        >
          {/* Ambient blurred backdrop to harmonize portrait/landscape mixed photos */}
          <Image
            src={car.coverImage || car.images?.[0] || '/car-mercedes.jpg'}
            alt=""
            fill
            sizes="80px"
            aria-hidden="true"
            className="object-cover scale-125 blur-xl opacity-40 brightness-75 pointer-events-none transition-transform duration-300"
          />
          {/* Foreground sharp car photo */}
          <Image
            src={car.coverImage || car.images?.[0] || '/car-mercedes.jpg'}
            alt=""
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1099px) 50vw, 33vw"
            className="object-contain group-hover:scale-103 transition-transform duration-300 ease-out drop-shadow-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
        </button>

        {/* Top Badges Bar */}
        <div className="absolute top-2 inset-x-2 flex items-center justify-between gap-1.5 pointer-events-none">
          {/* Status Badge */}
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold backdrop-blur-xs border shadow-2xs ${statusInfo.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
            <span>{statusInfo.label}</span>
          </span>

          {/* Car Code */}
          <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-900/80 text-slate-200 backdrop-blur-xs border border-white/20">
            {code}
          </span>
        </div>

        {/* Bottom Floating Bar inside photo */}
        <div className="absolute bottom-2 inset-x-2 flex items-center justify-between pointer-events-none">
          <span className="text-white text-[11px] font-medium drop-shadow-xs px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-xs">
            موديل {car.year} {car.category ? `· ${car.category}` : ''}
          </span>
          {minDays > 1 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-200 bg-slate-950/80 backdrop-blur-xs px-1.5 py-0.5 rounded border border-white/20">
              <Clock size={10} />
              <span>أقل حجز · {minDays} أيام ({quote.totalEGP.toLocaleString('ar-EG')} ج.م)</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Content Body */}
      <div className="flex flex-col flex-1 p-3 gap-2.5">
        {/* Car Title & Plate Badge */}
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={onDetails}
            className="text-right flex-1 min-w-0 group/title focus:outline-none"
          >
            <h3 className="font-bold text-slate-900 text-sm leading-snug truncate group-hover/title:text-slate-700 transition-colors" dir="auto">
              {car.make} {car.model}
            </h3>
            <span className="text-[11px] text-slate-500 block truncate mt-0.5">
              {car.fuelType || 'بنزين'} · {car.transmission || 'أوتوماتيك'}
            </span>
          </button>

          {/* Official License Plate Badge */}
          <div className="flex-shrink-0 flex items-center border border-slate-300 rounded bg-gradient-to-b from-white to-slate-50 px-2 py-0.5 shadow-2xs" title="رقم اللوحة">
            <span className="text-[9px] font-bold text-slate-400 border-l border-slate-300 pl-1.5 ml-1.5">مصر</span>
            <span className="font-mono font-bold text-slate-800 text-xs tracking-wider" dir="auto">
              {car.plateNumber || 'غير مسجلة'}
            </span>
          </div>
        </div>

        {/* Telemetry Strip (Odometer & Ownership) */}
        <div className="grid grid-cols-2 gap-2 text-[11px] py-1.5 px-2 bg-slate-50/80 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-1 min-w-0 text-slate-600">
            <UserRound size={12} className="text-slate-400 flex-shrink-0" />
            <span className="truncate" title={owner}>
              {owner}
            </span>
          </div>
          <div className="flex items-center gap-1 min-w-0 text-slate-600 justify-end">
            <Gauge size={12} className="text-slate-400 flex-shrink-0" />
            <span className="truncate font-medium" dir="auto">
              {car.currentKm ? `${car.currentKm.toLocaleString('ar-EG')} كم` : 'جديدة'}
            </span>
          </div>
        </div>

        {/* Executive Tariff / Pricing Strip */}
        <div className="flex items-center justify-between gap-1 p-2 bg-slate-50/70 border border-slate-200 rounded-lg text-center">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-slate-500 block">يومي</span>
            <div className="font-extrabold text-xs text-slate-900 truncate">
              {prices.daily.toLocaleString('ar-EG')} <small className="text-[9px] font-normal text-slate-500">ج.م</small>
            </div>
          </div>
          <div className="w-px h-4 bg-slate-200" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-slate-500 block">أسبوعي</span>
            <div className="font-extrabold text-xs text-slate-900 truncate">
              {prices.weekly.toLocaleString('ar-EG')} <small className="text-[9px] font-normal text-slate-500">ج.م</small>
            </div>
          </div>
          <div className="w-px h-4 bg-slate-200" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-slate-500 block">شهري</span>
            <div className="font-extrabold text-xs text-slate-900 truncate">
              {prices.monthly.toLocaleString('ar-EG')} <small className="text-[9px] font-normal text-slate-500">ج.م</small>
            </div>
          </div>
        </div>

        {/* Period Prices Collapsible */}
        {car.rentalPriceTiers && car.rentalPriceTiers.length > 0 && (
          <details className="fleet-unit-prices">
            <summary className="cursor-pointer font-bold text-slate-600 hover:text-slate-900 py-1 list-none flex items-center justify-between border-t border-slate-100 pt-1.5 text-[11px]">
              <span>كل الأسعار</span>
              <span className="text-[10px] text-slate-400">({car.rentalPriceTiers.length} فئات مدة)</span>
            </summary>
            <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg mt-1 text-[11px]">
              {car.rentalPriceTiers.map((tier) => (
                <div key={tier.days} className="flex items-center justify-between">
                  <span className="text-slate-600">{getPeriodLabel(tier.days)}</span>
                  <strong className="font-mono text-slate-900">{tier.totalEGP.toLocaleString('ar-EG')} ج.م</strong>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Active Booking status or Ready state */}
        {next ? (
          <div className="flex items-center justify-between gap-2 p-2 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-slate-800">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 animate-pulse" />
              <div className="truncate">
                <span className="font-bold block truncate">{next.customer.fullName}</span>
                <span className="text-[10px] text-slate-500">{BOOKING_STATUS_LABELS[next.status]}</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-600 text-left flex-shrink-0 flex items-center gap-1">
              <CalendarDays size={11} className="text-slate-400" />
              <span>{formatDate(next.endDate)}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 px-2 py-1 text-xs text-slate-500">
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>جاهزة للتشغيل</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {(history?.total ?? 0).toLocaleString('ar-EG')} حجز سابق
            </span>
          </div>
        )}

        {/* Action Buttons Footer */}
        <div className="mt-auto pt-2 border-t border-slate-100 flex items-center gap-1.5">
          <button
            type="button"
            onClick={onDetails}
            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-colors shadow-2xs"
          >
            <FileText size={13} />
            <span>التفاصيل</span>
          </button>

          {canBook && (
            <button
              type="button"
              onClick={onBook}
              disabled={car.status !== 'available'}
              className="inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-colors shadow-2xs"
              title={car.status === 'available' ? 'حجز سريع' : 'غير متاحة حالياً'}
            >
              <CalendarPlus size={13} />
              {'حجز'}
            </button>
          )}

          {admin && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              title="تعديل بيانات وأسعار السيارة"
              aria-label="تعديل السيارة"
            >
              <Pencil size={13} />
              {'تعديل'}
            </button>
          )}

          {admin && (
            <button
              type="button"
              onClick={onManage}
              aria-expanded={open}
              aria-controls={`fleet-manage-${car.id}`}
              className={`inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                open ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
              }`}
              title="إدارة الحالة والتشغيل"
              aria-label="إدارة السيارة"
            >
              <Settings2 size={13} />
              {'إدارة'}
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
    </article>
  );
}
