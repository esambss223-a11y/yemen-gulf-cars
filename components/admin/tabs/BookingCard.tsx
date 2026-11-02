'use client';

import React from 'react';
import { 
  CheckCircle2, 
  FileText, 
  Key, 
  MessageSquare, 
  Phone, 
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import type { Booking, BookingStatus, StaffUser } from '@/types/fleet';
import { getContractWhatsAppUrl } from '@/lib/contract-whatsapp';

const statusConfig: Record<BookingStatus, { label: string; dot: string; bg: string }> = {
  pending_approval: { label: 'بانتظار الموافقة', dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  confirmed: { label: 'مؤكد (بانتظار الخروج)', dot: 'bg-sky-500', bg: 'bg-sky-50 text-sky-800 border-sky-200' },
  active: { label: 'ساري بالتشغيل', dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  completed: { label: 'مكتمل ومستلم', dot: 'bg-slate-400', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
  cancelled: { label: 'ملغي / مرفوض', dot: 'bg-rose-500', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
};

interface BookingCardProps {
  booking: Booking;
  canStart: boolean;
  activatingBookingId: string | null;
  currentStaff?: StaffUser;
  onOpenContract: (booking: Booking) => void;
  onReturnCar: (booking: Booking) => void;
  onActivateBooking?: (booking: Booking) => void;
  onReviewBooking?: (booking: Booking) => void;
}

export default function BookingCard({
  booking,
  canStart,
  activatingBookingId,
  currentStaff,
  onOpenContract,
  onReturnCar,
  onActivateBooking,
  onReviewBooking,
}: BookingCardProps) {
  const statusObj = statusConfig[booking.status] || { label: booking.status, dot: 'bg-slate-400', bg: 'bg-slate-100 text-slate-800 border-slate-200' };

  return (
    <article
      className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all p-3 space-y-2.5"
      aria-label={`عقد رقم ${booking.bookingNumber}`}
    >
      {/* 1. Header: Contract Reference, Duration & Status */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white tracking-wider">
            {booking.bookingNumber}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold px-1.5 py-0.5 rounded bg-slate-100">
            {booking.daysCount} أيام
          </span>
        </div>

        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${statusObj.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dot} ${booking.status === 'active' || booking.status === 'pending_approval' ? 'animate-pulse' : ''}`} />
          <span>{statusObj.label}</span>
        </span>
      </div>

      {/* 2. Customer & Contact Shortcuts */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <strong className="text-xs font-bold text-slate-900 block truncate" title={booking.customer.fullName}>
            {booking.customer.fullName}
          </strong>
          <span className="font-mono text-[11px] text-slate-500 block truncate mt-0.5" dir="ltr">
            {booking.customer.phone}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <a
            href={`tel:${booking.customer.phone}`}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
            title="اتصال هاتفي"
          >
            <Phone size={12} />
          </a>
          <a
            href={getContractWhatsAppUrl(booking)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
            title="مراسلة واتساب بملخص العقد"
          >
            <MessageSquare size={12} />
          </a>
        </div>
      </div>

      {/* 3. Vehicle & Plate Badge */}
      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px]">
        <div className="truncate">
          <span className="text-slate-400 block text-[9px] font-medium">السيارة المؤجرة</span>
          <strong className="text-slate-900 font-bold block truncate mt-0.5">
            {booking.carName}
          </strong>
        </div>

        <div className="flex-shrink-0 flex items-center border border-slate-300 rounded bg-gradient-to-b from-white to-slate-100 px-2 py-0.5 shadow-2xs font-mono font-bold text-slate-800 text-[10px] tracking-wider" dir="auto">
          <span className="text-[8px] font-semibold text-slate-400 border-l border-slate-300 pl-1 ml-1">مصر</span>
          <span>{booking.carPlate || 'لوحة رسمية'}</span>
        </div>
      </div>

      {/* 4. Dates & Financial Telemetry */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
          <span className="text-[9px] text-slate-400 block font-medium">فترة العقد</span>
          <span className="text-slate-800 font-semibold block mt-0.5 truncate text-[10px]">
            {booking.startDate} ← {booking.endDate}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-left font-mono">
          <span className="text-[9px] text-slate-400 block font-medium">صافي القيمة</span>
          <strong className="text-xs font-black text-slate-900 block mt-0.5 truncate">
            {booking.finalTotalEGP.toLocaleString('ar-EG')} <small className="text-[9px] font-normal text-slate-500">ج.م</small>
          </strong>
        </div>
      </div>

      {/* Held Security Deposit strip */}
      {booking.securityDepositEGP > 0 && (
        <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-100/70 border border-slate-200 text-[10px] text-slate-600">
          <span className="flex items-center gap-1">
            <ShieldCheck size={11} className="text-slate-500" />
            <span>تأمين محتجز للشركة:</span>
          </span>
          <strong className="font-mono text-slate-900 font-bold">
            {booking.securityDepositEGP.toLocaleString('ar-EG')} ج.م
          </strong>
        </div>
      )}

      {/* 5. Action Buttons Toolbar */}
      <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
        {/* Approve / Review button (for pending) */}
        {booking.status === 'pending_approval' && onReviewBooking && currentStaff?.role === 'super_admin' && (
          <button
            type="button"
            onClick={() => onReviewBooking(booking)}
            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-2xs"
          >
            <FileText size={12} />
            <span>مراجعة واعتماد</span>
          </button>
        )}

        {/* Start / Activate button */}
        {canStart && onActivateBooking && (
          <button
            type="button"
            onClick={() => onActivateBooking(booking)}
            disabled={activatingBookingId === booking.id}
            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-2xs disabled:opacity-50"
          >
            <Key size={12} />
            <span>{activatingBookingId === booking.id ? 'جارٍ البدء…' : 'تسليم وبدء العقد'}</span>
          </button>
        )}

        {/* Return & Inspection button */}
        {booking.status === 'active' && (
          <button
            type="button"
            onClick={() => onReturnCar(booking)}
            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-2xs"
          >
            <CheckCircle2 size={12} />
            <span>استلام وفحص</span>
          </button>
        )}

        {/* View Contract Modal Button */}
        {booking.status !== 'pending_approval' && (
          <button
            type="button"
            onClick={() => onOpenContract(booking)}
            className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
            title="عرض وثيقة العقد والطباعة"
          >
            <FileText size={12} />
            <span>العقد</span>
          </button>
        )}

        {/* Direct WhatsApp Share */}
        {booking.status !== 'cancelled' && (
          <a
            href={getContractWhatsAppUrl(booking)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs transition-colors"
            title="إرسال ملخص العقد عبر واتساب"
          >
            <MessageSquare size={12} />
          </a>
        )}
      </div>
    </article>
  );
}
