'use client';

import React from 'react';
import { UserCheck, UserPlus, Edit3, Trash2, Shield, User } from 'lucide-react';
import { StaffUser } from '@/types/fleet';

interface StaffTabProps {
  staffList: StaffUser[];
  staffListError: string;
  currentStaffId: string;
  onOpenAddStaff: () => void;
  onOpenEditStaff: (staff: StaffUser) => void;
  onDeleteStaff: (staffId: string, staffName: string) => void;
}

export default function StaffTab({
  staffList,
  staffListError,
  currentStaffId,
  onOpenAddStaff,
  onOpenEditStaff,
  onDeleteStaff,
}: StaffTabProps) {
  return (
    <div className="admin-section admin-section-staff space-y-4 animate-fadeIn">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
        {staffListError && (
          <div role="alert" className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {staffListError} تم إخفاء القائمة المحلية القديمة.
          </div>
        )}
        
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
        {staffList.length === 0 && !staffListError ? (
          <p className="py-8 text-center text-sm text-slate-500">لا يوجد موظفون مسجلون في قاعدة البيانات.</p>
        ) : (
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

                  <span className={`text-[10px] font-bold flex items-center gap-1 ${staff.active ? 'text-emerald-600' : 'text-rose-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${staff.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {staff.active ? 'نشط' : 'غير نشط'}
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

                {staff.id !== currentStaffId && (
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
        )}
      </div>
    </div>
  );
}
