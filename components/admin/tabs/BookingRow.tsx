'use client';

import React from 'react';
import { 
  CheckCircle2, 
  FileText, 
  Key, 
  MessageSquare, 
  Phone, 
  ShieldCheck 
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

interface BookingRowProps {
  booking: Booking;
  canStart: boolean;
  activatingBookingId: string | null;
  currentStaff?: StaffUser;
  onOpenContract: (booking: Booking) => void;
  onReturnCar: (booking: Booking) => void;
  onActivateBooking?: (booking: Booking) => void;
  onReviewBooking?: (booking: Booking) => void;
}

export default function BookingRow({
  booking,
  canStart,
  activatingBookingId,
  currentStaff,
  onOpenContract,
  onReturnCar,
  onActivateBooking,
  onReviewBooking,
}: BookingRowProps) {
  const statusObj = statusConfig[booking.status] || { label: booking.status, dot: 'bg-slate-400', bg: 'bg-slate-100 text-slate-800 border-slate-200' };

  return (
    <div
      className="flex flex-wrap lg:flex-nowrap items-center justify-between p-2.5 gap-2.5 md:gap-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all text-xs"
      aria-label={`عقد رقم ${booking.bookingNumber}`}
    >
      {/* 1. Booking Code & Status */}
      <div className="flex items-center gap-2 min-w-[150px] flex-shrink-0">
        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white">
          {booking.bookingNumber}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusObj.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dot}`} />
          <span>{statusObj.label}</span>
        </span>
      </div>

      {/* 2. Customer Name & Phone */}
      <div className="min-w-[150px] flex-1">
        <strong className="text-slate-900 block truncate font-bold text-xs" title={booking.customer.fullName}>
          {booking.customer.fullName}
        </strong>
        <span className="font-mono text-[10px] text-slate-500 block" dir="ltr">
          {booking.customer.phone}
        </span>
      </div>

      {/* 3. Vehicle & Plate Capsule */}
      <div className="min-w-[160px] flex-1">
        <span className="text-slate-800 font-bold block truncate">
          {booking.carName}
        </span>
        <span className="font-mono text-[10px] text-slate-500 block">
          {booking.carPlate || 'لوحة رسمية'}
        </span>
      </div>

      {/* 4. Dates & Duration */}
      <div className="min-w-[140px] flex-shrink-0 text-[11px] text-slate-600">
        <div>{booking.startDate} ← {booking.endDate}</div>
        <span className="text-[10px] text-slate-400 block font-medium">
          المدة: {booking.daysCount} أيام
        </span>
      </div>

      {/* 5. Net Total & Deposit */}
      <div className="min-w-[130px] flex-shrink-0 text-left font-mono">
        <strong className="text-xs font-black text-slate-900 block">
          {booking.finalTotalEGP.toLocaleString('ar-EG')} ج.م
        </strong>
        <span className="text-[10px] text-slate-400 block">
          تأمين: {booking.securityDepositEGP.toLocaleString('ar-EG')} ج.م
        </span>
      </div>

      {/* 6. Quick Action Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0 mr-auto lg:mr-0">
        {booking.status === 'pending_approval' && onReviewBooking && currentStaff?.role === 'super_admin' && (
          <button
            type="button"
            onClick={() => onReviewBooking(booking)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-2xs"
          >
            <FileText size={12} />
            <span>اعتماد</span>
          </button>
        )}

        {canStart && onActivateBooking && (
          <button
            type="button"
            onClick={() => onActivateBooking(booking)}
            disabled={activatingBookingId === booking.id}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-2xs disabled:opacity-50"
          >
            <Key size={12} />
            <span>تسليم</span>
          </button>
        )}

        {booking.status === 'active' && (
          <button
            type="button"
            onClick={() => onReturnCar(booking)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-2xs"
          >
            <CheckCircle2 size={12} />
            <span>استلام</span>
          </button>
        )}

        {booking.status !== 'pending_approval' && (
          <button
            type="button"
            onClick={() => onOpenContract(booking)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
            title="عرض وثيقة العقد والطباعة"
          >
            <FileText size={12} />
            <span>العقد</span>
          </button>
        )}

        {booking.status !== 'cancelled' && (
          <a
            href={getContractWhatsAppUrl(booking)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs transition-colors"
            title="إرسال ملخص العقد عبر واتساب"
          >
            <MessageSquare size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
