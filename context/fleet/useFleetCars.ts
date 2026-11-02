'use client';

import { useState } from 'react';
import { validateCarOffers } from '@/lib/car-offers';
import { validateRentalPriceTiers } from '@/lib/car-pricing';
import { mapCloudCarRow } from '@/lib/car-mapping';
import { Car } from '@/types/fleet';
import { supabase } from '@/lib/supabase';
import { reportFleetWriteError } from './fleetStorage';
import { carLifecycleRequest } from '@/lib/car-lifecycle-client';

function carWriteMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'code' in error && ['PGRST204', '42703', '23514'].includes(String(error.code)) && 'message' in error && String(error.message).includes('rental_price_tiers')) return 'لتفعيل أسعار المدد الخاصة، شغّل ملف 20261031_repair_car_customer_fields.sql في Supabase ثم أعد المحاولة. لم تُحفظ التغييرات.';
  return fallback;
}

interface UseFleetCarsProps {
  logAction: (action: string, details: string) => void;
}

export function useFleetCars({ logAction }: UseFleetCarsProps) {
  const [cars, setCars] = useState<Car[]>([]);

  const mapCloudCar = mapCloudCarRow;

  const addCar = async (newCarData: Omit<Car, 'id'>): Promise<boolean> => {
    const newCar: Car = {
      ...newCarData,
      id: `car-${Date.now()}`,
    };
    try {
      validateCarOffers(newCar);
      const tiers = validateRentalPriceTiers(newCar.rentalPriceTiers ?? []);
      const featuresToSave = [...(newCar.features || [])].filter((f) => typeof f === 'string' && !f.startsWith('__discount_price:') && !f.startsWith('__min_rental_days:'));
      if (newCar.originalDailyPriceEGP && newCar.originalDailyPriceEGP > newCar.dailyPriceEGP) {
        featuresToSave.push(`__discount_price:${newCar.originalDailyPriceEGP}`);
      }
      const minDays = Number(newCar.minRentalDays) || 1;
      if (minDays > 1) {
        featuresToSave.push(`__min_rental_days:${minDays}`);
      }

      const { error } = await supabase.from('cars').insert({
        ...(tiers.length ? { rental_price_tiers: tiers } : {}),
        id: newCar.id,
        car_code: newCar.carCode || null,
        make: newCar.make,
        model: newCar.model,
        year: Number(newCar.year),
        category: newCar.category,
        plate_number: newCar.plateNumber,
        vin: newCar.vin || null,
        color: newCar.color,
        current_km: Number(newCar.currentKm || 0),
        initial_handover_km: Number(newCar.initialHandoverKm || 0),
        fleet_entry_date: newCar.fleetEntryDate || null,
        contract_start_date: newCar.contractStartDate || null,
        contract_end_date: newCar.contractEndDate || null,
        license_expiry_date: newCar.licenseExpiryDate || null,
        license_renewal_date: newCar.licenseRenewalDate || null,
        insurance_expiry_date: newCar.insuranceExpiryDate || null,
        next_service_km: newCar.nextServiceKm ? Number(newCar.nextServiceKm) : null,
        next_service_date: newCar.nextServiceDate || null,
        service_responsible_party: newCar.serviceResponsibleParty || 'company',
        daily_price_egp: Number(newCar.dailyPriceEGP),
        weekly_price_egp: newCar.weeklyPriceEGP != null ? Number(newCar.weeklyPriceEGP) : null,
        monthly_price_egp: newCar.monthlyPriceEGP != null ? Number(newCar.monthlyPriceEGP) : null,
        security_deposit_egp: Number(newCar.securityDepositEGP || 0),
        status: newCar.status || 'available',
        images: newCar.images || ['/car-mercedes.jpg'],
        cover_image: newCar.coverImage || '/car-mercedes.jpg',
        transmission: newCar.transmission || 'automatic',
        fuel_type: newCar.fuelType || 'petrol',
        seats: Number(newCar.seats || 5),
        ownership: newCar.ownership || 'company',
        owner_id: newCar.ownerId && newCar.ownerId.trim() !== '' ? newCar.ownerId : (newCar.ownership === 'investor' ? null : 'owner-1'),
        owner_name: newCar.ownerName || (newCar.ownership === 'company' ? 'شركة يمن الخليج (أسطول الشركة)' : null),
        owner_compensation_type: newCar.ownerCompensationType || null,
        owner_agreed_rate_egp: newCar.ownerAgreedRateEGP ? Number(newCar.ownerAgreedRateEGP) : null,
        features: featuresToSave,
      });
      if (error) throw error;
    } catch (e) {
      console.warn('Cloud car insert failed:', e);
      reportFleetWriteError(carWriteMessage(e, 'تعذرت إضافة السيارة إلى قاعدة البيانات؛ لم تُحفظ. تحقق من الاتصال والصلاحيات ثم أعد المحاولة.'));
      return false;
    }

    setCars((prev) => [newCar, ...prev]);
    logAction('إضافة سيارة جديدة', `تمت إضافة ${newCar.make} ${newCar.model} (${newCar.plateNumber})`);
    return true;
  };

  const updateCar = async (id: string, partial: Partial<Car>): Promise<boolean> => {
    if (partial.status === 'archived' || (cars.find((car) => car.id === id)?.status === 'archived' && partial.status)) {
      reportFleetWriteError('استخدم إجراء الأرشفة أو الإعادة من الأرشيف؛ تغيير حالة التشغيل لا يلغي الحجوزات.');
      return false;
    }
    let savedCar: Car;
    try {
      const current = cars.find(car => car.id === id);
      if (current) validateCarOffers({ ...current, ...partial });
      const payload: Record<string, unknown> = {};
      if (partial.rentalPriceTiers !== undefined) {
        const tiers = validateRentalPriceTiers(partial.rentalPriceTiers);
        if (tiers.length || cars.find(car => car.id === id)?.rentalPriceTiers?.length) payload.rental_price_tiers = tiers;
      }
      if (partial.carCode !== undefined) payload.car_code = partial.carCode;
      if (partial.make !== undefined) payload.make = partial.make;
      if (partial.model !== undefined) payload.model = partial.model;
      if (partial.year !== undefined) payload.year = partial.year;
      if (partial.category !== undefined) payload.category = partial.category;
      if (partial.plateNumber !== undefined) payload.plate_number = partial.plateNumber;
      if (partial.vin !== undefined) payload.vin = partial.vin || null;
      if (partial.color !== undefined) payload.color = partial.color;
      if (partial.status !== undefined) payload.status = partial.status;
      if (partial.currentKm !== undefined) payload.current_km = partial.currentKm;
      if (partial.initialHandoverKm !== undefined) payload.initial_handover_km = partial.initialHandoverKm;
      if (partial.fleetEntryDate !== undefined) payload.fleet_entry_date = partial.fleetEntryDate || null;
      if (partial.contractStartDate !== undefined) payload.contract_start_date = partial.contractStartDate || null;
      if (partial.contractEndDate !== undefined) payload.contract_end_date = partial.contractEndDate || null;
      if (partial.licenseExpiryDate !== undefined) payload.license_expiry_date = partial.licenseExpiryDate || null;
      if (partial.licenseRenewalDate !== undefined) payload.license_renewal_date = partial.licenseRenewalDate || null;
      if (partial.insuranceExpiryDate !== undefined) payload.insurance_expiry_date = partial.insuranceExpiryDate || null;
      if (partial.nextServiceKm !== undefined) payload.next_service_km = partial.nextServiceKm || null;
      if (partial.nextServiceDate !== undefined) payload.next_service_date = partial.nextServiceDate || null;
      if (partial.serviceResponsibleParty !== undefined) payload.service_responsible_party = partial.serviceResponsibleParty;
      if (partial.dailyPriceEGP !== undefined) payload.daily_price_egp = partial.dailyPriceEGP;
      if (partial.weeklyPriceEGP !== undefined) payload.weekly_price_egp = partial.weeklyPriceEGP;
      if (partial.monthlyPriceEGP !== undefined) payload.monthly_price_egp = partial.monthlyPriceEGP;
      if (partial.securityDepositEGP !== undefined) payload.security_deposit_egp = partial.securityDepositEGP;
      if (partial.images !== undefined) payload.images = partial.images;
      if (partial.coverImage !== undefined) payload.cover_image = partial.coverImage;
      if (partial.transmission !== undefined) payload.transmission = partial.transmission;
      if (partial.fuelType !== undefined) payload.fuel_type = partial.fuelType;
      if (partial.seats !== undefined) payload.seats = partial.seats;

      if (partial.features !== undefined || partial.originalDailyPriceEGP !== undefined || partial.minRentalDays !== undefined) {
        const currentCar = cars.find((c) => c.id === id);
        const baseFeatures = partial.features !== undefined ? partial.features : (currentCar?.features || []);
        const cleanFeatures = baseFeatures.filter((f: string) => typeof f === 'string' && !f.startsWith('__discount_price:') && !f.startsWith('__min_rental_days:'));
        const origPrice = partial.originalDailyPriceEGP !== undefined ? partial.originalDailyPriceEGP : currentCar?.originalDailyPriceEGP;
        const dailyPrice = partial.dailyPriceEGP !== undefined ? partial.dailyPriceEGP : (currentCar?.dailyPriceEGP || 0);
        const minDays = partial.minRentalDays !== undefined ? Number(partial.minRentalDays) : (currentCar?.minRentalDays || 1);

        if (origPrice && origPrice > dailyPrice) {
          cleanFeatures.push(`__discount_price:${origPrice}`);
        }
        if (minDays > 1) {
          cleanFeatures.push(`__min_rental_days:${minDays}`);
        }
        payload.features = cleanFeatures;
      }

      if (partial.ownership !== undefined) payload.ownership = partial.ownership;
      if (partial.ownerId !== undefined) payload.owner_id = partial.ownerId && partial.ownerId.trim() !== '' ? partial.ownerId : null;
      if (partial.ownerName !== undefined) payload.owner_name = partial.ownerName;
      if (partial.ownerCompensationType !== undefined) payload.owner_compensation_type = partial.ownerCompensationType;
      if (partial.ownerAgreedRateEGP !== undefined) payload.owner_agreed_rate_egp = partial.ownerAgreedRateEGP;

      if (!Object.keys(payload).length) return true;
      const { data, error } = await supabase.from('cars').update(payload).eq('id', id).select('*').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('CAR_NOT_FOUND');
      savedCar = mapCloudCar(data);
    } catch (error) {
      console.warn('Cloud car update failed:', error);
      reportFleetWriteError(carWriteMessage(error, 'تعذر حفظ تعديل السيارة في قاعدة البيانات؛ لم يُعتمد التغيير.'));
      return false;
    }

    setCars((prev) => prev.map((c) => (c.id === id ? savedCar : c)));
    logAction('تعديل سيارة', `تم تحديث بيانات السيارة ID: ${id}`);
    return true;
  };

  const deleteCar = async (id: string): Promise<boolean> => {
    try {
      await carLifecycleRequest(id, 'delete');
    } catch (error) {
      reportFleetWriteError(error instanceof Error ? error.message : 'تعذر حذف السيارة؛ لم يُحذف السجل.');
      return false;
    }

    setCars((prev) => prev.filter((c) => c.id !== id));
    return true;
  };

  const setCarArchived = async (id: string, archived: boolean): Promise<boolean> => {
    const result = await carLifecycleRequest(id, archived ? 'archive' : 'restore');
    const saved = mapCloudCar(result.car);
    setCars((previous) => previous.map((car) => car.id === saved.id ? saved : car));
    return true;
  };

  const saveCarOrder = async (ids: string[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('انتهت جلسة الدخول. سجل الدخول مجددًا.');
    const response = await fetch('/api/admin/cars/order', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ ids }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'تعذر حفظ ترتيب العرض.');
    const positions = new Map(ids.map((id,index) => [id,index]));
    setCars(previous => previous.map(car => positions.has(car.id) ? { ...car, displayOrder: positions.get(car.id) } : car));
    logAction('ترتيب عرض السيارات', 'تم حفظ ترتيب السيارات في موقع الزوار');
  };

  return {
    cars,
    setCars,
    mapCloudCar,
    addCar,
    updateCar,
    deleteCar,
    setCarArchived,
    saveCarOrder,
  };
}
