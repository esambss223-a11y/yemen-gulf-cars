'use client';

import React from 'react';
import { Search, Plus, Menu } from 'lucide-react';
import { StaffUser } from '@/types/fleet';

interface AdminHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCloudConnected: boolean;
  currentStaff: StaffUser;
  onOpenAddBooking: () => void;
  onOpenAddCar: () => void;
  onToggleMobileMenu?: () => void;
}

export default function AdminHeader({
  searchQuery,
  setSearchQuery,
  isCloudConnected,
  currentStaff,
  onOpenAddBooking,
  onOpenAddCar,
  onToggleMobileMenu,
}: AdminHeaderProps) {
  return (
    <header className="h-16 border-b border-[#c5a059]/20 bg-[#080e1c] px-3 sm:px-6 flex items-center justify-between gap-2.5 sm:gap-4 sticky top-0 z-20">
      
      {/* زر القائمة الجانبية للشاشات الصغيرة والمتوسطة */}
      <button
        onClick={onToggleMobileMenu}
        className="md:hidden p-2 rounded-xl bg-[#0e172a] border border-slate-700/60 text-slate-300 hover:text-white hover:border-[#c5a059] transition-colors shrink-0"
        title="فتح القائمة"
      >
        <Menu className="w-5 h-5 text-[#c5a059]" />
      </button>

      {/* محرك البحث الفوري */}
      <div className="relative flex-1 max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث فوري (الموديل، رقم اللوحة، اسم العميل، الهاتف)..."
          className="w-full bg-[#0d1629] border border-slate-700/60 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a059] transition-colors"
        />
      </div>

      {/* أزرار الإجراءات السريعة وشارة السحابة */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <div className={`hidden lg:flex px-2.5 py-1 rounded-full text-[10px] font-bold items-center gap-1.5 border ${
          isCloudConnected 
            ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-400' 
            : 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
          <span>{isCloudConnected ? 'Supabase متصل سحابياً ☁️' : 'جاهز للمزامنة السحابية ☁️'}</span>
        </div>

        {(currentStaff.role === 'super_admin' || currentStaff.role === 'rental_agent') && (
          <button
            onClick={onOpenAddBooking}
            className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
            title="حجز جديد"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">حجز جديد</span>
          </button>
        )}

        {currentStaff.role === 'super_admin' && (
          <button
            onClick={onOpenAddCar}
            className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#8a6d3b] hover:from-[#d4af37] hover:to-[#a07e44] text-black text-xs font-black flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
            title="إضافة سيارة"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">إضافة سيارة</span>
          </button>
        )}
      </div>
    </header>
  );
}
