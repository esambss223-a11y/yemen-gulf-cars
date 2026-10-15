'use client';

import React from 'react';
import { FileText, CheckCircle2, Clock } from 'lucide-react';
import { Booking } from '@/types/fleet';

interface BookingsTabProps {
  bookings: Booking[];
  onOpenContract: (booking: Booking) => void;
  onReturnCar: (booking: Booking) => void;
}

export default function BookingsTab({
  bookings,
  onOpenContract,
  onReturnCar,
}: BookingsTabProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        
        {/* ترويسة الجدول */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">سجل عقود وحجوزات الأسطول</h3>
            <p className="text-xs text-slate-500 mt-0.5">إدارة العقود التشغيلية، فترات التأجير، واستلام المركبات</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">
            إجمالي الحجوزات: {bookings.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold">
                <th className="py-3.5 pr-4">رقم العقد</th>
                <th className="py-3.5">السيارة واللوحة</th>
                <th className="py-3.5">العميل والهاتف</th>
                <th className="py-3.5">المدة والمواعيد</th>
                <th className="py-3.5">الإجمالي</th>
                <th className="py-3.5">التأمين المسترد</th>
                <th className="py-3.5">الحالة</th>
                <th className="py-3.5 pl-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    لا توجد حجوزات مسجلة حالياً
                  </td>
                </tr>
              ) : (
                bookings.map((bk) => (
                  <tr key={bk.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pr-4 font-mono font-bold text-amber-600">{bk.bookingNumber}</td>
                    <td className="py-3.5">
                      <div className="font-bold text-slate-900">{bk.carName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{bk.carPlate}</div>
                    </td>
                    <td className="py-3.5">
                      <div className="font-bold text-slate-900">{bk.customer.fullName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{bk.customer.phone}</div>
                    </td>
                    <td className="py-3.5">
                      <div className="text-slate-700 font-medium">{bk.daysCount} أيام ({bk.startDate} ⬅ {bk.endDate})</div>
                      <div className="text-[10px] text-slate-400">عداد البدء: {bk.startKm.toLocaleString()} كم</div>
                    </td>
                    <td className="py-3.5 font-mono font-bold text-slate-900">
                      {bk.finalTotalEGP.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">ج.م</span>
                    </td>
                    <td className="py-3.5">
                      <span className="font-mono text-slate-800 font-bold">{bk.securityDepositEGP.toLocaleString()} ج.م</span>
                      <span className={`block text-[10px] font-bold ${bk.depositStatus === 'held' ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {bk.depositStatus === 'held' ? '● محجوز' : '✓ مسترد'}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                        bk.status === 'active' 
                          ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                          : bk.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {bk.status === 'active' ? 'نشط بالتشغيل' : bk.status === 'completed' ? 'مكتمل ومسترجع' : 'ملغي'}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenContract(bk)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#081225] text-slate-700 hover:text-amber-400 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border border-slate-200"
                          title="معاينة وطباعة العقد"
                        >
                          <FileText className="w-3.5 h-3.5" /> العقد
                        </button>

                        {bk.status === 'active' && (
                          <button
                            onClick={() => onReturnCar(bk)}
                            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[11px] font-bold hover:from-amber-400 hover:to-amber-500 shadow-sm cursor-pointer"
                          >
                            استلام
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
