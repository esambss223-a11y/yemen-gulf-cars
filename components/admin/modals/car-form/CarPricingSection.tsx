'use client';

import React from 'react';
import { CircleDollarSign } from 'lucide-react';
import { CarFormState } from '../CarFormModal';

interface CarPricingSectionProps {
  carForm: CarFormState;
  setCarForm: React.Dispatch<React.SetStateAction<CarFormState>>;
}

export default function CarPricingSection({ carForm, setCarForm }: CarPricingSectionProps) {
  return (
    <div className="p-3 bg-[#070d19] border border-slate-800/80 rounded-xl space-y-2 font-arabic">
      <span className="text-[11px] font-bold text-[#f3e5ab] flex items-center gap-1.5">
        <CircleDollarSign className="w-3.5 h-3.5 text-[#c5a059]" /> أسعار التأجير للعملاء (ج.م):
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div>
          <label className="block text-slate-400 text-[10px] mb-1">سعر اليوم (ج.م):</label>
          <input
            type="number"
            required
            value={carForm.dailyPriceEGP}
            onChange={(e) => {
              const daily = parseInt(e.target.value) || 0;
              setCarForm({
                ...carForm,
                dailyPriceEGP: daily,
                weeklyPriceEGP: daily * 6,
              });
            }}
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] mb-1">سعر الأسبوع (ج.م):</label>
          <input
            type="number"
            value={carForm.weeklyPriceEGP}
            onChange={(e) => setCarForm({ ...carForm, weeklyPriceEGP: parseInt(e.target.value) || 0 })}
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-[10px] mb-1">التأمين المسترد (ج.م):</label>
          <input
            type="number"
            value={carForm.securityDepositEGP}
            onChange={(e) => setCarForm({ ...carForm, securityDepositEGP: parseInt(e.target.value) || 0 })}
            className="w-full bg-[#0b1322] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#c5a059]"
          />
        </div>
      </div>
    </div>
  );
}
