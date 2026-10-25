'use client';

import React from 'react';

interface AdminFooterProps {
  totalCars: number;
  availableCars: number;
  rentedCars: number;
}

export default function AdminFooter({
  totalCars,
  availableCars,
  rentedCars,
}: AdminFooterProps) {
  return (
    <footer className="admin-footer h-8 bg-[#040813] border-t border-slate-800/80 px-4 flex items-center justify-between text-[11px] text-slate-400 select-none shrink-0 font-mono z-10">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-sans font-bold">النظام: نشط ومتصل</span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="hidden sm:inline font-sans">
          الفرع: <strong className="text-slate-300 font-sans">القاهرة - المركز الرئيسي</strong>
        </span>
        <span className="hidden sm:inline text-slate-600">|</span>
        <span className="font-sans">
          العملة: <strong className="text-[#c5a059] font-sans">جنيه مصري (EGP)</strong>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden md:inline text-slate-500 font-sans">
          الأسطول: <span className="text-white font-mono">{totalCars}</span> سيارة (<span className="text-emerald-400 font-mono">{availableCars}</span> متاحة / <span className="text-amber-400 font-mono">{rentedCars}</span> مؤجرة)
        </span>
        <span className="text-slate-600 hidden md:inline">|</span>
        <span className="text-[10px] bg-slate-900 border border-slate-700/60 text-[#c5a059] px-2 py-0.5 rounded font-mono font-bold">
          YEMEN GULF ERP v2.4
        </span>
      </div>
    </footer>
  );
}
