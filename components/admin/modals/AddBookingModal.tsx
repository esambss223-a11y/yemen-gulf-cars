'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Gift, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import FleetDialog from './FleetDialog';
import BookingSummary from './booking-form/BookingSummary';
import './booking-form.css';
import { Car, Customer, PromoCoupon } from '@/types/fleet';

export interface NewBookingFormState {
  carId: string;
  customerName: string;
  customerPhone: string;
  nationalId: string;
  licenseNumber: string;
  nationality: string;
  loyaltyPointsRedeemed: number;
  loyaltyDiscountEGP: number;
  promoDiscountEGP: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  discountCode: string;
  notes: string;
}

interface AddBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  cars: Car[];
  customers?: Customer[];
  coupons: PromoCoupon[];
  newBooking: NewBookingFormState;
  setNewBooking: React.Dispatch<React.SetStateAction<NewBookingFormState>>;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  operationError?: string;
}

const COMMON_NATIONALITIES = [
  { code: 'eg', name: 'مصري' },
  { code: 'sa', name: 'سعودي' },
  { code: 'ae', name: 'إماراتي' },
  { code: 'kw', name: 'كويتي' },
  { code: 'qa', name: 'قطري' },
  { code: 'ye', name: 'يمني' },
  { code: 'om', name: 'عماني' },
  { code: 'bh', name: 'بحريني' },
  { code: 'other', name: 'أجنبي / أخرى' },
];

