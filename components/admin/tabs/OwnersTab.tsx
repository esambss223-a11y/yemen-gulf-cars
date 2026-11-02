'use client';

import React, { useState, useMemo } from 'react';
import { VehicleOwner, Car, StaffUser, Booking } from '@/types/fleet';
import { 
  Users, 
  Plus, 
  Car as CarIcon, 
  DollarSign, 
  TrendingUp, 
  Search, 
  CheckCircle2, 
  LayoutGrid,
  List,
  X
} from 'lucide-react';
import OwnerCard from './OwnerCard';
import OwnerRow from './OwnerRow';

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
  const [commissionFilter, setCommissionFilter] = useState<'all' | 'fixed_monthly' | 'percentage' | 'fixed_daily'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [expandedOwnerId, setExpandedOwnerId] = useState<string | null>(null);

  // Fast metrics
  const investorCars = useMemo(() => cars.filter(c => c.ownership === 'investor' || (c.ownerId && c.ownerId !== 'owner-1')), [cars]);
  const rentedCars = useMemo(() => investorCars.filter(c => c.status === 'rented'), [investorCars]);
  const externalOwners = useMemo(() => owners.filter(o => o.id !== 'owner-1'), [owners]);
  const monthlySalaryOwnersCount = useMemo(() => owners.filter(o => o.commissionModel === 'fixed_monthly').length, [owners]);

  // Filter owners
  const filteredOwners = useMemo(() => {
    return owners.filter((owner) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        owner.name.toLowerCase().includes(term) ||
        owner.phone.includes(term) ||
        (owner.nationalId && owner.nationalId.includes(term)) ||
        (owner.bankAccount && owner.bankAccount.toLowerCase().includes(term)) ||
        (owner.notes && owner.notes.toLowerCase().includes(term));

      const matchesCommission = commissionFilter === 'all' || owner.commissionModel === commissionFilter;
      return matchesSearch && matchesCommission;
    });
  }, [owners, searchTerm, commissionFilter]);

  const canEdit = currentStaff.role === 'super_admin';

  return (
    <div className="space-y-3 max-w-[1600px] mx-auto text-slate-800 font-arabic" dir="rtl">
      {/* 1. Header & Live Investor Telemetry */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">إدارة الملاك والشركاء (حسابات وأسطول الاستثمار)</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {externalOwners.length.toLocaleString('ar-EG')} شريك
            </span>
          </div>

          {/* Telemetry Capsules */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-bold">
              <CarIcon size={11} className="text-slate-600" />
              <span>سيارات الاستثمار: {investorCars.length}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              <CheckCircle2 size={11} className="text-emerald-600" />
              <span>مؤجرة بالشارع: {rentedCars.length}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-bold">
              <DollarSign size={11} className="text-amber-600" />
              <span>عقود شهرية: {monthlySalaryOwnersCount}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAddCar && (
            <button
              type="button"
              onClick={onOpenAddCar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              <CarIcon size={13} className="text-slate-600" />
              <span>ربط سيارة مستأجرة</span>
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={onOpenAddOwner}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>تسجيل مالك / شريك جديد</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Unified Intelligent Controls Strip */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 p-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث فوري: الاسم، الهاتف، البطاقة، أو الحساب البنكي…"
            className="w-full h-8 pr-8 pl-8 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              title="مسح البحث"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {[
            { value: 'all', label: 'الكل', count: owners.length },
            { value: 'fixed_monthly', label: 'مرتب شهري', count: owners.filter(o => o.commissionModel === 'fixed_monthly').length },
            { value: 'percentage', label: 'نسبة أرباح', count: owners.filter(o => o.commissionModel === 'percentage').length },
            { value: 'fixed_daily', label: 'مقطوع يومي', count: owners.filter(o => o.commissionModel === 'fixed_daily').length },
          ].map((item) => {
            const active = commissionFilter === item.value;
            return (
              <button
                type="button"
                key={item.value}
                onClick={() => setCommissionFilter(item.value as any)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{item.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  active ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {item.count.toLocaleString('ar-EG')}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 border-t md:border-t-0 md:border-r border-slate-200 pt-1 md:pt-0 md:pr-2 mr-auto md:mr-0">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="عرض البطاقات"
          >
            <LayoutGrid size={14} />
            <span className="hidden lg:inline text-[11px]">بطاقات</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              viewMode === 'table'
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="عرض الجدول المدمج"
          >
            <List size={14} />
            <span className="hidden lg:inline text-[11px]">جدول مدمج</span>
          </button>
        </div>
      </div>

      {/* 3. Owners Presentation */}
      {filteredOwners.length === 0 ? (
        <div className="p-10 text-center flex flex-col items-center justify-center gap-2 bg-white border border-dashed border-slate-300 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Users size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {searchTerm ? 'لا توجد نتائج تطابق معايير البحث' : 'لا يوجد ملاك أو شركاء مسجلين'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            {searchTerm ? 'جرّب تعديل كلمة البحث أو إزالة الفلاتر المحددة.' : 'يمكنك إضافة شريك جديد بالضغط على زر تسجيل مالك / شريك جديد.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
          {filteredOwners.map((owner) => {
            const ownerCarsList = cars.filter(c => c.ownerId === owner.id);
            return (
              <OwnerCard
                key={owner.id}
                owner={owner}
                ownerCars={ownerCarsList}
                isExpanded={expandedOwnerId === owner.id}
                onToggleExpand={() => setExpandedOwnerId(expandedOwnerId === owner.id ? null : owner.id)}
                onOpenSettlement={onOpenSettlement}
                onOpenEdit={onOpenEditOwner}
                onOpenEditCar={onOpenEditCar}
                canEdit={canEdit}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filteredOwners.map((owner) => {
            const ownerCarsList = cars.filter(c => c.ownerId === owner.id);
            return (
              <OwnerRow
                key={owner.id}
                owner={owner}
                ownerCars={ownerCarsList}
                onOpenSettlement={onOpenSettlement}
                onOpenEdit={onOpenEditOwner}
                canEdit={canEdit}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
