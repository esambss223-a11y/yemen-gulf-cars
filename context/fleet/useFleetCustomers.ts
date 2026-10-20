'use client';

import { useState } from 'react';
import { Customer } from '@/types/fleet';
import { INITIAL_CUSTOMERS } from '@/lib/initial-data';
import { supabase } from '@/lib/supabase';
import { saveToStorage, loadFromStorage } from './fleetStorage';

interface UseFleetCustomersProps {
  logAction: (action: string, details: string) => void;
}

export function useFleetCustomers({ logAction }: UseFleetCustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadFromStorage('yg_customers', INITIAL_CUSTOMERS)
  );

  const addCustomer = (customerData: Omit<Customer, 'id'>): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      createdAt: customerData.createdAt || new Date().toISOString().split('T')[0],
      tier: customerData.tier || 'regular',
      riskStatus: customerData.riskStatus || 'safe',
      trustScore: customerData.trustScore ?? 80,
      totalRentalsCount: customerData.totalRentalsCount ?? 0,
      totalSpentEGP: customerData.totalSpentEGP ?? 0,
    };
    setCustomers((prev) => {
      const updated = [newCustomer, ...prev];
      saveToStorage('yg_customers', updated);
      return updated;
    });

    try {
      supabase.from('customers').insert({
        id: newCustomer.id,
        full_name: newCustomer.fullName,
        phone: newCustomer.phone,
        whatsapp: newCustomer.whatsapp,
        national_id: newCustomer.nationalId,
        license_number: newCustomer.licenseNumber,
        nationality: newCustomer.nationality,
        tier: newCustomer.tier,
        risk_status: newCustomer.riskStatus,
        trust_score: newCustomer.trustScore,
        star_rating: newCustomer.starRating,
        rating_count: newCustomer.ratingCount,
        cleanliness_score: newCustomer.cleanlinessScore,
        damages_count: newCustomer.damagesCount,
        loyalty_points: newCustomer.loyaltyPoints,
        total_rentals_count: newCustomer.totalRentalsCount,
        total_spent_egp: newCustomer.totalSpentEGP,
        notes: newCustomer.notes,
      }).then();
    } catch {
      // ignore
    }

    logAction('تسجيل عميل جديد', `تمت إضافة العميل ${newCustomer.fullName} في سجل العملاء`);
    return newCustomer;
  };

  const updateCustomer = (id: string, partial: Partial<Customer>) => {
    setCustomers((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...partial } : c));
      saveToStorage('yg_customers', updated);
      return updated;
    });

    try {
      const payload: Record<string, unknown> = {};
      if (partial.fullName !== undefined) payload.full_name = partial.fullName;
      if (partial.phone !== undefined) payload.phone = partial.phone;
      if (partial.whatsapp !== undefined) payload.whatsapp = partial.whatsapp;
      if (partial.tier !== undefined) payload.tier = partial.tier;
      if (partial.riskStatus !== undefined) payload.risk_status = partial.riskStatus;
      if (partial.trustScore !== undefined) payload.trust_score = partial.trustScore;
      if (partial.starRating !== undefined) payload.star_rating = partial.starRating;
      if (partial.ratingCount !== undefined) payload.rating_count = partial.ratingCount;
      if (partial.cleanlinessScore !== undefined) payload.cleanliness_score = partial.cleanlinessScore;
      if (partial.damagesCount !== undefined) payload.damages_count = partial.damagesCount;
      if (partial.loyaltyPoints !== undefined) payload.loyalty_points = partial.loyaltyPoints;
      if (partial.totalRentalsCount !== undefined) payload.total_rentals_count = partial.totalRentalsCount;
      if (partial.totalSpentEGP !== undefined) payload.total_spent_egp = partial.totalSpentEGP;
      if (partial.notes !== undefined) payload.notes = partial.notes;

      supabase.from('customers').update(payload).eq('id', id).then();
    } catch {
      // ignore
    }

    logAction('تحديث بيانات عميل', `تم تحديث ملف العميل ID: ${id}`);
  };

  const deleteCustomer = (id: string) => {
    const cust = customers.find((c) => c.id === id);
    setCustomers((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveToStorage('yg_customers', updated);
      return updated;
    });

    try {
      supabase.from('customers').delete().eq('id', id).then();
    } catch {
      // ignore
    }

    logAction('حذف عميل من الدليل', `تم حذف العميل: ${cust?.fullName}`);
  };

  return {
    customers,
    setCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
