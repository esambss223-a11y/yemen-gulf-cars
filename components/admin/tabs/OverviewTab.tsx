'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { 
  Car as CarIcon, 
  Calendar, 
  Users, 
  Wallet, 
  ChevronLeft, 
  Plus, 
  CheckCircle2, 
  BarChart2,
  ShieldCheck,
  Eye,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { Booking, Car, StaffUser, VisitorStats } from '@/types/fleet';
import { AdminTab } from '@/components/admin/AdminSidebar';
import FleetAlertsBanner from './FleetAlertsBanner';
import OverviewAnalytics from './OverviewAnalytics';

interface OverviewTabProps {
  totalCars: number;
  availableCars: number;
  rentedCars: number;
  activeBookings: Booking[];
  totalRevenueEGP: number;
  totalHeldDepositsEGP: number;
  customersCount: number;
  currentStaff: StaffUser;
  visitorStats: VisitorStats;
  cars: Car[];
  bookings: Booking[];
  onReturnCar: (booking: Booking) => void;
  onOpenAddBooking: () => void;
  onOpenContract?: (booking: Booking) => void;
  setActiveTab: (tab: AdminTab) => void;
}

export default function OverviewTab({
  totalCars,
  availableCars,
  rentedCars,
  activeBookings,
  totalRevenueEGP,
  totalHeldDepositsEGP,
  customersCount,
  currentStaff,
  visitorStats,
  cars,
  bookings,
  onReturnCar,
  onOpenAddBooking,
  onOpenContract,
  setActiveTab,
}: OverviewTabProps) {
  const [activeView, setActiveView] = useState<'active_fleet' | 'recent_bookings'>('active_fleet');

  // السيارات الأكثر طلباً وحجزاً
  const mostBookedCars = useMemo(() => {
    const bookingCounts: Record<string, number> = {};
    bookings.forEach(b => {
      bookingCounts[b.carId] = (bookingCounts[b.carId] || 0) + 1;
    });

    return [...cars]
      .sort((a, b) => (bookingCounts[b.id] || 0) - (bookingCounts[a.id] || 0))
      .slice(0, 4)
      .map((car, index) => ({
        car,
        rank: index + 1,
        count: bookingCounts[car.id] || 0,
      }));
  }, [cars, bookings]);

  // أحدث الحجوزات للجدول
  const recentBookings = useMemo(() => {
    return [...bookings].slice(0, 6);
  }, [bookings]);

  // ملخص اليوم (Today's Summary)
  const todaySummary = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.startDate === todayStr);
    return {
      newBookings: todayBookings.length,
      rentedCars,
      revenueToday: todayBookings.reduce((sum, b) => sum + b.finalTotalEGP, 0),
    };
  }, [bookings, rentedCars]);

  // نسبة تشغيل الأسطول
  const fleetUtilizationRate = useMemo(() => {
    if (totalCars === 0) return 0;
    return Math.round((rentedCars / totalCars) * 100);
  }, [rentedCars, totalCars]);

  // التاريخ الحالي المنسق باللغة العربية
  const formattedTodayDate = useMemo(() => {
    return new Intl.DateTimeFormat('ar-EG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  return (
    <div className="admin-section admin-overview space-y-6 font-arabic text-slate-800 animate-fadeIn">

      {/* ========================================================
          1. الترويسة الذكية الهادئة: ترحيب أنيق + مؤشرات النشاط اللحظي
          ======================================================== */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        
        {/* الترحيب بالموظف والتاريخ */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full font-bold">
              {currentStaff.name}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-mono text-slate-500">{formattedTodayDate}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            مركز العمليات والتشغيل اليومي
          </h1>
        </div>

        {/* كبسولة نشاط المنصة وزوار الموقع (هادئة ومدمجة بدون وميض) */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500">زوار آخر 5 دقائق:</span>
            <strong className="font-mono font-bold text-slate-900">
              {visitorStats?.available ? visitorStats.liveNow.toLocaleString() : '—'}
            </strong>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500">اليوم:</span>
            <strong className="font-mono font-bold text-slate-900">
              {visitorStats?.available ? visitorStats.today.toLocaleString() : '—'}
            </strong>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500">الإجمالي:</span>
            <strong className="font-mono font-bold text-slate-900">
              {visitorStats?.available ? visitorStats.total.toLocaleString() : '—'}
            </strong>
          </div>
        </div>

      </div>

      {/* ========================================================
          2. شبكة المؤشرات الرئيسية (Executive Metric Grid)
          ======================================================== */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="مؤشرات التشغيل">
        
        {/* بطاقة الأسطول والتشغيل */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <CarIcon className="w-4 h-4 text-slate-600" />
                <span>أسطول اليوم</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                {fleetUtilizationRate}% نسبة التشغيل
              </span>
            </div>

            <div className="my-2">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                {availableCars}
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">سيارة متاحة للتأجير الفوري بالمعرض</span>
            </div>

            {/* شريط نسبة التشغيل */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
              <div 
                className="bg-slate-900 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(5, fleetUtilizationRate))}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>متاحة: <strong className="text-slate-900 font-mono">{availableCars}</strong></span>
            </div>
            <div>مؤجرة: <strong className="text-slate-900 font-mono">{rentedCars}</strong></div>
            <div>إجمالي: <strong className="text-slate-900 font-mono">{totalCars}</strong></div>
          </div>
        </div>

        {/* بطاقة الإيرادات التعاقدية */}
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-amber-400" />
                <span>إجمالي الإيرادات التعاقدية</span>
              </span>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md">
                ج.م
              </span>
            </div>

            <div className="my-2">
              <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                {currentStaff.role === 'rental_agent' ? '••••••' : (totalRevenueEGP / 1000).toFixed(0)}
                {currentStaff.role !== 'rental_agent' && (
                  <span className="text-xs font-normal text-slate-400 mr-2">ألف ج.م</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">إجمالي المبالغ التعاقدية المسجلة بالمنظومة</p>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between pt-3 mt-4 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-3 text-slate-300">
              <span>عقود جارية: <strong className="text-white font-mono">{activeBookings.length}</strong></span>
              <span>عملاء: <strong className="text-white font-mono">{customersCount}</strong></span>
            </div>
            <button 
              onClick={() => setActiveTab('bookings')}
              className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-0.5 text-xs transition-colors"
            >
              <span>العقود</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* بطاقة كفالات التأمين المحجوزة */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>كفالات التأمين المحجوزة</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>مؤمنة بالكامل</span>
              </span>
            </div>

            <div className="my-2">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                {(totalHeldDepositsEGP / 1000).toFixed(0)}
                <span className="text-xs font-normal text-slate-500 mr-2">ألف ج.م</span>
              </div>
              <span className="text-xs text-slate-500 mt-0.5 block">ودائع أمانات محتجزة تسترد عند الفحص والإرجاع</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100 text-xs text-slate-500">
            <span>تصفية فورية عند استلام المركبة</span>
            <span className="font-mono text-[11px] text-slate-400">حسابات بنكية / كاش</span>
          </div>
        </div>

      </section>

      {/* تنبيهات جاهزية الأسطول والصيانة */}
      <FleetAlertsBanner cars={cars} setActiveTab={setActiveTab} />

      {/* الرسوم البيانية التفاعلية وتحليل الإيرادات */}
      <OverviewAnalytics cars={cars} bookings={bookings} currentStaff={currentStaff} />

      {/* ========================================================
          3. مركز التشغيل الرئيسي المنظم (2-Column Operating Center)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* الجانب الرئيسي (8 أعمدة): جدول تشغيلي ذكي ونظيف */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            
            {/* أزرار التبديل الذكية بين السيارات المؤجرة بالشارع وأحدث الحجوزات */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveView('active_fleet')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'active_fleet'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  السيارات المؤجرة بالشارع ({activeBookings.length})
                </button>
                <button
                  onClick={() => setActiveView('recent_bookings')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'recent_bookings'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  أحدث الحجوزات ({recentBookings.length})
                </button>
              </div>

              <button 
                onClick={() => setActiveTab('bookings')}
                className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>سجل العقود الكامل</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* محتوى العرض 1: السيارات المؤجرة بالشارع ومواعيد عودتها مع زر استلام وفحص */}
            {activeView === 'active_fleet' && (
              <div className="p-4 sm:p-5">
                {activeBookings.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    جميع سيارات الأسطول متواجدة حالياً في المعرض ومتاحة للتأجير 🟢
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeBookings.map((bk) => (
                      <div 
                        key={bk.id}
                        className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-slate-200 relative overflow-hidden shrink-0 border border-slate-200">
                            <Image
                              src={cars.find(c => c.id === bk.carId)?.coverImage || '/car-mercedes.jpg'}
                              alt={bk.carName}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-black text-slate-900 truncate">{bk.carName}</h5>
                              <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                                {bk.carPlate}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              العميل: <strong className="text-slate-800">{bk.customer.fullName}</strong> ({bk.customer.phone})
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">موعد الإرجاع:</span>
                            <span className="text-xs font-mono font-bold text-amber-800">{bk.endDate} ({bk.endTime || '14:00'})</span>
                          </div>

                          <button
                            onClick={() => onReturnCar(bk)}
                            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                            title="استلام السيارة وإنهاء العقد وإدخال العداد النهائي"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>استلام وفحص</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* محتوى العرض 2: أحدث الحجوزات جدول نظيف ومرتب */}
            {activeView === 'recent_bookings' && (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                      <th className="py-3 pr-5">رقم العقد</th>
                      <th className="py-3">العميل</th>
                      <th className="py-3">السيارة</th>
                      <th className="py-3">فترة الإيجار</th>
                      <th className="py-3">الإجمالي</th>
                      <th className="py-3 pl-5 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentBookings.map((bk) => (
                      <tr 
                        key={bk.id} 
                        onClick={() => onOpenContract ? onOpenContract(bk) : null}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <td className="py-3 pr-5 font-mono font-bold text-amber-800">#{bk.bookingNumber}</td>
                        <td className="py-3 font-bold text-slate-900">{bk.customer.fullName}</td>
                        <td className="py-3 text-slate-700">{bk.carName}</td>
                        <td className="py-3 font-mono text-[11px] text-slate-500">
                          {bk.startDate} ⬅ {bk.endDate}
                        </td>
                        <td className="py-3 font-mono font-bold text-slate-900">
                          {bk.finalTotalEGP.toLocaleString()} ج.م
                        </td>
                        <td className="py-3 pl-5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bk.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            bk.status === 'active' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {bk.status === 'confirmed' ? 'مؤكد' :
                             bk.status === 'active' ? 'نشط بالشارع' : 'مكتمل'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>

        {/* الجانب الأيسر (4 أعمدة): ملخص اليوم الفاخر + الأكثر طلباً */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* بطاقة ملخص اليوم الفاخرة (Slate 900 Executive Card) */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800 flex flex-col justify-between">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <span>ملخص اليوم التشغيلي</span>
              </h4>
              <span className="text-[10px] font-mono bg-white/10 text-emerald-300 px-2 py-0.5 rounded-md">
                مباشر
              </span>
            </div>

            <div className="space-y-3 my-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>حجوزات تبدأ اليوم</span>
                </div>
                <span className="font-mono font-bold text-white text-sm">{todaySummary.newBookings}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <CarIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>السيارات المؤجرة</span>
                </div>
                <span className="font-mono font-bold text-white text-sm">{todaySummary.rentedCars}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>زوار الموقع اليوم</span>
                </div>
                <span className="font-mono font-bold text-white text-sm">
                  {visitorStats?.available ? visitorStats.today : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                <div className="flex items-center gap-2 text-slate-300">
                  <Wallet className="w-3.5 h-3.5 text-amber-400" />
                  <span>الإيراد المتوقع اليوم</span>
                </div>
                <span className="font-mono font-black text-amber-300 text-sm">
                  {currentStaff.role === 'rental_agent' ? '••••••' : (
                    (todaySummary.revenueToday / 1000).toFixed(0) + ' ألف ج.م'
                  )}
                </span>
              </div>
            </div>

            {/* زر إضافة حجز جديد المباشر */}
            <button
              onClick={onOpenAddBooking}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>إضافة حجز جديد</span>
            </button>

          </div>

          {/* السيارات الأكثر طلباً (Top Cars) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-800">السيارات الأكثر طلباً</h4>
              <button 
                onClick={() => setActiveTab('cars')}
                className="text-[11px] text-slate-500 hover:text-slate-900 font-bold hover:underline transition-colors"
              >
                الأحدث
              </button>
            </div>

            <div className="space-y-2.5">
              {mostBookedCars.map((item) => (
                <div 
                  key={item.car.id} 
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                      {item.rank}
                    </span>
                    <div className="w-9 h-7 rounded-md bg-slate-200 overflow-hidden relative shrink-0">
                      <Image
                        src={item.car.coverImage || '/car-mercedes.jpg'}
                        alt={`${item.car.make} ${item.car.model}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 truncate">
                        {item.car.make} {item.car.model}
                      </h5>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-slate-700 shrink-0">
                    {item.count} حجز
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
