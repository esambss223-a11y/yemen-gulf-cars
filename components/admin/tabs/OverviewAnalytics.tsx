'use client';

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Car as CarIcon, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Layers 
} from 'lucide-react';
import type { Booking, Car, StaffUser } from '@/types/fleet';

interface OverviewAnalyticsProps {
  cars: Car[];
  bookings: Booking[];
  currentStaff: StaffUser;
}

export default function OverviewAnalytics({
  cars,
  bookings,
  currentStaff,
}: OverviewAnalyticsProps) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // 1. تحليل توزيع الأسطول وحالات السيارات
  const fleetDistribution = useMemo(() => {
    const total = cars.length || 1;
    const available = cars.filter(c => c.status === 'available').length;
    const rented = cars.filter(c => c.status === 'rented').length;
    const maintenance = cars.filter(c => c.status === 'maintenance').length;
    const cleaning = cars.filter(c => c.status === 'cleaning').length;

    // توزيع الفئات
    const categories: Record<string, number> = {
      vip: 0,
      luxury_sedan: 0,
      suv: 0,
      economy: 0,
    };
    cars.forEach(c => {
      if (categories[c.category] !== undefined) {
        categories[c.category]++;
      }
    });

    return {
      available,
      availablePct: Math.round((available / total) * 100),
      rented,
      rentedPct: Math.round((rented / total) * 100),
      maintenance,
      maintenancePct: Math.round((maintenance / total) * 100),
      cleaning,
      cleaningPct: Math.round((cleaning / total) * 100),
      categories: [
        { key: 'vip', label: 'فئة VIP الفاخرة', count: categories.vip, color: '#bc9553' },
        { key: 'suv', label: 'دفع رباعي SUV عائلي', count: categories.suv, color: '#142638' },
        { key: 'luxury_sedan', label: 'سيدان فاخر ومريح', count: categories.luxury_sedan, color: '#4a6b82' },
        { key: 'economy', label: 'اقتصادي وعملي', count: categories.economy, color: '#8898aa' },
      ],
    };
  }, [cars]);

  // 2. تحليل حركة الإيرادات والحجوزات لآخر 6 أشهر
  const monthlyTrends = useMemo(() => {
    const monthsData: { label: string; shortMonth: string; bookingsCount: number; revenue: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
      
      const monthLabel = d.toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' });
      const monthShort = d.toLocaleDateString('ar-EG', { month: 'short' });

      const monthBookings = bookings.filter(b => (b.startDate && b.startDate.startsWith(monthPrefix)) || (b.createdAt && b.createdAt.startsWith(monthPrefix)));
      const monthRevenue = monthBookings.reduce((sum, b) => sum + (b.finalTotalEGP || 0), 0);

      monthsData.push({
        label: monthLabel,
        shortMonth: monthShort,
        bookingsCount: monthBookings.length,
        revenue: monthRevenue,
      });
    }

    const maxRevenue = Math.max(...monthsData.map(m => m.revenue), 10000);
    const maxBookings = Math.max(...monthsData.map(m => m.bookingsCount), 5);

    return {
      data: monthsData,
      maxRevenue,
      maxBookings,
    };
  }, [bookings]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-2">
      
      {/* الرسم البياني الأول: حركة ونمو الإيرادات والتعاقدات لآخر 6 أشهر (7 أعمدة) */}
      <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                حركة النشاط والإيرادات الشهرية
              </h3>
              <p className="text-[11px] text-slate-500">معدل التعاقدات والنمو المالي لآخر 6 أشهر</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-600 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#142638]" />
              العقود
            </span>
            <span className="flex items-center gap-1.5 text-amber-800 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              الإيراد (ج.م)
            </span>
          </div>
        </div>

        {/* أعمدة الرسم البياني التفاعلية بنظام SVG المخصص */}
        <div className="pt-6 pb-2">
          <div className="grid grid-cols-6 gap-2 sm:gap-3 items-end h-44 border-b border-slate-100 px-2">
            {monthlyTrends.data.map((item, idx) => {
              const heightPct = Math.max(12, Math.round((item.revenue / monthlyTrends.maxRevenue) * 100));
              const isHovered = hoveredMonth === idx;

              return (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-2 group relative h-full justify-end cursor-pointer"
                  onMouseEnter={() => setHoveredMonth(idx)}
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  {/* نافذة التلميح السريعة فوق العمود */}
                  {isHovered && (
                    <div className="absolute -top-16 z-20 bg-[#081225] text-white text-[10px] p-2 rounded-xl shadow-lg whitespace-nowrap border border-slate-700 pointer-events-none transform -translate-x-1/2 left-1/2 animate-in fade-in zoom-in-95">
                      <p className="font-bold text-amber-400">{item.label}</p>
                      <p className="mt-0.5 text-slate-200">
                        {currentStaff.role === 'rental_agent' ? '••••••' : `${item.revenue.toLocaleString('ar-EG')} ج.م`}
                      </p>
                      <p className="text-[9px] text-slate-400">{item.bookingsCount} عقد تأجير</p>
                    </div>
                  )}

                  {/* شريط الإيراد (العمود الرئيسي) */}
                  <div className="w-full max-w-[42px] bg-slate-100 rounded-t-xl relative overflow-hidden flex flex-col justify-end" style={{ height: `${heightPct}%` }}>
                    <div 
                      className={`w-full h-full rounded-t-xl transition-all duration-300 ${
                        isHovered 
                          ? 'bg-gradient-to-t from-amber-600 to-amber-400' 
                          : 'bg-gradient-to-t from-[#142638] to-[#25425f]'
                      }`}
                    />
                  </div>

                  {/* تسمية الشهر */}
                  <span className={`text-[10px] font-mono transition-colors ${isHovered ? 'text-amber-800 font-bold' : 'text-slate-500'}`}>
                    {item.shortMonth}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>إجمالي العقود المحققة: <strong className="text-slate-900 font-bold">{bookings.length} عقد</strong></span>
          <span>
            متوسط قيمة العقد:{' '}
            <strong className="text-slate-900 font-bold">
              {bookings.length > 0 
                ? `${Math.round(bookings.reduce((sum, b) => sum + (b.finalTotalEGP || 0), 0) / bookings.length).toLocaleString('ar-EG')} ج.م`
                : '—'}
            </strong>
          </span>
        </div>

      </div>

      {/* الرسم البياني الثاني: تحليل جاهزية الأسطول وفئاته (5 أعمدة) */}
      <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center">
              <PieChart className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                جاهزية الأسطول والفئات
              </h3>
              <p className="text-[11px] text-slate-500">نسب الإشغال حسب الفئة ونوع الاستخدام</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
            {cars.length} سيارة
          </span>
        </div>

        {/* شريط الإشغال الموزع (Multi-Segment Progress Bar) */}
        <div className="my-4">
          <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
            <span className="text-slate-700">معدل تشغيل الأسطول اللحظي</span>
            <span className="font-mono text-emerald-800">{fleetDistribution.rentedPct}% مؤجر بالشارع</span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
            <div 
              style={{ width: `${fleetDistribution.rentedPct}%` }}
              className="bg-[#142638] transition-all"
              title={`مؤجرة بالشارع: ${fleetDistribution.rented} سيارة`}
            />
            <div 
              style={{ width: `${fleetDistribution.availablePct}%` }}
              className="bg-emerald-500 transition-all"
              title={`متاحة بالمعرض: ${fleetDistribution.available} سيارة`}
            />
            <div 
              style={{ width: `${fleetDistribution.maintenancePct}%` }}
              className="bg-rose-500 transition-all"
              title={`قيد الصيانة: ${fleetDistribution.maintenance} سيارة`}
            />
          </div>

          <div className="flex items-center gap-4 text-[10px] text-slate-600 mt-2 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#142638]" /> مؤجرة ({fleetDistribution.rented})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> متاحة ({fleetDistribution.available})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> صيانة ({fleetDistribution.maintenance})
            </span>
          </div>
        </div>

        {/* توزيع الفئات (VIP, SUV, Luxury Sedan, Economy) */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          {fleetDistribution.categories.map((cat) => {
            const pct = Math.round((cat.count / (cars.length || 1)) * 100);
            return (
              <div key={cat.key} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-700 font-medium">{cat.label}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-slate-400 font-normal">({pct}%)</span>
                  <strong className="text-slate-900 font-bold">{cat.count}</strong>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
