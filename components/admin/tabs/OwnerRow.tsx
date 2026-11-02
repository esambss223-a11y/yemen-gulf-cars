'use client';

import React from 'react';
import { VehicleOwner, Car } from '@/types/fleet';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Pencil, 
  FileText, 
  MessageSquare,
  Phone 
} from 'lucide-react';

interface OwnerRowProps {
  owner: VehicleOwner;
  ownerCars: Car[];
  onOpenSettlement: (owner: VehicleOwner) => void;
  onOpenEdit: (owner: VehicleOwner) => void;
  canEdit: boolean;
}

export default function OwnerRow({
  owner,
  ownerCars,
  onOpenSettlement,
  onOpenEdit,
  canEdit,
}: OwnerRowProps) {
  const isCompany = owner.id === 'owner-1';
  const rentedCount = ownerCars.filter(c => c.status === 'rented').length;
  const whatsappNumber = (owner.phone || '').replace(/[^0-9]/g, '');

  const getContractBadge = () => {
    switch (owner.commissionModel) {
      case 'fixed_monthly':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <DollarSign className="w-3 h-3 text-amber-600" />
            <span>شهري: {(owner.fixedMonthlyRateEGP || 35000).toLocaleString('ar-EG')} ج.م</span>
          </span>
        );
      case 'fixed_daily':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <Clock className="w-3 h-3 text-slate-600" />
            <span>يومي: {(owner.fixedDailyRateEGP || 1200).toLocaleString('ar-EG')} ج.م</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span>نسبة: {owner.ownerSharePercent || 75}%</span>
          </span>
        );
    }
  };

  return (
    <div className="flex items-center justify-between p-2.5 gap-2 md:gap-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-2xs transition-all text-xs">
      {/* 1. Name & Avatar */}
      <div className="flex items-center gap-2.5 min-w-[160px] flex-1">
        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-extrabold text-xs flex-shrink-0">
          {owner.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <strong className="text-slate-900 block truncate font-bold text-xs">
              {owner.name}
            </strong>
            {isCompany && (
              <span className="text-[9px] px-1 rounded bg-slate-100 text-slate-600">الشركة</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <a href={`tel:${owner.phone}`} className="text-[10px] text-slate-500 font-mono hover:underline" dir="ltr">
              {owner.phone}
            </a>
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-800"
                title="واتساب"
              >
                <MessageSquare size={11} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 2. Bank Coordinates */}
      <div className="hidden sm:block min-w-[130px] flex-shrink-0 font-mono text-[11px] text-slate-700">
        <span className="text-[9px] text-slate-400 block font-sans">الحساب البنكي:</span>
        <span className="truncate block" title={owner.bankAccount}>{owner.bankAccount || 'غير مسجل'}</span>
      </div>

      {/* 3. National ID */}
      <div className="hidden lg:block min-w-[120px] flex-shrink-0 font-mono text-[11px] text-slate-700">
        <span className="text-[9px] text-slate-400 block font-sans">الرقم القومي:</span>
        <span className="truncate block">{owner.nationalId || 'غير مسجل'}</span>
      </div>

      {/* 4. Contract Model Badge */}
      <div className="flex-shrink-0">
        {getContractBadge()}
      </div>

      {/* 5. Registered Cars Telemetry */}
      <div className="hidden md:block min-w-[100px] flex-shrink-0 text-left font-mono">
        <strong className="text-xs font-bold text-slate-900 block">
          {ownerCars.length} سيارات
        </strong>
        <span className="text-[10px] text-slate-500 block font-sans">
          {rentedCount} مؤجرة حالياً
        </span>
      </div>

      {/* 6. Operations */}
      <div className="flex items-center gap-1.5 flex-shrink-0 mr-auto lg:mr-0">
        <button
          type="button"
          onClick={() => onOpenSettlement(owner)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          title="كشف حساب الأرباح"
        >
          <FileText size={11} />
          <span>كشف الحساب</span>
        </button>

        {canEdit && (
          <button
            type="button"
            onClick={() => onOpenEdit(owner)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs transition-colors cursor-pointer"
            title="تعديل المالك"
          >
            <Pencil size={11} />
          </button>
        )}
      </div>
    </div>
  );
}
