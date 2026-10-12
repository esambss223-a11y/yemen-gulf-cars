'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Car as CarIcon, 
  ExternalLink, 
  TrendingUp, 
  Calendar, 
  UserCheck, 
  Users, 
  ShieldCheck, 
  RotateCcw 
} from 'lucide-react';
import { StaffUser } from '@/types/fleet';

export type AdminTab = 'overview' | 'cars' | 'bookings' | 'staff' | 'owners' | 'coupons' | 'audit';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  currentStaff: StaffUser;
  totalCarsCount: number;
  activeBookingsCount: number;
  staffCount: number;
  ownersCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  resetToDefault: () => void;
  handleLogout: () => void;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  currentStaff,
  totalCarsCount,
  activeBookingsCount,
  staffCount,
  ownersCount,
  isMobileOpen = false,
  onCloseMobile,
  resetToDefault,
  handleLogout,
}: AdminSidebarProps) {
  return (
    <>
      {/* خلفية معتمة للجوال عند فتح القائمة */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden animate-fadeIn"
        />
      )}

      <aside className={`
        fixed inset-y-0 right-0 z-50 w-72 bg-[#0a1122] border-l border-[#c5a059]/20 flex flex-col shrink-0 h-full overflow-hidden shadow-2xl transition-transform duration-300 ease-in-out
        md:static md:translate-x-0 md:z-auto
        ${isMobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        
        {/* ترويسة اللوحة والشعار */}
        <div className="p-4 sm:p-5 border-b border-[#c5a059]/15 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c5a059] to-[#8a6d3b] flex items-center justify-center p-0.5 shadow-lg shadow-[#c5a059]/20">
              <div className="w-full h-full bg-[#060b17] rounded-[10px] flex items-center justify-center">
                <CarIcon className="w-5 h-5 text-[#c5a059]" />
              </div>
            </div>
            <div>
              <div className="font-black text-sm text-white group-hover:text-[#c5a059] transition-colors">
                يمن الخليج
              </div>
              <div className="text-[10px] text-[#c5a059] font-semibold">
                نظام إدارة الأسطول (ERP)
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/" className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800" title="معاينة الموقع للجمهور">
              <ExternalLink className="w-4 h-4" />
            </Link>
            {onCloseMobile && (
              <button 
                onClick={onCloseMobile}
                className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
                title="إغلاق القائمة"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* بطاقة الموظف النشط حالياً */}
      <div className="p-3.5 m-3.5 rounded-xl bg-[#0e172a] border border-[#c5a059]/30">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-slate-400 font-medium">المستخدم الحالي:</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            currentStaff.role === 'super_admin' ? 'bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40' :
            currentStaff.role === 'rental_agent' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            {currentStaff.role === 'super_admin' ? '👑 مدير عام' :
             currentStaff.role === 'rental_agent' ? '👤 موظف تأجير' : '💼 محاسب مالي'}
          </span>
        </div>
        <p className="text-xs font-bold text-white truncate">{currentStaff.name}</p>
      </div>

      {/* روابط التنقل في اللوحة (Navigation Menu) */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        
        <button
          onClick={() => setActiveTab('overview')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-[#c5a059]/20 text-[#f3e5ab] border-r-4 border-[#c5a059]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <span className="flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-[#c5a059]" /> نظرة عامة وإحصائيات
          </span>
        </button>

        <button
          onClick={() => setActiveTab('cars')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'cars'
              ? 'bg-[#c5a059]/20 text-[#f3e5ab] border-r-4 border-[#c5a059]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <span className="flex items-center gap-3">
            <CarIcon className="w-4 h-4 text-[#c5a059]" /> السيارات والأسطول
          </span>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-[#c5a059] font-mono">
            {totalCarsCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'bookings'
              ? 'bg-[#c5a059]/20 text-[#f3e5ab] border-r-4 border-[#c5a059]'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <span className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-[#c5a059]" /> الحجوزات والعقود
          </span>
          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full font-mono">
            {activeBookingsCount} نشط
          </span>
        </button>

        {/* قسم الموظفين وصلاحياتهم الكاملة */}
        {currentStaff.role === 'super_admin' && (
          <button
            onClick={() => setActiveTab('staff')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'staff'
                ? 'bg-[#c5a059]/20 text-[#f3e5ab] border-r-4 border-[#c5a059]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-3">
              <UserCheck className="w-4 h-4 text-[#c5a059]" /> فريق العمل والموظفين
            </span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-blue-400 font-mono">
              {staffCount}
            </span>
          </button>
        )}

        {/* قسم الملاك ونسب الأرباح */}
        {(currentStaff.role === 'super_admin' || currentStaff.role === 'accountant') && (
          <button
            onClick={() => setActiveTab('owners')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'owners'
                ? 'bg-[#c5a059]/20 text-[#f3e5ab] border-r-4 border-[#c5a059]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-3">
              <Users className="w-4 h-4 text-[#c5a059]" /> الملاك ونسب الأرباح
            </span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-mono">
              {ownersCount}
            </span>
          </button>
        )}

        {currentStaff.role === 'super_admin' && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audit'
                ? 'bg-[#c5a059]/20 text-[#f3e5ab] border-r-4 border-[#c5a059]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-[#c5a059]" /> سجل الرقابة والأمان
            </span>
          </button>
        )}

      </nav>

      {/* تذييل الشريط الجانبي */}
      <div className="p-3.5 border-t border-slate-800 flex items-center justify-between">
        <button 
          onClick={resetToDefault} 
          className="text-[10px] text-slate-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
          title="استعادة البيانات الأصلية"
        >
          <RotateCcw className="w-3 h-3" /> استعادة الافتراضي
        </button>
        
        <button
          onClick={handleLogout}
          className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
        >
          تسجيل الخروج ⏻
        </button>
      </div>
    </aside>
    </>
  );
}
