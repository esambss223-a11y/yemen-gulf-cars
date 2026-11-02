'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CheckCircle2,
  Gift,
  ShieldCheck
} from 'lucide-react';
import Image from 'next/image';
import FleetDialog from './FleetDialog';
import { rentalQuote } from '@/lib/car-pricing';
import { addDaysToDateString, calculateDaysBetween, validateRentalDuration } from '@/lib/booking-dates';
import { BookingSection, BookingInput } from './booking-form/BookingFields';
import BookingSummary from './booking-form/BookingSummary';
import './booking-form.css';
import { Car, Customer, PromoCoupon } from '@/types/fleet';
import ContractFields, { CONTRACT_GROUPS } from '../contracts/ContractFields';
import { changeContractVehicle, normalizeSecondaryPhone, validateContractDetails, type ContractDetails } from '@/lib/rental-contract';

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
  contractDetails?: ContractDetails;
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

const DURATION_PRESETS = [
  { days: 1, label: '1 يوم' },
  { days: 2, label: '2 يوم' },
  { days: 3, label: '3 أيام' },
  { days: 4, label: '4 أيام' },
  { days: 5, label: '5 أيام' },
  { days: 7, label: 'أسبوع (7 أيام)' },
  { days: 10, label: '10 أيام' },
  { days: 14, label: 'أسبوعين' },
  { days: 30, label: 'شهر (30 يوم)' },
];

const FUEL_PRESETS = ['فل 1/1', '3/4', '1/2', '1/4'];

/**
 * تحويل الأرقام العربية المشرقية (٠-٩) والفارسية (۰-۹) تلقائياً إلى أرقام نظامية (0-9)
 */
function toStandardDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 1776));
}

/**
 * فلترة الأرقام فقط والتخلص التام من أي حروف أو رموز
 */
function filterDigitsOnly(str: string, maxLength?: number): string {
  const digits = toStandardDigits(str).replace(/\D/g, '');
  return maxLength ? digits.slice(0, maxLength) : digits;
}

/**
 * إضافة عدد محدد من الأيام لتاريخ معين وتنسيقه بصيغة YYYY-MM-DD دون أي تأثير للمنطقة الزمنية
 */

export default function AddBookingModal(props: AddBookingModalProps) {
  return <BookingForm key={props.isOpen ? 'open' : 'closed'} {...props} />;
}

