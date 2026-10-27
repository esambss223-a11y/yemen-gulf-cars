'use client';

import { useState } from 'react';
import { Archive, FileText, LockKeyhole, RotateCcw } from 'lucide-react';
import type { Booking, Car } from '@/types/fleet';
import { BOOKING_STATUS_LABELS } from '@/lib/car-record';
import { carRemovalState } from '@/lib/car-lifecycle';

interface Props {
  car: Car; bookings: Booking[];
  onArchive: (archived: boolean) => Promise<boolean>;
  onCancelBooking: (booking: Booking, reason: string) => Promise<void>;
  onReturnBooking: (booking: Booking) => void;
  onContract: (booking: Booking) => void;
  onHistory: () => void;
}
const date = (value: string) => {
  const parsed = new Date(`${value?.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? 'غير مسجل' : parsed.toLocaleDateString('ar-EG', { timeZone: 'UTC' });
};
export default function CarRemovalPanel({ car, bookings, onArchive, onCancelBooking, onReturnBooking, onContract, onHistory }: Props) {
  const { history, open, canArchive } = carRemovalState(bookings, car.id);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const archived = car.status === 'archived';
  const cancel = async (booking: Booking) => {
    setBusy(true); setError(''); setMessage('');
    try { await onCancelBooking(booking, reason.trim()); setCancelId(null); setReason(''); setMessage('تم إلغاء الحجز وحفظ السبب في سجله.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'تعذر إلغاء الحجز.'); }
    finally { setBusy(false); }
  };
  const archive = async () => {
    setBusy(true); setError('');
    try { if (!await onArchive(!archived)) setError('لم تكتمل العملية.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'تعذر إتمام العملية.'); }
    finally { setBusy(false); }
  };
  return <section className="fleet-removal" aria-label="الحجوزات المرتبطة وإزالة السيارة">
    <h3>{archived ? 'السيارة في الأرشيف' : open.length ? 'قبل إزالة السيارة من الأسطول' : 'إزالة السيارة من الأسطول'}</h3>
    <p>{archived ? 'مخفية عن الزبائن والحجز الجديد. العقود والفواتير السابقة محفوظة.' : open.length ? 'تغيير حالة التشغيل لا يلغي حجزًا أو يغلق عقدًا. أنهِ الارتباطات التالية أولًا:' : history.length ? 'لا توجد حجوزات مفتوحة. يمكنك أرشفة السيارة مع حفظ سجل العقود والفواتير.' : 'لا توجد حجوزات مرتبطة. يمكنك أرشفتها، أو حذفها نهائيًا من الإجراء أدناه.'}</p>
    <div className="fleet-linked-bookings">{open.map((booking) => <article key={booking.id}>
      <div className="fleet-linked-heading"><strong>{booking.customer.fullName || 'اسم العميل غير مسجل'}</strong><span>{BOOKING_STATUS_LABELS[booking.status] || 'حالة تحتاج مراجعة'}</span></div>
      <p><bdi>{booking.bookingNumber}</bdi></p>
      <p>من {date(booking.startDate)} · <bdi>{booking.startTime?.slice(0, 5)}</bdi><br />إلى {date(booking.endDate)} · <bdi>{booking.endTime?.slice(0, 5)}</bdi></p>
      {booking.status === 'active' && <p className="fleet-linked-note">السيارة بعهدة هذا العميل حتى إتمام الاستلام وإغلاق العقد، حتى لو مضى تاريخ الإرجاع.</p>}
      <div className="fleet-linked-actions">
        {booking.status !== 'pending_approval' && <button className="fleet-button" disabled={busy} onClick={() => onContract(booking)}><FileText size={15} aria-hidden="true" />عرض العقد</button>}
        {booking.status === 'active' && <button className="fleet-button fleet-button-primary" disabled={busy} onClick={() => onReturnBooking(booking)}>استلام وإغلاق العقد</button>}
        {['pending_approval', 'confirmed'].includes(booking.status) && <button className="fleet-button" disabled={busy} onClick={() => { setCancelId(booking.id); setReason(''); setError(''); setMessage(''); }}>إلغاء {booking.status === 'pending_approval' ? 'الطلب' : 'الحجز'}</button>}
      </div>
      {cancelId === booking.id && <form className="fleet-cancel-form" onSubmit={(e) => { e.preventDefault(); void cancel(booking); }}>
        <label htmlFor={`cancel-reason-${booking.id}`}>سبب الإلغاء</label><textarea id={`cancel-reason-${booking.id}`} required minLength={3} maxLength={300} value={reason} disabled={busy} onChange={(e) => setReason(e.target.value)} />
        <p>يُحفظ الطلب وسبب إلغائه. إذا وُجدت دفعات أو تأمين محتجز فسيوقف النظام الإلغاء لحين مراجعة التسوية المالية.</p>
        <div className="fleet-linked-actions"><button className="fleet-button fleet-button-danger" type="submit" disabled={busy || reason.trim().length < 3}>{busy ? 'جارٍ الإلغاء…' : 'تأكيد الإلغاء'}</button><button className="fleet-button" type="button" disabled={busy} onClick={() => setCancelId(null)}>تراجع</button></div>
      </form>}
    </article>)}</div>
    {history.length > 0 && <button className="fleet-edit-link" disabled={busy} onClick={onHistory}>عرض سجل المستأجرين كاملًا ({history.length.toLocaleString('ar-EG')})</button>}
    {!archived && !canArchive && <p className="fleet-archive-blocked"><LockKeyhole size={16} aria-hidden="true" />الأرشفة متاحة بعد إنهاء الحجوزات المفتوحة أعلاه.</p>}
    {(archived || canArchive) && <div className="fleet-archive-action">{confirmArchive ? <><strong>{archived ? 'إعادة السيارة إلى الأسطول؟' : 'تأكيد أرشفة السيارة؟'}</strong><p>{archived ? 'ستعود بحالة صيانة للفحص، ثم يمكنك إتاحتها للحجز من حالة التشغيل.' : 'ستختفي من الموقع والأسطول المعتاد. يمكنك استعادتها من فلتر «الأرشيف».'}</p><div className="fleet-linked-actions"><button className="fleet-button fleet-button-primary" disabled={busy} onClick={archive}>{busy ? 'جارٍ التنفيذ…' : archived ? 'تأكيد الإعادة' : 'تأكيد الأرشفة'}</button><button className="fleet-button" disabled={busy} onClick={() => setConfirmArchive(false)}>تراجع</button></div></> : <button className="fleet-button" disabled={busy} onClick={() => setConfirmArchive(true)}>{archived ? <RotateCcw size={17} aria-hidden="true" /> : <Archive size={17} aria-hidden="true" />}{archived ? 'إعادة من الأرشيف' : 'أرشفة السيارة وحفظ سجلها'}</button>}</div>}
    <div aria-live="polite">{message && <p className="fleet-success">{message}</p>}{error && <p role="alert" className="fleet-error">{error}</p>}</div>
  </section>;
}
