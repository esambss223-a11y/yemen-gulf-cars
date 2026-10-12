'use client';

import React from 'react';
import { Search, Plus } from 'lucide-react';
import { StaffUser } from '@/types/fleet';

interface AdminHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCloudConnected: boolean;
  currentStaff: StaffUser;
  onOpenAddBooking: () => void;
  onOpenAddCar: () => void;
}

export default function AdminHeader({
  searchQuery,
  setSearchQuery,
  isCloudConnected,
  currentStaff,
  onOpenAddBooking,
  onOpenAddCar,
}: AdminHeaderProps) {
  return (
    <header className="h-16 border-b border-[#c5a059]/20 bg-[#080e1c] px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      
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
      <div className="flex items-center gap-2.5">
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border ${
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
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> حجز جديد
          </button>
        )}

        {currentStaff.role === 'super_admin' && (
          <button
            onClick={onOpenAddCar}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#8a6d3b] hover:from-[#d4af37] hover:to-[#a07e44] text-black text-xs font-black flex items-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> إضافة سيارة
          </button>
        )}
      </div>
    </header>
  );
}
