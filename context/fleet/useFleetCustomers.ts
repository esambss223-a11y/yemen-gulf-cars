'use client';

import { useState } from 'react';
import { Customer } from '@/types/fleet';
import { supabase } from '@/lib/supabase';
import { reportFleetWriteError } from './fleetStorage';

interface UseFleetCustomersProps {
  logAction: (action: string, details: string) => void;
}

export function useFleetCustomers({ logAction }: UseFleetCustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);

  const addCustomer = async (customerData: Omit<Customer, 'id'>): Promise<Customer | null> => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      source: customerData.source || 'office',
      createdAt: customerData.createdAt || new Date().toISOString().split('T')[0],
      tier: customerData.tier || 'regular',
      riskStatus: customerData.riskStatus || 'safe',
      trustScore: customerData.trustScore ?? 80,
      totalRentalsCount: customerData.totalRentalsCount ?? 0,
      totalSpentEGP: customerData.totalSpentEGP ?? 0,
    };
    try {
      const { error } = await supabase.from('customers').insert({
        id: newCustomer.id,
        full_name: newCustomer.fullName,
        source: newCustomer.source,
        identity_verified: Boolean(newCustomer.identityVerified),
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
      });
      if (error) throw error;
    } catch (error) {
      console.warn('Cloud customer insert failed:', error);
      reportFleetWriteError('تعذرت إضافة العميل إلى قاعدة البيانات؛ لم يُحفظ.');
      return null;
    }

    setCustomers((prev) => [newCustomer, ...prev]);
    logAction('تسجيل عميل جديد', `تمت إضافة العميل ${newCustomer.fullName} في سجل العملاء`);
    return newCustomer;
  };

  const updateCustomer = async (id: string, partial: Partial<Customer>): Promise<boolean> => {
    try {
      const payload: Record<string, unknown> = {};
      if (partial.fullName !== undefined) payload.full_name = partial.fullName;
      if (partial.phone !== undefined) payload.phone = partial.phone;
      if (partial.whatsapp !== undefined) payload.whatsapp = partial.whatsapp;
      if (partial.nationalId !== undefined) payload.national_id = partial.nationalId;
      if (partial.licenseNumber !== undefined) payload.license_number = partial.licenseNumber;
      if (partial.identityVerified !== undefined) payload.identity_verified = partial.identityVerified;
      if (partial.source !== undefined) payload.source = partial.source;
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

      if (!Object.keys(payload).length) return true;
      const { data, error } = await supabase.from('customers').update(payload).eq('id', id).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('CUSTOMER_NOT_FOUND');
    } catch (error) {
      console.warn('Cloud customer update failed:', error);
      reportFleetWriteError('تعذر حفظ تعديل العميل في قاعدة البيانات؛ لم يُعتمد التغيير.');
      return false;
    }

    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...partial } : c)));
    logAction('تحديث بيانات عميل', `تم تحديث ملف العميل ID: ${id}`);
    return true;
  };

  const deleteCustomer = async (id: string): Promise<boolean> => {
    const cust = customers.find((c) => c.id === id);
    try {
      const { data, error } = await supabase.from('customers').delete().eq('id', id).select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('CUSTOMER_NOT_FOUND');
    } catch (error) {
      console.warn('Cloud customer deletion failed:', error);
      reportFleetWriteError('تعذر حذف العميل من قاعدة البيانات؛ لم يُحذف السجل.');
      return false;
    }

    setCustomers((prev) => prev.filter((c) => c.id !== id));
    logAction('حذف عميل من الدليل', `تم حذف العميل: ${cust?.fullName}`);
    return true;
  };

  return {
    customers,
    setCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
