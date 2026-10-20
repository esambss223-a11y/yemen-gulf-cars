'use client';

import { useState, useEffect, useCallback } from 'react';
import { StaffUser, UserRole } from '@/types/fleet';
import { INITIAL_STAFF } from '@/lib/initial-data';
import { supabase, usernameToAuthEmail } from '@/lib/supabase';
import { saveToStorage, loadFromStorage } from './fleetStorage';

interface UseFleetAuthProps {
  onSignedIn?: () => void;
  logAction: (action: string, details: string) => void;
}

export function useFleetAuth({ onSignedIn, logAction }: UseFleetAuthProps) {
  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [staffList, setStaffList] = useState<StaffUser[]>(() =>
    loadFromStorage('yg_staff', INITIAL_STAFF)
  );

  const mapStaffRow = useCallback((row: Record<string, unknown>): StaffUser => ({
    id: String(row.id),
    name: String(row.name ?? ''),
    username: String(row.username ?? ''),
    role: (row.role as UserRole) ?? 'rental_agent',
    phone: String(row.phone ?? ''),
    active: Boolean(row.active),
  }), []);

  const fetchStaffData = useCallback(async (userId: string, userMeta?: Record<string, unknown>): Promise<Record<string, unknown> | null> => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, username, role, phone, active')
        .eq('id', userId)
        .single();
      if (!error && data) return data;
    } catch {
      // ignore
    }

    // استعلام الخادم الموثق لتجاوز أي قيود RLS
    try {
      const res = await fetch(`/api/auth/staff-profile?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json?.staff) return json.staff;
      }
    } catch {
      // ignore
    }

    // بيانات المستخدم الوصفية المخزنة في Supabase Auth
    if (userMeta?.name && userMeta?.username) {
      return {
        id: userId,
        name: userMeta.name,
        username: userMeta.username,
        role: userMeta.role || 'super_admin',
        phone: userMeta.phone || '+20 100 000 0001',
        active: true,
      };
    }

    return null;
  }, []);

  const loadStaffProfile = useCallback(async (userId: string, userMeta?: Record<string, unknown>) => {
    try {
      const staffRow = await fetchStaffData(userId, userMeta);
      if (staffRow) {
        const staff = mapStaffRow(staffRow);
        setCurrentStaff(staff.active ? staff : null);
      } else {
        setCurrentStaff(null);
      }
    } catch {
      setCurrentStaff(null);
    } finally {
      setIsAuthReady(true);
    }
  }, [fetchStaffData, mapStaffRow]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        loadStaffProfile(session.user.id, session.user.user_metadata as Record<string, unknown>);
        if (event === 'SIGNED_IN' && onSignedIn) {
          onSignedIn();
        }
      } else {
        try {
          localStorage.removeItem('yg_current_staff');
        } catch {
          // ignore
        }
        setCurrentStaff(null);
        setIsAuthReady(true);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [loadStaffProfile, onSignedIn]);

  const signIn = async (identifier: string, password: string): Promise<StaffUser> => {
    const rawInput = identifier.trim().toLowerCase();
    const isEmail = rawInput.includes('@');
    if (!isEmail && !/^[a-z0-9._-]+$/.test(rawInput)) {
      throw new Error('أدخل اسم الموظف أو البريد الإلكتروني بالإنجليزية');
    }

    const authEmail = usernameToAuthEmail(rawInput);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    });
    if (error || !data.user) {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    const staffRow = await fetchStaffData(data.user.id, data.user.user_metadata as Record<string, unknown>);

    if (!staffRow || !staffRow.active) {
      await supabase.auth.signOut();
      setCurrentStaff(null);
      throw new Error('هذا الحساب غير مفعّل كموظف في النظام');
    }

    const staff = mapStaffRow(staffRow);
    setCurrentStaff(staff);
    return staff;
  };

  const signOut = async () => {
    setCurrentStaff(null);
    try {
      localStorage.removeItem('yg_current_staff');
    } catch {
      // ignore
    }
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  };

  const addStaff = (staffData: Omit<StaffUser, 'id'>) => {
    const newStaff: StaffUser = {
      ...staffData,
      id: `staff-${Date.now()}`,
    };
    const updated = [...staffList, newStaff];
    setStaffList(updated);
    saveToStorage('yg_staff', updated);
    logAction('إضافة موظف جديد', `تمت إضافة الموظف ${newStaff.name} بدور ${newStaff.role}`);
  };

  const updateStaff = (id: string, partial: Partial<StaffUser>) => {
    const updated = staffList.map((s) => (s.id === id ? { ...s, ...partial } : s));
    setStaffList(updated);
    saveToStorage('yg_staff', updated);

    // تحديث بيانات الموظف النشط حالياً في الجلسة فوراً
    if (currentStaff && (currentStaff.id === id || currentStaff.username === id)) {
      const updatedCurrent = { ...currentStaff, ...partial };
      setCurrentStaff(updatedCurrent);
      saveToStorage('yg_current_staff', updatedCurrent);
    }

    try {
      const payload: Record<string, unknown> = {};
      if (partial.name !== undefined) payload.name = partial.name;
      if (partial.phone !== undefined) payload.phone = partial.phone;
      if (partial.role !== undefined) payload.role = partial.role;
      if (partial.active !== undefined) payload.active = partial.active;
      supabase.from('staff').update(payload).eq('id', id).then();
    } catch {
      // ignore
    }

    logAction('تعديل حساب موظف', `تم تعديل بيانات الموظف ID: ${id}`);
  };

  const deleteStaff = (id: string) => {
    if (staffList.length <= 1) {
      alert('لا يمكن حذف الموظف الوحيد في النظام');
      return;
    }
    const staff = staffList.find((s) => s.id === id);
    const updated = staffList.filter((s) => s.id !== id);
    setStaffList(updated);
    saveToStorage('yg_staff', updated);
    logAction('حذف موظف', `تم حذف حساب الموظف: ${staff?.name}`);
  };

  return {
    currentStaff,
    isAuthReady,
    staffList,
    setStaffList,
    signIn,
    signOut,
    addStaff,
    updateStaff,
    deleteStaff,
  };
}
