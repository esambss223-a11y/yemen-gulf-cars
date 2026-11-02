'use client';

import React, { useState, useMemo } from 'react';
import { Customer, Booking, CustomerTier, CustomerSource } from '@/types/fleet';
import { 
  Users, 
  Search, 
  UserPlus, 
  Star, 
  ShieldCheck, 
  AlertTriangle, 
  LayoutGrid, 
  List, 
  X,
  CreditCard,
  Globe
} from 'lucide-react';
import CustomerCard from './CustomerCard';
import CustomerRow from './CustomerRow';
import CustomerDetailsModal from '../modals/CustomerDetailsModal';

interface CustomersTabProps {
  customers: Customer[];
  bookings?: Booking[];
  onOpenAddCustomer: () => void;
  onOpenEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string, name: string) => void;
  onNewBookingForCustomer?: (customer: Customer) => void;
  onOpenContract?: (booking: Booking) => void;
}

const getCustomerSource = (customer: Customer): CustomerSource =>
  customer.source || (customer.id.startsWith('web-') ? 'website' : 'office');

export default function CustomersTab({
  customers,
  bookings = [],
  onOpenAddCustomer,
  onOpenEditCustomer,
  onDeleteCustomer,
  onNewBookingForCustomer,
  onOpenContract,
}: CustomersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | CustomerTier>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | CustomerSource>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);

  // Address lookup helper
  const getCustomerAddress = (cust: Customer) => {
    if (cust.address) {
      return {
        address: cust.address,
        governorate: cust.governorate || '',
      };
    }
    const matchingContract = bookings.find(
      b => (b.customer.id === cust.id || b.customer.phone === cust.phone || b.customer.nationalId === cust.nationalId) &&
           b.contractRecord?.details?.tenantAddress
    )?.contractRecord?.details;

    return {
      address: matchingContract?.tenantAddress || '',
      governorate: cust.governorate || matchingContract?.governorate || '',
    };
  };

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const term = searchTerm.toLowerCase().trim();
      const addr = getCustomerAddress(c);
      const matchesSearch =
        !term ||
        c.fullName.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        (c.whatsapp && c.whatsapp.includes(term)) ||
        c.nationalId.includes(term) ||
        c.licenseNumber.toLowerCase().includes(term) ||
        (c.nationality && c.nationality.toLowerCase().includes(term)) ||
        (addr.address && addr.address.toLowerCase().includes(term)) ||
        (addr.governorate && addr.governorate.toLowerCase().includes(term));

      const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
      const source = getCustomerSource(c);
      const matchesSource = sourceFilter === 'all' || source === sourceFilter;
      return matchesSearch && matchesTier && matchesSource;
    });
  }, [customers, searchTerm, tierFilter, sourceFilter, bookings]);

  // Telemetry metrics
  const vipGoldCount = customers.filter(c => c.tier === 'vip_gold').length;
  const vipSilverCount = customers.filter(c => c.tier === 'vip_silver').length;
  const blacklistCount = customers.filter(c => c.tier === 'blacklist').length;
  const webPendingCount = customers.filter(c => getCustomerSource(c) === 'website' && !c.identityVerified).length;
  const totalSpentAll = customers.reduce((sum, c) => sum + (c.totalSpentEGP || 0), 0);

  return (
    <div className="space-y-3 max-w-[1600px] mx-auto text-slate-800 font-arabic" dir="rtl">
      {/* 1. Header & Live CRM Telemetry */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">سجل العملاء وإدارة العلاقات (CRM)</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {customers.length.toLocaleString('ar-EG')} مسجل
            </span>
          </div>

          {/* Telemetry Capsules */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold">
              <Star size={11} className="fill-amber-500 text-amber-500" />
              <span>VIP: {vipGoldCount + vipSilverCount}</span>
            </span>

            {webPendingCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 font-bold">
                <Globe size={11} className="text-sky-600" />
                <span>طلبات الموقع: {webPendingCount}</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              <CreditCard size={11} className="text-emerald-600" />
              <span>إجمالي المعاملات: {totalSpentAll.toLocaleString('ar-EG')} ج.م</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAddCustomer}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-colors shadow-xs cursor-pointer"
        >
          <UserPlus size={14} />
          <span>تسجيل عميل جديد</span>
        </button>
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
            placeholder="بحث فوري: الاسم، الهاتف، العنوان، السكن، البطاقة، أو الرخصة…"
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
            { value: 'all', label: 'الكل', count: customers.length },
            { value: 'vip_gold', label: 'VIP ذهبي', count: vipGoldCount },
            { value: 'vip_silver', label: 'VIP فضي', count: vipSilverCount },
            { value: 'regular', label: 'منتظم', count: customers.filter(c => c.tier === 'regular' || !c.tier).length },
            { value: 'blacklist', label: 'محظور', count: blacklistCount },
          ].map((item) => {
            const active = tierFilter === item.value;
            return (
              <button
                type="button"
                key={item.value}
                onClick={() => setTierFilter(item.value as any)}
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

      {/* 3. Customer Items Presentation */}
      {filteredCustomers.length === 0 ? (
        <div className="p-10 text-center flex flex-col items-center justify-center gap-2 bg-white border border-dashed border-slate-300 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Users size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {searchTerm ? 'لا توجد نتائج تطابق معايير البحث' : 'لا يوجد عملاء مسجلين في هذا القسم'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            {searchTerm ? 'جرّب تعديل كلمة البحث أو إزالة الفلاتر المحددة.' : 'يمكنك إضافة عميل جديد بالضغط على زر تسجيل عميل أعلاه.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
          {filteredCustomers.map((cust) => (
            <CustomerCard
              key={cust.id}
              customer={cust}
              addressInfo={getCustomerAddress(cust)}
              onOpenDetails={setSelectedCustomerForDetails}
              onOpenEdit={onOpenEditCustomer}
              onDelete={onDeleteCustomer}
              onNewBooking={onNewBookingForCustomer}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filteredCustomers.map((cust) => (
            <CustomerRow
              key={cust.id}
              customer={cust}
              addressInfo={getCustomerAddress(cust)}
              onOpenDetails={setSelectedCustomerForDetails}
              onOpenEdit={onOpenEditCustomer}
              onDelete={onDeleteCustomer}
              onNewBooking={onNewBookingForCustomer}
            />
          ))}
        </div>
      )}

      {/* 4. Customer Details Modal */}
      {selectedCustomerForDetails && (
        <CustomerDetailsModal
          customer={selectedCustomerForDetails}
          bookings={bookings}
          isOpen={Boolean(selectedCustomerForDetails)}
          onClose={() => setSelectedCustomerForDetails(null)}
          onEdit={(c) => {
            setSelectedCustomerForDetails(null);
            onOpenEditCustomer(c);
          }}
          onNewBooking={(c) => {
            setSelectedCustomerForDetails(null);
            onNewBookingForCustomer?.(c);
          }}
          onOpenContract={onOpenContract}
        />
      )}
    </div>
  );
}
