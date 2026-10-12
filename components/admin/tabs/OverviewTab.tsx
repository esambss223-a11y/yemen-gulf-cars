import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  Car as CarIcon, 
  Eye, 
  TrendingUp, 
  Users, 
  Globe2, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { Booking, StaffUser, VisitorStats } from '@/types/fleet';

interface OverviewTabProps {
  totalCars: number;
  availableCars: number;
  rentedCars: number;
  activeBookings: Booking[];
  totalRevenueEGP: number;
  totalHeldDepositsEGP: number;
  currentStaff: StaffUser;
  visitorStats: VisitorStats;
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
  visitorStats,
  onReturnCar,
}: OverviewTabProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. قسم عداد وإحصائيات زوار الموقع (اليومي، الشهري، والكلي) */}
      <div className="bg-[#0a1122] border border-[#c5a059]/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        {/* لمسة إضاءة جمالية */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-b from-[#c5a059]/10 to-transparent blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c5a059] to-[#8a6d3b] flex items-center justify-center text-black shadow-md">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <span>حركة وإحصائيات زوار الموقع الإلكتروني</span>
                <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  مباشر الآن: {visitorStats.liveNow} زائر
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">تحديث فوري لعدد المشاهدات والزيارات للأسطول</p>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">آخر تحديث: {visitorStats.lastUpdated}</span>
        </div>

        {/* كروت الزيارات: اليوم، هذا الشهر، الكلي */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          
          {/* زوار اليوم */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#0e172a] border border-slate-800/80 hover:border-[#c5a059]/50 transition-all group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#c5a059]" /> زوار اليوم
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded font-mono font-bold flex items-center">
                +14% <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {visitorStats.today.toLocaleString()}
              <span className="text-xs text-slate-400 font-arabic font-normal mr-1.5">زيارة</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">تفاعل مستمر خلال الـ 24 ساعة الماضية</p>
          </div>

          {/* زوار الشهر */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#0e172a] border border-slate-800/80 hover:border-[#c5a059]/50 transition-all group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> زوار هذا الشهر
              </span>
              <span className="text-[10px] text-blue-400 bg-blue-950/60 border border-blue-800/50 px-1.5 py-0.5 rounded font-mono font-bold">
                أكتوبر 2026
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#f3e5ab] font-mono tracking-tight">
              {visitorStats.thisMonth.toLocaleString()}
              <span className="text-xs text-[#c5a059] font-arabic font-normal mr-1.5">زيارة</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">إجمالي طلبات المعاينة والحجوزات للشهر</p>
          </div>

          {/* إجمالي الزوار الكلي */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#0e172a] border border-slate-800/80 hover:border-[#c5a059]/50 transition-all group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" /> إجمالي الزوار الكلي
              </span>
              <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/50 px-1.5 py-0.5 rounded font-mono font-bold">
                تراكمي
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono tracking-tight">
              {visitorStats.total.toLocaleString()}
              <span className="text-xs text-cyan-400 font-arabic font-normal mr-1.5">زائر موثق</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">منذ إطلاق المنصة الإلكترونية</p>
          </div>

        </div>
      </div>

      {/* 2. إحصائيات الأسطول والعقود المالية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* إجمالي الأسطول */}
        <div className="bg-[#0b1324] border border-[#c5a059]/25 p-4 sm:p-5 rounded-2xl hover:border-[#c5a059]/50 transition-all">
          <p className="text-xs text-slate-400 font-semibold mb-1">إجمالي الأسطول</p>
          <h3 className="text-2xl sm:text-3xl font-black text-white font-mono">
            {totalCars} <span className="text-xs text-[#c5a059] font-arabic font-normal">مركبة</span>
          </h3>
          <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-[11px]">
            <span className="text-emerald-400 font-semibold">🟢 {availableCars} متاحة</span>
            <span className="text-amber-400 font-semibold">🟡 {rentedCars} مؤجرة</span>
          </div>
        </div>

        {/* العقود النشطة بالشارع */}
        <div className="bg-[#0b1324] border border-[#c5a059]/25 p-4 sm:p-5 rounded-2xl hover:border-[#c5a059]/50 transition-all">
          <p className="text-xs text-slate-400 font-semibold mb-1">العقود النشطة بالشارع</p>
          <h3 className="text-2xl sm:text-3xl font-black text-white font-mono">
            {activeBookings.length} <span className="text-xs text-emerald-400 font-arabic font-normal">عقد</span>
          </h3>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            نسبة تشغيل الأسطول: <strong className="text-white font-mono">{totalCars > 0 ? Math.round((rentedCars / totalCars) * 100) : 0}%</strong>
          </div>
        </div>

        {/* إجمالي الإيرادات التعاقدية */}
        <div className="bg-[#0b1324] border border-[#c5a059]/25 p-4 sm:p-5 rounded-2xl hover:border-[#c5a059]/50 transition-all">
          <p className="text-xs text-slate-400 font-semibold mb-1">إجمالي الإيرادات التعاقدية</p>
          <h3 className="text-2xl sm:text-3xl font-black text-[#f3e5ab] font-mono">
            {currentStaff.role === 'rental_agent' ? '••••••' : totalRevenueEGP.toLocaleString()}{' '}
            <span className="text-xs text-[#c5a059] font-arabic font-normal">ج.م</span>
          </h3>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            العملة المعتمدة: <strong className="text-[#c5a059]">الجنيه المصري</strong>
          </div>
        </div>

        {/* كفالات التأمين المستردة */}
        <div className="bg-[#0b1324] border border-[#c5a059]/25 p-4 sm:p-5 rounded-2xl hover:border-[#c5a059]/50 transition-all">
          <p className="text-xs text-slate-400 font-semibold mb-1">كفالات التأمين المستردة</p>
          <h3 className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono">
            {totalHeldDepositsEGP.toLocaleString()} <span className="text-xs text-cyan-400 font-arabic font-normal">ج.م</span>
          </h3>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-cyan-400 font-semibold">
            مستردة للعملاء عند فحص الإرجاع
          </div>
        </div>
      </div>

      {/* 3. متابعة السيارات المؤجرة ومواعيد عودتها */}
      <div className="bg-[#0b1324] border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#c5a059]" /> متابعة السيارات المؤجرة ومواعيد عودتها
          </h4>
          <span className="text-xs text-slate-400 font-medium">({activeBookings.length} سيارات بالشارع)</span>
        </div>

        {activeBookings.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            لا توجد سيارات مؤجرة حالياً، جميع أسطولكم متاح في المعرض 🟢
          </div>
        ) : (
          <div className="space-y-3">
            {activeBookings.map((bk) => (
              <div 
                key={bk.id} 
                className="p-3.5 bg-[#0e172a] rounded-xl border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#c5a059]/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-[#c5a059] shrink-0">
                    <CarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{bk.carName}</h5>
                    <p className="text-[11px] text-slate-400">
                      العميل: <strong className="text-[#c5a059]">{bk.customer.fullName}</strong> ({bk.customer.phone})
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-4 text-xs pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">موعد الإرجاع المقرر:</span>
                    <span className="font-mono font-bold text-amber-300">{bk.endDate} ({bk.endTime})</span>
                  </div>

                  <button
                    onClick={() => onReturnCar(bk)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#c5a059] text-black font-bold text-xs hover:bg-[#d4af37] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
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

