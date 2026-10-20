'use client';

import React from 'react';
import Image from 'next/image';
import { VehicleOwner, Car, Booking } from '@/types/fleet';
import { Printer, X, TrendingUp } from 'lucide-react';

interface OwnerSettlementModalProps {
  owner: VehicleOwner;
  cars: Car[];
  bookings: Booking[];
  onClose: () => void;
}

export default function OwnerSettlementModal({ owner, cars, bookings, onClose }: OwnerSettlementModalProps) {
  // تصفية السيارات المملوكة لهذا المالك
  const ownerCars = cars.filter(c => c.ownerId === owner.id);
  const ownerCarIds = ownerCars.map(c => c.id);

  // تصفية الحجوزات المرتبطة بسيارات هذا المالك
  const ownerBookings = bookings.filter(b => ownerCarIds.includes(b.carId));

  // الحسابات المالية وفق نموذج محاسبة المالك (الخيار ج)
  const totalRevenueEGP = ownerBookings.reduce((sum, b) => sum + b.finalTotalEGP, 0);
  const totalRentalDays = ownerBookings.reduce((sum, b) => sum + b.daysCount, 0);

  let ownerPayoutEGP = 0;
  if (owner.commissionModel === 'fixed_monthly') {
    ownerPayoutEGP = owner.fixedMonthlyRateEGP || 35000;
  } else if (owner.commissionModel === 'fixed_daily') {
    ownerPayoutEGP = totalRentalDays * (owner.fixedDailyRateEGP || 1200);
  } else {
    ownerPayoutEGP = Math.round((totalRevenueEGP * (owner.ownerSharePercent || 75)) / 100);
  }

  const companyCommissionEGP = Math.max(0, totalRevenueEGP - ownerPayoutEGP);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-arabic">
      
      <div className="bg-[#080d1a] border border-[#c5a059]/40 rounded-2xl w-full max-w-3xl max-h-[95vh] flex flex-col shadow-2xl relative my-auto">
        
        {/* شريط التحكم العلوي */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0b1324] rounded-t-2xl no-print">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#c5a059]" />
            <h3 className="text-sm font-bold text-white">
              كشف حساب وتصفية أرباح المالك: <span className="text-[#f3e5ab]">{owner.name}</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#96793e] hover:from-[#d4af37] hover:to-[#a98845] text-black font-black text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <Printer className="w-4 h-4" /> طباعة كشف الحساب / PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ورقة كشف الحساب القابلة للطباعة */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white text-slate-900 text-xs print:p-0 print:m-0 print:text-black">
          
          <div className="max-w-2xl mx-auto space-y-5 border border-slate-300 p-6 sm:p-8 rounded-xl bg-white shadow-sm print:border-none print:shadow-none print:p-0">
            
            {/* الترويسة */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-[#c5a059] pb-4 gap-4">
              <div className="text-right">
                <h1 className="text-xl font-black text-[#0f172a]">شركة اليمن والخليج لتأجير السيارات</h1>
                <p className="text-[11px] text-slate-600 font-semibold">إدارة تشغيل أساطيل المستثمرين ومشاركة الأرباح</p>
                <p className="text-[10px] text-slate-500 mt-1">القاهرة - جمهورية مصر العربية | هاتف: +20 103 402 5211</p>
              </div>

              <div className="text-center sm:text-left flex flex-col items-center sm:items-end">
                <div className="w-16 h-16 relative mb-1">
                  <Image src="/logo2.png" alt="شعار الشركة" width={64} height={64} className="object-contain" />
                </div>
                <div className="bg-[#f8f5eb] border border-[#c5a059]/60 px-3 py-1 rounded text-center">
                  <span className="text-[10px] text-slate-600 block">كشف حساب مستثمر رقم</span>
                  <span className="font-mono font-black text-xs text-[#8a6d3b]">STMT-{owner.id.toUpperCase()}-2026</span>
                </div>
              </div>
            </div>

            {/* بيانات المالك */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-slate-500 block">اسم المالك / المستثمر:</span>
                <strong className="text-slate-900 text-[11px]">{owner.name}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">الرقم القومي / الجواز:</span>
                <strong className="text-slate-900 font-mono text-[11px]">{owner.nationalId || 'غير مسجل'}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">رقم الهاتف / الواتساب:</span>
                <strong className="text-slate-900 font-mono text-[11px]">{owner.phone}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">نظام عقد المالك:</span>
                <strong className="text-[#8a6d3b] font-mono text-[11px]">
                  {owner.commissionModel === 'fixed_monthly' ? `إيجار شهري: ${(owner.fixedMonthlyRateEGP || 35000).toLocaleString()} ج.م (يوم ${owner.monthlyPayoutDay || 1})` :
                   owner.commissionModel === 'fixed_daily' ? `إيجار يومي: ${(owner.fixedDailyRateEGP || 1200).toLocaleString()} ج.م / يوم` :
                   `نسبة مشاركة: ${owner.ownerSharePercent || 75}%`}
                </strong>
              </div>
            </div>

            {/* بطاقات الملخص المالي */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-600 block mb-1">إجمالي الإيرادات المحققة</span>
                <strong className="text-sm font-mono text-slate-900">{totalRevenueEGP.toLocaleString()} ج.م</strong>
                <span className="text-[9px] text-slate-500 block mt-0.5">({totalRentalDays} أيام تشغيل)</span>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <span className="text-[10px] text-amber-800 block mb-1">عمولة الإدارة والتشغيل</span>
                <strong className="text-sm font-mono text-amber-900">{companyCommissionEGP.toLocaleString()} ج.م</strong>
                <span className="text-[9px] text-amber-700 block mt-0.5">({100 - owner.ownerSharePercent}% للشركة)</span>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-300">
                <span className="text-[10px] text-emerald-800 block mb-1">صافي المستحق للمالك</span>
                <strong className="text-base font-mono text-emerald-700 font-black">{ownerPayoutEGP.toLocaleString()} ج.م</strong>
                <span className="text-[9px] text-emerald-600 block mt-0.5 font-bold">جاهز للتحويل ✓</span>
              </div>
            </div>

            {/* جدول تفاصيل الحجوزات والتشغيل */}
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <div className="bg-[#f1f5f9] px-3 py-1.5 font-bold text-slate-800 border-b border-slate-300">
                سجل عقود وتشغيل سيارات المالك
              </div>
              <table className="w-full text-right border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 bg-slate-50">
                    <th className="py-2 pr-3">رقم العقد</th>
                    <th className="py-2">السيارة واللوحة</th>
                    <th className="py-2 text-center">المدة</th>
                    <th className="py-2 text-left font-mono">الإيراد (ج.م)</th>
                    <th className="py-2 pl-3 text-left font-mono">حصة المالك ({owner.ownerSharePercent}%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ownerBookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        لا توجد حجوزات مسجلة لهذه السيارات حتى الآن.
                      </td>
                    </tr>
                  ) : (
                    ownerBookings.map((b) => {
                      const share = Math.round((b.finalTotalEGP * owner.ownerSharePercent) / 100);
                      return (
                        <tr key={b.id}>
                          <td className="py-2.5 pr-3 font-mono font-bold text-[#8a6d3b]">{b.bookingNumber}</td>
                          <td className="py-2.5">
                            <div>{b.carName}</div>
                            <div className="text-[9px] text-slate-400 font-mono">{b.carPlate}</div>
                          </td>
                          <td className="py-2.5 text-center font-mono">{b.daysCount} أيام</td>
                          <td className="py-2.5 text-left font-mono">{b.finalTotalEGP.toLocaleString()} ج.م</td>
                          <td className="py-2.5 pl-3 text-left font-mono font-bold text-emerald-700">{share.toLocaleString()} ج.م</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* التوقيعات والاعتماد */}
            <div className="pt-6 grid grid-cols-2 gap-8 border-t border-slate-300 text-center">
              <div>
                <span className="text-slate-500 text-[10px] block mb-6">اعتماد المحاسب المالي للشركة:</span>
                <div className="border-b border-dashed border-slate-400 w-44 mx-auto mb-1"></div>
                <strong className="text-[11px] text-slate-800">إدارة الحسابات</strong>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block mb-6">توقيع المستثمر / المالك بالاستلام:</span>
                <div className="border-b border-dashed border-slate-400 w-44 mx-auto mb-1"></div>
                <strong className="text-[11px] text-slate-800">{owner.name}</strong>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
