'use client';

import React from 'react';
import Image from 'next/image';
import { Search, Plus, Menu, Bell } from 'lucide-react';
import { StaffUser } from '@/types/fleet';

interface AdminHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCloudConnected: boolean;
  currentStaff: StaffUser;
  onOpenAddBooking: () => void;
  onOpenAddCar: () => void;
  onToggleMobileMenu?: () => void;
  onOpenProfile?: () => void;
}

export default function AdminHeader({
  searchQuery,
  setSearchQuery,
  isCloudConnected,
  currentStaff,
  onOpenAddBooking,
  onOpenAddCar,
  onToggleMobileMenu,
  onOpenProfile,
}: AdminHeaderProps) {
  return (
    <header className="h-16 sm:h-20 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-6 sticky top-0 z-20 font-arabic shadow-xs">
      
      {/* 1. الجانب الأيمن: شعار وهوية شركة اليمن والخليج في كبسولة كحلية فاخرة */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors shrink-0"
          title="فتح القائمة"
        >
          <Menu className="w-5 h-5 text-slate-800" />
        </button>

        <div className="flex items-center gap-3 bg-[#081225] text-white py-1.5 px-3 sm:px-4 rounded-2xl shadow-sm">
          <div className="text-right hidden sm:block">
            <h1 className="text-xs sm:text-sm font-black text-white leading-tight">
              شركة اليمن والخليج
            </h1>
            <p className="text-[10px] text-[#c5a059] font-medium leading-none mt-0.5">
              لتأجير السيارات
            </p>
          </div>
          <div className="h-8 sm:h-10 w-auto flex items-center justify-center shrink-0">
            <Image
              src="/logo2.png"
              alt="شركة اليمن والخليج"
              width={120}
              height={40}
              priority
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* 2. المنتصف: شريط البحث المستدير الأنيق المطابق للصورة */}
      <div className="flex-1 max-w-xl mx-auto">
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن سيارة، حجز، عميل، أو رقم مرجعي..."
            className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200/90 focus:border-[#c5a059] rounded-full pr-10 pl-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c5a059]/20 transition-all font-arabic text-right shadow-inner"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 3. الجانب الأيسر: زر الإشعارات والأزرار التشغيلية */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* شارة الاتصال السحابي */}
        <div className={`hidden lg:flex px-2.5 py-1.5 rounded-full text-[10px] font-bold items-center gap-1.5 border shadow-2xs ${
          isCloudConnected 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
            : 'bg-cyan-50 border-cyan-200 text-cyan-700'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-cyan-500'}`} />
          <span>{isCloudConnected ? 'سحابي متصل ✓' : 'مزامنة محلية ☁️'}</span>
        </div>

        {/* زر الإشعارات */}
        <button
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors relative cursor-pointer"
          title="الإشعارات والتنبيهات التشغيلية"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-[#c5a059] absolute top-2 right-2 ring-2 ring-white" />
        </button>

        {/* زر حجز جديد المباشر */}
        {(currentStaff.role === 'super_admin' || currentStaff.role === 'rental_agent') && (
          <button
            onClick={onOpenAddBooking}
            className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5a059] hover:from-[#e0bc43] hover:to-[#cca74a] text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-[#c5a059]/20 transition-all cursor-pointer"
            title="إنشاء عقد وحجز جديد"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">حجز جديد</span>
          </button>
        )}

        {/* زر إضافة سيارة للمدير */}
        {currentStaff.role === 'super_admin' && (
          <button
            onClick={onOpenAddCar}
            className="hidden xl:flex px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold items-center gap-1.5 transition-all cursor-pointer"
            title="إضافة مركبة جديدة للأسطول"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة سيارة</span>
          </button>
        )}

      </div>

    </header>
  );
}
