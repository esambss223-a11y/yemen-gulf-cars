'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import { VehicleOwner } from '@/types/fleet';
import { CarFormState } from '../CarFormModal';

interface CarOwnershipSectionProps {
  carForm: CarFormState;
  setCarForm: React.Dispatch<React.SetStateAction<CarFormState>>;
  owners: VehicleOwner[];
}

export default function CarOwnershipSection({
  carForm,
  setCarForm,
  owners,
}: CarOwnershipSectionProps) {
  return (
    <div className="p-3 bg-[#070d19] border border-slate-800/80 rounded-xl space-y-2.5 font-arabic">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-[#c5a059]" /> جهة الملكية وعقد الشريك:
        </span>

        {/* اختيار نوع التبعية */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-[11px] cursor-pointer">
            <input
              type="radio"
              name="ownershipType"
              checked={carForm.ownership === 'company'}
              onChange={() => setCarForm({ ...carForm, ownership: 'company', ownerId: '', ownerName: 'شركة يمن الخليج' })}
              className="accent-[#c5a059]"
            />
            <span>أسطول الشركة</span>
          </label>
          <label className="flex items-center gap-1 text-[11px] cursor-pointer text-[#f3e5ab]">
            <input
              type="radio"
              name="ownershipType"
              checked={carForm.ownership === 'investor'}
              onChange={() => {
                const firstOwner = owners[0];
                setCarForm({
                  ...carForm,
                  ownership: 'investor',
                  ownerId: firstOwner ? firstOwner.id : '',
                  ownerName: firstOwner ? firstOwner.name : 'شريك خارجي',
                  ownerCompensationType: firstOwner?.commissionModel || 'fixed_monthly',
                  ownerAgreedRateEGP: firstOwner?.fixedMonthlyRateEGP || firstOwner?.fixedDailyRateEGP || 30000,
                });
              }}
              className="accent-[#c5a059]"
            />
            <span>مالك / شريك خارجي</span>
          </label>
        </div>
      </div>

      {/* تفاصيل إيجار المالك إذا كانت تابعة لمستثمر خارجي (الخيار ج) */}
      {carForm.ownership === 'investor' && (
        <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-fadeIn">
          <div>
            <label className="block text-slate-400 text-[10px] mb-1">اسم المالك / المستثمر:</label>
            <select
              value={carForm.ownerId}
              onChange={(e) => {
                const sel = owners.find(o => o.id === e.target.value);
                if (sel) {
                  setCarForm({
                    ...carForm,
                    ownerId: sel.id,
                    ownerName: sel.name,
                    ownerCompensationType: sel.commissionModel || carForm.ownerCompensationType,
                    ownerAgreedRateEGP: (sel.commissionModel === 'fixed_monthly' ? sel.fixedMonthlyRateEGP : sel.commissionModel === 'fixed_daily' ? sel.fixedDailyRateEGP : sel.ownerSharePercent) || carForm.ownerAgreedRateEGP,
                  });
                }
              }}
              className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#c5a059]"
            >
              {owners.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
              {owners.length === 0 && (
                <option value="">لا يوجد ملاك مسجلين (أضف من تبويب الملاك)</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] mb-1">نظام حساب المالك (الخيار ج):</label>
            <select
              value={carForm.ownerCompensationType || 'fixed_monthly'}
              onChange={(e) => setCarForm({ ...carForm, ownerCompensationType: e.target.value as any })}
              className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#c5a059]"
            >
              <option value="fixed_monthly">إيجار شهري ثابت للمالك (ج.م)</option>
              <option value="fixed_daily">إيجار يومي مقطوع للمالك (ج.م)</option>
              <option value="percentage">نسبة مئوية من الإيراد (%)</option>
            </select>
          </div>

          <div>
            <label className="block text-[#c5a059] font-bold text-[10px] mb-1">
              {carForm.ownerCompensationType === 'fixed_monthly' ? 'قيمة الإيجار الشهري (ج.م):' :
               carForm.ownerCompensationType === 'fixed_daily' ? 'إيجار المالك اليومي (ج.م):' :
               'نسبة حصة المالك (%):'}
            </label>
            <input
              type="number"
              value={carForm.ownerAgreedRateEGP || 0}
              onChange={(e) => setCarForm({ ...carForm, ownerAgreedRateEGP: parseInt(e.target.value) || 0 })}
              className="w-full bg-[#0b1322] border border-[#c5a059] rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
