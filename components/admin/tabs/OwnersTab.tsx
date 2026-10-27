'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { VehicleOwner, Car, StaffUser, Booking } from '@/types/fleet';
import { 
  Users, 
  Plus, 
  FileText, 
  Edit3, 
  Car as CarIcon, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Phone, 
  Search, 
  CreditCard, 
  Building, 
  CheckCircle2, 
  Clock, 
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Shield,
  Wrench,
  AlertTriangle,
  Gauge,
  Hash,
  Sparkles
} from 'lucide-react';

interface OwnersTabProps {
  owners: VehicleOwner[];
  cars: Car[];
  bookings?: Booking[];
  currentStaff: StaffUser;
  onOpenAddOwner: () => void;
  onOpenEditOwner: (owner: VehicleOwner) => void;
  onOpenSettlement: (owner: VehicleOwner) => void;
  onOpenAddCar?: () => void;
  onOpenEditCar?: (car: Car) => void;
}

export default function OwnersTab({
  owners,
  cars,
  bookings = [],
  currentStaff,
  onOpenAddOwner,
  onOpenEditOwner,
  onOpenSettlement,
  onOpenAddCar,
  onOpenEditCar,
}: OwnersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // إحصائيات عامة
  const investorCars = cars.filter(c => c.ownership === 'investor' || (c.ownerId && c.ownerId !== 'owner-1'));
  const rentedCars = investorCars.filter(c => c.status === 'rented');
  const externalOwners = owners.filter(o => o.id !== 'owner-1');

  // تصفية الملاك
  const filteredOwners = owners.filter(owner => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      owner.name.toLowerCase().includes(term) ||
      owner.phone.includes(term) ||
      (owner.nationalId && owner.nationalId.includes(term)) ||
      (owner.notes && owner.notes.toLowerCase().includes(term))
    );
  });

  const getContractBadge = (owner: VehicleOwner) => {
    switch (owner.commissionModel) {
      case 'fixed_monthly':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <DollarSign className="w-3.5 h-3.5 text-amber-600" />
            مرتب شهري ثابت: <strong className="font-mono">{(owner.fixedMonthlyRateEGP || 35000).toLocaleString('ar-EG')} ج.م</strong>
            <span className="text-[10px] text-amber-700">(يوم {owner.monthlyPayoutDay || 1})</span>
          </span>
        );
      case 'fixed_daily':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            إيجار يومي مقطوع: <strong className="font-mono">{(owner.fixedDailyRateEGP || 1200).toLocaleString('ar-EG')} ج.م/يوم</strong>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            نسبة مشاركة الأرباح: <strong className="font-mono">{owner.ownerSharePercent || 75}%</strong> للمالك
          </span>
        );
    }
  };

  // شارة فحص وصلاحية الرخصة
  const getLicenseBadge = (licenseExpiryDate?: string, licenseRenewalDate?: string) => {
    if (!licenseExpiryDate) {
      return (
        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
          رخصة غير مسجلة
        </span>
      );
    }
    const today = new Date();
    const expiry = new Date(licenseExpiryDate);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" /> رخصة منتهية ({licenseExpiryDate})
        </span>
      );
    }
    if (diffDays <= 30) {
      return (
        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" /> تجديد خلال {diffDays} يوم ({licenseRenewalDate || licenseExpiryDate})
        </span>
      );
    }
    return (
      <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> رخصة سارية حتى {licenseExpiryDate}
      </span>
    );
  };

  // شارة جدولة الصيانة الدورية
  const getMaintenanceCard = (car: Car) => {
    if (!car.nextServiceKm && !car.nextServiceDate) {
      return null;
    }
    const remainingKm = car.nextServiceKm ? car.nextServiceKm - car.currentKm : null;
    const isDueSoon = remainingKm !== null && remainingKm <= 1000;

    return (
      <div className={`p-2 rounded-lg text-[11px] border flex items-center justify-between ${
        isDueSoon 
          ? 'bg-amber-50/90 border-amber-300 text-amber-900' 
          : 'bg-slate-50 border-slate-200 text-slate-700'
      }`}>
        <div className="flex items-center gap-1.5">
          <Wrench className={`w-3.5 h-3.5 ${isDueSoon ? 'text-amber-600 animate-bounce' : 'text-slate-400'}`} />
          <div>
            <span className="font-bold">
              صيانة: {car.nextServiceKm ? `${car.nextServiceKm.toLocaleString()} كم` : ''} 
              {car.nextServiceDate ? ` (${car.nextServiceDate})` : ''}
            </span>
            <span className="text-[10px] block text-slate-500">
              المسؤول: {car.serviceResponsibleParty === 'owner' ? 'المالك' : 'الشركة'}
            </span>
          </div>
        </div>
        {remainingKm !== null && (
          <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
            isDueSoon ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-800'
          }`}>
            {remainingKm > 0 ? `متبقي ${remainingKm.toLocaleString()} كم` : 'مستحقة الآن!'}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="admin-section admin-section-owners space-y-4 animate-fadeIn font-arabic">
      
      {/* 1. الترويسة الرئيسية + الإحصائيات السريعة الفاتحة والمريحة */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" /> إدارة الملاك والشركاء (حسابات وأسطول السيارات)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              إدارة شاملة للملاك، أكواد السيارات، العدادات لحظة الاستلام، مواعيد الرخص وتجديدها، وجدولة الصيانة الدورية
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenAddCar && (
              <button
                onClick={onOpenAddCar}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
              >
                <CarIcon className="w-4 h-4 text-amber-600" /> إضافة سيارة مستأجرة
              </button>
            )}

            {currentStaff.role === 'super_admin' && (
              <button
                onClick={onOpenAddOwner}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> إضافة مالك / شريك جديد
              </button>
            )}
          </div>
        </div>

        {/* كروت الإحصاءات الثلاثية الواضحة */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">إجمالي الشركاء والملاك</span>
              <strong className="text-xl font-black text-slate-900 font-mono mt-0.5 block">{externalOwners.length} شريك</strong>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-blue-700 block">سيارات الملاك بالأسطول</span>
              <strong className="text-xl font-black text-blue-900 font-mono mt-0.5 block">{investorCars.length} سيارات</strong>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <CarIcon className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-700 block">مؤجرة حالياً في الشارع</span>
              <strong className="text-xl font-black text-emerald-900 font-mono mt-0.5 block">{rentedCars.length} سيارة</strong>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. شريط البحث السريع والواضح */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم المالك، الرقم القومي، رقم الهاتف، أو كود السيارة..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs bg-slate-50/60 font-arabic"
          />
        </div>
      </div>

      {/* 3. قائمة بطاقات الملاك الشاملة والسهلة (Master Owner Cards) */}
      <div className="space-y-4">
        {filteredOwners.map(owner => {
          const ownerCarsList = cars.filter(c => c.ownerId === owner.id);
          const isCompany = owner.id === 'owner-1';

          return (
            <div
              key={owner.id}
              className="bg-white border border-slate-200/90 hover:border-amber-400/50 rounded-2xl shadow-xs overflow-hidden transition-all"
            >
              {/* شريط رأس المالك العريض والمريح */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                
                {/* بيانات المالك الأساسية */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#0b1322] text-[#c5a059] flex items-center justify-center font-black text-base shadow-sm shrink-0">
                    {owner.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-black text-slate-900 text-sm sm:text-base">{owner.name}</h5>
                      {isCompany && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-200 text-slate-700">
                          أسطول الشركة
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-mono font-bold text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {owner.phone}
                      </span>
                      {owner.nationalId && (
                        <span className="flex items-center gap-1 text-slate-700 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                          <User className="w-3.5 h-3.5 text-amber-500" /> بطاقة/جواز: <strong>{owner.nationalId}</strong>
                        </span>
                      )}
                      {owner.bankAccount && (
                        <span className="flex items-center gap-1 text-slate-600 font-mono text-[11px]">
                          • <CreditCard className="w-3.5 h-3.5 text-slate-400" /> {owner.bankAccount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* نظام العقد والأزرار في اليسار */}
                <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end flex-wrap">
                  {getContractBadge(owner)}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenSettlement(owner)}
                      className="px-4 py-2 bg-[#081225] hover:bg-[#0e1d38] text-amber-400 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> كشف الحساب
                    </button>

                    {currentStaff.role === 'super_admin' && (
                      <button
                        onClick={() => onOpenEditOwner(owner)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-200"
                        title="تعديل بيانات المالك"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* قسم سيارات المالك التابعة له في نفس الكرت */}
              <div className="p-4 sm:p-5 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CarIcon className="w-4 h-4 text-amber-500" /> السيارات المسجلة لهذا المالك ({ownerCarsList.length} سيارات)
                  </span>

                  {onOpenAddCar && (
                    <button
                      onClick={onOpenAddCar}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> ربط سيارة جديدة
                    </button>
                  )}
                </div>

                {ownerCarsList.length === 0 ? (
                  <div className="py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    لا توجد سيارات مسجلة لهذا المالك حالياً.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {ownerCarsList.map(car => {
                      const activeBooking = bookings.find(b => b.carId === car.id && b.status === 'active');
                      const kmConsumed = Math.max(0, car.currentKm - (car.initialHandoverKm || 0));

                      return (
                        <div
                          key={car.id}
                          className="p-3.5 rounded-xl border border-slate-200/90 hover:border-amber-400/50 bg-slate-50/50 hover:bg-white transition-all flex flex-col justify-between group shadow-2xs"
                        >
                          <div>
                            {/* الصورة + الشارة + كود العربية */}
                            <div className="relative h-36 w-full rounded-lg overflow-hidden bg-slate-900 mb-2.5">
                              <Image
                                src={car.coverImage || car.images[0] || '/car-mercedes.jpg'}
                                alt={`${car.make} ${car.model}`}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />

                              {/* كود العربية في الزاوية العلوية اليمنى */}
                              <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                                {car.carCode && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-[#0b1322] text-[#c5a059] border border-[#c5a059]/60 shadow-md">
                                    كود: {car.carCode}
                                  </span>
                                )}
                              </div>

                              {/* شارة الحالة في الزاوية العلوية اليسرى */}
                              <div className="absolute top-2 left-2 z-10">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black shadow-xs ${
                                  car.status === 'available' ? 'bg-emerald-500 text-white' :
                                  car.status === 'rented' ? 'bg-blue-600 text-white' :
                                  car.status === 'cleaning' ? 'bg-sky-500 text-white' : 'bg-amber-500 text-black'
                                }`}>
                                  {car.status === 'available' ? '● متاح' :
                                   car.status === 'rented' ? '● مؤجر' :
                                   car.status === 'cleaning' ? '● غسيل' : car.status === 'archived' ? 'مؤرشفة' : '● صيانة'}
                                </span>
                              </div>

                              {/* اللوحة والموديل في الأسفل */}
                              <div className="absolute bottom-2 right-2 left-2 flex items-center justify-between text-white text-xs">
                                <strong className="font-bold drop-shadow-sm truncate">{car.make} {car.model} ({car.year})</strong>
                                <span className="font-mono text-[10px] bg-black/70 px-1.5 py-0.5 rounded border border-white/20 shrink-0 mr-1">
                                  {car.plateNumber}
                                </span>
                              </div>
                            </div>

                            {/* مواصفات السيارة وعقدها */}
                            <div className="space-y-2 text-xs">
                              
                              {/* بطاقة عداد الاستلام والاستهلاك */}
                              <div className="p-2 rounded-lg bg-slate-100/80 border border-slate-200/80 space-y-1 text-[11px]">
                                <div className="flex justify-between items-center text-slate-600">
                                  <span>العداد عند الاستلام:</span>
                                  <span className="font-mono font-bold text-slate-800">{(car.initialHandoverKm || 0).toLocaleString()} كم</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600">
                                  <span>العداد الحالي:</span>
                                  <span className="font-mono font-bold text-slate-900">{car.currentKm.toLocaleString()} كم</span>
                                </div>
                                <div className="flex justify-between items-center text-emerald-700 font-bold pt-1 border-t border-slate-200">
                                  <span>استهلاك تشغيل الشركة:</span>
                                  <span className="font-mono">+{kmConsumed.toLocaleString()} كم</span>
                                </div>
                              </div>

                              {/* مرتب واستحقاق السيارة */}
                              <div className="flex items-center justify-between text-xs py-1 px-1 bg-amber-50/50 rounded-lg border border-amber-200/60">
                                <span className="text-amber-900 font-medium text-[11px]">مرتب / استحقاق السيارة:</span>
                                <strong className="font-mono text-amber-800 font-black">
                                  {car.ownerCompensationType === 'fixed_monthly' 
                                    ? `${(car.ownerAgreedRateEGP || 35000).toLocaleString()} ج.م / شهر`
                                    : car.ownerCompensationType === 'fixed_daily'
                                    ? `${(car.ownerAgreedRateEGP || 1200).toLocaleString()} ج.م / يوم`
                                    : `${car.ownerAgreedRateEGP || 75}% من الإيراد`}
                                </strong>
                              </div>

                              {/* مدة تعاقد السيارة */}
                              {(car.contractStartDate || car.contractEndDate) && (
                                <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-100/60 px-2 py-1 rounded">
                                  <span>مدة تعاقد السيارة:</span>
                                  <span className="font-mono font-bold text-slate-700">
                                    {car.contractStartDate || '---'} إلى {car.contractEndDate || '---'}
                                  </span>
                                </div>
                              )}

                              {/* رخصة السيارة وتاريخ التجديد */}
                              <div className="flex items-center justify-between pt-0.5">
                                <span className="text-[10px] text-slate-500 font-medium">حالة الرخصة:</span>
                                {getLicenseBadge(car.licenseExpiryDate, car.licenseRenewalDate)}
                              </div>

                              {/* الصيانة الدورية */}
                              {getMaintenanceCard(car)}

                              {/* بيان العميل المستأجر إن كانت مؤجرة */}
                              {activeBooking ? (
                                <div className="p-2 rounded-lg bg-blue-50 border border-blue-200/60 text-[11px] text-blue-900 space-y-0.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold">المستأجر الحالي:</span>
                                    <strong className="font-bold">{activeBooking.customer.fullName}</strong>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-blue-700">
                                    <span>الإرجاع المتوقع:</span>
                                    <span className="font-mono font-bold">{activeBooking.endDate} ({activeBooking.endTime})</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200/50 text-[11px] text-emerald-800 text-center font-bold">
                                  جاهزة للتسليم الفوري
                                </div>
                              )}
                            </div>
                          </div>

                          {/* أزرار الإجراء السريع */}
                          {onOpenEditCar && (
                            <div className="pt-2.5 mt-2.5 border-t border-slate-200/60 flex items-center justify-end">
                              <button
                                onClick={() => onOpenEditCar(car)}
                                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> تعديل بيانات السيارة
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
