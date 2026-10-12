'use client';

import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Booking } from '@/types/fleet';

interface ReturnCarModalProps {
  booking: Booking | null;
  onClose: () => void;
  returnKmInput: string;
  setReturnKmInput: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ReturnCarModal({
  booking,
  onClose,
  returnKmInput,
  setReturnKmInput,
  onSubmit,
}: ReturnCarModalProps) {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b1324] border border-[#c5a059]/50 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#c5a059]" /> استلام السيارة وإنهاء العقد
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div className="bg-[#0e172a] p-3 rounded-xl border border-slate-800 space-y-1">
            <p className="text-white font-bold">{booking.carName}</p>
            <p className="text-slate-400">العميل: {booking.customer.fullName}</p>
            <p className="text-slate-400">العداد عند الخروج: <span className="font-mono text-[#c5a059]">{booking.startKm.toLocaleString()} كم</span></p>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">عداد الكيلومترات الحالي (عند العودة):</label>
            <input
              type="number"
              required
              value={returnKmInput}
              onChange={(e) => setReturnKmInput(e.target.value)}
              className="w-full bg-[#0e172a] border border-[#c5a059] rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
            />
          </div>

          <div className="p-3 bg-cyan-950/40 border border-cyan-800/50 rounded-xl text-cyan-300">
            <div className="flex justify-between font-bold">
              <span>مبلغ التأمين المستحق إرجاعه للعميل:</span>
              <span className="font-mono text-white">{booking.securityDepositEGP.toLocaleString()} ج.م</span>
            </div>
            <p className="text-[10px] text-cyan-400/80 mt-1">سيتم فك حجز التأمين وإعادة السيارة للحالة «متاحة» تلقائياً في المعرض.</p>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-[#c5a059] hover:bg-[#d4af37] text-black font-black shadow-lg cursor-pointer"
            >
              تأكيد الاستلام واسترجاع التأمين ✓
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
