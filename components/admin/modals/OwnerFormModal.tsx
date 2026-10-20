'use client';

import React from 'react';
import { Users, X } from 'lucide-react';
import { VehicleOwner } from '@/types/fleet';

export interface OwnerFormState {
  name: string;
  phone: string;
  nationalId?: string;
  bankAccount: string;
  commissionModel: VehicleOwner['commissionModel'];
  ownerSharePercent: number;
  fixedMonthlyRateEGP: number;
  fixedDailyRateEGP: number;
  monthlyPayoutDay?: number;
  notes: string;
}

interface OwnerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingOwner: VehicleOwner | null;
  ownerForm: OwnerFormState;
  setOwnerForm: React.Dispatch<React.SetStateAction<OwnerFormState>>;
  onSubmit: (e: React.FormEvent) => void;
}

export default function OwnerFormModal({
  isOpen,
  onClose,
  editingOwner,
  ownerForm,
  setOwnerForm,
  onSubmit,
}: OwnerFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b1324] border border-[#c5a059]/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#c5a059]" /> {editingOwner ? `تعديل بيانات: ${editingOwner.name}` : 'إضافة مالك/مستثمر جديد'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">اسم المالك / المستثمر:</label>
              <input
                type="text"
                required
                value={ownerForm.name}
                onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })}
                placeholder="مثال: الشيخ عبد الله بن ناصر"
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">الرقم القومي / جواز السفر:</label>
              <input
                type="text"
                value={ownerForm.nationalId || ''}
                onChange={(e) => setOwnerForm({ ...ownerForm, nationalId: e.target.value })}
                placeholder="14 رقم للبطاقة المصرية أو رقم الجواز"
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#c5a059]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">رقم الهاتف / الواتساب:</label>
              <input
                type="text"
                required
                value={ownerForm.phone}
                onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
                placeholder="مثال: +20 100 123 4567"
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">يوم صرف المرتب الشهري:</label>
              <input
                type="number"
                min="1"
                max="31"
                value={ownerForm.monthlyPayoutDay || 1}
                onChange={(e) => setOwnerForm({ ...ownerForm, monthlyPayoutDay: parseInt(e.target.value) || 1 })}
                placeholder="يوم 1 أو 5 من كل شهر"
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#c5a059]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">نظام المحاسبة والعقد (الخيار ج):</label>
            <select
              value={ownerForm.commissionModel || 'fixed_monthly'}
              onChange={(e) => setOwnerForm({ ...ownerForm, commissionModel: e.target.value as any })}
              className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
            >
              <option value="fixed_monthly">إيجار شهري ثابت للمالك (عقد تشغيل شهري)</option>
              <option value="fixed_daily">إيجار يومي مقطوع للمالك (عن كل يوم تأجير فعلي)</option>
              <option value="percentage">نسبة مئوية من إيراد التأجير (%)</option>
            </select>
          </div>

          {ownerForm.commissionModel === 'fixed_monthly' && (
            <div className="animate-fadeIn">
              <label className="block text-[#c5a059] font-bold mb-1">قيمة الإيجار الشهري للمالك (ج.م):</label>
              <input
                type="number"
                required
                value={ownerForm.fixedMonthlyRateEGP || 0}
                onChange={(e) => setOwnerForm({ ...ownerForm, fixedMonthlyRateEGP: parseInt(e.target.value) || 0 })}
                placeholder="مثال: 35000"
                className="w-full bg-[#0e172a] border border-[#c5a059] rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">يُدفع للمالك شهرياً بصفة ثابتة بغض النظر عن نسبة التشغيل.</p>
            </div>
          )}

          {ownerForm.commissionModel === 'fixed_daily' && (
            <div className="animate-fadeIn">
              <label className="block text-[#c5a059] font-bold mb-1">قيمة الإيجار اليومي للمالك (ج.م):</label>
              <input
                type="number"
                required
                value={ownerForm.fixedDailyRateEGP || 0}
                onChange={(e) => setOwnerForm({ ...ownerForm, fixedDailyRateEGP: parseInt(e.target.value) || 0 })}
                placeholder="مثال: 1200"
                className="w-full bg-[#0e172a] border border-[#c5a059] rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">يُحسب للمالك عن كل يوم يتم تأجير السيارة فيه للعميل.</p>
            </div>
          )}

          {ownerForm.commissionModel === 'percentage' && (
            <div className="animate-fadeIn">
              <label className="block text-[#c5a059] font-bold mb-1">نسبة أرباح المالك من الإيراد (%):</label>
              <input
                type="number"
                required
                min="1"
                max="99"
                value={ownerForm.ownerSharePercent || 75}
                onChange={(e) => setOwnerForm({ ...ownerForm, ownerSharePercent: parseInt(e.target.value) || 75 })}
                className="w-full bg-[#0e172a] border border-[#c5a059] rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                حصة شركة يمن الخليج التلقائية ستكون: <strong className="text-emerald-400 font-mono">{100 - (ownerForm.ownerSharePercent || 75)}%</strong>
              </p>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">ملاحظات أو رقم الحساب البنكي / إنستاباي:</label>
            <input
              type="text"
              value={ownerForm.notes}
              onChange={(e) => setOwnerForm({ ...ownerForm, notes: e.target.value })}
              placeholder="تفاصيل العقد أو الآيبان أو محفظة إنستاباي"
              className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-[#c5a059] hover:bg-[#d4af37] text-black font-bold cursor-pointer"
            >
              {editingOwner ? 'حفظ التعديلات' : 'إضافة المالك'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
