import type { Dispatch, SetStateAction } from 'react';
import type { CarFormState } from '../CarFormModal';

export default function CarDurationPrices({ carForm, setCarForm }: { carForm: CarFormState; setCarForm: Dispatch<SetStateAction<CarFormState>> }) {
  const entries = (carForm.rentalPriceTiers ?? []).map((tier, index) => ({ tier, index })).filter(({ tier }) => ![7,14,30].includes(tier.days));
  const tiers = entries.map(({ tier }) => tier);
  const update = (index: number, key: 'days' | 'totalEGP', value: number) => setCarForm(previous => ({
    ...previous, rentalPriceTiers: (previous.rentalPriceTiers ?? []).map((tier, sourceIndex) => sourceIndex === entries[index].index ? { ...tier, [key]: value } : tier),
  }));
  return <fieldset className="car-duration-prices">
    <legend>أسعار المدد الخاصة</legend>
    <p>حدّد إجمالي السعر للمدة كاملة، مثل 10 أيام أو 21 يومًا. فئة المدة تطبق عند تطابق عدد الأيام فقط، وبقية المدد بالسعر اليومي. الأسبوع والأسبوعان والشهر لها صفوفها أعلاه.</p>
    {tiers.map((tier, index) => <div className="car-duration-row" key={index}>
      <label><span>عدد الأيام</span><input aria-label={`أيام الفئة ${index + 1}`} type="number" min={2} max={365} step={1} required value={tier.days || ''} onChange={event => { const value = Number(event.target.value); if ([7,14,30].includes(value)) { event.target.setCustomValidity('هذه المدة لها صف مستقل أعلاه.'); event.target.reportValidity(); return; } event.target.setCustomValidity(''); update(index, 'days', value); }} /></label>
      <label><span>إجمالي المدة (ج.م)</span><input aria-label={`سعر الفئة ${index + 1}`} type="number" min={0.01} max={100000000} step="0.01" required value={tier.totalEGP || ''} onChange={event => update(index, 'totalEGP', Number(event.target.value))} /></label>
      <button type="button" aria-label={`حذف الفئة ${index + 1}`} onClick={() => setCarForm(previous => ({ ...previous, rentalPriceTiers: (previous.rentalPriceTiers ?? []).filter((_, sourceIndex) => sourceIndex !== entries[index].index) }))}>حذف</button>
    </div>)}
    <button type="button" disabled={(carForm.rentalPriceTiers?.length ?? 0) >= 20} onClick={() => {
      const days = Array.from({ length: 364 }, (_, i) => i + 2).find(day => ![7, 14, 30].includes(day) && !tiers.some(tier => tier.days === day))!;
      setCarForm(previous => ({ ...previous, rentalPriceTiers: [...(previous.rentalPriceTiers ?? []), { days, totalEGP: 0 }] }));
    }}>إضافة فئة مدة</button>
  </fieldset>;
}
