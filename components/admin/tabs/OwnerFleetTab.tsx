'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Car, VehicleOwner, OwnerCompensationType } from '@/types/fleet';
import { 
  Key, 
  Search, 
  Plus, 
  FileText, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  Car as CarIcon
} from 'lucide-react';

interface OwnerFleetTabProps {
  cars: Car[];
  owners: VehicleOwner[];
  onOpenAddCar: () => void;
  onOpenEditCar: (car: Car) => void;
  onOpenSettlement: (owner: VehicleOwner) => void;
  onSelectCarBooking?: (car: Car) => void;
}

export default function OwnerFleetTab({
  cars,
  owners,
  onOpenAddCar,
  onOpenEditCar,
  onOpenSettlement,
  onSelectCarBooking,
}: OwnerFleetTabProps) {
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'rented' | 'available' | 'maintenance'>('all');

  // فقط السيارات التابعة للمستثمرين / الملاك الخارجيين
  const investorCars = cars.filter(c => c.ownership === 'investor' || (c.ownerId && c.ownerId !== 'owner-1'));

  // الملاك الذين لديهم سيارات في الأسطول
  const activeOwners = owners.filter(o => o.id !== 'owner-1');

  // تصفية السيارات
  const filteredCars = investorCars.filter(car => {
    const matchesOwner = selectedOwnerId === 'all' || car.ownerId === selectedOwnerId;
    const matchesStatus = statusFilter === 'all' || car.status === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      !term ||
      car.make.toLowerCase().includes(term) ||
      car.model.toLowerCase().includes(term) ||
      car.plateNumber.includes(term) ||
      (car.ownerName && car.ownerName.toLowerCase().includes(term));

    return matchesOwner && matchesStatus && matchesSearch;
  });

  // حساب الإحصائيات المالية لأسطول الملاك
  const totalInvestorCars = investorCars.length;
  const activeRentedInvestorCars = investorCars.filter(c => c.status === 'rented').length;
  const utilizationRate = totalInvestorCars > 0 ? Math.round((activeRentedInvestorCars / totalInvestorCars) * 100) : 0;
  
  // تقدير إجمالي التزامات إيجار الملاك الشهرية
  const monthlyFixedCommitment = investorCars
    .filter(c => c.ownerCompensationType === 'fixed_monthly')
    .reduce((sum, c) => sum + (c.ownerAgreedRateEGP || 0), 0);

  const getCompensationLabel = (car: Car) => {
    switch (car.ownerCompensationType) {
      case 'fixed_monthly':
        return (
          <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold">
            شهري ثابت: {(car.ownerAgreedRateEGP || 35000).toLocaleString()} ج.م
          </span>
        );
      case 'fixed_daily':
        return (
          <span className="text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold">
            يومي مقطوع: {(car.ownerAgreedRateEGP || 1200).toLocaleString()} ج.م/يوم
          </span>
        );
      case 'percentage':
        return (
          <span className="text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold">
            نسبة تشغيل: {car.ownerAgreedRateEGP || 75}% للمالك
          </span>
        );
      default:
        return (
          <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-mono text-[11px]">
            عقد مشاركة
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn font-arabic">
      
      {/* 1. الترويسة الرئيسية والإحصائيات المالية لأسطول الملاك */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" /> إدارة أسطول الملاك الخارجيين والعقود التشغيلية
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة سيارات الشركاء والملاك المستأجرة، شروط العقود (شهري / يومي / نسبة)، وأداء كل سيارة
            </p>
          </div>
          
          <button
            onClick={onOpenAddCar}
            className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> إضافة سيارة مالك للأسطول
          </button>
        </div>

        {/* بطاقات المؤشرات المالية والتشغيلية */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] text-slate-500 font-medium">سيارات الملاك بالأسطول</span>
            <p className="text-lg font-black text-slate-900 font-mono mt-0.5">{totalInvestorCars} سيارة</p>
          </div>
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80">
            <span className="text-[11px] text-blue-800 font-medium">مؤجرة حالياً في الشارع</span>
            <p className="text-lg font-black text-blue-700 font-mono mt-0.5">{activeRentedInvestorCars} سيارة</p>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
            <span className="text-[11px] text-emerald-800 font-medium">معدل تشغيل سيارات الملاك</span>
            <p className="text-lg font-black text-emerald-700 font-mono mt-0.5">{utilizationRate}%</p>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
            <span className="text-[11px] text-amber-800 font-medium">التزامات العقود الشهرية</span>
            <p className="text-lg font-black text-amber-700 font-mono mt-0.5">{monthlyFixedCommitment.toLocaleString()} ج.م</p>
          </div>
        </div>
      </div>

      {/* 2. شريط التصفية والبحث واختيار المالك */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* حقل البحث */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث بالسيارة، الموديل، رقم اللوحة، أو اسم المالك..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs bg-slate-50/60 font-arabic"
          />
        </div>

        {/* قائمة اختيار المالك للتصفية */}
        <div className="flex items-center gap-2">
          <select
            value={selectedOwnerId}
            onChange={(e) => setSelectedOwnerId(e.target.value)}
            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">جميع الملاك والمستثمرين</option>
            {activeOwners.map(owner => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>

          {/* تصفية الحالة */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">كل الحالات</option>
            <option value="rented">مؤجرة حالياً</option>
            <option value="available">متاحة للتأجير</option>
            <option value="maintenance">صيانة</option>
          </select>
        </div>
      </div>

      {/* 3. قائمة سيارات الملاك وعقودها */}
      {filteredCars.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm">
          <CarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h5 className="font-bold text-slate-700 text-sm">لا توجد سيارات ملاك مطابقة</h5>
          <p className="text-xs text-slate-400 mt-1">
            لم يتم العثور على سيارات للمالك المحدد أو لا توجد سيارات تطابق الفلتر
          </p>
          <button
            onClick={onOpenAddCar}
            className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> إضافة سيارة مستأجرة من مالك
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCars.map((car) => {
            const ownerObj = owners.find(o => o.id === car.ownerId);
            return (
              <div
                key={car.id}
                className="bg-white border border-slate-200/90 hover:border-amber-400/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* صورة السيارة وشارة الحالة */}
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    <Image
                      src={car.coverImage || car.images[0] || '/car-mercedes.jpg'}
                      alt={`${car.make} ${car.model}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                    {/* شارة الحالة أعلى الصورة */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black shadow-md ${
                        car.status === 'available' ? 'bg-emerald-500 text-white' :
                        car.status === 'rented' ? 'bg-blue-600 text-white' :
                        'bg-amber-500 text-black'
                      }`}>
                        {car.status === 'available' ? '● متاح' :
                         car.status === 'rented' ? '● مؤجر حالياً' : '● صيانة'}
                      </span>
                    </div>

                    {/* لوحة السيارة والموديل أسفل الصورة */}
                    <div className="absolute bottom-3 right-3 left-3 text-white">
                      <h5 className="font-black text-sm drop-shadow-md">
                        {car.make} {car.model} {car.year}
                      </h5>
                      <div className="flex items-center justify-between text-xs text-slate-200 mt-0.5">
                        <span className="font-mono bg-black/50 px-2 py-0.5 rounded border border-white/20">
                          {car.plateNumber}
                        </span>
                        <span className="text-[11px] text-amber-300 font-bold">
                          سعر التأجير: {car.dailyPriceEGP.toLocaleString()} ج.م/يوم
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* بيانات المالك والعقد */}
                  <div className="p-4 space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">المالك / المستثمر:</span>
                        <strong className="text-xs text-slate-900 font-bold">
                          {car.ownerName || ownerObj?.name || 'غير محدد'}
                        </strong>
                      </div>

                      {ownerObj?.phone && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">هاتف المالك:</span>
                          <span className="font-mono text-slate-700 font-semibold dir-ltr">{ownerObj.phone}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                        <span className="text-xs text-slate-500">طبيعة العقد والبدل:</span>
                        {getCompensationLabel(car)}
                      </div>
                    </div>

                    {/* تفاصيل الكيلومتر والتأمين */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">العداد الحالي</span>
                        <strong className="font-mono text-slate-800">{car.currentKm.toLocaleString()} كم</strong>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">انتهاء التأمين</span>
                        <strong className="font-mono text-slate-800 text-[11px]">
                          {car.insuranceExpiryDate || 'ساري'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* أزرار الإجراءات */}
                <div className="p-4 pt-0 flex items-center gap-2">
                  {ownerObj && (
                    <button
                      onClick={() => onOpenSettlement(ownerObj)}
                      className="flex-1 py-2 bg-[#081225] hover:bg-[#0c1a35] text-amber-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> كشف حساب المالك
                    </button>
                  )}

                  <button
                    onClick={() => onOpenEditCar(car)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    title="تعديل بيانات العقد والسيارة"
                  >
                    تعديل
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
