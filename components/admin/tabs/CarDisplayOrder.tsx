'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { 
  ArrowDown, 
  ArrowUp, 
  ChevronsDown, 
  ChevronsUp, 
  ArrowUpDown, 
  X, 
  Check, 
  Sparkles,
  Car as CarIcon,
  AlertCircle
} from 'lucide-react';
import type { Car } from '@/types/fleet';
import { sortCarsForDisplay } from '@/lib/car-display-order';

interface CarDisplayOrderProps {
  cars: Car[];
  onSave: (ids: string[]) => Promise<void>;
  onClose: () => void;
}

export default function CarDisplayOrder({ cars, onSave, onClose }: CarDisplayOrderProps) {
  const [ids, setIds] = useState(() => 
    sortCarsForDisplay(cars.filter(car => car.status !== 'archived')).map(car => car.id)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busy, onClose]);

  const move = (index: number, target: number) => {
    setIds(previous => {
      const next = [...previous];
      const [id] = next.splice(index, 1);
      next.splice(target, 0, id);
      return next;
    });
  };

  const save = async () => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      await onSave(ids);
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'تعذر حفظ الترتيب.');
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  const nonArchivedCars = cars.filter(car => car.status !== 'archived');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fleet-order-title"
    >
      {/* Backdrop click listener */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={() => { if (!busy) onClose(); }} 
        aria-hidden="true" 
      />

      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-right">
        {/* Header */}
        <header className="p-4 sm:p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/60">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <ArrowUpDown size={18} className="text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  الأسطول العام
                </span>
                <span className="text-xs text-slate-600 font-bold">
                  {ids.length} سيارات
                </span>
              </div>
              <h3 id="fleet-order-title" className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-0.5">
                ترتيب ظهور السيارات في موقع الزوار
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                السيارة رقم <strong className="text-slate-900">#1</strong> ستتصدر واجهة الموقع للزوار. استخدم الأسهم لتقديم أو تأخير أي سيارة.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0 disabled:opacity-40"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </header>

        {/* Cars List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
          {ids.map((id, index) => {
            const car = nonArchivedCars.find(item => item.id === id);
            if (!car) return null;

            const isFirst = index === 0;
            const isTop3 = index < 3;
            const imgUrl = car.coverImage || (Array.isArray(car.images) && car.images[0]) || '/car-mercedes.jpg';

            return (
              <div
                key={id}
                className={`group flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                  isFirst
                    ? 'bg-amber-50/40 border-amber-200/90 shadow-sm'
                    : isTop3
                    ? 'bg-slate-50/70 border-slate-200/90'
                    : 'bg-white border-slate-200/70 hover:border-slate-300'
                }`}
              >
                {/* Right side: Rank + Thumbnail + Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Badge */}
                  <div
                    className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 transition-transform ${
                      isFirst
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                        : isTop3
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                    title={`الترتيب: المركز رقم ${index + 1}`}
                  >
                    {isFirst ? (
                      <span className="flex items-center gap-0.5">
                        <Sparkles size={11} className="text-amber-100" />
                        1
                      </span>
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Thumbnail (Studio Blur Canvas) */}
                  <div className="w-16 h-11 rounded-xl overflow-hidden bg-slate-950 border border-slate-200/80 shrink-0 relative flex items-center justify-center shadow-xs">
                    {imgUrl ? (
                      <>
                        <Image
                          src={imgUrl}
                          alt=""
                          fill
                          sizes="40px"
                          aria-hidden="true"
                          className="object-cover scale-125 blur-md opacity-40 pointer-events-none"
                          unoptimized
                        />
                        <Image
                          src={imgUrl}
                          alt={`${car.make} ${car.model}`}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </>
                    ) : (
                      <CarIcon size={18} className="text-slate-400" />
                    )}
                  </div>

                  {/* Car Details */}
                  <div className="min-w-0 text-right leading-tight">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {car.make} {car.model}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600">
                        ({car.year})
                      </span>
                      {isFirst && (
                        <span className="text-[10px] font-black text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded-md">
                          واجهة الموقع ⭐
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600 font-medium">
                      <span className="font-mono bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded text-slate-700 font-bold">
                        {car.plateNumber}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">
                        {car.dailyPriceEGP?.toLocaleString()} ج.م / يوم
                      </span>
                    </div>
                  </div>
                </div>

                {/* Left side: Movement controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    aria-label={`نقل إلى الصدارة — ${car.make} ${car.model}`}
                    title="نقل إلى الصدارة (المركز 1)"
                    disabled={busy || index === 0}
                    onClick={() => move(index, 0)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-20 disabled:pointer-events-none transition-all"
                  >
                    <ChevronsUp size={15} />
                  </button>

                  <button
                    type="button"
                    aria-label={`تقديم مركز واحد — ${car.make} ${car.model}`}
                    title="تقديم مركز واحد للأعلى"
                    disabled={busy || index === 0}
                    onClick={() => move(index, index - 1)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-20 disabled:pointer-events-none transition-all"
                  >
                    <ArrowUp size={15} />
                  </button>

                  <button
                    type="button"
                    aria-label={`تأخير مركز واحد — ${car.make} ${car.model}`}
                    title="تأخير مركز واحد للأسفل"
                    disabled={busy || index === ids.length - 1}
                    onClick={() => move(index, index + 1)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-20 disabled:pointer-events-none transition-all"
                  >
                    <ArrowDown size={15} />
                  </button>

                  <button
                    type="button"
                    aria-label={`نقل إلى النهاية — ${car.make} ${car.model}`}
                    title="نقل إلى أسفل القائمة"
                    disabled={busy || index === ids.length - 1}
                    onClick={() => move(index, ids.length - 1)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-20 disabled:pointer-events-none transition-all"
                  >
                    <ChevronsDown size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-4 sm:mx-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer */}
        <footer className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-600 hidden sm:block">
            سيتم حفظ الترتيب فوراً وعرضه لزوار الموقع العام.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all disabled:opacity-50"
            >
              إلغاء
            </button>

            <button
              type="button"
              disabled={busy || !ids.length}
              onClick={save}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 min-w-[140px]"
            >
              {busy ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جارٍ الحفظ…</span>
                </>
              ) : (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span>حفظ ترتيب الموقع</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
