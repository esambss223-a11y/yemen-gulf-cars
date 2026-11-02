'use client';

import React, { useState, useMemo } from 'react';
import { 
  UserCheck, 
  UserPlus, 
  ShieldCheck, 
  UserRound, 
  Briefcase, 
  Search, 
  X, 
  LayoutGrid, 
  List 
} from 'lucide-react';
import { StaffUser, UserRole } from '@/types/fleet';
import StaffCard from './StaffCard';
import StaffRow from './StaffRow';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter staff
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        s.name.toLowerCase().includes(term) ||
        s.username.toLowerCase().includes(term) ||
        (s.phone && s.phone.includes(term));

      const matchesRole = roleFilter === 'all' || s.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [staffList, searchTerm, roleFilter]);

  // Fast Metrics
  const activeCount = useMemo(() => staffList.filter((s) => s.active).length, [staffList]);
  const superAdminCount = useMemo(() => staffList.filter((s) => s.role === 'super_admin').length, [staffList]);
  const agentCount = useMemo(() => staffList.filter((s) => s.role === 'rental_agent').length, [staffList]);
  const accountantCount = useMemo(() => staffList.filter((s) => s.role === 'accountant').length, [staffList]);
  const fleetEntryCount = useMemo(() => staffList.filter((s) => s.role === 'fleet_entry').length, [staffList]);

  return (
    <div className="space-y-3 max-w-[1600px] mx-auto text-slate-800 font-arabic" dir="rtl">
      {/* 1. Header & Live Team Telemetry */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">فريق العمل وإدارة الصلاحيات (Staff & Access)</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {staffList.length.toLocaleString('ar-EG')} حساب
            </span>
          </div>

          {/* Telemetry Capsules */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>نشط: {activeCount}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 text-amber-300 font-bold">
              <ShieldCheck size={11} className="text-amber-400" />
              <span>مدراء: {superAdminCount}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-bold">
              <UserRound size={11} className="text-slate-600" />
              <span>تأجير: {agentCount}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-bold">
              <Briefcase size={11} className="text-slate-600" />
              <span>محاسبة: {accountantCount}</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAddStaff}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-colors shadow-xs cursor-pointer"
        >
          <UserPlus size={14} />
          <span>إضافة موظف جديد</span>
        </button>
      </header>

      {staffListError && (
        <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
          {staffListError}
        </div>
      )}

      {/* 2. Unified Intelligent Controls Strip */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 p-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث فوري: الاسم، اسم المستخدم للدخول، أو رقم الهاتف…"
            className="w-full h-8 pr-8 pl-8 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              title="مسح البحث"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {[
            { value: 'all', label: 'الكل', count: staffList.length },
            { value: 'super_admin', label: 'مدير عام', count: superAdminCount },
            { value: 'rental_agent', label: 'موظف تأجير', count: agentCount },
            { value: 'accountant', label: 'محاسب مالي', count: accountantCount },
            { value: 'fleet_entry', label: 'إدخال أسطول', count: fleetEntryCount },
          ].map((item) => {
            const active = roleFilter === item.value;
            return (
              <button
                type="button"
                key={item.value}
                onClick={() => setRoleFilter(item.value as any)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{item.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  active ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {item.count.toLocaleString('ar-EG')}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 border-t md:border-t-0 md:border-r border-slate-200 pt-1 md:pt-0 md:pr-2 mr-auto md:mr-0">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="عرض البطاقات"
          >
            <LayoutGrid size={14} />
            <span className="hidden lg:inline text-[11px]">بطاقات</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              viewMode === 'table'
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="عرض الجدول المدمج"
          >
            <List size={14} />
            <span className="hidden lg:inline text-[11px]">جدول مدمج</span>
          </button>
        </div>
      </div>

      {/* 3. Staff Presentation */}
      {filteredStaff.length === 0 ? (
        <div className="p-10 text-center flex flex-col items-center justify-center gap-2 bg-white border border-dashed border-slate-300 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <UserCheck size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {searchTerm ? 'لا توجد نتائج تطابق معايير البحث' : 'لا يوجد موظفون في هذا القسم'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            {searchTerm ? 'جرّب تعديل كلمة البحث أو إزالة الفلاتر المحددة.' : 'يمكنك إضافة موظف جديد بالضغط على زر إضافة موظف أعلاه.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 items-start">
          {filteredStaff.map((staff) => (
            <StaffCard
              key={staff.id}
              staff={staff}
              isCurrentUser={staff.id === currentStaffId}
              onOpenEdit={onOpenEditStaff}
              onDelete={onDeleteStaff}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filteredStaff.map((staff) => (
            <StaffRow
              key={staff.id}
              staff={staff}
              isCurrentUser={staff.id === currentStaffId}
              onOpenEdit={onOpenEditStaff}
              onDelete={onDeleteStaff}
            />
          ))}
        </div>
      )}
    </div>
  );
}
