import type { Car } from '@/types/fleet';

interface Props {
  car?: Car;
  days: number;
  baseRent: number;
  promoDiscount: number;
  loyaltyDiscount: number;
  loyaltyPoints: number;
  discountCode: string;
  total: number;
  rentPaid?: string;
  pricingLabel?: string;
  agreedDailyRate?: number;
}
export default function BookingSummary({ car, days, baseRent, promoDiscount, loyaltyDiscount, loyaltyPoints, discountCode, total, rentPaid = '', pricingLabel, agreedDailyRate }: Props) {
  const deposit = car?.securityDepositEGP ?? 0;
  const paid = Number(rentPaid);
  const validPaid = rentPaid.trim() !== '' && Number.isFinite(paid) && paid >= 0 && paid <= total;
  return <aside className="fleet-booking-summary" aria-label="الملخص المالي للحجز">
    <span>تفاصيل المبلغ</span><h3>ملخص الحجز</h3>
    {car ? <><p className="fleet-booking-summary-car">{car.make} {car.model}<br /><bdi>{car.plateNumber}</bdi></p>
      <dl><div><dt>مدة الإيجار</dt><dd>{days.toLocaleString('ar-EG')} يوم</dd></div>
        <div><dt>متوسط سعر اليوم قبل الخصم</dt><dd>{(agreedDailyRate ?? car.dailyPriceEGP ?? 0).toLocaleString('ar-EG')} ج.م</dd></div>
        {pricingLabel && <div><dt>طريقة التسعير</dt><dd>{pricingLabel}</dd></div>}
        <div><dt>الإيجار قبل الخصم</dt><dd>{baseRent.toLocaleString('ar-EG')} ج.م</dd></div>
        {promoDiscount > 0 && <div className="is-discount"><dt>كود الخصم <bdi>{discountCode}</bdi></dt><dd>−{promoDiscount.toLocaleString('ar-EG')} ج.م</dd></div>}
        {loyaltyDiscount > 0 && <div className="is-discount"><dt>نقاط الولاء ({loyaltyPoints.toLocaleString('ar-EG')})</dt><dd>−{loyaltyDiscount.toLocaleString('ar-EG')} ج.م</dd></div>}
        <div className="is-total"><dt>صافي الإيجار</dt><dd>{total.toLocaleString('ar-EG')} <small>ج.م</small></dd></div>
        <div className="is-deposit"><dt>التأمين المسترد</dt><dd>{deposit.toLocaleString('ar-EG')} ج.م</dd></div>
        <div className="is-handover-total"><dt>إجمالي الإيجار والتأمين</dt><dd>{(total + deposit).toLocaleString('ar-EG')} <small>ج.م</small></dd></div>
        {validPaid && <><div><dt>المدفوع من الإيجار حسب بيان العقد</dt><dd>{paid.toLocaleString('ar-EG')} ج.م</dd></div><div><dt>المتبقي من الإيجار حسب البيان</dt><dd>{(total - paid).toLocaleString('ar-EG')} ج.م</dd></div></>}
      </dl><p>التأمين المسترد منفصل عن صافي الإيجار. راجع بيانات العميل والمواعيد قبل تأكيد التسليم.</p>
    </> : <p className="fleet-booking-summary-car">اختر السيارة لعرض الأسعار وملخص الحجز.</p>}
  </aside>;
}
