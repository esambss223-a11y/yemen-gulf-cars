'use client';

import React from 'react';
import { Car as CarIcon, RefreshCw } from 'lucide-react';
import { CarFormState } from '../CarFormModal';

interface CarBasicInfoSectionProps {
  carForm: CarFormState;
  setCarForm: React.Dispatch<React.SetStateAction<CarFormState>>;
  onGenerateCode: () => void;
}

export default function CarBasicInfoSection({
  carForm,
  setCarForm,
  onGenerateCode,
}: CarBasicInfoSectionProps) {
  return (
    <div className="p-3.5 bg-[#070d19] border border-slate-800/80 rounded-xl space-y-3 font-arabic">
      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
        <CarIcon className="w-3.5 h-3.5 text-[#c5a059]" /> بيانات المركبة وكود الأصل والعداد:
      </span>

      {/* كود العربية وتاريخ الدخول وعداد الاستلام من المالك */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pb-2.5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[#c5a059] font-bold text-[10px]">كود العربية (Car Code):</label>
            <button
              type="button"
              onClick={onGenerateCode}
              className="text-[9px] text-amber-300 hover:underline flex items-center gap-0.5 cursor-pointer"
              title="توليد كود تلقائي"
            >
              <RefreshCw className="w-2.5 h-2.5" /> كود تلقائي
            </button>
          </div>
          <input
            type="text"
            value={carForm.carCode || ''}
            onChange={(e) => setCarForm({ ...carForm, carCode: e.target.value })}
            placeholder="مثال: YG-001 أو VIP-S500"
            className="w-full bg-[#0b1322] border border-[#c5a059]/60 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-bold text-xs focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] mb-1">عداد الاستلام من المالك (KM):</label>
          <input
            type="number"
            min="0"
            value={carForm.initialHandoverKm ?? 0}
            onChange={(e) => setCarForm({ ...carForm, initialHandoverKm: parseInt(e.target.value) || 0 })}
            placeholder="العداد وقت دخول الأسطول"
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] mb-1">تاريخ دخول الأسطول:</label>
          <input
            type="date"
            value={carForm.fleetEntryDate || ''}
            onChange={(e) => setCarForm({ ...carForm, fleetEntryDate: e.target.value })}
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-[#c5a059]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div>
          <label className="block text-slate-400 text-[10px] mb-1">الماركة (Make):</label>
          <input
            type="text"
            required
            value={carForm.make}
            onChange={(e) => setCarForm({ ...carForm, make: e.target.value })}
            placeholder="BYD, Geely, Chery, Toyota"
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] mb-1">الموديل (Model):</label>
          <input
            type="text"
            required
            value={carForm.model}
            onChange={(e) => setCarForm({ ...carForm, model: e.target.value })}
            placeholder="Song Plus, Tiggo 8, Patrol"
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] mb-1">سنة الصنع (Year):</label>
          <input
            type="number"
            min="1990"
            max="2030"
            required
            value={carForm.year}
            onChange={(e) => setCarForm({ ...carForm, year: parseInt(e.target.value) || 2024 })}
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] mb-1">فئة السيارة:</label>
          <select
            value={carForm.category}
            onChange={(e) => setCarForm({ ...carForm, category: e.target.value as any })}
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#c5a059]"
          >
            <option value="vip">فارهة VIP</option>
            <option value="suv">دفع رباعي SUV</option>
            <option value="luxury_sedan">سيدان فاخر</option>
            <option value="economy">اقتصادية</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div>
          <label className="block text-slate-400 text-[10px] mb-1">رقم اللوحة المرورية:</label>
          <input
            type="text"
            required
            value={carForm.plateNumber}
            onChange={(e) => setCarForm({ ...carForm, plateNumber: e.target.value })}
            placeholder="أ ب ج 1234"
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-bold font-mono focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] mb-1">اللون الخارجي:</label>
          <input
            type="text"
            value={carForm.color}
            onChange={(e) => setCarForm({ ...carForm, color: e.target.value })}
            placeholder="أسود ملكي، أبيض، فضي"
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] mb-1">عداد الكيلومتر الحالي (كم):</label>
          <input
            type="number"
            value={carForm.currentKm}
            onChange={(e) => setCarForm({ ...carForm, currentKm: parseInt(e.target.value) || 0 })}
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] mb-1">نوع الوقود / الطاقة:</label>
          <select
            value={carForm.fuelType}
            onChange={(e) => setCarForm({ ...carForm, fuelType: e.target.value as any })}
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#c5a059]"
          >
            <option value="petrol">بنزين (Petrol)</option>
            <option value="electric">كهرباء بالكامل (EV)</option>
            <option value="hybrid">هايبرد هجين (Hybrid/PHEV)</option>
            <option value="diesel">ديزل (Diesel)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
