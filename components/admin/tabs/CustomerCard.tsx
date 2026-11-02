'use client';

import React from 'react';
import { Customer, CustomerTier, CustomerSource } from '@/types/fleet';
import { 
  Phone, 
  MapPin, 
  FileText, 
  Car as CarIcon, 
  Pencil, 
  Trash2, 
  MessageSquare, 
  Star, 
  AlertTriangle, 
  ShieldCheck,
  CreditCard,
  Award
} from 'lucide-react';

interface CustomerCardProps {
  customer: Customer;
  addressInfo: { address: string; governorate: string };
  onOpenDetails: (customer: Customer) => void;
  onOpenEdit: (customer: Customer) => void;
  onDelete: (id: string, name: string) => void;
  onNewBooking?: (customer: Customer) => void;
}

export default function CustomerCard({
  customer,
  addressInfo,
  onOpenDetails,
  onOpenEdit,
  onDelete,
  onNewBooking,
}: CustomerCardProps) {
  const isVipGold = customer.tier === 'vip_gold';
  const isVipSilver = customer.tier === 'vip_silver';
  const isBlacklist = customer.tier === 'blacklist';
  const isWebSource = customer.source === 'website' || customer.id.startsWith('web-');
  const trustScore = customer.trustScore ?? 85;

  const getTierBadge = () => {
    if (isVipGold) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Star size={11} className="fill-amber-500 text-amber-500" />
          <span>VIP ذهبي</span>
        </span>
      );
    }
    if (isVipSilver) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
          <Star size={11} className="text-slate-500" />
          <span>VIP فضي</span>
        </span>
      );
    }
    if (isBlacklist) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle size={11} className="text-rose-600" />
          <span>محظور</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <span>منتظم</span>
      </span>
    );
  };

  const getTrustBadge = () => {
    if (isWebSource && !customer.identityVerified) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>بانتظار التحقق</span>
        </span>
      );
    }
    if (customer.riskStatus === 'high_risk' || trustScore < 50) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>مخاطر عالية</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <ShieldCheck size={11} className="text-emerald-600" />
        <span>موثوق ومؤكد</span>
      </span>
    );
  };

  const whatsappNumber = (customer.whatsapp || customer.phone || '').replace(/[^0-9]/g, '');

  return (
    <article className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all p-3.5 space-y-3 relative group">
      {/* Top Bar: Avatar, Full Name, Nationality, Badges */}
      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
        <button
          type="button"
          onClick={() => onOpenDetails(customer)}
          className="flex items-center gap-2.5 min-w-0 text-right group/btn focus:outline-none cursor-pointer"
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm flex-shrink-0 transition-colors ${
            isVipGold 
              ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-300' 
              : isBlacklist
                ? 'bg-rose-100 text-rose-700 border border-rose-300'
                : 'bg-slate-900 group-hover/btn:bg-slate-800 text-white'
          }`}>
            {customer.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <strong className="text-xs font-bold text-slate-900 block truncate group-hover/btn:text-slate-700 transition-colors">
              {customer.fullName}
            </strong>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
              <span>{customer.nationality || 'مصري'}</span>
              <span>·</span>
              {getTrustBadge()}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1 flex-shrink-0">
          {getTierBadge()}
        </div>
      </div>

      {/* Contact & Legal Coordinates */}
      <div className="space-y-2 text-xs">
        {/* Direct Phone & WhatsApp */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 min-w-0">
            <Phone size={13} className="text-slate-400 flex-shrink-0" />
            <a 
              href={`tel:${customer.phone}`} 
              className="font-mono text-xs font-bold text-slate-900 hover:text-slate-700 hover:underline"
              dir="ltr"
            >
              {customer.phone}
            </a>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <a
              href={`tel:${customer.phone}`}
              className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
              title="اتصال هاتفي"
            >
              <Phone size={11} />
            </a>
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                title="مراسلة واتساب"
              >
                <MessageSquare size={11} />
              </a>
            )}
          </div>
        </div>

        {/* Address & Residence */}
        <div 
          onClick={() => onOpenDetails(customer)}
          className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px] text-slate-600 cursor-pointer hover:bg-slate-100/70 transition-colors"
          title={addressInfo.address ? `العنوان: ${addressInfo.address}` : 'لم يسجل عنوان سكن'}
        >
          <MapPin size={12} className="text-slate-400 flex-shrink-0" />
          <span className="truncate">
            {addressInfo.address ? `${addressInfo.address}${addressInfo.governorate ? ` — ${addressInfo.governorate}` : ''}` : 'عنوان السكن: غير مسجل'}
          </span>
        </div>

        {/* Legal Identity: ID and Driver's License */}
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/60">
            <span className="text-[9px] text-slate-400 block font-medium">الهوية / الجواز</span>
            <span className="font-mono text-slate-800 font-bold block truncate mt-0.5" dir="auto">
              {customer.nationalId || 'غير مسجلة'}
            </span>
          </div>

          <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/60">
            <span className="text-[9px] text-slate-400 block font-medium">رخصة القيادة</span>
            <span className="font-mono text-slate-800 font-bold block truncate mt-0.5" dir="auto">
              {customer.licenseNumber || 'غير مسجلة'}
            </span>
          </div>
        </div>

        {/* Financial & Rental Telemetry */}
        <div className="grid grid-cols-3 gap-1 p-2 rounded-lg bg-slate-50 border border-slate-200/60 text-center text-[10px]">
          <div>
            <span className="text-slate-400 block">العقود المنفذة</span>
            <strong className="text-slate-900 font-mono text-xs block mt-0.5">
              {customer.totalRentalsCount || 0}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block">نقاط الولاء</span>
            <strong className="text-amber-700 font-mono text-xs block mt-0.5">
              {customer.loyaltyPoints || 0}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block">إجمالي التعامل</span>
            <strong className="text-slate-900 font-mono text-xs block mt-0.5">
              {(customer.totalSpentEGP || 0).toLocaleString('ar-EG')} <small className="text-[9px] font-normal text-slate-500">ج.م</small>
            </strong>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onOpenDetails(customer)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
        >
          <FileText size={12} />
          <span>الملف الشامل</span>
        </button>

        {onNewBooking && (
          <button
            type="button"
            onClick={() => onNewBooking(customer)}
            disabled={isBlacklist}
            className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            title={isBlacklist ? 'العميل مدرج في قائمة الحظر' : 'حجز سيارة لهذا العميل فوراً'}
          >
            <CarIcon size={12} />
            <span>حجز</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onOpenEdit(customer)}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs transition-colors cursor-pointer"
          title="تعديل بيانات العميل"
        >
          <Pencil size={12} />
        </button>

        <button
          type="button"
          onClick={() => onDelete(customer.id, customer.fullName)}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 text-xs transition-colors cursor-pointer"
          title="حذف العميل"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </article>
  );
}
