'use client';

import React from 'react';
import Image from 'next/image';
import { VehicleOwner, Car } from '@/types/fleet';
import { 
  Phone, 
  Car as CarIcon, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  Pencil, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  CreditCard 
} from 'lucide-react';

interface OwnerCardProps {
  owner: VehicleOwner;
  ownerCars: Car[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpenSettlement: (owner: VehicleOwner) => void;
  onOpenEdit: (owner: VehicleOwner) => void;
  onOpenEditCar?: (car: Car) => void;
  canEdit: boolean;
}

export default function OwnerCard({
  owner,
  ownerCars,
  isExpanded,
  onToggleExpand,
  onOpenSettlement,
  onOpenEdit,
  onOpenEditCar,
  canEdit,
}: OwnerCardProps) {
  const isCompany = owner.id === 'owner-1';
  const rentedCount = ownerCars.filter(c => c.status === 'rented').length;
  const whatsappNumber = (owner.phone || '').replace(/[^0-9]/g, '');

  const getContractBadge = () => {
    switch (owner.commissionModel) {
      case 'fixed_monthly':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <DollarSign className="w-3.5 h-3.5 text-amber-600" />
            <span>شهري: {(owner.fixedMonthlyRateEGP || 35000).toLocaleString('ar-EG')} ج.م</span>
            <span className="text-[10px] text-amber-700 font-normal">(يوم {owner.monthlyPayoutDay || 1})</span>
          </span>
        );
      case 'fixed_daily':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span>يومي: {(owner.fixedDailyRateEGP || 1200).toLocaleString('ar-EG')} ج.م/يوم</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>نسبة: {owner.ownerSharePercent || 75}% للمالك</span>
          </span>
        );
    }
  };

  const getLicenseStatus = (expiryDate?: string) => {
    if (!expiryDate) return { label: 'رخصة غير مسجلة', color: 'text-slate-400 bg-slate-100' };
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'رخصة منتهية', color: 'text-rose-700 bg-rose-50 border border-rose-200 font-bold' };
    if (diffDays <= 30) return { label: `تجديد خلال ${diffDays} يوم`, color: 'text-amber-800 bg-amber-50 border border-amber-200 font-bold' };
    return { label: `سارية حتى ${expiryDate}`, color: 'text-emerald-700 bg-emerald-50 border border-emerald-200' };
  };

  return (
    <article className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all overflow-hidden flex flex-col">
      {/* 1. Header: Avatar, Name, Cars count & Contract Model */}
      <div className="p-3.5 border-b border-slate-100 flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-sm flex-shrink-0">
            {owner.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <strong className="text-xs sm:text-sm font-extrabold text-slate-900 block truncate">
                {owner.name}
              </strong>
              {isCompany && (
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  أسطول الشركة
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span className="font-mono" dir="ltr">{owner.phone}</span>
              <span>·</span>
              <span className="font-semibold text-slate-700">{ownerCars.length} سيارات بالأسطول</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          {getContractBadge()}
        </div>
      </div>

      {/* 2. Body: Direct Contact, National ID & Bank Account */}
      <div className="p-3.5 space-y-2.5 flex-1 text-xs">
        {/* Contact Strip */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 min-w-0">
            <Phone size={13} className="text-slate-400 flex-shrink-0" />
            <a 
              href={`tel:${owner.phone}`} 
              className="font-mono text-xs font-bold text-slate-900 hover:text-slate-700 hover:underline"
              dir="ltr"
            >
              {owner.phone}
            </a>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <a
              href={`tel:${owner.phone}`}
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

        {/* Financial & ID Coordinates */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
            <span className="text-[9px] text-slate-400 font-medium block">الرقم القومي / الجواز</span>
            <strong className="font-mono text-slate-800 font-bold block mt-0.5 truncate" dir="auto">
              {owner.nationalId || 'غير مسجل'}
            </strong>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
            <span className="text-[9px] text-slate-400 font-medium block">الحساب البنكي / التحويل</span>
            <strong className="font-mono text-slate-800 block mt-0.5 truncate" title={owner.bankAccount}>
              {owner.bankAccount || 'غير مسجل'}
            </strong>
          </div>
        </div>

        {/* Cars Accordion Trigger */}
        <div>
          <button
            type="button"
            onClick={onToggleExpand}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-100/70 hover:bg-slate-100 text-slate-800 font-bold text-xs transition-colors cursor-pointer border border-slate-200/60"
          >
            <div className="flex items-center gap-1.5">
              <CarIcon size={14} className="text-slate-600" />
              <span>سيارات المالك بالأسطول ({ownerCars.length})</span>
              {rentedCount > 0 && (
                <span className="text-[10px] font-normal text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  {rentedCount} مؤجرة بالشارع
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-normal">
              <span>{isExpanded ? 'طي القائمة' : 'استعراض السيارات'}</span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </button>

          {/* Expanded Cars List */}
          {isExpanded && (
            <div className="mt-2 space-y-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 animate-in fade-in duration-150">
              {ownerCars.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-2">لا توجد سيارات مسجلة لهذا المالك حالياً.</p>
              ) : (
                ownerCars.map((c) => {
                  const lic = getLicenseStatus(c.licenseExpiryDate);
                  return (
                    <div
                      key={c.id}
                      className="p-1.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative w-9 h-6 rounded overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                          <Image
                            src={c.coverImage || c.images?.[0] || '/car-mercedes.jpg'}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="36px"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-slate-900 font-bold truncate block">{c.make} {c.model}</strong>
                            <span className="font-mono text-[10px] text-slate-500">({c.year})</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                            <span className="font-mono font-bold text-slate-700">{c.plateNumber}</span>
                            <span>·</span>
                            <span className={lic.color}>{lic.label}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                          c.status === 'rented' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {c.status === 'available' ? 'متاحة' : c.status === 'rented' ? 'مؤجرة' : 'صيانة'}
                        </span>

                        {onOpenEditCar && (
                          <button
                            type="button"
                            onClick={() => onOpenEditCar(c)}
                            className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                            title="تعديل بيانات وأسعار السيارة"
                          >
                            <Pencil size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {owner.notes && (
          <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-900">
            <span className="font-bold">ملاحظات: </span>
            <span>{owner.notes}</span>
          </div>
        )}
      </div>

      {/* 3. Footer Operations */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpenSettlement(owner)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          title="استخراج كشف حساب الأرباح والمستحقات للطباعة"
        >
          <FileText size={12} />
          <span>كشف الحساب والتصفية</span>
        </button>

        {canEdit && (
          <button
            type="button"
            onClick={() => onOpenEdit(owner)}
            className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            title="تعديل بيانات وحساب المالك"
          >
            <Pencil size={11} />
            <span>تعديل</span>
          </button>
        )}
      </div>
    </article>
  );
}
