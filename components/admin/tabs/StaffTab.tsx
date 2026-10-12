'use client';

import React from 'react';
import { UserCheck, UserPlus, Edit3, Trash2 } from 'lucide-react';
import { StaffUser } from '@/types/fleet';

interface StaffTabProps {
  staffList: StaffUser[];
  onOpenAddStaff: () => void;
  onOpenEditStaff: (staff: StaffUser) => void;
  onDeleteStaff: (staffId: string, staffName: string) => void;
}

export default function StaffTab({
  staffList,
  onOpenAddStaff,
  onOpenEditStaff,
  onDeleteStaff,
}: StaffTabProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-[#0b1324] border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#c5a059]" /> إدارة فريق العمل وصلاحيات المستخدمين
            </h4>
            <p className="text-xs text-slate-400">إضافة موظفين، تحديد الصلاحيات، وكلمات المرور الخاصة بهم</p>
          </div>
          <button
            onClick={onOpenAddStaff}
            className="px-4 py-2 bg-[#c5a059] hover:bg-[#d4af37] text-black font-black text-xs rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> إضافة موظف جديد
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((staff) => (
            <div key={staff.id} className="p-4 bg-[#0e172a] rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    staff.role === 'super_admin' ? 'bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40' :
                    staff.role === 'rental_agent' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {staff.role === 'super_admin' ? '👑 مدير عام' :
                     staff.role === 'rental_agent' ? '👤 موظف تأجير' : '💼 محاسب مالي'}
                  </span>

                  <span className="text-[10px] text-emerald-400 font-bold">نشط ✓</span>
                </div>

                <h5 className="font-bold text-white text-sm">{staff.name}</h5>
                <p className="text-xs text-slate-400 font-mono mt-1">اسم الدخول: <strong className="text-slate-200">{staff.username}</strong></p>
                <p className="text-xs text-slate-400 font-mono">الهاتف: <strong className="text-slate-200">{staff.phone}</strong></p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => onOpenEditStaff(staff)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-[#c5a059] hover:text-black rounded-lg text-xs font-bold text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> تعديل الصلاحية
                </button>

                {staff.role !== 'super_admin' && (
                  <button
                    onClick={() => onDeleteStaff(staff.id, staff.name)}
                    className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="حذف الموظف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
