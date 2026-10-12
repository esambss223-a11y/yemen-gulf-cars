'use client';

import React from 'react';
import { FileText } from 'lucide-react';
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
      <div className="bg-[#0b1324] border border-slate-800 rounded-2xl p-5 overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold pb-3">
              <th className="pb-3 pr-2">رقم العقد</th>
              <th className="pb-3">السيارة واللوحة</th>
              <th className="pb-3">العميل والهاتف</th>
              <th className="pb-3">المدة والمواعيد</th>
              <th className="pb-3">الإجمالي (ج.م)</th>
              <th className="pb-3">التأمين المسترد</th>
              <th className="pb-3">الحالة</th>
              <th className="pb-3 pl-2 text-center">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {bookings.map((bk) => (
              <tr key={bk.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 pr-2 font-mono font-bold text-[#c5a059]">{bk.bookingNumber}</td>
                <td className="py-3.5">
                  <div className="font-bold text-white">{bk.carName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{bk.carPlate}</div>
                </td>
                <td className="py-3.5">
                  <div className="font-bold text-white">{bk.customer.fullName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{bk.customer.phone}</div>
                </td>
                <td className="py-3.5">
                  <div className="text-slate-300">{bk.daysCount} أيام ({bk.startDate} ⬅ {bk.endDate})</div>
                  <div className="text-[10px] text-slate-500">العداد: {bk.startKm.toLocaleString()} كم</div>
                </td>
                <td className="py-3.5 font-mono font-bold text-[#f3e5ab]">
                  {bk.finalTotalEGP.toLocaleString()} ج.م
                </td>
                <td className="py-3.5">
                  <span className="font-mono text-cyan-300 font-bold">{bk.securityDepositEGP.toLocaleString()} ج.م</span>
                  <span className={`block text-[10px] ${bk.depositStatus === 'held' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {bk.depositStatus === 'held' ? 'محجوز' : 'تم الاسترجاع'}
                  </span>
                </td>
                <td className="py-3.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    bk.status === 'active' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    bk.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {bk.status === 'active' ? 'نشط بالشارع' : bk.status === 'completed' ? 'مكتمل ومسترجع' : 'ملغي'}
                  </span>
                </td>
                <td className="py-3.5 pl-2 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onOpenContract(bk)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-[#c5a059] text-slate-300 hover:text-black text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="معاينة وطباعة العقد"
                    >
                      <FileText className="w-3 h-3" /> العقد
                    </button>

                    {bk.status === 'active' && (
                      <button
                        onClick={() => onReturnCar(bk)}
                        className="px-2.5 py-1 rounded bg-[#c5a059] text-black text-[11px] font-bold hover:bg-[#d4af37] cursor-pointer"
                      >
                        استلام
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