export default function AddBookingModal({
  isOpen,
  onClose,
  cars,
  customers = [],
  coupons,
  newBooking,
  setNewBooking,
  onSubmit,
  operationError = '',
}: AddBookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ text: string; success: boolean } | null>(null);

  const currentDate = new Date().toISOString().slice(0, 10);
  const availableCoupons = coupons.filter((coupon) =>
    coupon.active && coupon.usedCount < coupon.maxUsage && (!coupon.expiresAt || coupon.expiresAt >= currentDate),
  );

  const handleApplyPromo = (codeToApply?: string) => {
    const code = (codeToApply || newBooking.discountCode || '').trim().toUpperCase();
    if (!code) {
      setNewBooking(prev => ({ ...prev, discountCode: '', promoDiscountEGP: 0 }));
      setPromoMessage(null);
      return;
    }

    const found = availableCoupons.find((coupon) => coupon.code.toUpperCase() === code);
    if (found) {
      const discount = found.discountType === 'percentage'
        ? Math.round((baseRentTotal * found.discountValue) / 100)
        : Math.min(found.discountValue, baseRentTotal);
      setNewBooking(prev => ({
        ...prev,
        discountCode: found.code,
        promoDiscountEGP: discount
      }));
      setPromoMessage({
        text: `تم تفعيل كود الخصم (${found.code}): خصم ${discount.toLocaleString()} ج.م ✓`,
        success: true
      });
    } else {
      setNewBooking(prev => ({ ...prev, promoDiscountEGP: 0 }));
      setPromoMessage({ text: 'كود الخصم المدخل غير صالح أو غير معتمد', success: false });
    }
  };

  const matchedCustomer = useMemo(() => {
    const cleanPhone = newBooking.customerPhone.trim();
    const cleanId = newBooking.nationalId.trim();
    const cleanName = newBooking.customerName.trim().toLowerCase();
    if (cleanPhone.length < 4 && cleanId.length < 4 && cleanName.length < 3) return null;
    return customers.find((customer) =>
      (cleanPhone.length >= 4 && customer.phone.includes(cleanPhone)) ||
      (cleanId.length >= 4 && customer.nationalId.includes(cleanId)) ||
      (cleanName.length >= 3 && customer.fullName.toLowerCase().includes(cleanName))
    ) || null;
  }, [newBooking.customerPhone, newBooking.nationalId, newBooking.customerName, customers]);

  // حساب الأيام والإيجار الأساسي
  const start = new Date(newBooking.startDate);
  const end = new Date(newBooking.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const selectedCar = cars.find(c => c.id === newBooking.carId) || cars[0];
  const baseRentTotal = (selectedCar?.dailyPriceEGP || 5000) * calculatedDays;

  // إدارة خصم نقاط الولاء التلقائي
  useEffect(() => {
    if (useLoyaltyPoints && matchedCustomer && matchedCustomer.loyaltyPoints) {
      // كل 10 نقاط = 10 جنيه خصم (أو 100 نقطة = 100 ج.م) بحد أقصى 20% من قيمة الإيجار
      const maxDiscount = Math.floor(baseRentTotal * 0.20);
      const discountVal = Math.min(matchedCustomer.loyaltyPoints, maxDiscount);
      setNewBooking(prev => ({
        ...prev,
        loyaltyPointsRedeemed: discountVal,
        loyaltyDiscountEGP: discountVal,
      }));
    } else {
      setNewBooking(prev => ({
        ...prev,
        loyaltyPointsRedeemed: 0,
        loyaltyDiscountEGP: 0,
      }));
    }
  }, [useLoyaltyPoints, matchedCustomer, baseRentTotal, setNewBooking]);

  if (!isOpen) return null;

  const handleSelectCustomer = (cust: Customer) => {
    setNewBooking(prev => ({
      ...prev,
      customerName: cust.fullName,
      customerPhone: cust.phone,
      nationalId: cust.nationalId,
      licenseNumber: cust.licenseNumber,
      nationality: cust.nationality || 'مصري',
    }));
  };

  const currentLoyaltyPoints = matchedCustomer?.loyaltyPoints || 0;
  const loyaltyDiscount = newBooking.loyaltyDiscountEGP || 0;
  const promoDiscount = newBooking.promoDiscountEGP || 0;
  const finalPayable = Math.max(0, baseRentTotal - loyaltyDiscount - promoDiscount);

  const displayCar = cars.find((car) => car.id === newBooking.carId);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true); setSubmitError('');
    try { await onSubmit(event); }
    catch (error) { setSubmitError(error instanceof Error ? error.message : 'تعذر حفظ الحجز. حاول مجددًا.'); }
    finally { setIsSubmitting(false); }
  };

  return <FleetDialog title="إنشاء عقد وحجز جديد" description="تسليم سيارة · بيانات واضحة وخطوات مرتبة قبل اعتماد العقد."
    titleId="new-booking-title" onClose={onClose} busy={isSubmitting}>
    <form className="fleet-booking-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
      <fieldset className="fleet-booking-scroll" disabled={isSubmitting}><legend className="sr-only">بيانات عقد التأجير الجديد</legend><div className="fleet-booking-layout">
        <div className="fleet-booking-sections">
          <BookingSection number="01" title="السيارة" description="اختر السيارة التي ستُسلّم للعميل.">
            <label className="fleet-booking-field"><span>السيارة المراد تأجيرها *</span>
              <select required value={newBooking.carId} onChange={(e) => setNewBooking({ ...newBooking, carId: e.target.value })}>
                <option value="" disabled>اختر سيارة من الأسطول</option>
                {cars.filter(car => car.status !== 'archived' && (car.status === 'available' || car.id === newBooking.carId)).map(car =>
                  <option key={car.id} value={car.id}>{car.make} {car.model} · {car.year} · {car.plateNumber} · {car.dailyPriceEGP.toLocaleString()} ج.م/يوم</option>)}
              </select>
            </label>
            {displayCar && <div className="fleet-booking-vehicle">
              <div className="fleet-booking-vehicle-photo"><Image src={displayCar.coverImage || displayCar.images?.[0] || '/car-mercedes.jpg'} alt={displayCar.make + ' ' + displayCar.model} fill sizes="100px" className="object-cover" /></div>
              <div><strong>{displayCar.make} {displayCar.model}</strong><p>{displayCar.year} · <bdi>{displayCar.plateNumber}</bdi></p><small>{displayCar.dailyPriceEGP.toLocaleString('ar-EG')} ج.م / يوم</small></div>
            </div>}
          </BookingSection>

          <BookingSection number="02" title="بيانات العميل" description="البحث بالاسم أو الهاتف أو الهوية يُظهر بيانات العميل المسجلة ونقاط ولائه.">
            {matchedCustomer && <div className="fleet-booking-match">
              <div className="fleet-booking-match-title"><strong>{matchedCustomer.fullName}</strong>
                <span className={'fleet-booking-badge' + (matchedCustomer.tier === 'blacklist' ? ' is-blocked' : matchedCustomer.tier === 'vip_gold' ? ' is-gold' : '')}>
                  <ShieldCheck size={14} aria-hidden="true" />{matchedCustomer.tier === 'blacklist' ? 'عميل في القائمة السوداء' : matchedCustomer.tier === 'vip_gold' ? 'عميل VIP ذهبي' : matchedCustomer.tier === 'vip_silver' ? 'عميل VIP فضي' : 'عميل مسجل'}
                </span>
              </div>
              <div className="fleet-booking-customer-meta"><span>{matchedCustomer.nationality || 'مصري'}</span><span>الهاتف: <bdi>{matchedCustomer.phone}</bdi></span><span>الهوية: <bdi>{matchedCustomer.nationalId}</bdi></span><span>نقاط الثقة: {matchedCustomer.trustScore ?? 85}%</span></div>
              <button className="fleet-booking-button" type="button" onClick={() => handleSelectCustomer(matchedCustomer)}>تعبئة بيانات العميل المسجلة</button>
              {currentLoyaltyPoints > 0 && <div className="fleet-booking-loyalty">
                <p><Gift size={17} aria-hidden="true" />رصيد الولاء: {currentLoyaltyPoints.toLocaleString('ar-EG')} نقطة، بقيمة {currentLoyaltyPoints.toLocaleString('ar-EG')} ج.م.</p>
                <label className="fleet-booking-checkbox"><input type="checkbox" checked={useLoyaltyPoints} onChange={(e) => setUseLoyaltyPoints(e.target.checked)} /><span>تطبيق خصم نقاط الولاء على الفاتورة</span></label>
              </div>}
            </div>}
            <div className="fleet-booking-fields">
              <BookingInput label="اسم العميل بالكامل *" required value={newBooking.customerName} onChange={(e) => setNewBooking({ ...newBooking, customerName: e.target.value })} autoComplete="name" placeholder="الاسم كما هو في الهوية" />
              <label className="fleet-booking-field"><span>الجنسية *</span><select value={newBooking.nationality || 'مصري'} onChange={(e) => setNewBooking({ ...newBooking, nationality: e.target.value })}>
                {COMMON_NATIONALITIES.map(nat => <option key={nat.code} value={nat.name.split(' ')[0]}>{nat.name}</option>)}
              </select></label>
              <BookingInput label="رقم الهاتف / الواتساب *" type="tel" required dir="ltr" autoComplete="tel" value={newBooking.customerPhone} onChange={(e) => setNewBooking({ ...newBooking, customerPhone: e.target.value })} placeholder="+20 100 000 0000" />
              <BookingInput label="الرقم القومي / جواز السفر *" required value={newBooking.nationalId} onChange={(e) => setNewBooking({ ...newBooking, nationalId: e.target.value })} placeholder="رقم الهوية أو الجواز" />
              <BookingInput label="رقم رخصة القيادة السارية *" wide required value={newBooking.licenseNumber} onChange={(e) => setNewBooking({ ...newBooking, licenseNumber: e.target.value })} placeholder="رقم رخصة القيادة" />
            </div>
          </BookingSection>

          <BookingSection number="03" title="الاستلام والإرجاع" description="حدّد التاريخ والوقت المتفق عليهما مع العميل.">
            <div className="fleet-booking-date-group"><h4>الاستلام والتسليم للعميل</h4><div className="fleet-booking-dates">
              <label><span>تاريخ الاستلام</span><input type="date" required value={newBooking.startDate} onChange={(e) => setNewBooking({ ...newBooking, startDate: e.target.value })} /></label>
              <label><span>وقت الاستلام</span><input type="time" required value={newBooking.startTime} onChange={(e) => setNewBooking({ ...newBooking, startTime: e.target.value })} /></label>
            </div></div>
            <div className="fleet-booking-date-group"><h4>الإرجاع المقرر</h4><div className="fleet-booking-dates">
              <label><span>تاريخ الإرجاع</span><input type="date" required value={newBooking.endDate} onChange={(e) => setNewBooking({ ...newBooking, endDate: e.target.value })} /></label>
              <label><span>وقت الإرجاع</span><input type="time" required value={newBooking.endTime} onChange={(e) => setNewBooking({ ...newBooking, endTime: e.target.value })} /></label>
            </div></div>
          </BookingSection>

          <BookingSection number="04" title="الخصومات والملاحظات" description="أضف كود الخصم المتاح وأي ملاحظات تخص تسليم السيارة.">
            <label className="fleet-booking-field" htmlFor="new-booking-promo"><span>كود الخصم الترويجي</span></label>
            <div className="fleet-booking-promo-entry"><input id="new-booking-promo" type="text" value={newBooking.discountCode} onChange={(e) => {
              setNewBooking({ ...newBooking, discountCode: e.target.value.toUpperCase() });
              if (!e.target.value) { setNewBooking(prev => ({ ...prev, discountCode: '', promoDiscountEGP: 0 })); setPromoMessage(null); }
            }} placeholder="أدخل كود الخصم" dir="ltr" autoCapitalize="characters" />
              <button className="fleet-booking-button" type="button" onClick={() => handleApplyPromo()}>تطبيق الخصم</button>
            </div>
            {promoMessage && <p className={'fleet-booking-feedback ' + (promoMessage.success ? 'is-success' : 'is-error')} role={promoMessage.success ? 'status' : 'alert'}>{promoMessage.text}</p>}
            <div className="fleet-booking-coupons" aria-label="أكواد الخصم المتاحة">{availableCoupons.length ? availableCoupons.map(coupon =>
              <button key={coupon.code} type="button" className={'fleet-booking-coupon' + (newBooking.discountCode === coupon.code ? ' is-selected' : '')} aria-pressed={newBooking.discountCode === coupon.code} onClick={() => handleApplyPromo(coupon.code)}>
                <bdi>{coupon.code}</bdi> · {coupon.discountType === 'percentage' ? coupon.discountValue + '%' : coupon.discountValue.toLocaleString('ar-EG') + ' ج.م'}
              </button>) : <p className="fleet-booking-empty-note">لا توجد أكواد خصم فعّالة حاليًا.</p>}
            </div>
            <label className="fleet-booking-field fleet-booking-notes"><span>ملاحظات التسليم <small>(اختياري)</small></span><textarea value={newBooking.notes} onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })} placeholder="أي تفاصيل متفق عليها مع العميل…" /></label>
          </BookingSection>
        </div>
        <BookingSummary car={displayCar} days={calculatedDays} baseRent={baseRentTotal} promoDiscount={promoDiscount} loyaltyDiscount={loyaltyDiscount} loyaltyPoints={newBooking.loyaltyPointsRedeemed} discountCode={newBooking.discountCode} total={finalPayable} />
      </div></fieldset>
      {(submitError || operationError) && <p className="fleet-booking-submit-error" role="alert">{submitError || operationError}</p>}
      <footer className="fleet-booking-footer">
        <div className="fleet-booking-footer-total"><span>صافي الإيجار <small>التأمين منفصل</small></span><strong>{displayCar ? finalPayable.toLocaleString('ar-EG') : '—'} <small>ج.م</small></strong></div>
        <button className="fleet-booking-button" type="button" onClick={onClose} disabled={isSubmitting}>إلغاء</button>
        <button className="fleet-booking-button is-primary" type="submit" disabled={isSubmitting}><CheckCircle2 size={18} aria-hidden="true" />{isSubmitting ? 'جارٍ حفظ العقد…' : 'تأكيد الحجز والتسليم'}</button>
      </footer>
    </form>
  </FleetDialog>;
}

function BookingSection({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return <section className="fleet-booking-section" aria-labelledby={'booking-section-' + number}>
    <header className="fleet-booking-section-heading"><span aria-hidden="true">{number}</span><div><h3 id={'booking-section-' + number}>{title}</h3><p>{description}</p></div></header>{children}
  </section>;
}

function BookingInput({ label, wide = false, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; wide?: boolean }) {
  return <label className={'fleet-booking-field' + (wide ? ' is-wide' : '')}><span>{label}</span><input {...props} /></label>;
}
