'use client';

import { useState, useCallback } from 'react';
import { Car } from '@/types/fleet';
import { supabase } from '@/lib/supabase';
import { reportFleetWriteError } from './fleetStorage';

interface UseFleetCarsProps {
  logAction: (action: string, details: string) => void;
}

export function useFleetCars({ logAction }: UseFleetCarsProps) {
  const [cars, setCars] = useState<Car[]>([]);

  const mapCloudCar = useCallback((c: Record<string, any>): Car => ({
    id: String(c.id),
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
    weeklyPriceEGP: c.weekly_price_egp ? Number(c.weekly_price_egp) : undefined,
    monthlyPriceEGP: c.monthly_price_egp ? Number(c.monthly_price_egp) : undefined,
    securityDepositEGP: Number(c.security_deposit_egp || 10000),
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
    features: Array.isArray(c.features) ? c.features : [],
    insuranceExpiryDate: c.insurance_expiry_date,
  }), []);

  const addCar = async (newCarData: Omit<Car, 'id'>): Promise<boolean> => {
    const newCar: Car = {
      ...newCarData,
      id: `car-${Date.now()}`,
    };
    try {
      const { error } = await supabase.from('cars').insert({
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
        next_service_km: newCar.nextServiceKm ? Number(newCar.nextServiceKm) : null,
        next_service_date: newCar.nextServiceDate || null,
        service_responsible_party: newCar.serviceResponsibleParty || 'company',
        daily_price_egp: Number(newCar.dailyPriceEGP),
        weekly_price_egp: newCar.weeklyPriceEGP ? Number(newCar.weeklyPriceEGP) : null,
        monthly_price_egp: newCar.monthlyPriceEGP ? Number(newCar.monthlyPriceEGP) : null,
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
        features: newCar.features || [],
      });
      if (error) throw error;
    } catch (e) {
      console.warn('Cloud car insert failed:', e);
      reportFleetWriteError('تعذرت إضافة السيارة إلى قاعدة البيانات؛ لم تُحفظ. تحقق من الاتصال والصلاحيات ثم أعد المحاولة.');
      return false;
    }

    setCars((prev) => [newCar, ...prev]);
    logAction('إضافة سيارة جديدة', `تمت إضافة ${newCar.make} ${newCar.model} (${newCar.plateNumber})`);
    return true;
  };

  const updateCar = async (id: string, partial: Partial<Car>): Promise<boolean> => {
    try {
      const payload: Record<string, unknown> = {};
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
      if (partial.features !== undefined) payload.features = partial.features;
      if (partial.ownership !== undefined) payload.ownership = partial.ownership;
      if (partial.ownerId !== undefined) payload.owner_id = partial.ownerId && partial.ownerId.trim() !== '' ? partial.ownerId : null;
      if (partial.ownerName !== undefined) payload.owner_name = partial.ownerName;
      if (partial.ownerCompensationType !== undefined) payload.owner_compensation_type = partial.ownerCompensationType;
      if (partial.ownerAgreedRateEGP !== undefined) payload.owner_agreed_rate_egp = partial.ownerAgreedRateEGP;

      if (!Object.keys(payload).length) return true;
      const { data, error } = await supabase.from('cars').update(payload).eq('id', id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('CAR_NOT_FOUND');
    } catch (error) {
      console.warn('Cloud car update failed:', error);
      reportFleetWriteError('تعذر حفظ تعديل السيارة في قاعدة البيانات؛ لم يُعتمد التغيير.');
      return false;
    }

    setCars((prev) => prev.map((c) => (c.id === id ? { ...c, ...partial } : c)));
    logAction('تعديل سيارة', `تم تحديث بيانات السيارة ID: ${id}`);
    return true;
  };

  const deleteCar = async (id: string): Promise<boolean> => {
    try {
      const { data: linkedBookings, error: bookingError } = await supabase
        .from('bookings').select('id').eq('car_id', id).limit(1);
      if (bookingError) throw bookingError;
      if (linkedBookings?.length) {
        reportFleetWriteError('لا يمكن حذف هذه السيارة لوجود حجوزات مرتبطة بها؛ غيّر حالتها إلى صيانة أو غير متاحة للحفاظ على سجل العقود.');
        return false;
      }
      const { data, error } = await supabase.from('cars').delete().eq('id', id).select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('CAR_NOT_FOUND');
    } catch (error) {
      console.warn('Cloud car deletion failed:', error);
      reportFleetWriteError('تعذر حذف السيارة من قاعدة البيانات؛ لم يُحذف السجل.');
      return false;
    }

    setCars((prev) => prev.filter((c) => c.id !== id));
    logAction('حذف سيارة', `تم حذف السيارة ID: ${id}`);
    return true;
  };

  return {
    cars,
    setCars,
    mapCloudCar,
    addCar,
    updateCar,
    deleteCar,
  };
}
