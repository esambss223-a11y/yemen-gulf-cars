'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Users, X, Save, UserRound, Phone, CreditCard, DollarSign, Calendar, FileText } from 'lucide-react';
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
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-form-title"
      >
        {/* Header - Unified Deep Slate Luxury Automotive Tone */}
        <header className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-amber-300 border border-slate-700 flex items-center justify-center font-bold">
              <UserRound size={16} />
            </div>
            <div>
              <h3 id="owner-form-title" className="text-sm font-bold text-white block">
                {editingOwner ? `تعديل بيانات الشريك: ${editingOwner.name}` : 'تسجيل مالك / شريك استثماري جديد'}
              </h3>
              <span className="text-[10px] text-slate-400 block">
                بيانات التعاقد، الحسابات البنكية، ونموذج احتساب وصرف الأرباح
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

        {/* Scrollable Form Body */}
        <form onSubmit={onSubmit} id="owner-edit-form" className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3.5 text-xs">
          
          {/* الاسم والرقم القومي */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">اسم المالك / المستثمر *</label>
              <input
                type="text"
                required
                value={ownerForm.name}
                onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })}
                placeholder="اسم الشريك أو الشركة المالكة"
                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">الرقم القومي / جواز السفر</label>
              <input
                type="text"
                value={ownerForm.nationalId || ''}
                onChange={(e) => setOwnerForm({ ...ownerForm, nationalId: e.target.value })}
                placeholder="الرقم القومي أو الجواز"
                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
              />
            </div>
          </div>

          {/* الهاتف والحساب البنكي */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">رقم الهاتف / الواتساب *</label>
              <input
                type="text"
                required
                value={ownerForm.phone}
                onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
                placeholder="+20 100 000 0000"
                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs dir-ltr text-right"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">الحساب البنكي / التحويل</label>
              <input
                type="text"
                value={ownerForm.bankAccount || ''}
                onChange={(e) => setOwnerForm({ ...ownerForm, bankAccount: e.target.value })}
                placeholder="اسم البنك ورقم الحساب أو IBAN"
                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
              />
            </div>
          </div>

          {/* نموذج احتساب العائد المالي */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <span className="font-bold text-slate-800 text-xs block">
              نموذج العقد وتقاسم العوائد المالية:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-600 font-medium mb-1 text-[10px]">نوع ونموذج العقد</label>
                <select
                  value={ownerForm.commissionModel}
                  onChange={(e) => setOwnerForm({ ...ownerForm, commissionModel: e.target.value as VehicleOwner['commissionModel'] })}
                  className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                >
                  <option value="fixed_monthly">مرتب شهري ثابت لكل سيارة</option>
                  <option value="percentage">نسبة مئوية من صافي إيراد التأجير</option>
                  <option value="fixed_daily">إيجار يومي مقطوع</option>
                </select>
              </div>

              {ownerForm.commissionModel === 'fixed_monthly' && (
                <div>
                  <label className="block text-slate-600 font-medium mb-1 text-[10px]">المرتب الشهري الثابت (ج.م)</label>
                  <input
                    type="number"
                    value={ownerForm.fixedMonthlyRateEGP || 35000}
                    onChange={(e) => setOwnerForm({ ...ownerForm, fixedMonthlyRateEGP: Number(e.target.value) || 0 })}
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono font-bold text-xs"
                  />
                </div>
              )}

              {ownerForm.commissionModel === 'percentage' && (
                <div>
                  <label className="block text-slate-600 font-medium mb-1 text-[10px]">نسبة المالك من الإيراد (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={ownerForm.ownerSharePercent || 75}
                    onChange={(e) => setOwnerForm({ ...ownerForm, ownerSharePercent: Number(e.target.value) || 75 })}
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono font-bold text-xs"
                  />
                </div>
              )}

              {ownerForm.commissionModel === 'fixed_daily' && (
                <div>
                  <label className="block text-slate-600 font-medium mb-1 text-[10px]">المقطوع اليومي الثابت (ج.م)</label>
                  <input
                    type="number"
                    value={ownerForm.fixedDailyRateEGP || 1200}
                    onChange={(e) => setOwnerForm({ ...ownerForm, fixedDailyRateEGP: Number(e.target.value) || 0 })}
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono font-bold text-xs"
                  />
                </div>
              )}
            </div>

            {ownerForm.commissionModel === 'fixed_monthly' && (
              <div>
                <label className="block text-slate-600 font-medium mb-1 text-[10px]">يوم استحقاق وصرف المرتب الشهري من كل شهر</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={ownerForm.monthlyPayoutDay || 1}
                  onChange={(e) => setOwnerForm({ ...ownerForm, monthlyPayoutDay: parseInt(e.target.value) || 1 })}
                  className="w-32 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono text-xs"
                />
              </div>
            )}
          </div>

          {/* ملاحظات وشروط خاصة */}
          <div>
            <label className="block text-slate-700 font-bold mb-1 text-[11px]">ملاحظات وشروط خاصة بالتعاقد</label>
            <textarea
              rows={2}
              value={ownerForm.notes || ''}
              onChange={(e) => setOwnerForm({ ...ownerForm, notes: e.target.value })}
              placeholder="شروط الصيانة، مواعيد السداد، تفاصيل الحساب البنكي..."
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
            />
          </div>

        </form>

        {/* Sticky Footer Actions */}
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
              const form = document.getElementById('owner-edit-form') as HTMLFormElement | null;
              if (form) form.requestSubmit();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Save size={13} />
            <span>{editingOwner ? 'حفظ تعديلات المالك' : 'تسجيل المالك'}</span>
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
