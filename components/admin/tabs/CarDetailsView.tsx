'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Edit3, FileText, Gauge, KeyRound, Phone, Search, ShieldCheck, Users, Wrench, ArrowRight } from 'lucide-react';
import type { Booking, BookingStatus, Car, StaffUser, VehicleOwner } from '@/types/fleet';
import { getCarImages } from '@/lib/car-images';
import { BOOKING_STATUS_LABELS, bookingsOnDay, cairoToday, calendarMonth, carHistory, carRentalTotals, filterCarHistory } from '@/lib/car-record';
import '../modals/car-details.css';


const num = (n: number) => Number.isFinite(n) ? n.toLocaleString('ar-EG') : '—';
function date(value?: string) {
  if (!value) return 'غير مسجل';
  const d = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('ar-EG', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
}
const carStatus = { available: 'متاحة للتأجير', rented: 'مؤجرة حاليًا', maintenance: 'تحت الصيانة', cleaning: 'تجهيز وغسيل', archived: 'مؤرشفة' };
const category = { vip: 'VIP', suv: 'دفع رباعي', luxury_sedan: 'سيدان فاخرة', economy: 'اقتصادية' };
const fuel = { petrol: 'بنزين', diesel: 'ديزل', electric: 'كهربائية', hybrid: 'هجين' };
const compensation = { fixed_monthly: 'إيجار شهري ثابت', fixed_daily: 'إيجار يومي ثابت', percentage: 'نسبة من الإيراد' };
function Facts({ entries }: { entries: [string, string | number | undefined][] }) {
  return <dl className="car-record-facts">{entries.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value == null || value === '' ? 'غير مسجل' : value}</dd></div>)}</dl>;
}

