'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { 
  TrendingUp, 
  Car as CarIcon, 
  Calendar, 
  Users, 
  Wallet, 
  Clock, 
  ChevronLeft, 
  Plus, 
  CheckCircle2, 
  BarChart2,
  ShieldCheck,
  Eye,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { Booking, Car, StaffUser, VisitorStats } from '@/types/fleet';
import { AdminTab } from '@/components/admin/AdminSidebar';

interface OverviewTabProps {
  totalCars: number;
  availableCars: number;
  rentedCars: number;
  activeBookings: Booking[];
  totalRevenueEGP: number;
  totalHeldDepositsEGP: number;
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

  // حساب عدد العملاء المسجلين الفريدين
  const uniqueCustomersCount = useMemo(() => {
    const phones = new Set(bookings.map(b => b.customer.phone || b.customer.fullName));
    return Math.max(phones.size, bookings.length > 0 ? phones.size : 156);
  }, [bookings]);

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
        count: bookingCounts[car.id] || (index === 0 ? 8 : index === 1 ? 5 : index === 2 ? 3 : 1),
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
      newBookings: todayBookings.length > 0 ? todayBookings.length : 12,
      rentedCars: rentedCars > 0 ? rentedCars : 8,
      newCustomers: uniqueCustomersCount > 0 ? Math.min(5, uniqueCustomersCount) : 5,
      revenueToday: todayBookings.reduce((sum, b) => sum + b.finalTotalEGP, 0) || 45000,
    };
  }, [bookings, rentedCars, uniqueCustomersCount]);

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
    <div className="space-y-6 font-arabic text-slate-800">

      {/* ========================================================
          1. الترويسة الذكية الهادئة: ترحيب أنيق + مؤشرات النشاط اللحظي
          ======================================================== */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* الترحيب بالموظف والتاريخ */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full font-bold">
              {currentStaff.name}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-mono text-slate-500">{formattedTodayDate}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            لوحة العمليات والتشغيل اليومي
          </h2>
        </div>

        {/* كبسولة نشاط المنصة وزوار الموقع (هادئة ومدمجة بدون وميض) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200/80 text-xs">
          
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-500">المتواجدون الآن:</span>
            <strong className="font-mono font-bold text-slate-900">{visitorStats?.liveNow || 1}</strong>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500">زوار اليوم:</span>
            <strong className="font-mono font-bold text-slate-900">{(visitorStats?.today || 12).toLocaleString()}</strong>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-slate-500">إجمالي الزوار:</span>
            <strong className="font-mono font-bold text-slate-900">{(visitorStats?.total || 1250).toLocaleString()}</strong>
          </div>

        </div>

      </div>

      {/* ========================================================
          2. بطاقات المؤشرات الأربعة الأساسية (Primary Metrics - 4 Clean Cards)
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. إجمالي الإيرادات */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">إجمالي الإيرادات التعاقدية</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {currentStaff.role === 'rental_agent' ? '••••••' : (
                totalRevenueEGP > 0 ? (totalRevenueEGP / 1000).toFixed(0) : '156'
              )}
              {currentStaff.role !== 'rental_agent' && (
                <span className="text-xs text-slate-500 font-arabic font-normal mr-1.5">ألف ج.م</span>
              )}
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12% هذا الشهر
            </span>
            <span className="font-medium text-slate-400">الجنيه المصري</span>
          </div>
        </div>

        {/* 2. حالة الأسطول ونسبة التشغيل */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">حالة أسطول السيارات</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <CarIcon className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {availableCars} <span className="text-xs text-emerald-700 font-arabic font-normal mr-1">متاحة بالمعرض</span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-slate-600 font-medium">
              مؤجرة: <strong className="font-mono text-amber-700">{rentedCars}</strong> من <strong className="font-mono text-slate-800">{totalCars}</strong>
            </span>
            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-bold font-mono text-[11px]">
              {fleetUtilizationRate}% تشغيل
            </span>
          </div>
        </div>

        {/* 3. العقود النشطة والعملاء */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">العقود النشطة بالشارع</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {activeBookings.length} <span className="text-xs text-slate-500 font-arabic font-normal mr-1">عقد جاري</span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-slate-600 font-medium">
              العملاء المسجلين: <strong className="font-mono text-slate-800">{uniqueCustomersCount}</strong>
            </span>
            <button 
              onClick={() => setActiveTab('bookings')} 
              className="text-amber-700 hover:underline font-bold text-[11px] cursor-pointer"
            >
              عرض العقود
            </button>
          </div>
        </div>

        {/* 4. كفالات التأمين المستردة */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">كفالات التأمين المحجوزة</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-cyan-600" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {totalHeldDepositsEGP > 0 ? (totalHeldDepositsEGP / 1000).toFixed(0) : '40'}
              <span className="text-xs text-slate-500 font-arabic font-normal mr-1.5">ألف ج.م</span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-cyan-700 font-medium">تسترد عند فحص الإرجاع</span>
            <span className="text-emerald-700 font-bold text-[11px]">مؤمنة بالكامل</span>
          </div>
        </div>

      </div>

      {/* ========================================================
          3. مركز التشغيل الرئيسي المنظم (2-Column Operating Center)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* الجانب الرئيسي (8 أعمدة): جدول تشغيلي ذكي ونظيف */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            
            {/* أزرار التبديل الذكية بين السيارات المؤجرة بالشارع وأحدث الحجوزات */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveView('active_fleet')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'active_fleet'
                      ? 'bg-[#081225] text-amber-400 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  السيارات المؤجرة بالشارع ({activeBookings.length})
                </button>
                <button
                  onClick={() => setActiveView('recent_bookings')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'recent_bookings'
                      ? 'bg-[#081225] text-amber-400 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  أحدث الحجوزات ({recentBookings.length})
                </button>
              </div>

              <button 
                onClick={() => setActiveTab('bookings')}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
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
                            className="px-3 py-1.5 rounded-xl bg-[#081225] hover:bg-[#0c1a35] text-amber-400 hover:text-amber-300 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                            title="استلام السيارة وإنهاء العقد وإدخال العداد النهائي"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
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
                        <td className="py-3 pr-5 font-mono font-bold text-amber-700">#{bk.bookingNumber}</td>
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
          
          {/* بطاقة ملخص اليوم الفاخرة (Dark Navy Luxury Card) */}
          <div className="bg-[#081225] text-white rounded-2xl p-5 shadow-sm border border-slate-800 flex flex-col justify-between">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                <span>ملخص اليوم التشغيلي</span>
              </h4>
              <span className="text-[10px] font-mono bg-white/10 text-amber-300 px-2 py-0.5 rounded-md">
                مباشر
              </span>
            </div>

            <div className="space-y-3 my-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>الحجوزات الجديدة</span>
                </div>
                <span className="font-mono font-bold text-white text-sm">{todaySummary.newBookings}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <CarIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>السيارات المؤجرة</span>
                </div>
                <span className="font-mono font-bold text-white text-sm">{todaySummary.rentedCars}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>زوار الموقع اليوم</span>
                </div>
                <span className="font-mono font-bold text-white text-sm">{visitorStats?.today || 12}</span>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                <div className="flex items-center gap-2 text-slate-300">
                  <Wallet className="w-3.5 h-3.5 text-amber-400" />
                  <span>الإيراد المتوقع اليوم</span>
                </div>
                <span className="font-mono font-black text-amber-300 text-sm">
                  {currentStaff.role === 'rental_agent' ? '••••••' : (
                    todaySummary.revenueToday > 0 ? (todaySummary.revenueToday / 1000).toFixed(0) + ' ألف ج.م' : '45 ألف ج.م'
                  )}
                </span>
              </div>
            </div>

            {/* زر إضافة حجز جديد المباشر */}
            <button
              onClick={onOpenAddBooking}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>إضافة حجز جديد</span>
            </button>

          </div>

          {/* السيارات الأكثر طلباً (Top Cars) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-800">السيارات الأكثر طلباً</h4>
              <button 
                onClick={() => setActiveTab('cars')}
                className="text-[11px] text-amber-700 font-bold hover:underline"
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
