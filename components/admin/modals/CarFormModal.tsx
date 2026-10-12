'use client';

import React from 'react';
import { Car as CarIcon, X } from 'lucide-react';
import { Car, VehicleOwner } from '@/types/fleet';

interface CarFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCar: Car | null;
  carForm: {
    make: string;
    model: string;
    year: number;
    category: Car['category'];
    plateNumber: string;
    color: string;
    currentKm: number;
    dailyPriceEGP: number;
    weeklyPriceEGP: number;
    securityDepositEGP: number;
    status: Car['status'];
    images: string[];
    transmission: Car['transmission'];
    fuelType: Car['fuelType'];
    seats: number;
    ownership: Car['ownership'];
    ownerId: string;
    ownerName: string;
    features: string[];
  };
  setCarForm: React.Dispatch<React.SetStateAction<any>>;
  owners: VehicleOwner[];
  onSubmit: (e: React.FormEvent) => void;
}

export default function CarFormModal({
  isOpen,
  onClose,
  editingCar,
  carForm,
  setCarForm,
  owners,
  onSubmit,
}: CarFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0b1324] border border-[#c5a059]/40 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-4 shadow-2xl my-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CarIcon className="w-5 h-5 text-[#c5a059]" /> {editingCar ? `تعديل بيانات ${editingCar.make} ${editingCar.model}` : 'إضافة سيارة جديدة للأسطول'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">ماركة السيارة (Make):</label>
              <input
                type="text"
                required
                value={carForm.make}
                onChange={(e) => setCarForm({ ...carForm, make: e.target.value })}
                placeholder="مثال: Mercedes-Benz, BMW, Porsche"
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">الموديل (Model):</label>
              <input
                type="text"
                required
                value={carForm.model}
                onChange={(e) => setCarForm({ ...carForm, model: e.target.value })}
                placeholder="مثال: S-Class S500, Range Rover"
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">سنة الصنع:</label>
              <input
                type="number"
                value={carForm.year}
                onChange={(e) => setCarForm({ ...carForm, year: parseInt(e.target.value) || 2024 })}
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">رقم اللوحة:</label>
              <input
                type="text"
                required
                value={carForm.plateNumber}
                onChange={(e) => setCarForm({ ...carForm, plateNumber: e.target.value })}
                placeholder="مثال: م ص ر 5542"
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="block text-[#c5a059] font-bold mb-1">عداد الكيلومترات الفعلي (Km):</label>
              <input
                type="number"
                required
                value={carForm.currentKm}
                onChange={(e) => setCarForm({ ...carForm, currentKm: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#0e172a] border border-[#c5a059] rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">حالة السيارة:</label>
              <select
                value={carForm.status}
                onChange={(e) => setCarForm({ ...carForm, status: e.target.value as any })}
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
              >
                <option value="available">🟢 متاحة للتأجير</option>
                <option value="rented">🟡 مؤجرة حالياً</option>
                <option value="maintenance">🔴 في الصيانة</option>
                <option value="cleaning">⚪ تحت التجهيز والغسيل</option>
              </select>
            </div>

            <div>
              <label className="block text-[#c5a059] font-bold mb-1">سعر الإيجار اليومي (ج.م EGP):</label>
              <input
                type="number"
                required
                value={carForm.dailyPriceEGP}
                onChange={(e) => setCarForm({ ...carForm, dailyPriceEGP: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#0e172a] border border-[#c5a059]/60 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-cyan-300 font-bold mb-1">مبلغ التأمين المسترد (ج.م EGP):</label>
              <input
                type="number"
                required
                value={carForm.securityDepositEGP}
                onChange={(e) => setCarForm({ ...carForm, securityDepositEGP: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#0e172a] border border-cyan-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">مالك السيارة:</label>
              <select
                value={carForm.ownerId}
                onChange={(e) => {
                  const sel = owners.find(o => o.id === e.target.value);
                  setCarForm({
                    ...carForm,
                    ownerId: e.target.value,
                    ownership: e.target.value === 'owner-1' ? 'company' : 'investor',
                    ownerName: sel ? sel.name : 'شركة يمن الخليج'
                  });
                }}
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
              >
                {owners.map(o => (
                  <option key={o.id} value={o.id}>{o.name} ({o.ownerSharePercent}%)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">رابط صورة السيارة (أو مسارها):</label>
              <input
                type="text"
                value={carForm.images[0]}
                onChange={(e) => setCarForm({ ...carForm, images: [e.target.value] })}
                placeholder="/car-mercedes.jpg أو رابط ويب"
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-[#c5a059] hover:bg-[#d4af37] text-black font-black shadow-lg cursor-pointer"
            >
              {editingCar ? 'حفظ التعديلات ✓' : 'إضافة السيارة للأسطول ✓'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