interface Props {
  car: Car; bookings: Booking[]; owner?: VehicleOwner; currentStaff: StaffUser;
  onClose: () => void; onEdit: () => void; onOpenContract: (booking: Booking) => void;
  onManage?: () => void;
}
export default function CarDetailsView({ car, bookings, owner, currentStaff, onClose, onEdit, onOpenContract, onManage }: Props) {

  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const historyRef = useRef<HTMLElement>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [section, setSection] = useState<'history' | 'calendar' | 'specs'>('history');
  const scrollHistory = useRef(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState<'all' | BookingStatus>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState(() => { const today = cairoToday(); return new Date(`${today.slice(0, 7)}-01T12:00:00Z`); });
  const images = getCarImages(car);
  const history = useMemo(() => carHistory(bookings, car.id), [bookings, car.id]);
  const totals = carRentalTotals(history);
  const financial = currentStaff.role === 'super_admin' || currentStaff.role === 'accountant';
  const compensationKind = car.ownerCompensationType || owner?.commissionModel;
  const filtered = filterCarHistory(history, from, to, status).filter((booking) => !query.trim() ||
    `${booking.customer.fullName} ${booking.customer.phone} ${booking.bookingNumber} ${booking.staffName}`.toLowerCase().includes(query.trim().toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / 6));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 6, currentPage * 6);
  const rangeError = !!(from && to && from > to);
  const today = cairoToday();
  const active = history.find((booking) => booking.status === 'active');
  const next = [...history].reverse().find((booking) => booking.status === 'confirmed' && booking.endDate >= today);
  const featured = active || next;
  const calendar = calendarMonth(month.getUTCFullYear(), month.getUTCMonth());
  const monthTitle = month.toLocaleDateString('ar-EG', { timeZone: 'UTC', month: 'long', year: 'numeric' });

  useEffect(() => { closeRef.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    if (section === 'history' && scrollHistory.current) {
      scrollHistory.current = false;
      historyRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      historyRef.current?.focus({ preventScroll: true });
    }
  }, [section]);
  const jump = (id: string) => setSection(id === 'car-record-schedule' ? 'calendar' : id === 'car-record-specs' ? 'specs' : 'history');
  const daySelected = (value: string) => {
    setFrom(value); setTo(value); setPage(1); setStatus('all');
    scrollHistory.current = true;
    setSection('history');
  };
  return <div className="car-record-layer car-record-page font-arabic" dir="rtl">
    <section ref={dialogRef} className="car-record-dialog" role="region" aria-labelledby="car-record-title">
      <header className="car-record-header"><div><span>السيارات / التفاصيل</span><h2 id="car-record-title">{car.make} {car.model}</h2></div>
        <div className="car-record-header-actions">{currentStaff.role === 'super_admin' && car.status !== 'archived' && <button className="car-record-button" onClick={onEdit}><Edit3 size={16} aria-hidden="true" />تعديل البيانات</button>}
          {currentStaff.role === 'super_admin' && onManage && <button className="car-record-button" onClick={onManage}>إدارة الحجوزات والإزالة</button>}
          <button ref={closeRef} onClick={onClose} aria-label="رجوع إلى السيارات" className="car-record-close"><ArrowRight size={18} /><span>رجوع للسيارات</span></button></div>
      </header>
      <div className="car-record-body">
        <div className="car-record-hero">
          <div className="car-record-gallery"><div className="car-record-photo"><Image src={images[Math.min(imageIndex, images.length - 1)]} alt={`${car.make} ${car.model} — صورة ${imageIndex + 1}`} fill sizes="(max-width: 760px) 100vw, 520px" className="object-cover" /><span className={`car-record-status is-${car.status}`}>{carStatus[car.status]}</span><span className="car-record-photo-count">{imageIndex + 1} / {images.length}</span></div>
            {images.length > 1 && <div className="car-record-thumbnails" aria-label="صور السيارة">{images.map((src, index) => <button key={src} onClick={() => setImageIndex(index)} aria-label={`عرض صورة ${index + 1}`} aria-pressed={imageIndex === index} className={imageIndex === index ? 'is-selected' : ''}><Image src={src} alt="" fill sizes="64px" className="object-cover" /></button>)}</div>}
          </div>
          <div className="car-record-intro"><span className="car-record-eyebrow">{category[car.category]} · موديل {car.year}</span><h3>{car.make}<br /><strong>{car.model}</strong></h3><div className="car-record-identifiers"><span dir="auto">{car.plateNumber}</span>{car.carCode && <span dir="ltr">{car.carCode}</span>}</div>
            <div className="car-record-owner-summary"><KeyRound size={19} aria-hidden="true" /><div><small>{car.ownership === 'investor' ? 'المالك / الشريك' : 'جهة الملكية'}</small><strong>{owner?.name || car.ownerName || (car.ownership === 'company' ? 'أسطول الشركة' : 'غير مسجل')}</strong></div></div>
            <p className="car-record-price">{num(car.dailyPriceEGP)} <span>ج.م / يوم</span></p>
            {featured ? <div className="car-record-next"><CalendarDays size={19} aria-hidden="true" /><div><strong>{active ? 'العقد الجاري' : 'الحجز المؤكد التالي'}</strong><span>{date(featured.startDate)} — {date(featured.endDate)}</span><span>{featured.customer.fullName}</span>{active && active.endDate < today && <span className="car-record-overdue">تجاوز موعد الإرجاع المتفق عليه، والعقد ما زال جاريًا.</span>}</div></div> : <p className="car-record-no-next">لا يوجد عقد جارٍ أو حجز مؤكد قادم مسجل.</p>}
          </div>
        </div>
        <div className="car-record-metrics" aria-label="إحصائيات السيارة طوال الوقت">
          <article><span><KeyRound size={16} aria-hidden="true" />مرات التأجير الفعلية</span><strong>{num(totals.rentals)}</strong><small>العقود الجارية والمكتملة</small></article>
          <article><span><Clock3 size={16} aria-hidden="true" />أيام التعاقد</span><strong>{num(totals.days)}</strong><small>أيام العقود الجارية والمكتملة</small></article>
          <article><span><CalendarDays size={16} aria-hidden="true" />حجوزات مؤكدة</span><strong>{num(totals.confirmed)}</strong><small>لم تتحول بعد إلى عقود جارية</small></article>
          <article className="car-record-value"><span>{financial ? 'قيمة عقود التأجير' : 'عقود مكتملة'}</span><strong>{num(financial ? totals.contractValue : totals.completed)}</strong><small>{financial ? 'ج.م · دون التأمين، وليست المتحصل النقدي' : 'تم إنهاء التأجير والاستلام'}</small></article>
        </div>
        <nav className="car-record-nav" aria-label="أقسام تفاصيل السيارة"><button aria-pressed={section === 'history'} onClick={() => jump('car-record-history')}><Users size={16} aria-hidden="true" />سجل المستأجرين</button><button aria-pressed={section === 'calendar'} onClick={() => jump('car-record-schedule')}><CalendarDays size={16} aria-hidden="true" />التقويم</button><button aria-pressed={section === 'specs'} onClick={() => jump('car-record-specs')}><FileText size={16} aria-hidden="true" />بيانات السيارة والمالك</button></nav>

        <section id="car-record-schedule" hidden={section !== 'calendar'} tabIndex={-1} className="car-record-panel car-record-calendar-section">
          <div className="car-record-section-heading"><div><span>01 / المواعيد</span><h3>متى تكون السيارة محجوزة؟</h3><p>اضغط على يوم لعرض حجوزاته وأسماء المستأجرين.</p></div><div className="car-record-month-controls"><button aria-label="الشهر السابق" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1, 12)))}><ChevronRight size={19} /></button><strong aria-live="polite">{monthTitle}</strong><button aria-label="الشهر التالي" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1, 12)))}><ChevronLeft size={19} /></button></div></div>
          <div className="car-record-calendar"><div className="car-record-weekdays">{['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'].map((day) => <span key={day}>{day}</span>)}</div><div className="car-record-days">{Array.from({ length: calendar.offset }, (_, i) => <span key={`blank-${i}`} />)}{calendar.dates.map(({ day, date: value }) => {
            const rows = bookingsOnDay(history, value); const approved = rows.some((b) => b.status === 'active' || b.status === 'confirmed'); const completed = rows.some((b) => b.status === 'completed'); const pending = rows.some((b) => b.status === 'pending_approval');
            return <button key={value} onClick={() => daySelected(value)} className={`${approved ? 'is-booked' : completed ? 'is-completed' : pending ? 'is-pending' : ''} ${value === today ? 'is-today' : ''} ${from === value && to === value ? 'is-chosen' : ''}`} aria-label={`${date(value)}، ${rows.length ? `${rows.length} حجوزات مسجلة` : 'لا توجد حجوزات مسجلة'}`} aria-pressed={from === value && to === value}><span>{num(day)}</span>{rows.length > 0 && <i aria-hidden="true" />}</button>;
          })}</div></div>
          <div className="car-record-legend"><span><i className="is-booked" />عقد جارٍ / حجز مؤكد</span><span><i className="is-completed" />عقد مكتمل</span><span><i className="is-pending" />طلب قيد المراجعة</span></div><p className="car-record-caption">التقويم يعتمد على المواعيد المتفق عليها، ولا يعني أن اليوم محجوز بالكامل. راجع ساعات الاستلام والإرجاع أدناه. عدم وجود حجز لا يغيّر حالة الصيانة أو التوفر، ولا ينهي عقدًا جاريًا تجاوز موعد إرجاعه.</p>
        </section>

        <section ref={historyRef} id="car-record-history" hidden={section !== 'history'} tabIndex={-1} className="car-record-panel">
          <div className="car-record-section-heading"><div><span>02 / سجل التأجير</span><h3>من استأجر السيارة خلال الفترة؟</h3><p>اسم المستأجر، الموظف المسؤول، ومواعيد الاستلام والإرجاع لكل عقد.</p></div><span className="car-record-count">{num(filtered.length)} نتيجة</span></div>
          <div className="car-record-filters"><label>من تاريخ<input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} /></label><label>إلى تاريخ<input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} /></label><label>حالة الحجز<select value={status} onChange={(e) => { setStatus(e.target.value as 'all' | BookingStatus); setPage(1); }}><option value="all">كل الحالات</option>{Object.entries(BOOKING_STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="car-record-search"><span><Search size={14} aria-hidden="true" />بحث في سجل السيارة</span><input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="اسم المستأجر أو الموظف أو رقم العقد" /></label></div>
          <div className="car-record-filter-note"><p>تظهر الحجوزات التي تتقاطع مع الفترة المختارة، حتى لو بدأت قبلها. الإحصائيات أعلى الملف تشمل كل الفترات.</p>{(from || to || query || status !== 'all') && <button onClick={() => { setFrom(''); setTo(''); setStatus('all'); setQuery(''); setPage(1); }}>عرض السجل كاملًا</button>}</div>
          {rangeError && <p className="car-record-range-error" role="alert">تاريخ البداية يجب أن يسبق تاريخ النهاية.</p>}
          <div className="car-record-bookings" aria-live="polite">{!visible.length ? <div className="car-record-empty"><CalendarDays size={28} aria-hidden="true" /><strong>{history.length ? 'لا توجد حجوزات تطابق الفترة أو البحث.' : 'لم تسجّل حجوزات لهذه السيارة بعد.'}</strong><p>ستظهر هنا العقود والمستأجرون عند تسجيل أول حجز.</p></div> : visible.map((booking) => <article key={booking.id} className={`car-record-booking booking-${booking.status}`}>
            <div className="car-record-booking-top"><span className={`car-record-booking-status is-${booking.status}`}>{BOOKING_STATUS_LABELS[booking.status]}</span><span dir="ltr" className="car-record-booking-number">{booking.bookingNumber}</span></div>
            <div className="car-record-booking-grid"><div className="car-record-renter"><small>المستأجر</small><strong>{booking.customer.fullName || 'غير مسجل'}</strong>{booking.customer.phone && <span className="car-record-customer-phone"><Phone size={13} aria-hidden="true" /><bdi>{booking.customer.phone}</bdi></span>}<small>أجّرها له: <b>{booking.staffName || 'غير مسجل'}</b></small>{booking.approvedByStaffName && <small>اعتمد الحجز: {booking.approvedByStaffName}</small>}</div>
              <div className="car-record-booking-period"><div><small>من / الاستلام</small><strong>{date(booking.startDate)}</strong><span dir="ltr">{booking.startTime?.slice(0, 5) || '14:00'}</span></div><ArrowLeft size={18} aria-hidden="true" /><div><small>إلى / الإرجاع المتفق عليه</small><strong>{date(booking.endDate)}</strong><span dir="ltr">{booking.endTime?.slice(0, 5) || '14:00'}</span></div></div>
              <div className="car-record-booking-amount"><strong>{num(booking.daysCount)} <small>يوم</small></strong>{financial && <span>{num(booking.finalTotalEGP)} ج.م <small>قيمة العقد دون التأمين</small></span>}{!['pending_approval', 'cancelled'].includes(booking.status) && <button onClick={() => onOpenContract(booking)}><FileText size={14} aria-hidden="true" />عرض العقد</button>}</div>
            </div>{booking.actualReturnDate && <p className="car-record-return"><Check size={14} aria-hidden="true" />الإرجاع الفعلي: {date(booking.actualReturnDate)}</p>}{booking.notes && <details className="car-record-booking-notes"><summary>ملاحظات الحجز</summary><p>{booking.notes}</p></details>}
          </article>)}</div>
          {pages > 1 && <div className="car-record-pagination"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>السابق</button><span>صفحة {num(currentPage)} من {num(pages)}</span><button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>التالي</button></div>}
        </section>

        <section id="car-record-specs" hidden={section !== 'specs'} tabIndex={-1} className="car-record-spec-grid">
          <article className="car-record-panel"><div className="car-record-section-heading"><div><span>03 / الملكية</span><h3><KeyRound size={20} aria-hidden="true" />المالك واتفاق التشغيل</h3></div></div><Facts entries={[
            ['جهة الملكية', car.ownership === 'company' ? 'ملك الشركة' : 'مالك / شريك خارجي'], ['اسم المالك', owner?.name || car.ownerName || (car.ownership === 'company' ? 'أسطول الشركة' : undefined)],
            ['بداية التعاقد', date(car.contractStartDate)], ['نهاية التعاقد', date(car.contractEndDate)], ['دخول الأسطول', date(car.fleetEntryDate)],
            ...(financial ? [['هاتف المالك', owner?.phone], ['نظام الاتفاق', compensationKind ? compensation[compensationKind] : undefined],
              ['القيمة المتفق عليها', compensationKind === 'percentage' ? owner?.ownerSharePercent === undefined ? undefined : `${num(owner.ownerSharePercent)}٪` : car.ownerAgreedRateEGP === undefined ? undefined : `${num(car.ownerAgreedRateEGP)} ج.م`],
              ['يوم صرف المستحقات', owner?.monthlyPayoutDay], ['الحساب البنكي للمالك', owner?.bankAccount], ['هوية المالك', owner?.nationalId]] as [string, string | number | undefined][] : []),
          ]} />{financial && owner?.notes && <p className="car-record-caption">ملاحظات المالك: {owner.notes}</p>}</article>
          <article className="car-record-panel"><div className="car-record-section-heading"><div><span>04 / المواصفات</span><h3><Gauge size={20} aria-hidden="true" />معلومات السيارة</h3></div></div><Facts entries={[
            ['الماركة والموديل', `${car.make} ${car.model}`], ['سنة الصنع', car.year], ['الفئة', category[car.category]], ['رقم اللوحة', car.plateNumber], ['كود السيارة', car.carCode], ['رقم الشاسيه', car.vin],
            ['اللون', car.color], ['ناقل الحركة', car.transmission === 'automatic' ? 'أوتوماتيك' : 'يدوي'], ['الوقود', fuel[car.fuelType]], ['عدد المقاعد', car.seats], ['العداد الحالي', `${num(car.currentKm)} كم`], ['عداد الاستلام', car.initialHandoverKm === undefined ? undefined : `${num(car.initialHandoverKm)} كم`],
          ]} /></article>
          <article className="car-record-panel"><div className="car-record-section-heading"><div><span>05 / الأسعار</span><h3><FileText size={20} aria-hidden="true" />أسعار التأجير والتأمين</h3></div></div><Facts entries={[
            ['السعر اليومي', `${num(car.dailyPriceEGP)} ج.م`], ['السعر الأسبوعي', car.weeklyPriceEGP === undefined ? undefined : `${num(car.weeklyPriceEGP)} ج.م`], ['السعر الشهري', car.monthlyPriceEGP === undefined ? undefined : `${num(car.monthlyPriceEGP)} ج.م`], ['التأمين المسترد', `${num(car.securityDepositEGP)} ج.م`],
          ]} /><p className="car-record-caption">هذه الأسعار الحالية؛ كل عقد يحتفظ بالسعر المسجل وقت الحجز.</p>{car.features?.length > 0 && <div className="car-record-features">{car.features.map((feature, index) => <span key={`${feature}-${index}`}><Check size={13} aria-hidden="true" />{feature}</span>)}</div>}</article>
          <article className="car-record-panel"><div className="car-record-section-heading"><div><span>06 / المتابعة</span><h3><Wrench size={20} aria-hidden="true" />التراخيص والصيانة</h3></div></div><Facts entries={[
            ['انتهاء رخصة السيارة', date(car.licenseExpiryDate)], ['موعد تجديد الرخصة', date(car.licenseRenewalDate)], ['انتهاء التأمين', date(car.insuranceExpiryDate)], ['موعد الصيانة القادمة', date(car.nextServiceDate)], ['عداد الصيانة المستهدف', car.nextServiceKm === undefined ? undefined : `${num(car.nextServiceKm)} كم`], ['المسؤول عن الصيانة', car.serviceResponsibleParty === 'owner' ? 'المالك' : 'الشركة'],
          ]} /><p className="car-record-caption"><ShieldCheck size={15} aria-hidden="true" />تغيير حالة السيارة متاح للمدير من «إدارة» في قائمة السيارات.</p></article>
        </section>
        <footer className="car-record-footer">ملف مرتبط ببيانات السيارة وعقودها المسجلة · مواعيد التشغيل بتوقيت القاهرة</footer>
      </div>
    </section>
  </div>;
}
