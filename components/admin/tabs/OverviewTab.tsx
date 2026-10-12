'use client';

import React from 'react';
import { Clock, CheckCircle2, Car as CarIcon } from 'lucide-react';
import { Booking, StaffUser } from '@/types/fleet';

interface OverviewTabProps {
  totalCars: number;
  availableCars: number;
  rentedCars: number;
  activeBookings: Booking[];
  totalRevenueEGP: number;
  totalHeldDepositsEGP: number;
  currentStaff: StaffUser;
  onReturnCar: (booking: Booking) => void;
}

export default function OverviewTab({
  totalCars,
  availableCars,
  rentedCars,
  activeBookings,
  totalRevenueEGP,
  totalHeldDepositsEGP,
  currentStaff,
  onReturnCar,
}: OverviewTabProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0b1324] border border-[#c5a059]/25 p-5 rounded-2xl">
          <p className="text-xs text-slate-400 font-semibold mb-1">إجمالي الأسطول</p>
          <h3 className="text-2xl font-black text-white font-mono">{totalCars} <span className="text-xs text-[#c5a059] font-arabic font-normal">مركبة</span></h3>
          <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-[11px]">
            <span className="text-emerald-400 font-semibold">🟢 {availableCars} متاحة</span>
            <span className="text-amber-400 font-semibold">🟡 {rentedCars} مؤجرة</span>
          </div>
        </div>

        <div className="bg-[#0b1324] border border-[#c5a059]/25 p-5 rounded-2xl">
          <p className="text-xs text-slate-400 font-semibold mb-1">العقود النشطة بالشارع</p>
          <h3 className="text-2xl font-black text-white font-mono">{activeBookings.length} <span className="text-xs text-emerald-400 font-arabic font-normal">عقد</span></h3>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            نسبة تشغيل الأسطول: <strong className="text-white font-mono">{totalCars > 0 ? Math.round((rentedCars / totalCars) * 100) : 0}%</strong>
          </div>
        </div>

        <div className="bg-[#0b1324] border border-[#c5a059]/25 p-5 rounded-2xl">
          <p className="text-xs text-slate-400 font-semibold mb-1">إجمالي الإيرادات التعاقدية</p>
          <h3 className="text-2xl font-black text-[#f3e5ab] font-mono">
            {currentStaff.role === 'rental_agent' ? '••••••' : totalRevenueEGP.toLocaleString()} <span className="text-xs text-[#c5a059] font-arabic font-normal">ج.م</span>
          </h3>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            العملة المعتمدة: <strong className="text-[#c5a059]">الجنيه المصري</strong>
          </div>
        </div>

        <div className="bg-[#0b1324] border border-[#c5a059]/25 p-5 rounded-2xl">
          <p className="text-xs text-slate-400 font-semibold mb-1">كفالات التأمين المستردة</p>
          <h3 className="text-2xl font-black text-cyan-300 font-mono">
            {totalHeldDepositsEGP.toLocaleString()} <span className="text-xs text-cyan-400 font-arabic font-normal">ج.م</span>
          </h3>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-cyan-400 font-semibold">
            مستردة للعملاء عند فحص الإرجاع
          </div>
        </div>
      </div>

      {/* متابعة السيارات المؤجرة ومواعيد عودتها */}
      <div className="bg-[#0b1324] border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#c5a059]" /> متابعة السيارات المؤجرة ومواعيد عودتها
          </h4>
          <span className="text-xs text-slate-400">({activeBookings.length} سيارات بالشارع)</span>
        </div>

        {activeBookings.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            لا توجد سيارات مؤجرة حالياً، جميع أسطولكم متاح في المعرض 🟢
          </div>
        ) : (
          <div className="space-y-3">
            {activeBookings.map((bk) => (
              <div key={bk.id} className="p-3.5 bg-[#0e172a] rounded-xl border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-[#c5a059]">
                    <CarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{bk.carName}</h5>
                    <p className="text-[11px] text-slate-400">العميل: <strong className="text-[#c5a059]">{bk.customer.fullName}</strong> ({bk.customer.phone})</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">موعد الإرجاع المقرر:</span>
                    <span className="font-mono font-bold text-amber-300">{bk.endDate} ({bk.endTime})</span>
                  </div>

                  <button
                    onClick={() => onReturnCar(bk)}
                    className="px-3 py-1.5 rounded-lg bg-[#c5a059] text-black font-bold text-xs hover:bg-[#d4af37] transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> استلام وفحص
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
