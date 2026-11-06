'use client';

import { useState } from 'react';
import { 
  ArrowUpLeft, 
  ArrowDownUp, 
  CarFront, 
  Check, 
  Plus, 
  Search, 
  Settings2, 
  Trash2, 
  X, 
  LayoutGrid, 
  List, 
  TrendingUp,
  Camera
} from 'lucide-react';
import type { Booking, Car, StaffUser } from '@/types/fleet';
import type { CarFleetFilter } from '@/lib/car-lifecycle';
import CarRemovalPanel from './CarRemovalPanel';
import { summarizeFleetBookings } from '@/lib/fleet-booking-summary';
import FleetCarRow from './FleetCarRow';
import FleetCarCompactRow from './FleetCarCompactRow';
import CarDisplayOrder from './CarDisplayOrder';
import { sortCarsForDisplay } from '@/lib/car-display-order';
import './fleet-cars.css';

const FLEET_STATUS_LABELS: Record<Car['status'], string> = { 
  available: 'متاحة للتأجير', 
  rented: 'مؤجرة', 
  maintenance: 'تحت الصيانة', 
  cleaning: 'تجهيز وغسيل', 
  archived: 'مؤرشفة' 
};

interface Props {
  onSaveOrder?: (ids: string[]) => Promise<void>;
  cars: Car[];
  filteredCars: Car[];
  bookings: Booking[];
  carFilter: CarFleetFilter;
  managementId: string | null;
  onManagementChange: (id: string | null) => void;
  setCarFilter: (filter: Props['carFilter']) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  availableCarsCount: number;
  rentedCarsCount: number;
  currentStaff: StaffUser;
  onOpenAddCar: () => void;
  onOpenEditCar: (car: Car, initialStep?: number) => void;
  onOpenDetails: (car: Car) => void;
  onOpenQuickBook: (car: Car) => void;
  onDeleteCar: (id: string) => Promise<boolean>;
  onUpdateStatus: (id: string, status: Car['status']) => Promise<boolean>;
  onArchiveChange: (id: string, archived: boolean) => Promise<boolean>;
  onCancelBooking: (booking: Booking, reason: string) => Promise<void>;
  onReturnBooking: (booking: Booking) => void;
  onOpenContract: (booking: Booking) => void;
}

