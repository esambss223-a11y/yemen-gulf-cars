'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Car as CarIcon, 
  Calendar, 
  Users, 
  FileText, 
  Truck, 
  BarChart3, 
  Settings,
  LogOut,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { StaffUser } from '@/types/fleet';

export type AdminTab = 'overview' | 'cars' | 'bookings' | 'staff' | 'owners' | 'coupons' | 'audit' | 'profile';

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
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
      setDateStr(now.toISOString().split('T')[0]);
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems: { id: AdminTab; label: string; icon: React.ElementType; badge?: number | string }[] = [
    { id: 'overview', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'cars', label: 'السيارات', icon: CarIcon, badge: totalCarsCount },
    { id: 'bookings', label: 'الحجوزات', icon: Calendar, badge: activeBookingsCount },
    { id: 'staff', label: 'العملاء وفريق العمل', icon: Users, badge: staffCount },
    { id: 'owners', label: 'المبيعات والموردين', icon: Truck, badge: ownersCount },
    { id: 'audit', label: 'التقارير وسجل الرقابة', icon: BarChart3 },
    { id: 'profile', label: 'الإعدادات وحسابي', icon: Settings },
  ];

  return (
    <>
      {/* خلفية معتمة للجوال عند فتح القائمة */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden animate-fadeIn"
        />
      )}

      <aside className={`
        fixed inset-y-0 right-0 z-50 w-64 bg-[#081225] border-l border-white/5 flex flex-col shrink-0 h-full overflow-hidden shadow-2xl transition-transform duration-300 ease-in-out
        md:static md:translate-x-0 md:z-auto
        ${isMobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        
        {/* ========================================================
            1. ترويسة المستخدم في أعلى الشريط (User Profile Pill)
            ======================================================== */}
        <div className="p-4 border-b border-white/5">
          <button
            onClick={() => {
              setActiveTab('profile');
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-[#0e1b36] hover:bg-[#132347] border border-white/5 hover:border-[#c5a059]/40 transition-all text-right cursor-pointer group"
            title="عرض ملفك الشخصي وإعداداتك"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c5a059] to-[#8a6d3b] flex items-center justify-center text-slate-950 font-black text-sm shrink-0 shadow-md">
                {currentStaff.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400 font-medium">أهلاً بك</div>
                <div className="text-xs font-black text-white truncate group-hover:text-[#c5a059] transition-colors">
                  {currentStaff.name}
                </div>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-[#c5a059] group-hover:-translate-x-0.5 transition-transform shrink-0" />
          </button>
        </div>

        {/* ========================================================
            2. روابط التنقل (Navigation Menu Items)
            ======================================================== */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto font-arabic">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#c5a059] text-slate-950 shadow-lg shadow-[#c5a059]/20 font-black'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive 
                      ? 'bg-slate-950/20 text-slate-950' 
                      : 'bg-slate-800/80 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ========================================================
            3. تذييل الشريط الجانبي وحالة النظام الحية (System Status)
            ======================================================== */}
        <div className="p-3.5 border-t border-white/5 bg-[#060e1d]/80 space-y-2.5">
          
          {/* حالة النظام والوقت */}
          <div className="p-2.5 rounded-xl bg-[#09152b] border border-white/5 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-[11px] font-bold text-white">النظام يعمل بشكل طبيعي</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pr-4">
              <span>{timeStr || '10:24 ص'}</span>
              <span>{dateStr || '2026-10-16'}</span>
            </div>
          </div>

          {/* روابط سريعة: معاينة الموقع وزر تسجيل الخروج */}
          <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
            <Link 
              href="/" 
              className="hover:text-[#c5a059] flex items-center gap-1 transition-colors"
              title="معاينة الواجهة العامة للعملاء"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>عرض الموقع</span>
            </Link>

            <button
              onClick={handleLogout}
              className="text-rose-400/80 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
              title="تسجيل الخروج من الحساب"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>

        </div>

      </aside>
    </>
  );
}
