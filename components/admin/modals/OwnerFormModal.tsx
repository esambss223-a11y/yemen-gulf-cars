'use client';

import React from 'react';
import { Users, X } from 'lucide-react';
import { VehicleOwner } from '@/types/fleet';

export interface OwnerFormState {
  name: string;
  phone: string;
  bankAccount: string;
  commissionModel: VehicleOwner['commissionModel'];
  ownerSharePercent: number;
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
            <label className="block text-slate-300 font-semibold mb-1">رقم الهاتف / الواتساب:</label>
            <input
              type="text"
              required
              value={ownerForm.phone}
              onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
              placeholder="مثال: +966 50 123 4567"
              className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
            />
          </div>

          <div>
            <label className="block text-[#c5a059] font-bold mb-1">نسبة أرباح المالك من الإيراد (%):</label>
            <input
              type="number"
              required
              min="1"
              max="99"
              value={ownerForm.ownerSharePercent}
              onChange={(e) => setOwnerForm({ ...ownerForm, ownerSharePercent: parseInt(e.target.value) || 75 })}
              className="w-full bg-[#0e172a] border border-[#c5a059] rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              حصة شركة يمن الخليج التلقائية ستكون: <strong className="text-emerald-400 font-mono">{100 - ownerForm.ownerSharePercent}%</strong>
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">ملاحظات أو رقم الحساب البنكي:</label>
            <input
              type="text"
              value={ownerForm.notes}
              onChange={(e) => setOwnerForm({ ...ownerForm, notes: e.target.value })}
              placeholder="تفاصيل العقد أو الآيبان"
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
