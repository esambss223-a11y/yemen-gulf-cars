'use client';

import React from 'react';
import { Shield, Wrench } from 'lucide-react';
import { CarFormState } from '../CarFormModal';

interface CarLicenseAndServiceSectionProps {
  carForm: CarFormState;
  setCarForm: React.Dispatch<React.SetStateAction<CarFormState>>;
}

export default function CarLicenseAndServiceSection({
  carForm,
  setCarForm,
}: CarLicenseAndServiceSectionProps) {
  return (
    <div className="p-3 bg-[#070d19] border border-slate-800/80 rounded-xl space-y-2.5 font-arabic">
      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-amber-400" /> التراخيص، مدة التعاقد، والصيانة الدورية:
      </span>

      {/* سطر 1: رخصة السيارة وموعد التجديد */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="bg-[#0b1322] p-2.5 rounded-lg border border-slate-800">
          <label className="block text-slate-300 text-[10px] font-semibold mb-1">تاريخ انتهاء رخصة السيارة:</label>
          <input
            type="date"
            value={carForm.licenseExpiryDate || ''}
            onChange={(e) => setCarForm({ ...carForm, licenseExpiryDate: e.target.value })}
            className="w-full bg-[#070d19] border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs font-mono focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div className="bg-[#0b1322] p-2.5 rounded-lg border border-slate-800">
          <label className="block text-slate-300 text-[10px] font-semibold mb-1">موعد تجديد الرخصة وفحص المرور:</label>
          <input
            type="date"
            value={carForm.licenseRenewalDate || ''}
            onChange={(e) => setCarForm({ ...carForm, licenseRenewalDate: e.target.value })}
            className="w-full bg-[#070d19] border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs font-mono focus:outline-none focus:border-[#c5a059]"
          />
        </div>
      </div>

      {/* سطر 2: مدة التعاقد مع المالك */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="bg-[#0b1322] p-2.5 rounded-lg border border-slate-800">
          <label className="block text-slate-300 text-[10px] font-semibold mb-1">تاريخ بدء تعاقد تشغيل السيارة:</label>
          <input
            type="date"
            value={carForm.contractStartDate || ''}
            onChange={(e) => setCarForm({ ...carForm, contractStartDate: e.target.value })}
            className="w-full bg-[#070d19] border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs font-mono focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div className="bg-[#0b1322] p-2.5 rounded-lg border border-slate-800">
          <label className="block text-slate-300 text-[10px] font-semibold mb-1">تاريخ انتهاء تعاقد السيارة:</label>
          <input
            type="date"
            value={carForm.contractEndDate || ''}
            onChange={(e) => setCarForm({ ...carForm, contractEndDate: e.target.value })}
            className="w-full bg-[#070d19] border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs font-mono focus:outline-none focus:border-[#c5a059]"
          />
        </div>
      </div>

      {/* سطر 3: الصيانة الدورية (يدوي - يحدده الموظف بالكامل) */}
      <div className="bg-[#0b1322] p-2.5 rounded-lg border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
            <Wrench className="w-3 h-3 text-[#c5a059]" /> الصيانة الدورية (تحديد يدوي للموظف):
          </span>
          <span className="text-[10px] text-slate-400">سجل العداد المستهدف والمسؤول</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="block text-slate-400 text-[10px] mb-1">عداد الصيانة القادمة (KM):</label>
            <input
              type="number"
              value={carForm.nextServiceKm || 0}
              onChange={(e) => setCarForm({ ...carForm, nextServiceKm: parseInt(e.target.value) || 0 })}
              placeholder="مثال: 25000"
              className="w-full bg-[#070d19] border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-mono focus:outline-none focus:border-[#c5a059]"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] mb-1">تاريخ الصيانة المتوقع:</label>
            <input
              type="date"
              value={carForm.nextServiceDate || ''}
              onChange={(e) => setCarForm({ ...carForm, nextServiceDate: e.target.value })}
              className="w-full bg-[#070d19] border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-mono focus:outline-none focus:border-[#c5a059]"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] mb-1">المسؤول عن تكلفة الصيانة:</label>
            <select
              value={carForm.serviceResponsibleParty || 'company'}
              onChange={(e) => setCarForm({ ...carForm, serviceResponsibleParty: e.target.value as any })}
              className="w-full bg-[#070d19] border border-slate-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-[#c5a059]"
            >
              <option value="company">على حساب الشركة</option>
              <option value="owner">على حساب المالك</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
