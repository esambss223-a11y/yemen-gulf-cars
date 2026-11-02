'use client';

import React from 'react';
import { Calendar, Car, Users, FileText, User, Tag, Activity } from 'lucide-react';
import { AuditLogItem } from '@/types/fleet';

interface AuditItemProps {
  log: AuditLogItem;
  viewMode: 'timeline' | 'table';
}

export type ActionCategory = 'all' | 'bookings' | 'fleet' | 'customers' | 'owners' | 'staff' | 'coupons';

export const getLogCategory = (action: string, details: string): ActionCategory => {
  const text = `${action} ${details}`.toLowerCase();
  if (text.includes('حجز') || text.includes('عقد') || text.includes('تسليم') || text.includes('استلام') || text.includes('تأجير') || text.includes('booking')) {
    return 'bookings';
  }
  if (text.includes('سيار') || text.includes('أسطول') || text.includes('عداد') || text.includes('car') || text.includes('fleet')) {
    return 'fleet';
  }
  if (text.includes('عميل') || text.includes('customer')) {
    return 'customers';
  }
  if (text.includes('مالك') || text.includes('شريك') || text.includes('تصفية') || text.includes('owner')) {
    return 'owners';
  }
  if (text.includes('موظف') || text.includes('صلاحي') || text.includes('دخول') || text.includes('staff')) {
    return 'staff';
  }
  if (text.includes('خصم') || text.includes('كوبون') || text.includes('coupon')) {
    return 'coupons';
  }
  return 'bookings';
};

export const getCategoryMeta = (category: ActionCategory) => {
  switch (category) {
    case 'bookings':
      return { label: 'العقود والحجوزات', icon: Calendar, badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    case 'fleet':
      return { label: 'أسطول السيارات', icon: Car, badge: 'bg-slate-100 text-slate-800 border-slate-300' };
    case 'customers':
      return { label: 'دليل العملاء', icon: Users, badge: 'bg-amber-50 text-amber-900 border-amber-200' };
    case 'owners':
      return { label: 'الملاك والشركاء', icon: FileText, badge: 'bg-indigo-50 text-indigo-900 border-indigo-200' };
    case 'staff':
      return { label: 'فريق العمل', icon: User, badge: 'bg-sky-50 text-sky-900 border-sky-200' };
    case 'coupons':
      return { label: 'العروض والأكواد', icon: Tag, badge: 'bg-purple-50 text-purple-900 border-purple-200' };
    default:
      return { label: 'عملية عامة', icon: Activity, badge: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
};

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'super_admin':
      return { label: 'مدير عام', style: 'bg-slate-900 text-amber-300 border-slate-700 font-bold' };
    case 'rental_agent':
      return { label: 'مسؤول تأجير', style: 'bg-slate-100 text-slate-800 border-slate-300 font-medium' };
    case 'accountant':
      return { label: 'محاسب مالي', style: 'bg-emerald-50 text-emerald-900 border-emerald-200 font-medium' };
    default:
      return { label: role || 'نظام', style: 'bg-slate-100 text-slate-700 border-slate-200 font-medium' };
  }
};

export default function AuditItem({ log, viewMode }: AuditItemProps) {
  const category = getLogCategory(log.action, log.details);
  const meta = getCategoryMeta(category);
  const role = getRoleBadge(log.staffRole);
  const Icon = meta.icon;

  if (viewMode === 'table') {
    return (
      <tr className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs">
        <td className="p-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap" dir="ltr">
          {log.timestamp}
        </td>
        <td className="p-2.5 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <strong className="text-slate-900 font-bold">{log.staffName}</strong>
            <span className={`text-[10px] px-1.5 py-0.2 rounded border ${role.style}`}>
              {role.label}
            </span>
          </div>
        </td>
        <td className="p-2.5 whitespace-nowrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border ${meta.badge}`}>
            <Icon size={10} />
            <span>{meta.label}</span>
          </span>
        </td>
        <td className="p-2.5">
          <strong className="text-slate-900 font-bold block">{log.action}</strong>
          <span className="text-[11px] text-slate-500 block truncate max-w-md mt-0.5">{log.details}</span>
        </td>
      </tr>
    );
  }

  return (
    <div className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all flex items-start gap-3 text-xs">
      {/* Category Icon Capsule */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${meta.badge}`}>
        <Icon size={14} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap pb-1.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <strong className="text-slate-900 font-bold text-xs">{log.staffName}</strong>
            <span className={`text-[9px] px-1.5 py-0.2 rounded border ${role.style}`}>
              {role.label}
            </span>
            <span className={`text-[10px] px-2 py-0.2 rounded border font-semibold ${meta.badge}`}>
              {meta.label}
            </span>
          </div>

          <span className="font-mono text-[10px] text-slate-400" dir="ltr">
            {log.timestamp}
          </span>
        </div>

        <div className="mt-1.5 space-y-0.5">
          <strong className="text-slate-900 block font-bold text-xs">{log.action}</strong>
          <p className="text-[11px] text-slate-600 leading-relaxed font-sans">{log.details}</p>
        </div>
      </div>
    </div>
  );
}
