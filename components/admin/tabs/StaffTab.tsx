'use client';

import React from 'react';
import { UserCheck, UserPlus, Edit3, Trash2, Shield, User } from 'lucide-react';
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
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
        
        {/* الترويسة */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-500" /> إدارة فريق العمل وصلاحيات المستخدمين
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">تحديد الصلاحيات الإدارية، الحسابات المصرحة، وكلمات المرور</p>
          </div>
          <button
            onClick={onOpenAddStaff}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> إضافة موظف جديد
          </button>
        </div>

        {/* بطاقات الموظفين */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((staff) => (
            <div 
              key={staff.id} 
              className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 hover:border-amber-400/40 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                    staff.role === 'super_admin' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    staff.role === 'rental_agent' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                    'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {staff.role === 'super_admin' ? '👑 مدير عام' :
                     staff.role === 'rental_agent' ? '👤 موظف تأجير' : '💼 محاسب مالي'}
                  </span>

                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> نشط
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{staff.name}</h5>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">اسم الدخول: <strong className="text-slate-700">{staff.username}</strong></p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                  <span>رقم الهاتف: </span>
                  <span className="font-mono text-slate-700 font-bold">{staff.phone}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <button
                  onClick={() => onOpenEditStaff(staff)}
                  className="px-3 py-1.5 bg-white hover:bg-[#081225] hover:text-amber-400 rounded-lg text-xs font-bold text-slate-700 transition-colors flex items-center gap-1 cursor-pointer border border-slate-200 shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" /> تعديل الصلاحية
                </button>

                {staff.role !== 'super_admin' && (
                  <button
                    onClick={() => onDeleteStaff(staff.id, staff.name)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
