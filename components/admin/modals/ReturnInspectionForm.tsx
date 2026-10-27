'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, Star } from 'lucide-react';
import type { Booking, ReturnInspectionPayload } from '@/types/fleet';
import { calculateReturnSettlement } from '@/lib/return-settlement';
import FleetDialog from './FleetDialog';
import FleetFormSection from './FleetFormSection';
import './return-inspection.css';

interface Props {
  booking: Booking | null;
  onClose: () => void;
  returnKmInput: string;
  setReturnKmInput: (value: string) => void;
  onSubmit: (event: FormEvent, inspection?: ReturnInspectionPayload) => void | Promise<void>;
  operationError?: string;
}

export default function ReturnInspectionForm(props: Props) {
  return props.booking ? <InspectionForm key={props.booking.id} {...props} booking={props.booking} /> : null;
}

function InspectionForm({ booking, onClose, returnKmInput, setReturnKmInput, onSubmit, operationError = '' }: Props & { booking: Booking }) {
  const [hasDelay, setHasDelay] = useState(false);
  const [lateNoticeGiven, setLateNoticeGiven] = useState(true);
  const [lateHours, setLateHours] = useState(1);
  const [cleanlinessScore, setCleanlinessScore] = useState<'clean' | 'moderate' | 'dirty'>('clean');
  const [cleanlinessFee, setCleanlinessFee] = useState(0);
  const [hasDamages, setHasDamages] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [damageFee, setDamageFee] = useState(0);
  const [customerRatingStars, setCustomerRatingStars] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [customerRecommendation, setCustomerRecommendation] = useState<'recommend' | 'caution' | 'blacklist'>('recommend');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const { penaltyFee, actualDamageFee, totalDeductions, netRefundableDeposit, clientOwesExtra } = calculateReturnSettlement({
    deposit: booking.securityDepositEGP, dailyRate: booking.dailyRateEGP,
    hasDelay, lateNoticeGiven, lateHours, cleanlinessFee, hasDamages, damageFee,
  });
  const currentReturnKm = parseInt(returnKmInput) || booking.startKm;
  const distanceDriven = Math.max(0, currentReturnKm - booking.startKm);
  const changeCleanliness = (score: typeof cleanlinessScore) => {
    setCleanlinessScore(score); setCleanlinessFee(score === 'dirty' ? 250 : 0);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try {
      await onSubmit(event, { lateNoticeGiven: hasDelay ? lateNoticeGiven : true, lateHours: hasDelay ? lateHours : 0,
        penaltyFee, cleanlinessScore, cleanlinessFee, hasDamages, damageDescription: hasDamages ? damageDescription : undefined,
        damageFee: actualDamageFee, customerRatingStars, customerRecommendation, inspectionNotes });
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'تعذر حفظ محضر الاستلام.'); }
    finally { setBusy(false); }
  };
  return <FleetDialog title="استلام السيارة وفحص السلامة" description={'تقييم العميل وإغلاق العقد · ' + booking.bookingNumber}
    titleId="return-inspection-title" onClose={onClose} busy={busy} closeLabel="إغلاق فحص الاستلام">
    <form className="fleet-booking-form fleet-return-form" onSubmit={submit} aria-busy={busy}>
      <fieldset className="fleet-booking-scroll" disabled={busy}><legend className="sr-only">محضر استلام السيارة وتقييم العميل</legend>
        <div className="fleet-booking-layout"><div className="fleet-booking-sections">
          <FleetFormSection number="01" title="السيارة وقراءة العداد" description="راجع بيانات العقد وسجّل قراءة العداد الحالية.">
            <div className="fleet-return-identity"><strong>{booking.carName}</strong><bdi>{booking.carPlate}</bdi><p>{booking.customer.fullName} · <bdi>{booking.customer.phone}</bdi></p><p>الإرجاع المقرر: <bdi>{booking.endDate} · {booking.endTime}</bdi></p></div>
            <div className="fleet-booking-fields"><label className="fleet-booking-field"><span>قراءة العداد عند الاستلام *</span><input type="number" required min={booking.startKm} value={returnKmInput} onChange={(event) => setReturnKmInput(event.target.value)} /></label>
              <div className="fleet-return-distance"><span>العداد عند الخروج: {booking.startKm.toLocaleString('ar-EG')} كم</span><strong>{distanceDriven.toLocaleString('ar-EG')} كم</strong><small>المسافة المقطوعة خلال العقد</small></div></div>
          </FleetFormSection>
          <FleetFormSection number="02" title="المواعيد والتأخير" description="تطبّق الغرامة حسب حالة الإبلاغ وشروط العقد الحالية.">
            <div className="fleet-inspection-options"><Choice selected={!hasDelay} onClick={() => setHasDelay(false)}>في الموعد</Choice><Choice selected={hasDelay} onClick={() => setHasDelay(true)}>يوجد تأخير</Choice></div>
            {hasDelay && <div className="fleet-inspection-extra"><div className="fleet-inspection-options"><Choice selected={lateNoticeGiven} onClick={() => setLateNoticeGiven(true)}>إبلاغ مسبق<small>200 ج.م لكل ساعة</small></Choice><Choice selected={!lateNoticeGiven} onClick={() => setLateNoticeGiven(false)}>دون إبلاغ مسبق<small>غرامة إيجار يوم كامل</small></Choice></div>
              {lateNoticeGiven && <label className="fleet-booking-field"><span>عدد ساعات التأخير</span><input type="number" min={1} max={72} value={lateHours} onChange={(event) => setLateHours(Math.max(1, parseInt(event.target.value) || 1))} /></label>}
              <p className="fleet-return-notice">غرامة التأخير: {penaltyFee.toLocaleString('ar-EG')} ج.م</p></div>}
          </FleetFormSection>
          <FleetFormSection number="03" title="النظافة وفحص الأضرار" description="سجّل نتيجة الفحص الداخلي والخارجي وأي رسوم مستحقة.">
            <div className="fleet-inspection-options is-three"><Choice selected={cleanlinessScore === 'clean'} onClick={() => changeCleanliness('clean')}>نظيفة وممتازة</Choice><Choice selected={cleanlinessScore === 'moderate'} onClick={() => changeCleanliness('moderate')}>نظافة مقبولة</Choice><Choice selected={cleanlinessScore === 'dirty'} onClick={() => changeCleanliness('dirty')}>غسيل عميق<small>250 ج.م</small></Choice></div>
            <h4 className="fleet-inspection-subtitle">الخدوش والأضرار والتلفيات</h4><div className="fleet-inspection-options"><Choice selected={!hasDamages} onClick={() => setHasDamages(false)}>السيارة سليمة</Choice><Choice selected={hasDamages} onClick={() => setHasDamages(true)}>يوجد أضرار</Choice></div>
            {hasDamages && <div className="fleet-inspection-extra"><label className="fleet-booking-field"><span>وصف الأضرار أو الخدوش *</span><textarea required value={damageDescription} onChange={(event) => setDamageDescription(event.target.value)} placeholder="مكان الضرر ووصفه…" /></label><label className="fleet-booking-field"><span>تكلفة الإصلاح المخصومة من التأمين (ج.م)</span><input type="number" min={0} step={50} value={damageFee} onChange={(event) => setDamageFee(Math.max(0, parseInt(event.target.value) || 0))} /></label></div>}
          </FleetFormSection>
          <FleetFormSection number="04" title="تقييم العميل وملاحظات الفحص" description="يحفظ التقييم والتوصية ضمن إجراء الاستلام الحالي.">
            <div className="fleet-inspection-rating" role="group" aria-label="تقييم العميل من خمس نجوم">{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" aria-label={'تقييم ' + star + ' من 5'} aria-pressed={customerRatingStars === star} onClick={() => setCustomerRatingStars(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)}><Star size={23} aria-hidden="true" fill={(hoverRating || customerRatingStars) >= star ? 'currentColor' : 'none'} /></button>)}<strong>{customerRatingStars} / 5</strong></div>
            <div className="fleet-inspection-options is-three"><Choice selected={customerRecommendation === 'recommend'} onClick={() => setCustomerRecommendation('recommend')}>موثوق ونوصي به</Choice><Choice selected={customerRecommendation === 'caution'} onClick={() => setCustomerRecommendation('caution')}>تعامل بحذر</Choice><Choice selected={customerRecommendation === 'blacklist'} onClick={() => setCustomerRecommendation('blacklist')}>قائمة سوداء</Choice></div>
            <label className="fleet-booking-field fleet-booking-notes"><span>ملاحظات الموظف الفاحص</span><textarea rows={3} value={inspectionNotes} onChange={(event) => setInspectionNotes(event.target.value)} placeholder="ملاحظات حالة السيارة وسلوك العميل…" /></label>
          </FleetFormSection>
        </div><aside className="fleet-booking-summary" aria-label="تصفية التأمين"><span>التصفية المالية</span><h3>ملخص الاستلام</h3><p className="fleet-booking-summary-car">{booking.customer.fullName}<br />{booking.bookingNumber}</p><dl>
          <div><dt>التأمين المحجوز</dt><dd>{booking.securityDepositEGP.toLocaleString('ar-EG')} ج.م</dd></div>
          <div><dt>غرامة التأخير</dt><dd>{penaltyFee.toLocaleString('ar-EG')} ج.م</dd></div><div><dt>رسوم النظافة</dt><dd>{cleanlinessFee.toLocaleString('ar-EG')} ج.م</dd></div><div><dt>تكلفة الأضرار</dt><dd>{actualDamageFee.toLocaleString('ar-EG')} ج.م</dd></div><div><dt>إجمالي الخصومات</dt><dd>{totalDeductions.toLocaleString('ar-EG')} ج.م</dd></div>
          <div className="is-total"><dt>{clientOwesExtra > 0 ? 'مستحق على العميل' : 'التأمين المستحق رده'}</dt><dd>{(clientOwesExtra > 0 ? clientOwesExtra : netRefundableDeposit).toLocaleString('ar-EG')} <small>ج.م</small></dd></div>
        </dl><p>راجع القراءة والرسوم والتقييم قبل اعتماد الاستلام وإغلاق العقد.</p></aside></div>
      </fieldset>
      {(error || operationError) && <p className="fleet-booking-submit-error" role="alert">{error || operationError}</p>}
      <footer className="fleet-booking-footer"><div className="fleet-booking-footer-total"><span>{clientOwesExtra > 0 ? 'مستحق على العميل' : 'التأمين المستحق رده'}</span><strong>{(clientOwesExtra > 0 ? clientOwesExtra : netRefundableDeposit).toLocaleString('ar-EG')} <small>ج.م</small></strong></div><button type="button" className="fleet-booking-button" disabled={busy} onClick={onClose}>إلغاء</button><button type="submit" className="fleet-booking-button is-primary" disabled={busy}><CheckCircle2 size={18} aria-hidden="true" />{busy ? 'جارٍ حفظ الاستلام…' : 'اعتماد الاستلام وإغلاق العقد'}</button></footer>
    </form>
  </FleetDialog>;
}

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return <button className={'fleet-inspection-choice' + (selected ? ' is-selected' : '')} type="button" aria-pressed={selected} onClick={onClick}>{children}</button>;
}
