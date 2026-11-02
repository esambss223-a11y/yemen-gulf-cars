'use client';

import type { Booking } from '@/types/fleet';
import { 
  UserRound, 
  Phone, 
  Car, 
  CalendarDays, 
  CreditCard, 
  ShieldCheck, 
  Clock, 
  FileText, 
  Gauge, 
  MessageSquare,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CONTRACT_FIELDS } from '@/lib/rental-contract';
import { getContractWhatsAppUrl } from '@/lib/contract-whatsapp';

const money = (n: number) => n.toLocaleString('ar-EG') + ' ج.م';

const depositStatusLabels: Record<string, { label: string; color: string }> = {
  held: { label: 'محتجز لدى الشركة', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  pending: { label: 'قيد التسوية', color: 'text-slate-700 bg-slate-100 border-slate-200' },
  refunded_full: { label: 'مسترد بالكامل', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  refunded_partial: { label: 'مسترد جزئياً', color: 'text-sky-700 bg-sky-50 border-sky-200' },
};

export default function RentalBookingDetails({ booking }: { booking: Booking }) {
  const depositInfo = depositStatusLabels[booking.depositStatus] || depositStatusLabels.held;
  
  const supplemental = Object.entries(booking.contractRecord?.details || {})
    .filter(([key, value]) => value && key !== 'secondaryPhone')
    .map(([key, value]) => ({
      label: CONTRACT_FIELDS[key as keyof typeof CONTRACT_FIELDS] || key,
      value: String(value),
    }));

  return (
    <div className="space-y-4 text-xs text-slate-800">
      
      {/* Top Essential Cards Grid (Customer & Vehicle) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        
        {/* CARD 1: CUSTOMER (الطرف الثاني - المستأجر) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
              <UserRound size={15} className="text-slate-500" />
              الطرف الثاني (المستأجر)
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              {booking.customer.nationality || 'مصري'}
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <strong className="text-sm font-extrabold text-slate-900 block truncate">
                {booking.customer.fullName}
              </strong>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px]">الرقم القومي / جواز السفر</span>
                <span className="font-mono font-bold text-slate-800 block mt-0.5" dir="auto">
                  {booking.customer.nationalId || 'غير مسجل'}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px]">رقم رخصة القيادة</span>
                <span className="font-mono font-bold text-slate-800 block mt-0.5" dir="auto">
                  {booking.customer.licenseNumber || 'غير مسجل'}
                </span>
              </div>
            </div>

            {/* Quick Contact Bar */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href={`tel:${booking.customer.phone}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold transition-colors"
              >
                <Phone size={12} className="text-slate-500" />
                <span className="font-mono text-xs">{booking.customer.phone}</span>
              </a>

              <a
                href={getContractWhatsAppUrl(booking)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-2xs"
                title="مراسلة العميل عبر واتساب"
              >
                <MessageSquare size={13} />
                <span>واتساب</span>
              </a>
            </div>
          </div>
        </div>

        {/* CARD 2: VEHICLE & DATES (المركبة والمواعيد) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
              <Car size={15} className="text-slate-500" />
              المركبة ومواعيد التعاقد
            </span>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-300 bg-slate-50 font-mono text-[11px] font-bold">
              <span className="text-[9px] text-slate-400">مصر</span>
              <span>{booking.carPlate}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <strong className="text-sm font-extrabold text-slate-900 block truncate">
                {booking.carName}
              </strong>
            </div>

            {/* Dates Timeline Strip */}
            <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px]">
              <div>
                <span className="text-[10px] text-slate-400 block">الاستلام المعتمد</span>
                <strong className="text-slate-900 block mt-0.5">
                  {booking.startDate}
                </strong>
                <span className="text-slate-500 text-[10px]">{booking.startTime || '14:00'}</span>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] text-slate-400 block">الإرجاع المقرر</span>
                <strong className="text-slate-900 block mt-0.5">
                  {booking.endDate}
                </strong>
                <span className="text-slate-500 text-[10px]">{booking.endTime || '14:00'}</span>
              </div>
            </div>

            {/* Odometer & Duration Stats */}
            <div className="flex items-center justify-between text-[11px] text-slate-600 px-1 pt-0.5">
              <span className="flex items-center gap-1">
                <Clock size={12} className="text-slate-400" />
                مدة الإيجار: <b>{booking.daysCount.toLocaleString('ar-EG')} أيام</b>
              </span>
              <span className="flex items-center gap-1">
                <Gauge size={12} className="text-slate-400" />
                عداد الخروج: <b>{booking.startKm.toLocaleString('ar-EG')} كم</b>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview Ribbon (Clear, Flat, Unified) */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
            <CreditCard size={15} className="text-slate-500" />
            الملخص المالي للعقد
          </span>
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${depositInfo.color}`}>
            {depositInfo.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-medium block">الإيجار اليومي</span>
            <strong className="text-xs font-bold text-slate-800 block mt-0.5">
              {money(booking.dailyRateEGP)}
            </strong>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-medium block">الإجمالي قبل الخصم</span>
            <strong className="text-xs font-bold text-slate-800 block mt-0.5">
              {money(booking.totalRentEGP)}
            </strong>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-medium block">صافي الإيجار المستحق</span>
            <strong className="text-sm font-extrabold text-slate-900 block mt-0.5">
              {money(booking.finalTotalEGP)}
            </strong>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-medium block">التأمين المسترد</span>
            <strong className="text-sm font-extrabold text-slate-900 block mt-0.5">
              {money(booking.securityDepositEGP)}
            </strong>
          </div>
        </div>

        {/* Staff & Metadata Footnote */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          <span>الموظف المنشئ: <b className="text-slate-800">{booking.staffName || 'غير مسجل'}</b></span>
          {booking.approvedByStaffName && (
            <span>تم الاعتماد بواسطة: <b className="text-slate-800">{booking.approvedByStaffName}</b></span>
          )}
          <span>تاريخ الحجز: <span dir="ltr">{booking.createdAt}</span></span>
        </div>
      </div>

      {/* Supplemental Office Data (if any filled) */}
      {supplemental.length > 0 && (
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
          <span className="font-bold text-xs text-slate-800 block">
            البيانات التكميلية المدخلة بالعقد
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
            {supplemental.map((item, idx) => (
              <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block">{item.label}</span>
                <strong className="text-slate-900 block mt-0.5 truncate" title={item.value}>
                  {item.value}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contract Notes & Late Return Policy */}
      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
        <AlertCircle size={15} className="text-slate-500 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800 block font-semibold mb-0.5">شروط التأخير والتسليم:</strong>
          <span>شرط التأخير: 200 ج.م لكل ساعة مع الإبلاغ المسبق وموافقة الشركة، أو غرامة يوم كامل دون إبلاغ.</span>
          {booking.notes && (
            <p className="mt-1 pt-1 border-t border-slate-200 text-slate-700">
              <b>ملاحظات الحجز:</b> {booking.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
