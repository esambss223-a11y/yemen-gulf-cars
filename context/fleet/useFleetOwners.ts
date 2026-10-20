'use client';

import { useState, useCallback } from 'react';
import { VehicleOwner } from '@/types/fleet';
import { INITIAL_OWNERS } from '@/lib/initial-data';
import { supabase } from '@/lib/supabase';
import { saveToStorage, loadFromStorage } from './fleetStorage';

interface UseFleetOwnersProps {
  logAction: (action: string, details: string) => void;
}

export function useFleetOwners({ logAction }: UseFleetOwnersProps) {
  const [owners, setOwners] = useState<VehicleOwner[]>(() =>
    loadFromStorage('yg_owners', INITIAL_OWNERS)
  );

  const mapCloudOwner = useCallback((o: Record<string, any>): VehicleOwner => ({
    id: String(o.id),
    name: String(o.name),
    phone: String(o.phone),
    nationalId: o.national_id,
    bankAccount: o.bank_account,
    commissionModel: o.commission_model || 'fixed_monthly',
    ownerSharePercent: Number(o.owner_share_percent || 75),
    fixedDailyRateEGP: o.fixed_daily_rate_egp ? Number(o.fixed_daily_rate_egp) : undefined,
    fixedMonthlyRateEGP: o.fixed_monthly_rate_egp ? Number(o.fixed_monthly_rate_egp) : undefined,
    monthlyPayoutDay: o.monthly_payout_day ? Number(o.monthly_payout_day) : 1,
    notes: o.notes,
  }), []);

  const addOwner = async (ownerData: Omit<VehicleOwner, 'id'>) => {
    const newOwner: VehicleOwner = {
      ...ownerData,
      id: `owner-${Date.now()}`,
    };
    const updated = [...owners, newOwner];
    setOwners(updated);
    saveToStorage('yg_owners', updated);

    try {
      await supabase.from('owners').insert({
        id: newOwner.id,
        name: newOwner.name,
        phone: newOwner.phone,
        national_id: newOwner.nationalId,
        bank_account: newOwner.bankAccount,
        commission_model: newOwner.commissionModel,
        owner_share_percent: newOwner.ownerSharePercent,
        fixed_daily_rate_egp: newOwner.fixedDailyRateEGP,
        fixed_monthly_rate_egp: newOwner.fixedMonthlyRateEGP,
        monthly_payout_day: newOwner.monthlyPayoutDay,
        notes: newOwner.notes,
      });
    } catch {
      // ignore
    }

    logAction('إضافة مالك/مستثمر جديد', `تمت إضافة المالك ${newOwner.name}`);
  };

  const updateOwner = async (id: string, partial: Partial<VehicleOwner>) => {
    const updated = owners.map((o) => (o.id === id ? { ...o, ...partial } : o));
    setOwners(updated);
    saveToStorage('yg_owners', updated);

    try {
      const payload: Record<string, unknown> = {};
      if (partial.name !== undefined) payload.name = partial.name;
      if (partial.phone !== undefined) payload.phone = partial.phone;
      if (partial.nationalId !== undefined) payload.national_id = partial.nationalId;
      if (partial.bankAccount !== undefined) payload.bank_account = partial.bankAccount;
      if (partial.commissionModel !== undefined) payload.commission_model = partial.commissionModel;
      if (partial.ownerSharePercent !== undefined) payload.owner_share_percent = partial.ownerSharePercent;
      if (partial.fixedDailyRateEGP !== undefined) payload.fixed_daily_rate_egp = partial.fixedDailyRateEGP;
      if (partial.fixedMonthlyRateEGP !== undefined) payload.fixed_monthly_rate_egp = partial.fixedMonthlyRateEGP;
      if (partial.monthlyPayoutDay !== undefined) payload.monthly_payout_day = partial.monthlyPayoutDay;
      if (partial.notes !== undefined) payload.notes = partial.notes;

      await supabase.from('owners').update(payload).eq('id', id);
    } catch {
      // ignore
    }

    logAction('تعديل بيانات مالك', `تم تحديث المالك ID: ${id}`);
  };

  const deleteOwner = async (id: string) => {
    const owner = owners.find((o) => o.id === id);
    const updated = owners.filter((o) => o.id !== id);
    setOwners(updated);
    saveToStorage('yg_owners', updated);

    try {
      await supabase.from('owners').delete().eq('id', id);
    } catch {
      // ignore
    }

    logAction('حذف مالك', `تم حذف المالك: ${owner?.name}`);
  };

  return {
    owners,
    setOwners,
    mapCloudOwner,
    addOwner,
    updateOwner,
    deleteOwner,
  };
}
