import { validateRentalPriceTiers } from '@/lib/car-pricing';
import type { Car } from '@/types/fleet';

// Legacy database rows contain optional fields and feature metadata.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCloudCarRow(c: Record<string, any>): Car {
    const rawFeatures: string[] = Array.isArray(c.features) ? c.features : [];
    const discountTag = rawFeatures.find((f) => typeof f === 'string' && f.startsWith('__discount_price:'));
    const parsedOriginalPrice = discountTag ? Number(discountTag.split(':')[1]) : undefined;
    const minDaysTag = rawFeatures.find((f) => typeof f === 'string' && f.startsWith('__min_rental_days:'));
    const parsedMinDays = minDaysTag ? Number(minDaysTag.split(':')[1]) : undefined;
    const cleanFeatures = rawFeatures.filter((f) => typeof f === 'string' && !f.startsWith('__discount_price:') && !f.startsWith('__min_rental_days:'));

    return {
      id: String(c.id),
      displayOrder: Number.isInteger(c.display_order) ? c.display_order : undefined,
      carCode: c.car_code,
      make: String(c.make),
      model: String(c.model),
      year: Number(c.year),
      category: c.category || 'vip',
      plateNumber: String(c.plate_number || ''),
      vin: c.vin,
      color: c.color || 'أسود ملكي',
      currentKm: Number(c.current_km || 0),
      initialHandoverKm: c.initial_handover_km !== undefined ? Number(c.initial_handover_km) : 0,
      fleetEntryDate: c.fleet_entry_date,
      contractStartDate: c.contract_start_date,
      contractEndDate: c.contract_end_date,
      licenseExpiryDate: c.license_expiry_date,
      licenseRenewalDate: c.license_renewal_date,
      nextServiceKm: c.next_service_km !== undefined ? Number(c.next_service_km) : 10000,
      nextServiceDate: c.next_service_date,
      serviceResponsibleParty: c.service_responsible_party || 'company',
      dailyPriceEGP: Number(c.daily_price_egp),
      originalDailyPriceEGP: c.original_daily_price_egp
        ? Number(c.original_daily_price_egp)
        : (parsedOriginalPrice || (c.id === 'car-jac-top-01' || c.make === 'جاك' ? 2000 : undefined)),
      rentalPriceTiers: validateRentalPriceTiers(c.rental_price_tiers ?? []),
      weeklyPriceEGP: c.weekly_price_egp != null ? Number(c.weekly_price_egp) : undefined,
      monthlyPriceEGP: c.monthly_price_egp != null ? Number(c.monthly_price_egp) : undefined,
      securityDepositEGP: Number(c.security_deposit_egp ?? 0),
      minRentalDays: c.min_rental_days ? Number(c.min_rental_days) : (parsedMinDays && parsedMinDays > 0 ? parsedMinDays : 1),
      status: c.status || 'available',
      images: Array.isArray(c.images) ? c.images : ['/car-mercedes.jpg'],
      coverImage: c.cover_image || '/car-mercedes.jpg',
      transmission: c.transmission || 'automatic',
      fuelType: c.fuel_type || 'petrol',
      seats: Number(c.seats || 5),
      ownership: c.ownership || 'company',
      ownerId: c.owner_id || (c.ownership === 'company' ? 'owner-1' : undefined),
      ownerName: c.owner_name || (c.ownership === 'company' ? 'شركة يمن الخليج (أسطول الشركة)' : undefined),
      ownerCompensationType: c.owner_compensation_type,
      ownerAgreedRateEGP: c.owner_agreed_rate_egp ? Number(c.owner_agreed_rate_egp) : undefined,
      features: cleanFeatures,
      insuranceExpiryDate: c.insurance_expiry_date,
    };
}