function BookingForm({
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
  const [step, setStep] = useState(0);
  const [phoneDialCode, setPhoneDialCode] = useState('+20');
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLFieldSetElement>(null);
  const [submitError, setSubmitError] = useState('');
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ text: string; success: boolean } | null>(null);

  const currentDate = new Date().toISOString().slice(0, 10);
  const availableCoupons = coupons.filter((coupon) =>
    coupon.active && coupon.usedCount < coupon.maxUsage && (!coupon.expiresAt || coupon.expiresAt >= currentDate),
  );

  // حساب الأيام بدقة
  const calculatedDays = useMemo(() => {
    return calculateDaysBetween(newBooking.startDate, newBooking.endDate);
  }, [newBooking.startDate, newBooking.endDate]);

  const selectedCar = cars.find(c => c.id === newBooking.carId);
  const quote = selectedCar ? rentalQuote(selectedCar, calculatedDays) : null;
  const baseRentTotal = quote?.totalEGP ?? 0;

  // فحص الاسم الكامل وعدد الكلمات لضمان كونه ثلاثياً أو رباعياً
  const customerNameTrimmed = newBooking.customerName.trim();
  const nameWords = useMemo(() => {
    return customerNameTrimmed ? customerNameTrimmed.split(/\s+/).filter(Boolean) : [];
  }, [customerNameTrimmed]);

  const isEgyptian = (newBooking.nationality || 'مصري') === 'مصري';

  // تعديل مدة الإيجار بالأيام وحساب تاريخ الإرجاع آلياً
  const handleDurationChange = (days: number) => {
    const cleanDays = Math.max(1, Math.min(365, days));
    const baseDate = newBooking.startDate || currentDate;
    const newEnd = addDaysToDateString(baseDate, cleanDays);
    setNewBooking(prev => ({
      ...prev,
      startDate: prev.startDate || baseDate,
      endDate: newEnd,
    }));
  };

  // تعديل تاريخ الاستلام مع المحافظة على عدد أيام الإيجار المحجوزة
  const handleStartDateChange = (newStartDate: string) => {
    const currentDays = calculatedDays;
    const newEndDate = addDaysToDateString(newStartDate, currentDays);
    setNewBooking(prev => ({
      ...prev,
      startDate: newStartDate,
      endDate: newEndDate,
    }));
  };

  // تعديل تاريخ الإرجاع يدوياً من التقويم
  const handleEndDateChange = (newEndDate: string) => {
    setNewBooking(prev => {
      const start = prev.startDate || currentDate;
      if (newEndDate <= start) {
        return {
          ...prev,
          endDate: addDaysToDateString(start, 1),
        };
      }
      return {
        ...prev,
        endDate: newEndDate,
      };
    });
  };

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
    const cleanPhone = newBooking.customerPhone.replace(/\s+/g, '').trim();
    const cleanId = newBooking.nationalId.trim();
    const cleanName = newBooking.customerName.trim().toLowerCase();
    if (cleanPhone.length < 4 && cleanId.length < 4 && cleanName.length < 3) return null;
    return customers.find((customer) =>
      (cleanPhone.length >= 4 && customer.phone.replace(/\s+/g, '').includes(cleanPhone)) ||
      (cleanId.length >= 4 && customer.nationalId.includes(cleanId)) ||
      (cleanName.length >= 3 && customer.fullName.toLowerCase().includes(cleanName))
    ) || null;
  }, [newBooking.customerPhone, newBooking.nationalId, newBooking.customerName, customers]);

  // إدارة خصم نقاط الولاء التلقائي
  useEffect(() => {
    if (useLoyaltyPoints && matchedCustomer && matchedCustomer.loyaltyPoints) {
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
      contractDetails: Object.fromEntries(
        Object.entries(prev.contractDetails || {}).filter(([key]) =>
          ['carYear', 'vin', 'carColor', 'engineNumber', 'handoverFuel', 'conditionNotes'].includes(key)
        )
      ),
    }));
  };

  const currentLoyaltyPoints = matchedCustomer?.loyaltyPoints || 0;
  const loyaltyDiscount = newBooking.loyaltyDiscountEGP || 0;
  const promoDiscount = newBooking.promoDiscountEGP || 0;
  const finalPayable = Math.max(0, baseRentTotal - loyaltyDiscount - promoDiscount);

  const displayCar = cars.find((car) => car.id === newBooking.carId);
  const details: ContractDetails = {
    carYear: displayCar ? String(displayCar.year) : '',
    vin: displayCar?.vin || '',
    carColor: displayCar?.color || '',
    ...newBooking.contractDetails,
  };
  const updateDetails = (value: ContractDetails) => setNewBooking(previous => ({ ...previous, contractDetails: value }));

  const moveStep = (next: number) => {
    setStep(next);
    setSubmitError('');
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const nextStep = () => {
    if (!formRef.current?.reportValidity()) return;
    // 1. التحقق من الخطوة الأولى: السيارة والمدة
    if (step === 0) {
      try { validateRentalDuration(newBooking.startDate, newBooking.endDate, selectedCar?.minRentalDays); }
      catch (error) { setSubmitError(error instanceof Error ? error.message : 'راجع مدة الإيجار.'); return; }
      if (!newBooking.carId) {
        setSubmitError('يرجى اختيار السيارة المراد تأجيرها أولاً.');
        return;
      }
      if (!newBooking.startDate || !newBooking.endDate) {
        setSubmitError('يرجى تحديد مواعيد الاستلام والإرجاع.');
        return;
      }
    }

    // 2. التحقق من الخطوة الثانية: بيانات المستأجر والهوية
    if (step === 1) {
      if (!customerNameTrimmed) {
        setSubmitError('يرجى إدخال اسم المستأجر بالكامل.');
        return;
      }
      if (nameWords.length < 2) {
        setSubmitError('يرجى كتابة اسم العميل ثنائياً أو ثلاثياً على الأقل كما هو مدون في الهوية الرسمية.');
        return;
      }
      if (!newBooking.customerPhone.trim()) {
        setSubmitError('يرجى إدخال رقم هاتف المستأجر للتواصل.');
        return;
      }
      if (!newBooking.nationalId.trim()) {
        setSubmitError('يرجى إدخال الرقم القومي أو جواز السفر للمستأجر.');
        return;
      }
      if (!newBooking.licenseNumber.trim()) {
        setSubmitError('يرجى إدخال رقم رخصة القيادة السارية.');
        return;
      }
      try {
        normalizeSecondaryPhone(details.secondaryPhone || '');
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'راجع رقم الهاتف الإضافي.');
        return;
      }
    }

    moveStep(Math.min(2, step + 1));
  };

  const supplementary = (keys: string[]) =>
    CONTRACT_GROUPS.filter(group => keys.includes(group.key)).map(group => (
      <BookingSection
        key={group.key}
        number="+"
        title={group.title}
        description={
          group.key === 'payment'
            ? 'بيان للطباعة حسب إيصال السداد؛ لا يسجّل تحصيلًا جديدًا أو يغيّر الفواتير.'
            : 'أكمل البيانات المتوفرة، ويمكن استكمال الفارغ بالقلم في المكتب.'
        }
      >
        <div className="fleet-booking-section-fields">
          {group.key === 'license' && (
            <BookingInput
              label="رقم رخصة القيادة السارية *"
              name="licenseNumber"
              required
              maxLength={240}
              value={newBooking.licenseNumber}
              onChange={event => {
                const clean = toStandardDigits(event.target.value).replace(/[^a-zA-Z0-9\s-]/g, '');
                setNewBooking(previous => ({ ...previous, licenseNumber: clean }));
              }}
              placeholder="رقم رخصة القيادة"
            />
          )}
          <ContractFields
            fields={group.fields.filter(key => key !== 'returnFuel')}
            value={details}
            onChange={updateDetails}
            rentTotal={finalPayable}
          />
        </div>
      </BookingSection>
    ));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (step < 2) {
      nextStep();
      return;
    }
    try {
      validateRentalDuration(newBooking.startDate, newBooking.endDate, selectedCar?.minRentalDays);
      validateContractDetails(details, finalPayable);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'راجع بيانات العقد.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit(event);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'تعذر حفظ الحجز. حاول مجددًا.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ترتيب الخطوات العبقري المنطقي
  const stepsOrder = [
    { title: 'السيارة والتسليم', label: '1. السيارة والمدة والأسعار' },
    { title: 'العميل والرخصة', label: '2. بيانات المستأجر والتوثيق' },
    { title: 'المراجعة والحفظ', label: '3. مراجعة العقد والتسليم' },
  ];

  return (
    <FleetDialog
      title="إنشاء عقد وحجز جديد"
      description="تسليم سيارة · بيانات واضحة وخطوات مرتبة قبل اعتماد العقد."
      titleId="new-booking-title"
      onClose={onClose}
      busy={isSubmitting}
    >
      {/* شريط خطوات الإجراءات بالترتيب العبقري الجديد */}
      <nav className="fleet-booking-steps" aria-label="خطوات إنشاء العقد">
        {stepsOrder.map((s, index) => (
          <button
            key={s.title}
            type="button"
            aria-current={step === index ? 'step' : undefined}
            disabled={isSubmitting}
            onClick={() => moveStep(index)}
          >
            <span>{index + 1}</span>
            {s.title}
          </button>
        ))}
      </nav>

      <form ref={formRef} className="fleet-booking-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <fieldset ref={scrollRef} className="fleet-booking-scroll" disabled={isSubmitting}>
          <legend className="sr-only">بيانات عقد التأجير الجديد</legend>
          <div className="fleet-booking-layout">
            <div className="fleet-booking-sections">

              {/* ========================================================
                  الخطوة 1 المعتمدة أولاً: السيارة والمدة والأسعار
                  ======================================================== */}
              <fieldset className="fleet-booking-step" hidden={step !== 0} disabled={step !== 0}>

                {/* 1.1 اختيار السيارة المتاحة بالمعرض */}
                <BookingSection number="01" title="السيارة" description="اختر السيارة المراد تأجيرها لعرض الأسعار والمدة فوراً.">
                  <label className="fleet-booking-field">
                    <span>السيارة المراد تأجيرها *</span>
                    <select
                      required
                      value={newBooking.carId}
                      onChange={(e) => {
                        const car = cars.find(car => car.id === e.target.value);
                        setNewBooking(previous => ({
                          ...previous,
                          carId: e.target.value,
                          contractDetails: changeContractVehicle(previous.contractDetails, car)
                        }));
                      }}
                    >
                      <option value="" disabled>اختر سيارة من الأسطول</option>
                      {cars
                        .filter(car => car.status !== 'archived' && (car.status === 'available' || car.id === newBooking.carId))
                        .map(car => (
                          <option key={car.id} value={car.id}>
                            {car.make} {car.model} · {car.year} · {car.plateNumber} · {car.dailyPriceEGP.toLocaleString()} ج.م/يوم
                          </option>
                        ))}
                    </select>
                  </label>

                  {displayCar && (
                    <div className="fleet-booking-vehicle">
                      <div className="fleet-booking-vehicle-photo">
                        <Image
                          src={displayCar.coverImage || displayCar.images?.[0] || '/car-mercedes.jpg'}
                          alt={displayCar.make + ' ' + displayCar.model}
                          fill
                          sizes="100px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <strong>{displayCar.make} {displayCar.model}</strong>
                        <p>{displayCar.year} · <bdi>{displayCar.plateNumber}</bdi></p>
                        <small>{displayCar.dailyPriceEGP.toLocaleString('ar-EG')} ج.م / يوم · التأمين: {(displayCar.securityDepositEGP || 10000).toLocaleString('ar-EG')} ج.م</small>
                        {displayCar.currentKm !== undefined && (
                          <div style={{ fontSize: '11px', color: '#142638', marginTop: '4px', fontWeight: 700 }}>
                            عداد الخروج الحالي: {displayCar.currentKm.toLocaleString('ar-EG')} كم
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* خيارات تحديد مستوى الوقود السريعة */}
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--fleet-line)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 750, color: 'var(--fleet-ink)', display: 'block', marginBottom: '6px' }}>
                      مستوى الوقود عند التسليم:
                    </span>
                    <div className="fleet-fuel-pills">
                      {FUEL_PRESETS.map(fuel => (
                        <button
                          key={fuel}
                          type="button"
                          onClick={() => updateDetails({ ...details, handoverFuel: fuel })}
                          className={'fleet-fuel-pill' + (details.handoverFuel === fuel ? ' is-active' : '')}
                        >
                          {fuel}
                        </button>
                      ))}
                    </div>
                  </div>
                </BookingSection>

                {/* 1.2 تحديد مدة الإيجار والتواريخ الذكية */}
                <BookingSection number="02" title="الاستلام والإرجاع" description="حدّد التاريخ والوقت المتفق عليهما مع العميل.">

                  {/* أداة تحديد مدة الإيجار بالأيام واختصاراتها السريعة */}
                  <div className="fleet-booking-duration-card">
                    <div className="fleet-booking-duration-header">
                      <strong>⏳ مدة الإيجار بالأيام</strong>
                      <div className="fleet-booking-stepper">
                        <button
                          type="button"
                          onClick={() => handleDurationChange(calculatedDays - 1)}
                          disabled={calculatedDays <= 1}
                          className="fleet-stepper-btn"
                          title="إنقاص يوم"
                        >
                          −
                        </button>
                        <div className="fleet-stepper-val">
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={calculatedDays}
                            onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)}
                          />
                          <span>أيام</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDurationChange(calculatedDays + 1)}
                          className="fleet-stepper-btn"
                          title="زيادة يوم"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* أزرار سريعة بنقرة واحدة */}
                    <div className="fleet-booking-presets" aria-label="أزرار مدة الإيجار السريعة">
                      {DURATION_PRESETS.map((item) => (
                        <button
                          key={item.days}
                          type="button"
                          onClick={() => handleDurationChange(item.days)}
                          className={'fleet-preset-chip' + (calculatedDays === item.days ? ' is-active' : '')}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div className="fleet-duration-summary-pill">
                      <span>🗓️ موعد الإرجاع المحسوب تلقائياً:</span>
                      <strong>{newBooking.endDate} الساعة ({newBooking.endTime || '14:00'})</strong>
                      <small>({calculatedDays} أيام إيجار كاملة)</small>
                    </div>
                  </div>

                  <div className="fleet-booking-date-group">
                    <h4>الاستلام والتسليم للعميل</h4>
                    <div className="fleet-booking-dates">
                      <label>
                        <span>تاريخ الاستلام</span>
                        <input
                          type="date"
                          required
                          value={newBooking.startDate}
                          onChange={(e) => handleStartDateChange(e.target.value)}
                        />
                      </label>
                      <label>
                        <span>وقت الاستلام</span>
                        <input
                          type="time"
                          required
                          value={newBooking.startTime}
                          onChange={(e) => setNewBooking({ ...newBooking, startTime: e.target.value })}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="fleet-booking-date-group">
                    <h4>الإرجاع المقرر</h4>
                    <div className="fleet-booking-dates">
                      <label>
                        <span>تاريخ الإرجاع</span>
                        <input
                          type="date"
                          required
                          value={newBooking.endDate}
                          onChange={(e) => handleEndDateChange(e.target.value)}
                        />
                      </label>
                      <label>
                        <span>وقت الإرجاع</span>
                        <input
                          type="time"
                          required
                          value={newBooking.endTime}
                          onChange={(e) => setNewBooking({ ...newBooking, endTime: e.target.value })}
                        />
                      </label>
                    </div>
                  </div>
                </BookingSection>

                {supplementary(['vehicle'])}

              </fieldset>

              {/* ========================================================
                  الخطوة 2 المعتمدة ثانياً: بيانات المستأجر والتوثيق القانوني
                  ======================================================== */}
              <fieldset className="fleet-booking-step" hidden={step !== 1} disabled={step !== 1}>

                <BookingSection number="02" title="بيانات العميل" description="البحث بالاسم أو الهاتف أو الهوية يُظهر بيانات العميل المسجلة ونقاط ولائه.">

                  {matchedCustomer && (
                    <div className="fleet-booking-match">
                      <div className="fleet-booking-match-title">
                        <strong>{matchedCustomer.fullName}</strong>
                        <span className={'fleet-booking-badge' + (matchedCustomer.tier === 'blacklist' ? ' is-blocked' : matchedCustomer.tier === 'vip_gold' ? ' is-gold' : '')}>
                          <ShieldCheck size={14} aria-hidden="true" />
                          {matchedCustomer.tier === 'blacklist' ? 'عميل في القائمة السوداء' : matchedCustomer.tier === 'vip_gold' ? 'عميل VIP ذهبي' : matchedCustomer.tier === 'vip_silver' ? 'عميل VIP فضي' : 'عميل مسجل'}
                        </span>
                      </div>
                      <div className="fleet-booking-customer-meta">
                        <span>{matchedCustomer.nationality || 'مصري'}</span>
                        <span>الهاتف: <bdi>{matchedCustomer.phone}</bdi></span>
                        <span>الهوية: <bdi>{matchedCustomer.nationalId}</bdi></span>
                        <span>نقاط الثقة: {matchedCustomer.trustScore ?? 85}%</span>
                      </div>
                      <button className="fleet-booking-button" type="button" onClick={() => handleSelectCustomer(matchedCustomer)}>
                        تعبئة بيانات العميل المسجلة
                      </button>
                      {currentLoyaltyPoints > 0 && (
                        <div className="fleet-booking-loyalty">
                          <p>
                            <Gift size={17} aria-hidden="true" />
                            رصيد الولاء: {currentLoyaltyPoints.toLocaleString('ar-EG')} نقطة، بقيمة {currentLoyaltyPoints.toLocaleString('ar-EG')} ج.م.
                          </p>
                          <label className="fleet-booking-checkbox">
                            <input type="checkbox" checked={useLoyaltyPoints} onChange={(e) => setUseLoyaltyPoints(e.target.checked)} />
                            <span>تطبيق خصم نقاط الولاء على الفاتورة</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="fleet-booking-fields">
                    {/* حقل اسم العميل مع مؤشر اكتمال الاسم الثلاثي/الرباعي */}
                    <div className="fleet-booking-field is-wide">
                      <BookingInput
                        label="اسم العميل بالكامل *"
                        required
                        value={newBooking.customerName}
                        onChange={(e) => setNewBooking({ ...newBooking, customerName: e.target.value })}
                        autoComplete="name"
                        placeholder="الاسم ثلاثي أو رباعي كما في الهوية (مثال: أحمد محمد علي حسن)"
                      />
                      {customerNameTrimmed ? (
                        nameWords.length === 1 ? (
                          <div className="fleet-field-helper is-warning">
                            <span>⚠️ يرجى كتابة الاسم ثلاثياً على الأقل لضمان قانونية العقد</span>
                            <span>اسم واحد</span>
                          </div>
                        ) : nameWords.length === 2 ? (
                          <div className="fleet-field-helper is-warning">
                            <span>🟡 يفضل كتابة اسم الجد أو اللقب لإتمام الاسم ثلاثياً</span>
                            <span>اسمان</span>
                          </div>
                        ) : (
                          <div className="fleet-field-helper is-success">
                            <span>✅ الاسم مكتمل قانونياً ومعتمد للعقد الرسمي</span>
                            <span>{nameWords.length} أسماء</span>
                          </div>
                        )
                      ) : (
                        <div className="fleet-field-helper is-info">
                          <span>يرجى كتابة الاسم ثلاثياً أو رباعياً كما في الهوية أو جواز السفر</span>
                        </div>
                      )}
                    </div>

                    {/* حقل الجنسية */}
                    <label className="fleet-booking-field">
                      <span>الجنسية *</span>
                      <select
                        value={newBooking.nationality || 'مصري'}
                        onChange={(e) => setNewBooking({ ...newBooking, nationality: e.target.value })}
                      >
                        {COMMON_NATIONALITIES.map(nat => (
                          <option key={nat.code} value={nat.name.split(' ')[0]}>
                            {nat.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    {/* حقل رقم الهاتف الأساسي مع مفتاح الدولة المستقل تماماً */}
                    <div className="fleet-booking-field">
                      <span>رقم الهاتف الأساسي *</span>
                      <div className="fleet-phone-field">
                        <select
                          className="fleet-country-select"
                          value={phoneDialCode}
                          onChange={(e) => setPhoneDialCode(e.target.value)}
                          aria-label="مفتاح الدولة للهاتف"
                        >
                          <option value="+20">🇪🇬 مصر (+20)</option>
                          <option value="+966">🇸🇦 السعودية (+966)</option>
                          <option value="+967">🇾🇪 اليمن (+967)</option>
                          <option value="+971">🇦🇪 الإمارات (+971)</option>
                          <option value="+965">🇰🇼 الكويت (+965)</option>
                          <option value="+974">🇶🇦 قطر (+974)</option>
                          <option value="+968">🇴🇲 عمان (+968)</option>
                          <option value="+973">🇧🇭 البحرين (+973)</option>
                          <option value="">🌐 دولي آخر</option>
                        </select>
                        <input
                          name="customerPhone"
                          type="tel"
                          required
                          dir="ltr"
                          autoComplete="tel"
                          inputMode="numeric"
                          maxLength={15}
                          value={newBooking.customerPhone}
                          onChange={(e) => {
                            const digits = filterDigitsOnly(e.target.value, 15);
                            setNewBooking({ ...newBooking, customerPhone: digits });
                          }}
                          placeholder={phoneDialCode === '+20' ? '010 0000 0000' : 'رقم الهاتف'}
                        />
                      </div>
                      <div className="fleet-field-helper is-info">
                        <span>أرقام فقط (مفتاح الدولة مستقل تماماً)</span>
                        <span className="font-mono">{newBooking.customerPhone.length} أرقام</span>
                      </div>
                    </div>

                    {/* حقل رقم هاتف إضافي اختياري (أرقام فقط) */}
                    <BookingInput
                      label="رقم هاتف إضافي (اختياري)"
                      name="secondaryPhone"
                      type="tel"
                      dir="ltr"
                      inputMode="numeric"
                      maxLength={30}
                      value={details.secondaryPhone || ''}
                      onChange={event => {
                        const digits = toStandardDigits(event.target.value).replace(/[^\d+]/g, '');
                        setNewBooking(previous => ({ ...previous, contractDetails: { ...previous.contractDetails, secondaryPhone: digits } }));
                      }}
                      placeholder="اتركه فارغًا إذا لم يوجد"
                    />

                    {/* حقل الرقم القومي أو جواز السفر */}
                    <div className="fleet-booking-field">
                      <BookingInput
                        label={isEgyptian ? "الرقم القومي (14 رقماً) *" : "الرقم القومي / جواز السفر *"}
                        required
                        inputMode={isEgyptian ? "numeric" : "text"}
                        maxLength={isEgyptian ? 14 : 30}
                        value={newBooking.nationalId}
                        onChange={(e) => {
                          const val = isEgyptian
                            ? filterDigitsOnly(e.target.value, 14)
                            : toStandardDigits(e.target.value).replace(/[^a-zA-Z0-9]/g, '').slice(0, 30);
                          setNewBooking({ ...newBooking, nationalId: val });
                        }}
                        placeholder={isEgyptian ? "أدخل 14 رقماً للبطاقة القومية" : "رقم الهوية أو الجواز"}
                      />
                      {isEgyptian && (
                        <div className="fleet-field-helper is-info">
                          <span>{newBooking.nationalId.length === 14 ? '✅ الرقم القومي مكتمل' : 'البطاقة القومية المصرية 14 رقماً'}</span>
                          <span className="font-mono">{newBooking.nationalId.length} / 14</span>
                        </div>
                      )}
                    </div>
                  </div>
                </BookingSection>

                {/* قسم تفاصيل الرخصة والعناوين التكميلية */}
                {supplementary(['address', 'license'])}

              </fieldset>

              {/* ========================================================
                  الخطوة 3 المعتمدة ثالثاً: مراجعة العقد والخصومات والطباعة
                  ======================================================== */}
              <fieldset className="fleet-booking-step" hidden={step !== 2} disabled={step !== 2}>
                <BookingSection
                  number="03"
                  title="مراجعة العقد قبل الحفظ"
                  description="ستُحفظ بيانات الحجز والعقد معًا، ثم يفتح ملف العقد للطباعة والتوقيع بالقلم."
                >
                  <dl className="fleet-booking-review">
                    <div>
                      <dt>العميل</dt>
                      <dd>{newBooking.customerName} · <bdi>{[phoneDialCode ? `${phoneDialCode} ${newBooking.customerPhone}` : newBooking.customerPhone, details.secondaryPhone].filter(Boolean).join(' / ')}</bdi></dd>
                    </div>
                    <div>
                      <dt>السيارة</dt>
                      <dd>{displayCar?.make} {displayCar?.model} · {displayCar?.plateNumber}</dd>
                    </div>
                    <div>
                      <dt>الاستلام</dt>
                      <dd>{newBooking.startDate} · {newBooking.startTime}</dd>
                    </div>
                    <div>
                      <dt>الإرجاع</dt>
                      <dd>{newBooking.endDate} · {newBooking.endTime}</dd>
                    </div>
                  </dl>
                  <p className="fleet-booking-review-note">
                    التأخير: 200 جنيه للساعة مع الإبلاغ وموافقة الشركة، وإيجار يوم كامل دون إبلاغ. رفع النسخة الموقعة اختياري بعد الطباعة.
                  </p>
                </BookingSection>

                <details className="fleet-booking-optional">
                  <summary>إضافة سائق إضافي — اختياري</summary>
                  {supplementary(['driver'])}
                </details>

                <BookingSection
                  number="04"
                  title="الخصومات والملاحظات"
                  description="أضف كود الخصم المتاح وأي ملاحظات تخص تسليم السيارة."
                >
                  <label className="fleet-booking-field" htmlFor="new-booking-promo">
                    <span>كود الخصم الترويجي</span>
                  </label>
                  <div className="fleet-booking-promo-entry">
                    <input
                      id="new-booking-promo"
                      type="text"
                      value={newBooking.discountCode}
                      onChange={(e) => {
                        setNewBooking({ ...newBooking, discountCode: e.target.value.toUpperCase() });
                        if (!e.target.value) {
                          setNewBooking(prev => ({ ...prev, discountCode: '', promoDiscountEGP: 0 }));
                          setPromoMessage(null);
                        }
                      }}
                      placeholder="أدخل كود الخصم"
                      dir="ltr"
                      autoCapitalize="characters"
                    />
                    <button className="fleet-booking-button" type="button" onClick={() => handleApplyPromo()}>
                      تطبيق الخصم
                    </button>
                  </div>
                  {promoMessage && (
                    <p className={'fleet-booking-feedback ' + (promoMessage.success ? 'is-success' : 'is-error')} role={promoMessage.success ? 'status' : 'alert'}>
                      {promoMessage.text}
                    </p>
                  )}
                  <div className="fleet-booking-coupons" aria-label="أكواد الخصم المتاحة">
                    {availableCoupons.length ? (
                      availableCoupons.map(coupon => (
                        <button
                          key={coupon.code}
                          type="button"
                          className={'fleet-booking-coupon' + (newBooking.discountCode === coupon.code ? ' is-selected' : '')}
                          aria-pressed={newBooking.discountCode === coupon.code}
                          onClick={() => handleApplyPromo(coupon.code)}
                        >
                          <bdi>{coupon.code}</bdi> · {coupon.discountType === 'percentage' ? coupon.discountValue + '%' : coupon.discountValue.toLocaleString('ar-EG') + ' ج.م'}
                        </button>
                      ))
                    ) : (
                      <p className="fleet-booking-empty-note">لا توجد أكواد خصم فعّالة حاليًا.</p>
                    )}
                  </div>
                  <label className="fleet-booking-field fleet-booking-notes">
                    <span>ملاحظات التسليم <small>(اختياري)</small></span>
                    <textarea
                      value={newBooking.notes}
                      onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                      placeholder="أي تفاصيل متفق عليها مع العميل…"
                    />
                  </label>
                </BookingSection>

                {supplementary(['payment'])}
              </fieldset>

            </div>

            {/* ملخص الحساب المالي الجانبي */}
            <BookingSummary
              car={displayCar}
              days={calculatedDays}
              baseRent={baseRentTotal}
              pricingLabel={quote?.label}
              agreedDailyRate={quote?.dailyRateEGP}
              rentPaid={details.rentPaidEGP}
              promoDiscount={promoDiscount}
              loyaltyDiscount={loyaltyDiscount}
              loyaltyPoints={newBooking.loyaltyPointsRedeemed}
              discountCode={newBooking.discountCode}
              total={finalPayable}
            />
          </div>
        </fieldset>

        {(submitError || operationError) && (
          <p className="fleet-booking-submit-error" role="alert">
            {submitError || operationError}
          </p>
        )}

        <footer className="fleet-booking-footer">
          <div className="fleet-booking-footer-total">
            <span>صافي الإيجار <small>التأمين منفصل</small></span>
            <strong>{displayCar ? finalPayable.toLocaleString('ar-EG') : '—'} <small>ج.م</small></strong>
          </div>
          <button className="fleet-booking-button" type="button" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </button>
          {step > 0 && (
            <button className="fleet-booking-button" type="button" disabled={isSubmitting} onClick={() => moveStep(step - 1)}>
              السابق
            </button>
          )}
          <button className="fleet-booking-button is-primary" type="submit" disabled={isSubmitting}>
            <CheckCircle2 size={18} aria-hidden="true" />
            {isSubmitting ? 'جارٍ حفظ العقد…' : step < 2 ? 'التالي' : 'حفظ العقد والتسليم'}
          </button>
        </footer>
      </form>
    </FleetDialog>
  );
}
