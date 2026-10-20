'use client';

import { useState, useCallback } from 'react';
import { Car } from '@/types/fleet';
import { INITIAL_CARS } from '@/lib/initial-data';
import { supabase } from '@/lib/supabase';
import { saveToStorage, loadFromStorage } from './fleetStorage';

interface UseFleetCarsProps {
  logAction: (action: string, details: string) => void;
}

export function useFleetCars({ logAction }: UseFleetCarsProps) {
  const [cars, setCars] = useState<Car[]>(() =>
    loadFromStorage('yg_cars', INITIAL_CARS)
  );

  const mapCloudCar = useCallback((c: Record<string, any>): Car => ({
    id: String(c.id),
    carCode: c.car_code,
    make: String(c.make),
    model: String(c.model),
    year: Number(c.year),
    category: c.category || 'vip',
    plateNumber: String(c.plate_number),
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
    ownerId: c.owner_id,
    ownerName: c.owner_name,
    ownerCompensationType: c.owner_compensation_type,
    ownerAgreedRateEGP: c.owner_agreed_rate_egp ? Number(c.owner_agreed_rate_egp) : undefined,
    features: Array.isArray(c.features) ? c.features : [],
    insuranceExpiryDate: c.insurance_expiry_date,
  }), []);

  const addCar = async (newCarData: Omit<Car, 'id'>) => {
    const newCar: Car = {
      ...newCarData,
      id: `car-${Date.now()}`,
    };
    const updated = [newCar, ...cars];
    setCars(updated);
    saveToStorage('yg_cars', updated);

    try {
      await supabase.from('cars').insert({
        id: newCar.id,
        car_code: newCar.carCode,
        make: newCar.make,
        model: newCar.model,
        year: newCar.year,
        category: newCar.category,
        plate_number: newCar.plateNumber,
        vin: newCar.vin,
        color: newCar.color,
        current_km: newCar.currentKm,
        initial_handover_km: newCar.initialHandoverKm,
        fleet_entry_date: newCar.fleetEntryDate,
        contract_start_date: newCar.contractStartDate,
        contract_end_date: newCar.contractEndDate,
        license_expiry_date: newCar.licenseExpiryDate,
        license_renewal_date: newCar.licenseRenewalDate,
        next_service_km: newCar.nextServiceKm,
        next_service_date: newCar.nextServiceDate,
        service_responsible_party: newCar.serviceResponsibleParty,
        daily_price_egp: newCar.dailyPriceEGP,
        weekly_price_egp: newCar.weeklyPriceEGP,
        monthly_price_egp: newCar.monthlyPriceEGP,
        security_deposit_egp: newCar.securityDepositEGP,
        status: newCar.status,
        images: newCar.images,
        cover_image: newCar.coverImage,
        transmission: newCar.transmission,
        fuel_type: newCar.fuelType,
        seats: newCar.seats,
        ownership: newCar.ownership,
        owner_id: newCar.ownerId,
        owner_name: newCar.ownerName,
        owner_compensation_type: newCar.ownerCompensationType,
        owner_agreed_rate_egp: newCar.ownerAgreedRateEGP,
        features: newCar.features,
      });
    } catch (e) {
      console.warn('Cloud car insert warning:', e);
    }

    logAction('إضافة سيارة جديدة', `تمت إضافة ${newCar.make} ${newCar.model} (${newCar.plateNumber})`);
  };

  const updateCar = async (id: string, partial: Partial<Car>) => {
    const updated = cars.map((c) => (c.id === id ? { ...c, ...partial } : c));
    setCars(updated);
    saveToStorage('yg_cars', updated);

    try {
      const payload: Record<string, unknown> = {};
      if (partial.carCode !== undefined) payload.car_code = partial.carCode;
      if (partial.make !== undefined) payload.make = partial.make;
      if (partial.model !== undefined) payload.model = partial.model;
      if (partial.year !== undefined) payload.year = partial.year;
      if (partial.category !== undefined) payload.category = partial.category;
      if (partial.plateNumber !== undefined) payload.plate_number = partial.plateNumber;
      if (partial.color !== undefined) payload.color = partial.color;
      if (partial.status !== undefined) payload.status = partial.status;
      if (partial.currentKm !== undefined) payload.current_km = partial.currentKm;
      if (partial.initialHandoverKm !== undefined) payload.initial_handover_km = partial.initialHandoverKm;
      if (partial.fleetEntryDate !== undefined) payload.fleet_entry_date = partial.fleetEntryDate;
      if (partial.contractStartDate !== undefined) payload.contract_start_date = partial.contractStartDate;
      if (partial.contractEndDate !== undefined) payload.contract_end_date = partial.contractEndDate;
      if (partial.licenseExpiryDate !== undefined) payload.license_expiry_date = partial.licenseExpiryDate;
      if (partial.licenseRenewalDate !== undefined) payload.license_renewal_date = partial.licenseRenewalDate;
      if (partial.nextServiceKm !== undefined) payload.next_service_km = partial.nextServiceKm;
      if (partial.nextServiceDate !== undefined) payload.next_service_date = partial.nextServiceDate;
      if (partial.serviceResponsibleParty !== undefined) payload.service_responsible_party = partial.serviceResponsibleParty;
      if (partial.dailyPriceEGP !== undefined) payload.daily_price_egp = partial.dailyPriceEGP;
      if (partial.weeklyPriceEGP !== undefined) payload.weekly_price_egp = partial.weeklyPriceEGP;
      if (partial.securityDepositEGP !== undefined) payload.security_deposit_egp = partial.securityDepositEGP;
      if (partial.images !== undefined) payload.images = partial.images;
      if (partial.coverImage !== undefined) payload.cover_image = partial.coverImage;
      if (partial.ownership !== undefined) payload.ownership = partial.ownership;
      if (partial.ownerId !== undefined) payload.owner_id = partial.ownerId;
      if (partial.ownerName !== undefined) payload.owner_name = partial.ownerName;
      if (partial.ownerCompensationType !== undefined) payload.owner_compensation_type = partial.ownerCompensationType;
      if (partial.ownerAgreedRateEGP !== undefined) payload.owner_agreed_rate_egp = partial.ownerAgreedRateEGP;

      await supabase.from('cars').update(payload).eq('id', id);
    } catch {
      // ignore
    }

    logAction('تعديل سيارة', `تم تحديث بيانات السيارة ID: ${id}`);
  };

  const deleteCar = async (id: string) => {
    const car = cars.find((c) => c.id === id);
    const updated = cars.filter((c) => c.id !== id);
    setCars(updated);
    saveToStorage('yg_cars', updated);

    try {
      await supabase.from('cars').delete().eq('id', id);
    } catch {
      // ignore
    }

    logAction('حذف سيارة', `تم حذف السيارة: ${car?.make} ${car?.model}`);
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
