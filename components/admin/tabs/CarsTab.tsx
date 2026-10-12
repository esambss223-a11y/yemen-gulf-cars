'use client';

import React from 'react';
import Image from 'next/image';
import { Filter, Plus, Calendar, Edit3, Trash2 } from 'lucide-react';
import { Car, StaffUser } from '@/types/fleet';

interface CarsTabProps {
  cars: Car[];
  filteredCars: Car[];
  carFilter: 'all' | 'available' | 'rented' | 'maintenance';
  setCarFilter: (filter: 'all' | 'available' | 'rented' | 'maintenance') => void;
  availableCarsCount: number;
  rentedCarsCount: number;
  currentStaff: StaffUser;
  onOpenAddCar: () => void;
  onOpenEditCar: (car: Car) => void;
  onOpenQuickBook: (car: Car) => void;
  onDeleteCar: (carId: string, carName: string) => void;
}

export default function CarsTab({
  cars,
  filteredCars,
  carFilter,
  setCarFilter,
  availableCarsCount,
  rentedCarsCount,
  currentStaff,
  onOpenAddCar,
  onOpenEditCar,
  onOpenQuickBook,
  onDeleteCar,
}: CarsTabProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      
      {/* شريط الفلترة والأزرار */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0b1324] p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#c5a059]" />
          <span className="text-xs font-bold text-slate-300">تصفية الأسطول:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setCarFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                carFilter === 'all' ? 'bg-[#c5a059] text-black' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              الكل ({cars.length})
            </button>
            <button
              onClick={() => setCarFilter('available')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                carFilter === 'available' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              المتاحة ({availableCarsCount})
            </button>
            <button
              onClick={() => setCarFilter('rented')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                carFilter === 'rented' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              المؤجرة ({rentedCarsCount})
            </button>
          </div>
        </div>

        {currentStaff.role === 'super_admin' && (
          <button
            onClick={onOpenAddCar}
            className="px-4 py-2 bg-[#c5a059] hover:bg-[#d4af37] text-black font-black text-xs rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" /> إضافة سيارة جديدة
          </button>
        )}
      </div>

      {/* بطاقات السيارات مع أزرار التعديل الشامل */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCars.map((car) => (
          <div key={car.id} className="bg-[#0b1324] border border-[#c5a059]/20 rounded-2xl overflow-hidden hover:border-[#c5a059]/60 transition-all flex flex-col group">
            
            <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
              <Image
                src={car.coverImage || car.images[0] || '/car-mercedes.jpg'}
                alt={`${car.make} ${car.model}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1324] via-transparent to-black/40" />

              <div className="absolute top-3 right-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border shadow-lg ${
                  car.status === 'available' ? 'bg-emerald-500 text-black border-emerald-400' :
                  car.status === 'rented' ? 'bg-amber-500 text-black border-amber-300' :
                  'bg-rose-500 text-white border-rose-400'
                }`}>
                  {car.status === 'available' ? '🟢 متاحة' :
                   car.status === 'rented' ? '🟡 مؤجرة' : '🔴 صيانة'}
                </span>
              </div>

              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 text-[11px] font-mono font-bold text-white">
                {car.plateNumber}
              </div>

              <div className="absolute bottom-3 right-3 left-3">
                <p className="text-[10px] text-[#c5a059] font-bold uppercase">{car.make}</p>
                <h4 className="text-base font-black text-white">{car.model} {car.year}</h4>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0e172a] p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">عداد الكيلومترات:</span>
                  <span className="font-mono font-bold text-[#c5a059]">{car.currentKm.toLocaleString()} كم</span>
                </div>
                <div className="bg-[#0e172a] p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">التأمين المسترد:</span>
                  <span className="font-mono font-bold text-cyan-300">{car.securityDepositEGP.toLocaleString()} ج.م</span>
                </div>
              </div>

              <div className="bg-[#0e172a]/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">سعر الإيجار اليومي:</span>
                <span className="text-base font-black text-white font-mono">
                  {car.dailyPriceEGP.toLocaleString()} <span className="text-xs text-[#c5a059] font-arabic font-normal">ج.م / يوم</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                <span>المالك:</span>
                <strong className="text-slate-200 truncate max-w-[170px]">{car.ownerName || 'أسطول الشركة'}</strong>
              </div>

              {/* شريط الإجراءات: تعديل شامل، تأجير، حذف */}
              <div className="pt-2 flex items-center gap-2">
                {car.status === 'available' ? (
                  <button
                    onClick={() => onOpenQuickBook(car)}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow"
                  >
                    <Calendar className="w-3.5 h-3.5" /> تأجير فوري
                  </button>
                ) : (
                  <div className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs text-center">
                    بالشارع حالياً
                  </div>
                )}

                {/* زر التعديل الشامل للسيارة */}
                {currentStaff.role === 'super_admin' && (
                  <button
                    onClick={() => onOpenEditCar(car)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-[#c5a059] text-slate-300 hover:text-black transition-all cursor-pointer border border-slate-700"
                    title="تعديل شامل للسيارة والصور والعداد"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}

                {currentStaff.role === 'super_admin' && (
                  <button
                    onClick={() => onDeleteCar(car.id, `${car.make} ${car.model}`)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
                    title="حذف السيارة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
