'use client';

import React from 'react';
import Image from 'next/image';
import { Filter, Plus, Calendar, Edit3, Trash2, Gauge, Shield, DollarSign } from 'lucide-react';
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
    <div className="space-y-5 animate-fadeIn">
      
      {/* شريط الفلترة والأزرار */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 ml-2">
            <Filter className="w-4 h-4 text-amber-500" />
            <span>تصفية الأسطول:</span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCarFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                carFilter === 'all' 
                  ? 'bg-[#081225] text-amber-400 shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الكل ({cars.length})
            </button>
            <button
              onClick={() => setCarFilter('available')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                carFilter === 'available' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              المتاحة ({availableCarsCount})
            </button>
            <button
              onClick={() => setCarFilter('rented')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                carFilter === 'rented' 
                  ? 'bg-amber-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
              }`}
            >
              المؤجرة ({rentedCarsCount})
            </button>
          </div>
        </div>

        {currentStaff.role === 'super_admin' && (
          <button
            onClick={onOpenAddCar}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> إضافة سيارة جديدة
          </button>
        )}
      </div>

      {/* بطاقات السيارات بتصميم فاخر وعملي */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCars.map((car) => (
          <div 
            key={car.id} 
            className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden hover:shadow-lg hover:border-amber-400/40 transition-all duration-300 flex flex-col group"
          >
            {/* صورة السيارة مع شارات الحالة */}
            <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
              <Image
                src={car.coverImage || car.images[0] || '/car-mercedes.jpg'}
                alt={`${car.make} ${car.model}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* شارة الحالة التشغيلية */}
              <div className="absolute top-3 right-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md backdrop-blur-md ${
                  car.status === 'available' 
                    ? 'bg-emerald-500/90 text-white border border-emerald-400/50' 
                    : car.status === 'rented' 
                    ? 'bg-amber-500/90 text-slate-950 border border-amber-400/50' 
                    : 'bg-rose-500/90 text-white border border-rose-400/50'
                }`}>
                  {car.status === 'available' ? '● متاح للتشغيل' :
                   car.status === 'rented' ? '● مؤجر حالياً' : '● صيانة'}
                </span>
              </div>

              {/* لوحة السيارة */}
              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 text-[11px] font-mono font-bold text-white shadow-sm">
                {car.plateNumber}
              </div>

              {/* معلومات السيارة السفلية */}
              <div className="absolute bottom-3 right-3 left-3">
                <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">{car.make}</p>
                <h4 className="text-base font-extrabold text-white">{car.model} {car.year}</h4>
              </div>
            </div>

            {/* تفاصيل السيارة التشغيلية والمالية */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">عداد المسافات:</span>
                  <span className="font-mono font-bold text-slate-800">{car.currentKm.toLocaleString()} كم</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">التأمين المسترد:</span>
                  <span className="font-mono font-bold text-slate-800">{car.securityDepositEGP.toLocaleString()} ج.م</span>
                </div>
              </div>

              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/50 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">سعر التأجير اليومي:</span>
                <span className="text-base font-black text-slate-900 font-mono">
                  {car.dailyPriceEGP.toLocaleString()} <span className="text-xs text-amber-700 font-arabic font-bold">ج.م / يوم</span>
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>جهة الملكية:</span>
                <strong className="text-slate-700 truncate max-w-[170px]">{car.ownerName || 'أسطول الشركة'}</strong>
              </div>

              {/* شريط الإجراءات: تأجير، تعديل، حذف */}
              <div className="pt-2 flex items-center gap-2">
                {car.status === 'available' ? (
                  <button
                    onClick={() => onOpenQuickBook(car)}
                    className="flex-1 py-2.5 rounded-xl bg-[#081225] hover:bg-[#0c1a35] text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow"
                  >
                    <Calendar className="w-3.5 h-3.5" /> تأجير فوري
                  </button>
                ) : (
                  <div className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs text-center border border-slate-200">
                    قيد التأجير بالشارع
                  </div>
                )}

                {/* زر التعديل الشامل للسيارة */}
                {currentStaff.role === 'super_admin' && (
                  <button
                    onClick={() => onOpenEditCar(car)}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 transition-all cursor-pointer border border-slate-200"
                    title="تعديل تفاصيل السيارة"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}

                {currentStaff.role === 'super_admin' && (
                  <button
                    onClick={() => onDeleteCar(car.id, `${car.make} ${car.model}`)}
                    className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer"
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
