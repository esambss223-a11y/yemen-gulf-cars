'use client';

import React from 'react';
import { StaffUser, UserRole } from '@/types/fleet';
import { Phone, MessageSquare, Pencil, Trash2 } from 'lucide-react';

interface StaffCardProps {
  staff: StaffUser;
  isCurrentUser: boolean;
  onOpenEdit: (staff: StaffUser) => void;
  onDelete: (staffId: string, staffName: string) => void;
}

const roleMap: Record<UserRole, { label: string; badgeClass: string; desc: string }> = {
  super_admin: {
    label: 'مدير عام',
    badgeClass: 'bg-slate-900 text-amber-300 border-slate-700 font-extrabold',
    desc: 'تحكم وصلاحية كاملة على كافة أقسام الأسطول، العقود، الحسابات، والإعدادات',
  },
  rental_agent: {
    label: 'موظف تأجير واستقبال',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
    desc: 'تسليم واستلام السيارات، إبرام وطباعة العقود، وإدارة سجلات العملاء والحجوزات',
  },
  accountant: {
    label: 'محاسب مالي',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
    desc: 'الرقابة المالية، كشوفات تصفية أرباح الشركاء، ومراجعة تقارير وسندات الإيرادات',
  },
  fleet_entry: {
    label: 'مسؤول إدخال أسطول',
    badgeClass: 'bg-sky-50 text-sky-900 border-sky-200 font-bold',
    desc: 'إدخال وتحديث بيانات السيارات والأسطول، التأمينات، والعدادات فقط دون العقود أو الحسابات',
  },
};

export default function StaffCard({
  staff,
  isCurrentUser,
  onOpenEdit,
  onDelete,
}: StaffCardProps) {
  const roleInfo = roleMap[staff.role] || roleMap.rental_agent;
  const whatsappNumber = (staff.phone || '').replace(/[^0-9]/g, '');

  return (
    <article className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all p-3.5 space-y-3 flex flex-col justify-between">
      <div>
        {/* Top Bar: Role badge & Status dot */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] border ${roleInfo.badgeClass}`}>
            {roleInfo.label}
          </span>

          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${
            staff.active ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${staff.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {staff.active ? 'نشط ومصرّح' : 'حساب معطل'}
          </span>
        </div>

        {/* Profile Header */}
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-xs flex-shrink-0">
            {staff.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <strong className="text-xs sm:text-sm font-extrabold text-slate-900 block truncate">
                {staff.name}
              </strong>
              {isCurrentUser && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold border border-amber-200 flex-shrink-0">
                  أنت
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
              <span>اسم الدخول:</span>
              <code className="font-mono text-slate-800 font-bold text-[10px] bg-slate-100 px-1 py-0.2 rounded">
                @{staff.username}
              </code>
            </div>
          </div>
        </div>

        {/* Role Scope */}
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 mt-2.5 text-[11px] text-slate-600 leading-relaxed">
          <span className="text-slate-400 block text-[9px] font-medium mb-0.5">نطاق الصلاحيات:</span>
          <span>{roleInfo.desc}</span>
        </div>

        {/* Phone Strip */}
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200/70 mt-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <Phone size={12} className="text-slate-400 flex-shrink-0" />
            <a href={`tel:${staff.phone}`} className="font-mono text-[11px] font-bold text-slate-800 hover:underline" dir="ltr">
              {staff.phone || 'غير مسجل'}
            </a>
          </div>

          {staff.phone && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <a
                href={`tel:${staff.phone}`}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
                title="اتصال هاتفياً"
              >
                <Phone size={11} />
              </a>
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                  title="مراسلة واتساب"
                >
                  <MessageSquare size={11} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Operations */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpenEdit(staff)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          title="تعديل بيانات وصلاحيات الموظف"
        >
          <Pencil size={11} />
          <span>تعديل الصلاحية</span>
        </button>

        {!isCurrentUser && (
          <button
            type="button"
            onClick={() => onDelete(staff.id, staff.name)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 text-xs transition-colors cursor-pointer"
            title="حذف حساب الموظف نهائياً"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </article>
  );
}
