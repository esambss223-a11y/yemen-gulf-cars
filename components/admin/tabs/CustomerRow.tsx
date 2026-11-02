'use client';

import React from 'react';
import { Customer } from '@/types/fleet';
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
  ShieldCheck 
} from 'lucide-react';

interface CustomerRowProps {
  customer: Customer;
  addressInfo: { address: string; governorate: string };
  onOpenDetails: (customer: Customer) => void;
  onOpenEdit: (customer: Customer) => void;
  onDelete: (id: string, name: string) => void;
  onNewBooking?: (customer: Customer) => void;
}

export default function CustomerRow({
  customer,
  addressInfo,
  onOpenDetails,
  onOpenEdit,
  onDelete,
  onNewBooking,
}: CustomerRowProps) {
  const isVipGold = customer.tier === 'vip_gold';
  const isVipSilver = customer.tier === 'vip_silver';
  const isBlacklist = customer.tier === 'blacklist';
  const isWebSource = customer.source === 'website' || customer.id.startsWith('web-');
  const trustScore = customer.trustScore ?? 85;

  const whatsappNumber = (customer.whatsapp || customer.phone || '').replace(/[^0-9]/g, '');

  return (
    <div className="flex items-center justify-between p-2.5 gap-2 md:gap-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-2xs transition-all text-xs">
      {/* 1. Client Identity & Tier */}
      <button
        type="button"
        onClick={() => onOpenDetails(customer)}
        className="flex items-center gap-2.5 min-w-[160px] flex-1 text-right group cursor-pointer focus:outline-none"
        title="اضغط لعرض الملف الشامل"
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs flex-shrink-0 transition-colors ${
          isVipGold 
            ? 'bg-amber-500 text-slate-950 font-black' 
            : isBlacklist
              ? 'bg-rose-100 text-rose-700'
              : 'bg-slate-900 group-hover:bg-slate-800 text-white'
        }`}>
          {customer.fullName.charAt(0)}
        </div>
        <div className="min-w-0">
          <strong className="text-slate-900 block truncate font-bold text-xs group-hover:text-slate-700 transition-colors">
            {customer.fullName}
          </strong>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
            <span>{customer.nationality || 'مصري'}</span>
            {isWebSource && !customer.identityVerified && (
              <span className="font-bold text-amber-700">· قيد التحقق</span>
            )}
          </div>
        </div>
      </button>

      {/* 2. Phone & 1-Click WhatsApp */}
      <div className="flex-shrink-0 flex items-center gap-1.5">
        <a 
          href={`tel:${customer.phone}`} 
          className="font-mono text-[11px] font-bold text-slate-900 hover:underline"
          dir="ltr"
        >
          {customer.phone}
        </a>
        {whatsappNumber && (
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            title="مراسلة عبر واتساب"
          >
            <MessageSquare size={11} />
          </a>
        )}
      </div>

      {/* 3. Address & Governorate (Progressive Disclosure) */}
      <div className="hidden lg:block min-w-[140px] max-w-[200px] flex-shrink-0 text-[11px] text-slate-600 truncate" title={addressInfo.address || 'لم يسجل سكن'}>
        <div className="flex items-center gap-1 truncate">
          <MapPin size={11} className="text-slate-400 flex-shrink-0" />
          <span className="truncate">{addressInfo.address || 'بدون عنوان سكن'}</span>
        </div>
        <span className="text-[10px] text-slate-400 block">{addressInfo.governorate || 'المحافظة: غير محددة'}</span>
      </div>

      {/* 4. National ID & License */}
      <div className="hidden xl:block min-w-[120px] flex-shrink-0 font-mono text-[11px] text-slate-700">
        <div className="truncate" title={customer.nationalId}>{customer.nationalId || 'بدون بطاقة'}</div>
        <span className="text-[10px] text-slate-400 block">{customer.licenseNumber || 'بدون رخصة'}</span>
      </div>

      {/* 5. Tier Badge */}
      <div className="hidden sm:inline-flex flex-shrink-0">
        {isVipGold ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Star size={11} className="fill-amber-500 text-amber-500" /> VIP ذهبي
          </span>
        ) : isVipSilver ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <Star size={11} className="text-slate-500" /> VIP فضي
          </span>
        ) : isBlacklist ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle size={11} className="text-rose-600" /> محظور
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            منتظم
          </span>
        )}
      </div>

      {/* 6. Rental Count & LTV */}
      <div className="hidden md:block min-w-[100px] flex-shrink-0 text-left font-mono">
        <strong className="text-xs font-bold text-slate-900 block">
          {(customer.totalSpentEGP || 0).toLocaleString('ar-EG')} ج.م
        </strong>
        <span className="text-[10px] text-slate-500 block">
          {customer.totalRentalsCount || 0} عقود
        </span>
      </div>

      {/* 7. Quick Operations */}
      <div className="flex items-center gap-1 flex-shrink-0 mr-auto lg:mr-0">
        <button
          type="button"
          onClick={() => onOpenDetails(customer)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          title="الملف الشامل وسجل العقود"
        >
          <FileText size={11} />
          <span>الملف</span>
        </button>

        {onNewBooking && (
          <button
            type="button"
            onClick={() => onNewBooking(customer)}
            disabled={isBlacklist}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            title="فتح حجز جديد لهذا العميل"
          >
            <CarIcon size={11} />
            <span className="hidden sm:inline">حجز</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onOpenEdit(customer)}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs transition-colors cursor-pointer"
          title="تعديل بيانات العميل"
        >
          <Pencil size={11} />
        </button>

        <button
          type="button"
          onClick={() => onDelete(customer.id, customer.fullName)}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 text-xs transition-colors cursor-pointer"
          title="حذف العميل"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}
