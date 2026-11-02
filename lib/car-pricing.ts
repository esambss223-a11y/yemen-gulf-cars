import type { Car } from '@/types/fleet';

export function validateRentalPriceTiers(value: unknown): NonNullable<Car['rentalPriceTiers']> {
  if (!Array.isArray(value) || value.length > 20) throw new Error('الحد الأقصى 20 فئة مدة لكل سيارة.');
  const seen = new Set<number>();
  return value.map(tier => {
    if (!tier || !Number.isInteger(tier.days) || tier.days < 2 || tier.days > 365 || seen.has(tier.days) || typeof tier.totalEGP !== 'number' || !Number.isFinite(tier.totalEGP) || tier.totalEGP <= 0 || tier.totalEGP > 100000000 || Math.abs(tier.totalEGP * 100 - Math.round(tier.totalEGP * 100)) > 0.00001) throw new Error('راجع فئات المدد: أيام صحيحة دون تكرار وسعر أكبر من صفر. السعر بعد الخصم يجب أن يكون أقل من السعر الأساسي.');
    seen.add(tier.days);
    if (tier.originalTotalEGP !== undefined && (typeof tier.originalTotalEGP !== 'number' || !Number.isFinite(tier.originalTotalEGP) || tier.originalTotalEGP <= tier.totalEGP || tier.originalTotalEGP > 100000000 || Math.abs(tier.originalTotalEGP * 100 - Math.round(tier.originalTotalEGP * 100)) > 0.00001)) throw new Error('السعر الأساسي للعرض يجب أن يكون أكبر من السعر النهائي وبحد أقصى منزلتين عشريتين.');
    return { days: tier.days, totalEGP: tier.totalEGP, ...(tier.originalTotalEGP !== undefined ? { originalTotalEGP: tier.originalTotalEGP } : {}) };
  });
}

// Each duration has its own exact total, without prorating or package mixing.
export function rentalQuote(car: Pick<Car, 'dailyPriceEGP' | 'weeklyPriceEGP' | 'monthlyPriceEGP' | 'rentalPriceTiers'>, days: number) {
  if (!Number.isInteger(days) || days < 1) throw new Error('مدة الإيجار غير صالحة.');
  const tier = validateRentalPriceTiers(car.rentalPriceTiers ?? []).find(tier => tier.days === days);
  const prices = carRentalPrices(car);
  const total = days === 7 ? prices.weekly : days === 30 ? prices.monthly : tier ? tier.totalEGP : car.dailyPriceEGP * days;
  const totalEGP = Math.round(total * 100) / 100;
  if (!Number.isFinite(totalEGP) || totalEGP < 0) throw new Error('راجع سعر السيارة قبل إنشاء العقد.');
  return { totalEGP, dailyRateEGP: Math.round(totalEGP / days * 100) / 100, label: tier || days === 7 || days === 30 ? `سعر فئة ${days} أيام` : 'السعر اليومي × المدة' };
}

// Explicit period prices take precedence; legacy cars can still use catalog defaults.
export function carRentalPrices(car: Pick<Car, 'dailyPriceEGP' | 'weeklyPriceEGP' | 'monthlyPriceEGP'>) {
  return {
    daily: car.dailyPriceEGP,
    weekly: car.weeklyPriceEGP ?? car.dailyPriceEGP * 6,
    monthly: car.monthlyPriceEGP ?? car.dailyPriceEGP * 24,
  };
}
