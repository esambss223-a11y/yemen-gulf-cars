'use client';

import React from 'react';
import { UserCheck, X } from 'lucide-react';
import { StaffUser, UserRole } from '@/types/fleet';

export interface StaffFormState {
  name: string;
  username: string;
  password: string;
  role: UserRole;
  phone: string;
  active: boolean;
}

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStaff: StaffUser | null;
  staffForm: StaffFormState;
  setStaffForm: React.Dispatch<React.SetStateAction<StaffFormState>>;
  onSubmit: (e: React.FormEvent) => void;
}

export default function StaffFormModal({
  isOpen,
  onClose,
  editingStaff,
  staffForm,
  setStaffForm,
  onSubmit,
}: StaffFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b1324] border border-blue-500/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" /> {editingStaff ? `تعديل الموظف: ${editingStaff.name}` : 'إضافة موظف جديد للنظام'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">اسم الموظف بالكامل:</label>
            <input
              type="text"
              required
              value={staffForm.name}
              onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
              placeholder="مثال: محمد علي العتيبي"
              className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">اسم المستخدم (للدخول):</label>
            <input
              type="text"
              required
              autoComplete="off"
              spellCheck={false}
              value={staffForm.username}
              onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
              placeholder="مثال: mohamed"
              className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">كلمة المرور:</label>
            <input
              type="password"
              required={!editingStaff}
              minLength={8}
              autoComplete="new-password"
              value={staffForm.password || ''}
              onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
              placeholder={editingStaff ? 'اتركها فارغة إذا لم ترغب بتغييرها' : '8 أحرف على الأقل'}
              className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">الدور والصلاحية الوظيفية:</label>
            <select
              value={staffForm.role}
              onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as UserRole })}
              className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
            >
              <option value="rental_agent">👤 موظف استقبال وتأجير (تسليم، استلام، طباعة عقود)</option>
              <option value="accountant">💼 محاسب مالي (كشوفات الملاك، مراجعة الفواتير)</option>
              <option value="super_admin">👑 مدير عام (صلاحية كاملة على كل شيء)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">رقم الهاتف:</label>
            <input
              type="text"
              value={staffForm.phone}
              onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
              placeholder="01012345678"
              className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
            />
          </div>

          {editingStaff && (
            <label className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={staffForm.active}
                onChange={(e) => setStaffForm({ ...staffForm, active: e.target.checked })}
                className="accent-emerald-500"
              />
              الحساب نشط ويمكنه تسجيل الدخول
            </label>
          )}

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
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
            >
              {editingStaff ? 'حفظ التعديلات' : 'إضافة الموظف'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
