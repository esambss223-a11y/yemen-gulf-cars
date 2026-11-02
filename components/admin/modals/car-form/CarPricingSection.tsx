'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import { CircleDollarSign, Tag } from 'lucide-react';
import type { CarFormState } from '../CarFormModal';
import { carPeriodOffer, updateCarPeriodOffer } from '@/lib/car-offers';
import CarDurationPrices from './CarDurationPrices';
import './car-pricing.css';

interface Props { carForm: CarFormState; setCarForm: Dispatch<SetStateAction<CarFormState>>; }
const periods = [{ days: 1, title: 'اليوم', field: 'dailyPriceEGP' }, { days: 7, title: 'الأسبوع', field: 'weeklyPriceEGP' }, { days: 14, title: 'الأسبوعان', field: 'period-price-14' }, { days: 30, title: 'الشهر', field: 'monthlyPriceEGP' }];

export function PeriodOfferRow({ carForm, setCarForm, days, title, field }: Props & { days: number; title: string; field: string }) {
  const offer = carPeriodOffer(carForm, days);
  const [active, setActive] = useState(offer.original !== undefined);
  const set = (change: { price?: number; original?: number | null }) => setCarForm(previous => updateCarPeriodOffer(previous, days, change));
  const saving = active && offer.original && offer.original > offer.price ? offer.original - offer.price : 0;
  return <div className={`car-offer-row ${active ? 'has-offer' : ''}`}>
    <div className="car-offer-period"><strong>{title}</strong><small>{days} {days === 1 ? 'يوم' : 'أيام'}</small></div>
    <label className="car-offer-price"><span>السعر الأساسي</span><input name={active ? `original-price-${days}` : field} aria-label={`السعر الأساسي — ${title}`} type="number" min={0.01} step="0.01" required={days === 1 || days === 7 || days === 30 || active} value={(active ? offer.original : offer.price) || ''} placeholder="ج.م" onChange={event => set(active ? { original: Number(event.target.value) } : { price: Number(event.target.value) })} /></label>
    <label className="car-offer-switch"><input type="checkbox" checked={active} onChange={event => {
      const enabled = event.target.checked; setActive(enabled);
      set(enabled ? { original: offer.price } : { price: offer.original ?? offer.price, original: null });
    }} /><span>تفعيل عرض</span><small>{title}</small></label>
    {active ? <label className="car-offer-price is-final"><span>بعد الخصم</span><input name={field} aria-label={`السعر بعد الخصم — ${title}`} type="number" min={0.01} step="0.01" required value={offer.price || ''} placeholder="ج.م" onChange={event => set({ price: Number(event.target.value) })} /><small>{saving ? `توفير ${saving.toLocaleString('ar-EG')} ج.م` : 'أدخل سعرًا أقل من الأساسي'}</small></label> : <div className="car-offer-no-discount">دون عرض</div>}
  </div>;
}

export default function CarPricingSection(props: Props) {
  const { carForm, setCarForm } = props;
  return <section className="fleet-car-pricing" aria-labelledby="car-pricing-heading">
    <h3 id="car-pricing-heading"><CircleDollarSign size={18} aria-hidden="true" />الأسعار والعروض</h3>
    <p>كل سعر هو إجمالي المدة كاملة. اكتب السعر الأساسي، وفعّل العرض فقط عند وجود خصم لهذه المدة.</p>
    <div className="car-offer-table">{periods.map(period => <PeriodOfferRow key={period.days} {...props} {...period} />)}</div>
    <p className="car-offer-explanation"><Tag size={15} aria-hidden="true" />لكل مدة عرض مستقل؛ تعديل عرض اليوم لا يغيّر الأسبوع أو الأسبوعين أو الشهر. إلغاء العرض يعيد السعر الأساسي.</p>
    <div className="fleet-car-pricing-fields car-offer-policy">
      <label><span>أقل مدة للإيجار (بالأيام)</span><input name="minRentalDays" type="number" min={1} max={365} step={1} required value={carForm.minRentalDays ?? 1} onChange={event => setCarForm(previous => ({ ...previous, minRentalDays: Number(event.target.value) }))} /><small>مثلًا: 7 يمنع حجز السيارة لمدة أقصر من أسبوع.</small></label>
      <label><span>التأمين المسترد (ج.م)</span><input name="securityDepositEGP" type="number" min={0} step="0.01" required value={carForm.securityDepositEGP ?? 0} onChange={event => setCarForm(previous => ({ ...previous, securityDepositEGP: Number(event.target.value) }))} /><small>اكتب صفرًا إذا لم يوجد تأمين.</small></label>
    </div>
    <details className="car-extra-periods"><summary>مدد أخرى — اختياري</summary><CarDurationPrices {...props} /></details>
  </section>;
}
