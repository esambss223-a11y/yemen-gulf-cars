'use client';

import React from 'react';
import { Calendar, X } from 'lucide-react';
import { Car } from '@/types/fleet';

interface AddBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  cars: Car[];
  newBooking: {
    carId: string;
    customerName: string;
    customerPhone: string;
    nationalId: string;
    licenseNumber: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    discountCode: string;
    notes: string;
  };
  setNewBooking: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AddBookingModal({
  isOpen,
  onClose,
  cars,
  newBooking,
  setNewBooking,
  onSubmit,
}: AddBookingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b1324] border border-emerald-500/40 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" /> إنشاء عقد وحجز جديد (تسليم سيارة)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">السيارة المراد تأجيرها:</label>
            <select
              required
              value={newBooking.carId}
              onChange={(e) => setNewBooking({ ...newBooking, carId: e.target.value })}
              className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
            >
              {cars.filter(c => c.status === 'available').map(car => (
                <option key={car.id} value={car.id}>
                  {car.make} {car.model} {car.year} ({car.plateNumber}) - {car.dailyPriceEGP.toLocaleString()} ج.م/يوم
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">اسم العميل بالكامل:</label>
              <input
                type="text"
                required
                value={newBooking.customerName}
                onChange={(e) => setNewBooking({ ...newBooking, customerName: e.target.value })}
                placeholder="مثال: خالد محمد عبد الله"
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">رقم الهاتف / الواتساب:</label>
              <input
                type="text"
                required
                value={newBooking.customerPhone}
                onChange={(e) => setNewBooking({ ...newBooking, customerPhone: e.target.value })}
                placeholder="مثال: 01012345678"
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">تاريخ الاستلام:</label>
              <input
                type="date"
                required
                value={newBooking.startDate}
                onChange={(e) => setNewBooking({ ...newBooking, startDate: e.target.value })}
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">تاريخ الإرجاع المقرر:</label>
              <input
                type="date"
                required
                value={newBooking.endDate}
                onChange={(e) => setNewBooking({ ...newBooking, endDate: e.target.value })}
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg cursor-pointer"
            >
              تأكيد الحجز وطباعة العقد ✓
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
