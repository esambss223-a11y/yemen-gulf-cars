'use client';

import React from 'react';
import { StaffUser, UserRole } from '@/types/fleet';
import { Phone, MessageSquare, Pencil, Trash2 } from 'lucide-react';

interface StaffRowProps {
  staff: StaffUser;
  isCurrentUser: boolean;
  onOpenEdit: (staff: StaffUser) => void;
  onDelete: (staffId: string, staffName: string) => void;
}

const roleMap: Record<UserRole, { label: string; badgeClass: string }> = {
  super_admin: {
    label: 'مدير عام',
    badgeClass: 'bg-slate-900 text-amber-300 border-slate-700 font-extrabold',
  },
  rental_agent: {
    label: 'موظف تأجير',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
  },
  accountant: {
    label: 'محاسب مالي',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
  },
  fleet_entry: {
    label: 'مسؤول إدخال أسطول',
    badgeClass: 'bg-sky-50 text-sky-900 border-sky-200 font-bold',
  },
};

export default function StaffRow({
  staff,
  isCurrentUser,
  onOpenEdit,
  onDelete,
}: StaffRowProps) {
  const roleInfo = roleMap[staff.role] || roleMap.rental_agent;
  const whatsappNumber = (staff.phone || '').replace(/[^0-9]/g, '');

  return (
    <div className="flex items-center justify-between p-2.5 gap-2 md:gap-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-2xs transition-all text-xs">
      {/* 1. Name & Username */}
      <div className="flex items-center gap-2.5 min-w-[160px] flex-1">
        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-extrabold text-xs flex-shrink-0">
          {staff.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <strong className="text-slate-900 block truncate font-bold text-xs">
              {staff.name}
            </strong>
            {isCurrentUser && (
              <span className="text-[9px] px-1 rounded bg-amber-100 text-amber-900 font-bold">أنت</span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 block truncate font-mono">
            @{staff.username}
          </span>
        </div>
      </div>

      {/* 2. Contact Phone & WhatsApp */}
      <div className="flex-shrink-0 flex items-center gap-1.5">
        <a href={`tel:${staff.phone}`} className="font-mono text-[11px] font-bold text-slate-800 hover:underline" dir="ltr">
          {staff.phone || 'بدون هاتف'}
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

      {/* 3. Role Badge */}
      <div className="flex-shrink-0">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] border ${roleInfo.badgeClass}`}>
          {roleInfo.label}
        </span>
      </div>

      {/* 4. Active Status */}
      <div className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold flex-shrink-0">
        <span className={`w-1.5 h-1.5 rounded-full ${staff.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        <span className={staff.active ? 'text-emerald-700' : 'text-rose-700'}>
          {staff.active ? 'نشط' : 'معطل'}
        </span>
      </div>

      {/* 5. Operations */}
      <div className="flex items-center gap-1.5 flex-shrink-0 mr-auto lg:mr-0">
        <button
          type="button"
          onClick={() => onOpenEdit(staff)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          title="تعديل الصلاحيات"
        >
          <Pencil size={11} />
          <span>تعديل</span>
        </button>

        {!isCurrentUser && (
          <button
            type="button"
            onClick={() => onDelete(staff.id, staff.name)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 text-xs transition-colors cursor-pointer"
            title="حذف حساب الموظف"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
}
