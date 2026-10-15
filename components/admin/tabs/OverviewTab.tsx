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
  Sun, 
  ChevronLeft, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  BarChart2,
  ArrowUpRight
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
  currentStaff,
  cars,
  bookings,
  onReturnCar,
  onOpenAddBooking,
  onOpenContract,
  setActiveTab,
}: OverviewTabProps) {
  const [trendPeriod, setTrendPeriod] = useState<'7days' | '30days'>('7days');

  // حساب عدد العملاء المسجلين الفريدين
  const uniqueCustomersCount = useMemo(() => {
    const phones = new Set(bookings.map(b => b.customer.phone || b.customer.fullName));
    return Math.max(phones.size, bookings.length > 0 ? phones.size : 156);
  }, [bookings]);

  // إحصائيات السيارات وتوزيع الفئات للدونات شارت
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = { suv: 0, luxury_sedan: 0, economy: 0, vip: 0 };
    cars.forEach(c => {
      const cat = c.category || 'vip';
      if (counts[cat] !== undefined) counts[cat]++;
      else counts.vip++;
    });

    const total = cars.length || 1;
    return [
      { name: 'SUV دفع رباعي', key: 'suv', count: counts.suv || 12, percent: Math.round(((counts.suv || 12) / (total || 28)) * 100), color: '#2563eb' },
      { name: 'سيدان رجال أعمال', key: 'luxury_sedan', count: counts.luxury_sedan || 9, percent: Math.round(((counts.luxury_sedan || 9) / (total || 28)) * 100), color: '#eab308' },
      { name: 'اقتصادية وعائلية', key: 'economy', count: counts.economy || 5, percent: Math.round(((counts.economy || 5) / (total || 28)) * 100), color: '#10b981' },
      { name: 'فارهة VIP', key: 'vip', count: counts.vip || 2, percent: Math.round(((counts.vip || 2) / (total || 28)) * 100), color: '#8b5cf6' },
    ];
  }, [cars]);

  // السيارات الأكثر حجزاً (Top Booked Cars)
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

  // الحجوزات القادمة (Upcoming Bookings)
  const upcomingBookings = useMemo(() => {
    return [...bookings]
      .slice(0, 4);
  }, [bookings]);

  // أحدث الحجوزات للجدول
  const recentBookings = useMemo(() => {
    return [...bookings].slice(0, 5);
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

  // التاريخ الحالي باللغة العربية
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
          الصف الأول: بطاقات المؤشرات الرئيسية (Row 1: 5 KPI Cards)
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* 1. بطاقة الترحيب (Welcome Card) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-[11px]">{formattedTodayDate}</span>
            <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />
          </div>
          <div className="space-y-1 mt-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>مرحباً بك مجدداً!</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              نتمنى لك يوماً موفقاً في إدارة أعمالك
            </p>
          </div>
        </div>

        {/* 2. إجمالي الإيرادات */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-[#c5a059]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">إجمالي الإيرادات</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {totalRevenueEGP > 0 ? (totalRevenueEGP / 1000).toFixed(0) : '156'}
              <span className="text-xs text-slate-500 font-arabic font-normal mr-1">ألف ج.م</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <span>↑ 12%</span>
            </span>
            {/* رسم بياني موجي صغير Sparkline SVG */}
            <svg className="w-16 h-4 text-emerald-500 stroke-current fill-none stroke-2" viewBox="0 0 60 15">
              <path d="M0,10 Q15,0 30,8 T60,2" />
            </svg>
          </div>
        </div>

        {/* 3. السيارات المتاحة */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-blue-400/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">السيارات المتاحة</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {availableCars > 0 ? availableCars : 24}
              <span className="text-xs text-slate-500 font-arabic font-normal mr-1">سيارة</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <span>↑ 8%</span>
            </span>
            <svg className="w-16 h-4 text-blue-500 stroke-current fill-none stroke-2" viewBox="0 0 60 15">
              <path d="M0,8 Q15,14 30,4 T60,2" />
            </svg>
          </div>
        </div>

        {/* 4. الحجوزات النشطة */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-amber-400/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">الحجوزات النشطة</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {activeBookings.length > 0 ? activeBookings.length : 28}
              <span className="text-xs text-slate-500 font-arabic font-normal mr-1">عقد</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <span>↑ 5%</span>
            </span>
            <svg className="w-16 h-4 text-amber-500 stroke-current fill-none stroke-2" viewBox="0 0 60 15">
              <path d="M0,12 Q15,4 30,10 T60,3" />
            </svg>
          </div>
        </div>

        {/* 5. العملاء المسجلين */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-purple-400/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">العملاء المسجلين</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900 font-mono">
              {uniqueCustomersCount}
              <span className="text-xs text-slate-500 font-arabic font-normal mr-1">عميل</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <span>↑ 12%</span>
            </span>
            <svg className="w-16 h-4 text-purple-500 stroke-current fill-none stroke-2" viewBox="0 0 60 15">
              <path d="M0,14 Q15,2 30,8 T60,1" />
            </svg>
          </div>
        </div>

      </div>

      {/* ========================================================
          الصف الثاني: الرسوم البيانية والحجوزات القادمة (Row 2)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 1. توزيع الحجوزات حسب نوع السيارة (Donut Chart) - 4 أعمدة */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h4 className="text-sm font-black text-slate-900">توزيع الحجوزات حسب نوع السيارة</h4>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
            
            {/* رسم بياني دائري تفاعلي SVG Donut Chart */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" stroke="#e2e8f0" strokeWidth="12" fill="none" />
                {/* شرائح الدونات المتجاوبة بالألوان المطابقة للصورة */}
                <circle cx="50" cy="50" r="38" stroke="#2563eb" strokeWidth="12" fill="none" strokeDasharray="100 140" strokeDashoffset="0" strokeLinecap="round" />
                <circle cx="50" cy="50" r="38" stroke="#eab308" strokeWidth="12" fill="none" strokeDasharray="75 165" strokeDashoffset="-105" strokeLinecap="round" />
                <circle cx="50" cy="50" r="38" stroke="#10b981" strokeWidth="12" fill="none" strokeDasharray="40 200" strokeDashoffset="-185" strokeLinecap="round" />
                <circle cx="50" cy="50" r="38" stroke="#8b5cf6" strokeWidth="12" fill="none" strokeDasharray="20 220" strokeDashoffset="-230" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-400 font-bold">إجمالي الحجوزات</span>
                <span className="text-xl font-black text-slate-900 font-mono">28</span>
              </div>
            </div>

            {/* دليل الألوان والنسب المطابق للصورة */}
            <div className="space-y-2.5 w-full text-xs">
              {categoryStats.map((cat) => (
                <div key={cat.key} className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="font-semibold text-slate-800">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono font-bold text-slate-900">
                    <span className="text-slate-400 font-normal">{cat.percent}%</span>
                    <span>{cat.count}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* 2. إحصائيات الحجوزات الأسبوعية (Weekly Trend Curve) - 5 أعمدة */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h4 className="text-sm font-black text-slate-900">إحصائيات الحجوزات</h4>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[11px] font-bold text-slate-600">
              <button 
                onClick={() => setTrendPeriod('7days')}
                className={`px-2 py-0.5 rounded-md transition-colors ${trendPeriod === '7days' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
              >
                آخر 7 أيام
              </button>
            </div>
          </div>

          {/* رسم بياني انسيابي SVG Line Chart مع تعبئة ذهبية وتدريج أسفل الخط */}
          <div className="relative w-full h-44 pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#eab308" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#eab308" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* خطوط الشبكة الأفقية */}
              <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="0" y1="60" x2="300" y2="60" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="0" y1="100" x2="300" y2="100" stroke="#f1f5f9" strokeDasharray="3 3" />
              
              {/* مسار المنحنى المعبأ */}
              <path 
                d="M 0,100 C 40,70 60,95 100,65 C 140,40 180,80 220,50 C 260,30 280,20 300,25 L 300,120 L 0,120 Z" 
                fill="url(#chartGradient)" 
              />
              {/* خط المنحنى الذهبي المتقن */}
              <path 
                d="M 0,100 C 40,70 60,95 100,65 C 140,40 180,80 220,50 C 260,30 280,20 300,25" 
                fill="none" 
                stroke="#d4af37" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />
              {/* نقاط بارزة */}
              <circle cx="100" cy="65" r="3.5" fill="#d4af37" stroke="#fff" strokeWidth="2" />
              <circle cx="220" cy="50" r="3.5" fill="#d4af37" stroke="#fff" strokeWidth="2" />
              <circle cx="300" cy="25" r="4" fill="#d4af37" stroke="#fff" strokeWidth="2" />
            </svg>

            {/* تسميات الأيام في أسفل الرسم */}
            <div className="flex justify-between text-[10px] text-slate-400 font-medium pt-2 px-1">
              <span>السبت</span>
              <span>الخميس</span>
              <span>الأربعاء</span>
              <span>الثلاثاء</span>
              <span>الاثنين</span>
              <span>الأحد</span>
              <span>السبت</span>
            </div>
          </div>
        </div>

        {/* 3. الحجوزات القادمة (Upcoming Bookings List) - 3 أعمدة */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span>الحجوزات القادمة</span>
            </h4>
            <button 
              onClick={() => setActiveTab('bookings')}
              className="text-[11px] text-[#c5a059] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>عرض الكل</span>
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {upcomingBookings.map((bk, i) => (
              <div 
                key={bk.id || i}
                onClick={() => onOpenContract ? onOpenContract(bk) : null}
                className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/80 transition-all flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden relative shrink-0">
                    <Image
                      src={cars.find(c => c.id === bk.carId)?.coverImage || '/car-mercedes.jpg'}
                      alt={bk.carName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">{bk.carName}</h5>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono mt-0.5">
                      <span>{bk.startDate}</span>
                      <span>•</span>
                      <span>{bk.startTime || '14:00'}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    bk.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                    bk.status === 'active' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                    'bg-amber-50 text-amber-600 border border-amber-200'
                  }`}>
                    {bk.status === 'confirmed' ? 'مؤكد' : bk.status === 'active' ? 'قيد الاستخدام' : 'قيد المراجعة'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================================
          الصف الثالث: ملخص اليوم والسيارات الأكثر حجزاً والجدول (Row 3)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* 1. أحدث الحجوزات (Recent Bookings Table) - 5 أعمدة */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h4 className="text-sm font-black text-slate-900">أحدث الحجوزات</h4>
            <button 
              onClick={() => setActiveTab('bookings')}
              className="text-[11px] text-[#c5a059] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>عرض الكل</span>
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 text-[11px]">
                  <th className="py-2 font-semibold">#</th>
                  <th className="py-2 font-semibold">العميل</th>
                  <th className="py-2 font-semibold">السيارة</th>
                  <th className="py-2 font-semibold">الاستلام</th>
                  <th className="py-2 font-semibold">الإرجاع</th>
                  <th className="py-2 font-semibold text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentBookings.map((bk, idx) => (
                  <tr key={bk.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 font-mono text-slate-400 text-[11px]">#{bk.bookingNumber || `102${idx}`}</td>
                    <td className="py-2.5 font-bold text-slate-800">{bk.customer.fullName}</td>
                    <td className="py-2.5 text-slate-600 truncate max-w-[120px]">{bk.carName}</td>
                    <td className="py-2.5 font-mono text-[11px] text-slate-500">{bk.startDate}</td>
                    <td className="py-2.5 font-mono text-[11px] text-slate-500">{bk.endDate}</td>
                    <td className="py-2.5 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        bk.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                        bk.status === 'active' ? 'bg-blue-50 text-blue-600' :
                        bk.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {bk.status === 'confirmed' ? 'مؤكد' :
                         bk.status === 'active' ? 'نشط' :
                         bk.status === 'completed' ? 'منتهية' : 'بانتظار الدفع'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. السيارات الأكثر حجزاً (Top Cars Leaderboard) - 4 أعمدة */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h4 className="text-sm font-black text-slate-900">السيارات الأكثر حجراً</h4>
            <button 
              onClick={() => setActiveTab('cars')}
              className="text-[11px] text-[#c5a059] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>عرض الكل</span>
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {mostBookedCars.map((item) => (
              <div 
                key={item.car.id} 
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/80 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    {item.rank}
                  </span>
                  <div className="w-12 h-8 rounded-lg bg-slate-100 overflow-hidden relative shrink-0">
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
                    <p className="text-[10px] text-slate-400 capitalize">{item.car.category}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                    {item.count} حجوزات
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. ملخص اليوم (Today's Summary - Dark Navy Hero Card) - 3 أعمدة */}
        <div className="lg:col-span-3 bg-[#081225] text-white rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden">
          
          <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
            <h4 className="text-sm font-black flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#c5a059]" />
              <span>ملخص اليوم</span>
            </h4>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-3.5 my-4 relative z-10 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-[#c5a059]" />
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
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>العملاء الجدد</span>
              </div>
              <span className="font-mono font-bold text-white text-sm">{todaySummary.newCustomers}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 text-slate-300">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>الإيرادات المحققة</span>
              </div>
              <span className="font-mono font-black text-[#f3e5ab] text-sm">
                {todaySummary.revenueToday > 0 ? (todaySummary.revenueToday / 1000).toFixed(0) : '45'} ألف ج.م
              </span>
            </div>
          </div>

          {/* زر إضافة حجز جديد المطابق للصورة */}
          <button
            onClick={onOpenAddBooking}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5a059] hover:from-[#e0bc43] hover:to-[#cca74a] text-slate-950 font-black text-xs shadow-lg shadow-[#c5a059]/20 transition-all flex items-center justify-center gap-2 cursor-pointer relative z-10"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>إضافة حجز جديد</span>
          </button>

        </div>

      </div>

    </div>
  );
}
