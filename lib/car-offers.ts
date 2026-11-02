import type { Car } from '@/types/fleet';
import { validateRentalPriceTiers } from './car-pricing';

export type OfferCar = Pick<Car, 'dailyPriceEGP' | 'weeklyPriceEGP' | 'monthlyPriceEGP' | 'originalDailyPriceEGP' | 'rentalPriceTiers'>;
export function carPeriodOffer(car: OfferCar, days: number) {
  const tier = car.rentalPriceTiers?.find(tier => tier.days === days);
  const price = days === 1 ? car.dailyPriceEGP : days === 7 ? car.weeklyPriceEGP : days === 30 ? car.monthlyPriceEGP : tier?.totalEGP;
  const original = days === 1 ? car.originalDailyPriceEGP : tier?.originalTotalEGP;
  return { price: price ?? 0, original: original && original > 0 ? original : undefined };
}

export function updateCarPeriodOffer<T extends OfferCar>(car: T, days: number, change: { price?: number; original?: number | null }): T {
  const previous = carPeriodOffer(car, days);
  const price = change.price ?? previous.price;
  const original = change.original === null ? undefined : change.original ?? previous.original;
  if (days === 1) return { ...car, dailyPriceEGP: price, originalDailyPriceEGP: original ?? 0 };
  const tiers = (car.rentalPriceTiers ?? []).filter(tier => tier.days !== days);
  // Standard-period fields remain authoritative; their tier carries the offer metadata.
  if ((! [7, 30].includes(days) && price > 0) || original !== undefined) tiers.push({ days, totalEGP: price, ...(original !== undefined ? { originalTotalEGP: original } : {}) });
  return { ...car, ...(days === 7 ? { weeklyPriceEGP: price } : days === 30 ? { monthlyPriceEGP: price } : {}), rentalPriceTiers: tiers };
}

export function validateCarOffers(car: OfferCar) {
  validateRentalPriceTiers(car.rentalPriceTiers ?? []);
  if (car.originalDailyPriceEGP && car.originalDailyPriceEGP <= car.dailyPriceEGP) throw new Error('السعر اليومي بعد الخصم يجب أن يكون أقل من السعر الأساسي.');
  for (const days of [7, 30]) {
    const offer = carPeriodOffer(car, days);
    if (offer.original !== undefined && offer.original <= offer.price) throw new Error(`راجع عرض ${days} أيام: السعر النهائي يجب أن يكون أقل من السعر الأساسي.`);
  }
}
