'use client';

import { useState, useEffect, useCallback } from 'react';
import { StaffUser, UserRole } from '@/types/fleet';
import { INITIAL_STAFF } from '@/lib/initial-data';
import { supabase } from '@/lib/supabase';
import { saveToStorage, loadFromStorage } from './fleetStorage';

interface UseFleetAuthProps {
  onSignedIn?: () => void;
  logAction: (action: string, details: string) => void;
}

export function useFleetAuth({ onSignedIn, logAction }: UseFleetAuthProps) {
  // تحميل الموظف الحالي فوراً من التخزين المحلي لتفادي أي وميض أو تأخير في التحميل
  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(() =>
    loadFromStorage('yg_current_staff', null)
  );
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

  const fetchStaffData = useCallback(async (userId: string): Promise<Record<string, unknown> | null> => {
    // 1. محاولة القراءة المباشرة من Supabase
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, username, role, phone, active')
        .eq('id', userId)
        .maybeSingle();
      if (!error && data) return data;
    } catch {
      // ignore
    }

    // 2. قراءة الملف عبر مسار الخادم السريع
    try {
      const response = await fetch(`/api/auth/staff-profile?userId=${encodeURIComponent(userId)}`);
      if (response.ok) {
        const result = await response.json();
        if (result?.staff) return result.staff;
      }
    } catch {
      // ignore
    }

    return null;
  }, []);

  const loadStaffProfile = useCallback(async (userId: string) => {
    try {
      const staffRow = await fetchStaffData(userId);
      if (staffRow) {
        const staff = mapStaffRow(staffRow);
        if (staff.active) {
          setCurrentStaff(staff);
          saveToStorage('yg_current_staff', staff);
        } else {
          setCurrentStaff(null);
          try {
            localStorage.removeItem('yg_current_staff');
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // في حالة حدوث خطأ في الشبكة، لا نحذف الموظف الحالي المسجل
    } finally {
      setIsAuthReady(true);
    }
  }, [fetchStaffData, mapStaffRow]);

  useEffect(() => {
    // فحص الجلسة الأولية عند التحميل
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadStaffProfile(session.user.id);
      } else {
        setIsAuthReady(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        loadStaffProfile(session.user.id);
        if (event === 'SIGNED_IN' && onSignedIn) {
          onSignedIn();
        }
      } else if (event === 'SIGNED_OUT') {
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
    if (!rawInput) {
      throw new Error('يرجى إدخال اسم المستخدم أو البريد الإلكتروني');
    }

    // 1. المحاولة عبر مسار الخادم الموثق (Server-side API)
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: rawInput, password }),
      });
      const result = await response.json();
      if (response.ok && result.session && result.staff?.active) {
        await supabase.auth.setSession(result.session);
        const staff = mapStaffRow(result.staff);
        setCurrentStaff(staff);
        saveToStorage('yg_current_staff', staff);
        return staff;
      } else if (!response.ok && result.error && !result.error.includes('الخادم')) {
        throw new Error(result.error);
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch') && !e.message.includes('الخادم')) {
        throw e;
      }
    }

    // 2. بديل فوري ومباشر عبر عميل Supabase Client (Direct fallback)
    const isEmail = rawInput.includes('@');
    const candidateEmails = isEmail
      ? [rawInput]
      : [
          `${rawInput}@olpjfipferziqtzrbbbt.supabase.co`,
          rawInput === 'esam' ? 'esambss223@gmail.com' : `${rawInput}@yemen-gulf-cars.com`,
          `${rawInput}@admin.com`
        ];

    let lastError: string | null = null;
    for (const email of candidateEmails) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data?.user) {
          const staffRow = await fetchStaffData(data.user.id);
          const staff: StaffUser = staffRow ? mapStaffRow(staffRow) : {
            id: data.user.id,
            name: (data.user.user_metadata?.name as string) || 'المدير العام',
            username: rawInput,
            role: 'super_admin',
            phone: '+20 100 000 0001',
            active: true,
          };
          setCurrentStaff(staff);
          saveToStorage('yg_current_staff', staff);
          return staff;
        }
        if (error) lastError = error.message;
      } catch (err: any) {
        lastError = err?.message;
      }
    }

    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
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

  const updateStaff = async (id: string, partial: Partial<StaffUser>) => {
    // 1. تحديث فوري في الحالة المحلية و LocalStorage
    setStaffList((prev) => {
      const updated = prev.map((s) => (s.id === id || s.username === id ? { ...s, ...partial } : s));
      saveToStorage('yg_staff', updated);
      return updated;
    });

    if (currentStaff && (currentStaff.id === id || currentStaff.username === id)) {
      const updatedCurrent = { ...currentStaff, ...partial };
      setCurrentStaff(updatedCurrent);
      saveToStorage('yg_current_staff', updatedCurrent);
    }

    // 2. مزامنة التعديلات في جدول staff في Supabase
    try {
      const payload: Record<string, unknown> = {};
      if (partial.name !== undefined) payload.name = partial.name;
      if (partial.username !== undefined) payload.username = partial.username;
      if (partial.phone !== undefined) payload.phone = partial.phone;
      if (partial.role !== undefined) payload.role = partial.role;
      if (partial.active !== undefined) payload.active = partial.active;

      if (Object.keys(payload).length > 0) {
        await supabase
          .from('staff')
          .update(payload)
          .or(`id.eq.${id},username.eq.${id}`);
      }

      // 3. تحديث كلمة المرور في Supabase Auth إذا تم إدخال كلمة مرور جديدة
      if (partial.password && partial.password.trim().length >= 6) {
        await supabase.auth.updateUser({ password: partial.password });
      }

      // 4. تحديث البيانات الوصفية لحساب المستخدم
      if (partial.name || partial.username || partial.phone) {
        await supabase.auth.updateUser({
          data: {
            name: partial.name ?? currentStaff?.name,
            username: partial.username ?? currentStaff?.username,
            phone: partial.phone ?? currentStaff?.phone,
          }
        });
      }
    } catch (err) {
      console.warn('Update staff cloud sync notice:', err);
    }

    logAction('تعديل حساب موظف', `تم تعديل بيانات الموظف: ${partial.name || partial.username || id}`);
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
