'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowUpLeft, CalendarPlus, CarFront, Check, ChevronDown, Plus, Search, Settings2, Trash2, Wrench, X } from 'lucide-react';
import type { Booking, Car, StaffUser } from '@/types/fleet';
import type { CarFleetFilter } from '@/lib/car-lifecycle';
import CarRemovalPanel from './CarRemovalPanel';
import './fleet-cars.css';

const FLEET_STATUS_LABELS: Record<Car['status'], string> = { available: 'متاحة للتأجير', rented: 'مؤجرة', maintenance: 'تحت الصيانة', cleaning: 'تجهيز وغسيل', archived: 'مؤرشفة' };
interface Props {
  cars: Car[]; filteredCars: Car[]; bookings: Booking[];
  carFilter: CarFleetFilter;
  managementId: string | null; onManagementChange: (id: string | null) => void;
  setCarFilter: (filter: Props['carFilter']) => void;
  searchQuery: string; onSearchChange: (value: string) => void;
  availableCarsCount: number; rentedCarsCount: number; currentStaff: StaffUser;
  onOpenAddCar: () => void; onOpenEditCar: (car: Car) => void; onOpenDetails: (car: Car) => void;
  onOpenQuickBook: (car: Car) => void;
  onDeleteCar: (id: string) => Promise<boolean>;
  onUpdateStatus: (id: string, status: Car['status']) => Promise<boolean>;
  onArchiveChange: (id: string, archived: boolean) => Promise<boolean>;
  onCancelBooking: (booking: Booking, reason: string) => Promise<void>;
  onReturnBooking: (booking: Booking) => void;
  onOpenContract: (booking: Booking) => void;
}
function Management({ car, count, onClose, onEdit, onDelete, onStatus, children }: {
  car: Car; count: number; onClose: () => void; onEdit: () => void;
  onDelete: () => Promise<boolean>; onStatus: (status: Car['status']) => Promise<boolean>;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState(car.status);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const save = async () => {
    setBusy(true); setError(''); setMessage('');
    try { if (await onStatus(status)) setMessage('تم حفظ حالة السيارة.'); else setError('تعذر الحفظ. راجع تنبيه النظام وأعد المحاولة.'); }
    catch { setError('تعذر حفظ الحالة.'); } finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true); setError('');
    try { if (!await onDelete()) { setError('تعذر حذف السيارة. راجع التنبيه أعلى الصفحة.'); setConfirmDelete(false); } }
    catch { setError('تعذر حذف السيارة.'); } finally { setBusy(false); }
  };
  return <section id={`fleet-manage-${car.id}`} className="fleet-management" aria-label={`إدارة ${car.make} ${car.model}`}>
    <div className="fleet-management-title"><strong><Settings2 size={16} aria-hidden="true" />إدارة السيارة</strong><button disabled={busy} onClick={onClose} aria-label="إغلاق إجراءات السيارة"><X size={18} /></button></div>
    {car.status !== 'archived' && <><label htmlFor={`fleet-status-${car.id}`}>حالة التشغيل</label>
    <div className="fleet-status-editor"><select id={`fleet-status-${car.id}`} value={status} disabled={busy} onChange={(e) => { setStatus(e.target.value as Car['status']); setMessage(''); }}>{Object.entries(FLEET_STATUS_LABELS).filter(([value]) => value !== 'archived').map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button className="fleet-button fleet-button-primary" disabled={busy || status === car.status} onClick={save}>{busy ? 'جارٍ الحفظ…' : 'حفظ الحالة'}</button></div>
    <p className="fleet-help">حالة التشغيل تحدد التوفر فقط؛ لا تلغي حجزًا ولا تغلق عقدًا. للإزالة راجع الارتباطات أدناه.</p>
    <button className="fleet-edit-link" disabled={busy} onClick={onEdit}>تعديل بيانات السيارة وأسعارها <ArrowUpLeft size={15} aria-hidden="true" /></button></>}
    {children}
    {count === 0 && <div className="fleet-delete-area">{confirmDelete ? <div className="fleet-delete-confirm"><strong>تأكيد حذف {car.make} {car.model}؟</strong><p>هذا حذف نهائي للسيارة. سيعيد النظام التحقق من عدم ارتباطها بحجوزات قبل الحذف.</p><div><button className="fleet-button fleet-button-danger" disabled={busy} onClick={remove}>{busy ? 'جارٍ الحذف…' : 'نعم، حذف السيارة'}</button><button className="fleet-button" disabled={busy} onClick={() => setConfirmDelete(false)}>إلغاء</button></div></div> : <button className="fleet-delete-trigger" disabled={busy} onClick={() => setConfirmDelete(true)}><Trash2 size={16} aria-hidden="true" />حذف السيارة نهائيًا</button>}</div>}
    <div aria-live="polite">{message && <p className="fleet-success"><Check size={15} aria-hidden="true" />{message}</p>}{error && <p className="fleet-error" role="alert">{error}</p>}</div>
  </section>;
}
export default function FleetCarsTab({ cars, filteredCars, bookings, carFilter, setCarFilter, searchQuery, onSearchChange,
  availableCarsCount, rentedCarsCount, currentStaff, onOpenAddCar, onOpenEditCar, onOpenDetails, onOpenQuickBook, onDeleteCar, onUpdateStatus,
  managementId, onManagementChange: setManagementId, onArchiveChange, onCancelBooking, onReturnBooking, onOpenContract }: Props) {
  const [notice, setNotice] = useState('');
  const admin = currentStaff.role === 'super_admin';
  const serviceCount = cars.filter((car) => car.status === 'maintenance' || car.status === 'cleaning').length;
  const bookingCounts = new Map<string, number>();
  bookings.forEach((booking) => bookingCounts.set(booking.carId, (bookingCounts.get(booking.carId) || 0) + 1));
  return <section className="fleet-page" aria-label="إدارة السيارات">
    <header className="fleet-heading"><div><span className="fleet-eyebrow">إدارة الأسطول</span><h1>السيارات<span>.</span></h1><p>كل سيارة، حالتها وخطوتك التالية. في مكان واحد.</p></div>{admin && <button className="fleet-button fleet-button-primary" onClick={onOpenAddCar}><Plus size={18} aria-hidden="true" />إضافة سيارة</button>}</header>
    {notice && <p role="status" className="fleet-success fleet-notice">{notice}</p>}
    <div className="fleet-summary" aria-label="ملخص الأسطول"><div><span>السيارات في الأسطول</span><strong>{cars.filter((car) => car.status !== 'archived').length.toLocaleString('ar-EG')}</strong><CarFront size={21} aria-hidden="true" /></div><div><span>متاحة للتأجير</span><strong>{availableCarsCount.toLocaleString('ar-EG')}</strong><i className="fleet-dot is-available" /></div><div><span>مؤجرة حاليًا</span><strong>{rentedCarsCount.toLocaleString('ar-EG')}</strong><i className="fleet-dot is-rented" /></div><div><span>صيانة وتجهيز</span><strong>{serviceCount.toLocaleString('ar-EG')}</strong><Wrench size={20} aria-hidden="true" /></div></div>
    <div className="fleet-toolbar"><label className="fleet-search"><Search size={19} aria-hidden="true" /><span className="sr-only">البحث في السيارات</span><input type="search" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} placeholder="اسم السيارة، رقم اللوحة، أو المالك…" /></label><div className="fleet-filters" aria-label="تصفية حالة السيارات">{[
      { value: 'all', label: 'الأسطول', count: cars.filter((car) => car.status !== 'archived').length }, { value: 'available', label: 'متاحة', count: availableCarsCount },
      { value: 'rented', label: 'مؤجرة', count: rentedCarsCount }, { value: 'maintenance', label: 'صيانة وتجهيز', count: serviceCount },
      { value: 'archived', label: 'الأرشيف', count: cars.filter((car) => car.status === 'archived').length },
    ].map(({ value, label, count }) => <button key={value} aria-pressed={carFilter === value} className={carFilter === value ? 'is-active' : ''} onClick={() => setCarFilter(value as Props['carFilter'])}>{label}<span>{count.toLocaleString('ar-EG')}</span></button>)}</div></div>
    <div className="fleet-results-label"><span>{filteredCars.length.toLocaleString('ar-EG')} سيارة في العرض</span><span>اختر «التفاصيل» للسجل، أو «إدارة» للحالة والإجراءات.</span></div>
    <div className="fleet-cards">{filteredCars.map((car) => {
      const count = bookingCounts.get(car.id) || 0;
      const open = managementId === car.id;
      return <article className={`fleet-card ${open ? 'has-management' : ''}`} key={car.id}>
        <div className="fleet-card-main"><button className="fleet-card-photo" onClick={() => onOpenDetails(car)} aria-label={`تفاصيل ${car.make} ${car.model}، لوحة ${car.plateNumber}`}><Image src={car.coverImage || car.images?.[0] || '/car-mercedes.jpg'} alt={`${car.make} ${car.model}`} fill sizes="(max-width: 640px) 112px, (max-width: 1100px) 50vw, 33vw" className="object-cover" /></button><div className="fleet-card-info"><div className="fleet-card-meta"><span className={`fleet-state is-${car.status}`}><i />{FLEET_STATUS_LABELS[car.status]}</span><span className="fleet-year">{car.year}</span></div><button className="fleet-car-title" onClick={() => onOpenDetails(car)}><span>{car.make}</span><strong>{car.model}</strong></button><span className="fleet-plate" dir="auto">{car.plateNumber}</span><p className="fleet-owner">{car.ownerName || (car.ownership === 'company' ? 'أسطول الشركة' : 'المالك غير مسجل')}</p></div></div>
        <div className="fleet-card-facts"><div><span>الإيجار اليومي</span><strong>{car.dailyPriceEGP.toLocaleString('ar-EG')} <small>ج.م</small></strong></div><div><span>العداد</span><strong>{car.currentKm.toLocaleString('ar-EG')} <small>كم</small></strong></div><div><span>سجل الحجوزات</span><strong>{count.toLocaleString('ar-EG')} <small>حجز</small></strong></div></div>
        <div className={`fleet-card-actions ${!admin ? 'is-staff' : ''}`}><button className="fleet-button fleet-button-primary" onClick={() => onOpenDetails(car)}>التفاصيل <ArrowUpLeft size={16} aria-hidden="true" /></button><button className="fleet-button" onClick={() => onOpenQuickBook(car)} disabled={car.status !== 'available'} title={car.status !== 'available' ? 'الحجز متاح عندما تكون حالة السيارة متاحة للتأجير' : 'إنشاء حجز لهذه السيارة'}><CalendarPlus size={16} aria-hidden="true" />حجز</button>{admin && <button className={`fleet-button ${open ? 'is-open' : ''}`} onClick={() => setManagementId(open ? null : car.id)} aria-expanded={open} aria-controls={`fleet-manage-${car.id}`}><Settings2 size={16} aria-hidden="true" />إدارة<ChevronDown size={14} aria-hidden="true" /></button>}</div>
        {admin && open && <Management key={`${car.id}-${car.status === 'archived'}`} car={car} count={count} onClose={() => setManagementId(null)} onEdit={() => onOpenEditCar(car)} onDelete={() => onDeleteCar(car.id)} onStatus={(status) => onUpdateStatus(car.id, status)}>
          <CarRemovalPanel car={car} bookings={bookings} onArchive={async (archived) => {
            const saved = await onArchiveChange(car.id, archived);
            if (saved) { setNotice(archived ? 'تمت أرشفة السيارة. ستجدها في فلتر الأرشيف مع سجلها كاملًا.' : 'عادت السيارة إلى الأسطول بحالة صيانة للفحص قبل إتاحتها للحجز.'); setManagementId(null); }
            return saved;
          }} onCancelBooking={onCancelBooking} onReturnBooking={onReturnBooking} onContract={onOpenContract} onHistory={() => onOpenDetails(car)} />
        </Management>}
      </article>;
    })}</div>
    {!filteredCars.length && <div className="fleet-empty"><CarFront size={36} aria-hidden="true" /><h2>{cars.length ? 'لا توجد سيارات تطابق البحث' : 'أسطولك يبدأ من هنا'}</h2><p>{cars.length ? 'جرّب اسمًا أو لوحة أخرى، أو اعرض جميع الحالات.' : 'أضف أول سيارة لتظهر حالتها وحجوزاتها هنا.'}</p>{cars.length ? <button className="fleet-button" onClick={() => { onSearchChange(''); setCarFilter('all'); }}>إزالة الفلاتر</button> : admin && <button className="fleet-button fleet-button-primary" onClick={onOpenAddCar}>إضافة أول سيارة</button>}</div>}
  </section>;
}
