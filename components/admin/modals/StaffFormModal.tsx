'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { UserCheck, X, Save, UserRound, KeyRound, Phone, ShieldCheck, Briefcase } from 'lucide-react';
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
  const [mounted, setMounted] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onCloseRef.current();
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalJSX = (
    <div 
      className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden font-arabic text-xs"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-form-title"
      >
        {/* Header - Unified Deep Slate Luxury Automotive Tone */}
        <header className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-amber-300 border border-slate-700 flex items-center justify-center font-bold">
              <UserCheck size={16} />
            </div>
            <div>
              <h3 id="staff-form-title" className="text-sm font-bold text-white block">
                {editingStaff ? `تعديل صلاحيات: ${editingStaff.name}` : 'إضافة موظف جديد للنظام'}
              </h3>
              <span className="text-[10px] text-slate-400 block">
                بيانات الدخول، الدور الوظيفي، وتحديد مستوى الصلاحيات
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg grid place-items-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X size={18} />
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={onSubmit} id="staff-edit-form" className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1 text-[11px]">اسم الموظف بالكامل *</label>
            <input
              type="text"
              required
              value={staffForm.name}
              onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
              placeholder="مثال: أحمد عبد الله اليماني"
              className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">اسم المستخدم للدخول *</label>
              <input
                type="text"
                required
                autoComplete="off"
                spellCheck={false}
                value={staffForm.username}
                onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                placeholder="مثال: ahmed"
                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs dir-ltr text-right"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                {editingStaff ? 'تغيير كلمة المرور' : 'كلمة المرور *'}
              </label>
              <input
                type="password"
                required={!editingStaff}
                minLength={8}
                autoComplete="new-password"
                value={staffForm.password || ''}
                onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                placeholder={editingStaff ? 'اتركها فارغة للإبقاء عليها' : '8 أحرف على الأقل'}
                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 text-[11px]">الدور والصلاحية الوظيفية *</label>
            <select
              value={staffForm.role}
              onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as UserRole })}
              className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
            >
              <option value="rental_agent">👤 موظف تأجير واستقبال (تسليم، استلام، طباعة عقود، وحجوزات)</option>
              <option value="accountant">💼 محاسب مالي (الرقابة المالية والفواتير ومراجعة الإيرادات)</option>
              <option value="fleet_entry">🚗 مسؤول إدخال أسطول السيارات (إدخال وتحديث السيارات والتأمينات فقط)</option>
              <option value="super_admin">👑 مدير عام (صلاحية كاملة وحصرية على الملاك والأسطول والعقود)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 text-[11px]">رقم الهاتف للتواصل</label>
            <input
              type="text"
              value={staffForm.phone}
              onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
              placeholder="0100 000 0000"
              className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs dir-ltr text-right"
            />
          </div>

          {editingStaff && (
            <div className="pt-1">
              <label className="flex items-center gap-2 text-slate-700 font-bold text-xs cursor-pointer p-2 rounded-lg bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  checked={staffForm.active}
                  onChange={(e) => setStaffForm({ ...staffForm, active: e.target.checked })}
                  className="w-4 h-4 rounded text-slate-900 accent-slate-900"
                />
                <span>الحساب نشط ويُسمح له بتسجيل الدخول</span>
              </label>
            </div>
          )}
        </form>

        {/* Sticky Footer */}
        <footer className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
          >
            إلغاء
          </button>
          
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById('staff-edit-form') as HTMLFormElement | null;
              if (form) form.requestSubmit();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Save size={13} />
            <span>{editingStaff ? 'حفظ تعديلات الموظف' : 'إضافة الموظف'}</span>
          </button>
        </footer>

      </div>
    </div>
  );

  if (typeof document !== 'undefined' && mounted) {
    return createPortal(modalJSX, document.body);
  }

  return modalJSX;
}