function Management({ car, count, onClose, onEdit, onEditImages, onDelete, onStatus, children }: {
  car: Car;
  count: number;
  onClose: () => void;
  onEdit: () => void;
  onEditImages?: () => void;
  onDelete: () => Promise<boolean>;
  onStatus: (status: Car['status']) => Promise<boolean>;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState(car.status);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const save = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      if (await onStatus(status)) setMessage('تم حفظ حالة السيارة بنجاح.');
      else setError('تعذر الحفظ. راجع تنبيه النظام وأعد المحاولة.');
    } catch { setError('تعذر حفظ الحالة.'); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true); setError('');
    try {
      if (!await onDelete()) { setError('تعذر حذف السيارة. راجع التنبيه أعلى الصفحة.'); setConfirmDelete(false); }
    } catch { setError('تعذر حذف السيارة.'); }
    finally { setBusy(false); }
  };

  return (
    <section id={`fleet-manage-${car.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3" aria-label={`إدارة ${car.make} ${car.model}`}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <strong className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Settings2 size={15} className="text-slate-600" aria-hidden="true" />
          إدارة تشغيل: {car.make} {car.model}
        </strong>
        <button
          disabled={busy}
          onClick={onClose}
          aria-label="إغلاق إجراءات السيارة"
          className="w-7 h-7 rounded-lg grid place-items-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {car.status !== 'archived' && (
        <div className="space-y-2">
          <label htmlFor={`fleet-status-${car.id}`} className="block text-xs font-bold text-slate-700">
            حالة التشغيل الحالية
          </label>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              id={`fleet-status-${car.id}`}
              value={status}
              disabled={busy}
              onChange={(e) => { setStatus(e.target.value as Car['status']); setMessage(''); }}
              className="flex-1 min-w-[180px] h-9 px-3 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            >
              {Object.entries(FLEET_STATUS_LABELS)
                .filter(([value]) => value !== 'archived')
                .map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
            </select>
            <button
              className="px-3.5 h-9 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 text-xs font-bold transition-colors whitespace-nowrap shadow-xs"
              disabled={busy || status === car.status}
              onClick={save}
            >
              {busy ? 'جارٍ الحفظ…' : 'حفظ الحالة'}
            </button>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            * تغيير حالة التشغيل يحدد التوفر للحجز فقط؛ لا يلغي حجزاً مؤكداً ولا يغلق عقداً سارياً.
          </p>
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <button
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 underline transition-colors"
              disabled={busy}
              onClick={onEdit}
            >
              تعديل مواصفات وأسعار السيارة بالكامل <ArrowUpLeft size={13} aria-hidden="true" />
            </button>
            {onEditImages && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-800 transition-colors shadow-2xs"
                disabled={busy}
                onClick={onEditImages}
              >
                <Camera size={13} className="text-[#c5a059]" />
                إدارة وتعديل الصور مباشرة
              </button>
            )}
          </div>
        </div>
      )}

      {children}

      {count === 0 && (
        <div className="pt-2 border-t border-slate-200">
          {confirmDelete ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <strong className="text-xs font-bold text-rose-900 block">
                تأكيد حذف {car.make} {car.model} نهائياً؟
              </strong>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                هذا حذف دائم لا يمكن التراجع عنه. سيعيد النظام التأكد من خلو سجل السيارة من أي حجوزات.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold transition-colors shadow-xs"
                  disabled={busy}
                  onClick={remove}
                >
                  {busy ? 'جارٍ الحذف…' : 'نعم، حذف السيارة'}
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium"
                  disabled={busy}
                  onClick={() => setConfirmDelete(false)}
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <button
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium transition-colors"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={13} aria-hidden="true" />
              حذف السيارة من النظام نهائياً
            </button>
          )}
        </div>
      )}

      <div aria-live="polite">
        {message && (
          <p className="mt-1 text-xs font-semibold text-emerald-700 flex items-center gap-1">
            <Check size={13} /> {message}
          </p>
        )}
        {error && (
          <p className="mt-1 text-xs font-semibold text-rose-700 flex items-center gap-1" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

export default function FleetCarsTab({
  onSaveOrder,
  cars,
  filteredCars,
  bookings,
  carFilter,
  setCarFilter,
  searchQuery,
  onSearchChange,
  availableCarsCount,
  rentedCarsCount,
  currentStaff,
  onOpenAddCar,
  onOpenEditCar,
  onOpenDetails,
  onOpenQuickBook,
  onDeleteCar,
  onUpdateStatus,
  managementId,
  onManagementChange: setManagementId,
  onArchiveChange,
  onCancelBooking,
  onReturnBooking,
  onOpenContract,
}: Props) {
  const [notice, setNotice] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const admin = currentStaff?.role === 'super_admin';
  const canAddCar = admin || currentStaff?.role === 'fleet_entry';
  const canBook = admin || currentStaff?.role === 'rental_agent';
  const activeCount = cars.filter(car => car.status !== 'archived').length;
  const maintenanceCount = cars.filter(car => car.status === 'maintenance' || car.status === 'cleaning').length;
  const archivedCount = cars.filter(car => car.status === 'archived').length;
  const occupancyRate = activeCount > 0 ? Math.round((rentedCarsCount / activeCount) * 100) : 0;

  const filters: { value: CarFleetFilter; label: string; count: number; dot?: string }[] = [
    { value: 'all', label: 'الأسطول', count: activeCount },
    { value: 'available', label: 'متاحة', count: availableCarsCount, dot: 'bg-emerald-500' },
    { value: 'rented', label: 'مؤجرة', count: rentedCarsCount, dot: 'bg-amber-500' },
    { value: 'maintenance', label: 'صيانة', count: maintenanceCount, dot: 'bg-rose-500' },
    { value: 'archived', label: 'الأرشيف', count: archivedCount },
  ];

  const summaries = summarizeFleetBookings(bookings);
  const clearFilters = () => {
    onSearchChange('');
    setCarFilter('all');
  };

  const renderManagementDrawer = (car: Car, count: number) => (
    admin ? (
      <Management
        key={`${car.id}-${car.status === 'archived'}`}
        car={car}
        count={count}
        onClose={() => setManagementId(null)}
        onEdit={() => onOpenEditCar(car)}
        onEditImages={() => onOpenEditCar(car, 2)}
        onDelete={() => onDeleteCar(car.id)}
        onStatus={(status) => onUpdateStatus(car.id, status)}
      >
        <CarRemovalPanel
          car={car}
          bookings={bookings}
          onArchive={async (archived) => {
            const saved = await onArchiveChange(car.id, archived);
            if (saved) {
              setNotice(
                archived
                  ? 'تمت أرشفة السيارة. ستجدها في فلتر الأرشيف مع سجلها كاملاً.'
                  : 'عادت السيارة إلى الأسطول بحالة صيانة للفحص قبل إتاحتها للحجز.'
              );
              setManagementId(null);
            }
            return saved;
          }}
          onCancelBooking={onCancelBooking}
          onReturnBooking={onReturnBooking}
          onContract={onOpenContract}
          onHistory={() => onOpenDetails(car)}
        />
      </Management>
    ) : null
  );

  return (
    <section className="space-y-3 max-w-[1600px] mx-auto text-slate-800" aria-label="إدارة أسطول السيارات">
      
      {/* 1. Fleet Operations Console (Unified, High-Density, Zero Wasted Space) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
        
        {/* Right side: Title & Live Filter Switchboard */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 flex-shrink-0">
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">الأسطول</h2>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700" title="معدل الإشغال">
              <TrendingUp size={11} className="text-slate-500" />
              {occupancyRate}%
            </span>
          </div>

          {/* Integrated Status Tabs with Live Count Badges */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            {filters.map((filter) => {
              const active = carFilter === filter.value;
              return (
                <button
                  type="button"
                  key={filter.value}
                  onClick={() => setCarFilter(filter.value)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {filter.dot && <span className={`w-1.5 h-1.5 rounded-full ${filter.dot}`} />}
                  <span>{filter.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    active ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {filter.count.toLocaleString('ar-EG')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Left side: Search & Operations Controls */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap mr-auto lg:mr-0">
          {/* Instant Search */}
          <div className="relative flex-1 sm:w-56 min-w-[160px]">
            <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="بحث بالماركة، اللوحة، الكود…"
              className="w-full h-8 pr-7 pl-6 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                title="مسح البحث"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="عرض البطاقات"
            >
              <LayoutGrid size={13} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="عرض جدول التشغيل المدمج"
            >
              <List size={13} />
            </button>
          </div>

          {/* Reordering Website Display */}
          {admin && onSaveOrder && (
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
              aria-expanded={ordering}
              onClick={() => setOrdering(!ordering)}
              title="ترتيب ظهور السيارات في موقع الزوار"
            >
              <ArrowDownUp size={12} className="text-slate-500" />
              <span className="hidden sm:inline">الترتيب</span>
            </button>
          )}

          {/* Add Car Primary Button */}
          {canAddCar && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-colors shadow-xs shrink-0 cursor-pointer"
              onClick={onOpenAddCar}
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>إضافة سيارة</span>
            </button>
          )}
        </div>
      </div>

      {/* Website Reordering Modal */}
      {ordering && onSaveOrder && (
        <CarDisplayOrder
          cars={cars}
          onSave={async (ids) => {
            await onSaveOrder(ids);
            setNotice('تم حفظ ترتيب ظهور السيارات في موقع الزوار بنجاح.');
          }}
          onClose={() => setOrdering(false)}
        />
      )}

      {/* Notice Banner */}
      {notice && (
        <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Check size={13} className="text-emerald-600" />
            <span>{notice}</span>
          </div>
          <button type="button" onClick={() => setNotice('')} className="text-slate-400 hover:text-slate-700">
            <X size={13} />
          </button>
        </div>
      )}

      {/* 2. Cars Layout (Dual Mode: Automotive Grid or Runway Dispatch Table) */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
          {sortCarsForDisplay(filteredCars).map((car) => {
            const history = summaries.get(car.id);
            const count = history?.total ?? 0;
            const open = managementId === car.id;

            return (
              <FleetCarRow
                key={car.id}
                car={car}
                history={history}
                admin={admin}
                canBook={canBook}
                open={open}
                onDetails={() => onOpenDetails(car)}
                onBook={() => onOpenQuickBook(car)}
                onEdit={() => onOpenEditCar(car)}
                onEditImages={() => onOpenEditCar(car, 2)}
                onManage={() => setManagementId(open ? null : car.id)}
              >
                {open && renderManagementDrawer(car, count)}
              </FleetCarRow>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {sortCarsForDisplay(filteredCars).map((car) => {
            const history = summaries.get(car.id);
            const count = history?.total ?? 0;
            const open = managementId === car.id;

            return (
              <FleetCarCompactRow
                key={car.id}
                car={car}
                history={history}
                admin={admin}
                canBook={canBook}
                open={open}
                onDetails={() => onOpenDetails(car)}
                onBook={() => onOpenQuickBook(car)}
                onEdit={() => onOpenEditCar(car)}
                onEditImages={() => onOpenEditCar(car, 2)}
                onManage={() => setManagementId(open ? null : car.id)}
              >
                {open && renderManagementDrawer(car, count)}
              </FleetCarCompactRow>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!filteredCars.length && (
        <div className="p-8 text-center flex flex-col items-center justify-center gap-2 bg-white border border-dashed border-slate-300 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <CarFront size={20} aria-hidden="true" />
          </div>
          <h3 className="text-xs font-bold text-slate-900">
            {cars.length ? 'لا توجد سيارات تطابق الفلتر المحدد' : 'أسطولك يبدأ من هنا'}
          </h3>
          <p className="text-[11px] text-slate-500 max-w-sm">
            {cars.length
              ? 'جرّب البحث باسم أو رقم لوحة أخرى، أو اضغط على إزالة الفلاتر.'
              : 'أضف أول سيارة لتظهر حالتها، أسعارها، وتفاصيل حجوزاتها هنا.'}
          </p>
          {cars.length ? (
            <button
              type="button"
              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
              onClick={clearFilters}
            >
              إلغاء الفلاتر
            </button>
          ) : (
            admin && (
              <button
                type="button"
                className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-colors"
                onClick={onOpenAddCar}
              >
                إضافة أول سيارة
              </button>
            )
          )}
        </div>
      )}
    </section>
  );
}
