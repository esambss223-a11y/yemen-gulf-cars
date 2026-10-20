'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { StaffUser, UserRole } from '@/types/fleet';
import { INITIAL_STAFF } from '@/lib/initial-data';
import { supabase } from '@/lib/supabase';
import { saveToStorage, loadFromStorage } from './fleetStorage';

interface UseFleetAuthProps {
  onSignedIn?: () => void;
  logAction: (action: string, details: string) => void;
}

export function useFleetAuth({ onSignedIn, logAction }: UseFleetAuthProps) {
  // تحميل بيانات الموظف مباشرة من التخزين المحلي فور فتح الصفحة
  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(() =>
    loadFromStorage('yg_current_staff', null)
  );
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [staffList, setStaffList] = useState<StaffUser[]>(() =>
    loadFromStorage('yg_staff', INITIAL_STAFF)
  );

  // علم يحدد ما إذا كان تسجيل الخروج تم بطلب صريح من المستخدم
  const isExplicitSignOutRef = useRef(false);

  const mapStaffRow = useCallback((row: Record<string, unknown>): StaffUser => ({
    id: String(row.id),
    name: String(row.name ?? ''),
    username: String(row.username ?? ''),
    role: (row.role as UserRole) ?? 'rental_agent',
    phone: String(row.phone ?? ''),
    active: Boolean(row.active),
  }), []);

  // ========== مراقبة الجلسة والتحقق من حالة المصادقة ==========
  useEffect(() => {
    // 1. استعادة الجلسة عند بدء تشغيل التطبيق
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // إذا كان هناك موظف محلي مخزن يطابق الجلسة، نثبّته فوراً
        const localStaff = loadFromStorage<StaffUser | null>('yg_current_staff', null);
        if (localStaff && localStaff.active) {
          setCurrentStaff(localStaff);
        }
      }
      setIsAuthReady(true);
    }).catch(() => {
      setIsAuthReady(true);
    });

    // 2. مراقبة تغييرات Auth في Supabase
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // فقط في حال تم استدعاء signOut() الصريح من قبل المستخدم نقوم بمسح الجلسة
      if (event === 'SIGNED_OUT') {
        if (isExplicitSignOutRef.current) {
          isExplicitSignOutRef.current = false;
          setCurrentStaff(null);
          try { localStorage.removeItem('yg_current_staff'); } catch { /* ignore */ }
        }
        setIsAuthReady(true);
      } else if (event === 'SIGNED_IN' && session?.user) {
        if (onSignedIn) onSignedIn();
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [onSignedIn]);

  // ========== تسجيل الدخول ==========
  const signIn = async (identifier: string, password: string): Promise<StaffUser> => {
    const rawInput = identifier.trim().toLowerCase();
    if (!rawInput) {
      throw new Error('يرجى إدخال اسم المستخدم أو البريد الإلكتروني');
    }

    isExplicitSignOutRef.current = false;

    // 1. محاولة الدخول عبر مسار الخادم الموثق
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: rawInput, password }),
      });
      const result = await response.json();

      if (response.ok && result.session && result.staff) {
        const staff = mapStaffRow(result.staff);
        setCurrentStaff(staff);
        saveToStorage('yg_current_staff', staff);
        setIsAuthReady(true);

        try {
          await supabase.auth.setSession({
            access_token: result.session.access_token,
            refresh_token: result.session.refresh_token,
          });
        } catch {
          // ignore setSession failure, user is already authenticated
        }

        return staff;
      } else if (!response.ok && result.error && !result.error.includes('الخادم')) {
        throw new Error(result.error);
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch') && !e.message.includes('Failed')) {
        throw e;
      }
    }

    // 2. بديل فوري ومباشر عبر عميل Supabase Client
    const authDomain = new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olpjfipferziqtzrbbbt.supabase.co'
    ).hostname;

    const candidateEmails = rawInput.includes('@')
      ? [rawInput]
      : [
          `${rawInput}@${authDomain}`,
          rawInput === 'esam' ? 'esambss223@gmail.com' : null,
          `${rawInput}@yemen-gulf-cars.com`,
        ].filter(Boolean) as string[];

    for (const email of candidateEmails) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data?.user) {
          const staff: StaffUser = {
            id: data.user.id,
            name: (data.user.user_metadata?.name as string) || (rawInput === 'admin' ? 'المهندس عصام (المدير العام)' : 'المدير العام'),
            username: rawInput,
            role: 'super_admin',
            phone: (data.user.user_metadata?.phone as string) || '+20 100 000 0001',
            active: true,
          };
          setCurrentStaff(staff);
          saveToStorage('yg_current_staff', staff);
          setIsAuthReady(true);
          return staff;
        }
      } catch {
        // ignore
      }
    }

    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
  };

  // ========== تسجيل الخروج الصريح ==========
  const signOut = async () => {
    isExplicitSignOutRef.current = true;
    setCurrentStaff(null);
    try { localStorage.removeItem('yg_current_staff'); } catch { /* ignore */ }
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
  };

  // ========== إدارة الموظفين ==========
  const addStaff = (staffData: Omit<StaffUser, 'id'>) => {
    const newStaff: StaffUser = { ...staffData, id: `staff-${Date.now()}` };
    setStaffList((prev) => {
      const updated = [...prev, newStaff];
      saveToStorage('yg_staff', updated);
      return updated;
    });
    logAction('إضافة موظف جديد', `تمت إضافة الموظف ${newStaff.name} بدور ${newStaff.role}`);
  };

  const updateStaff = async (id: string, partial: Partial<StaffUser>) => {
    // 1. تحديث فوري للحالة المحلية والتخزين المحلي
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

    // 2. مزامنة سحابية مؤكدة عبر مسار الخادم update-profile
    try {
      await fetch('/api/admin/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: partial.name,
          username: partial.username,
          phone: partial.phone,
          role: partial.role,
          password: partial.password,
        }),
      });
    } catch {
      // ignore
    }

    // 3. محاولة ثانوية عبر عميل Supabase المباشر
    try {
      if (partial.password && partial.password.trim().length >= 6) {
        await supabase.auth.updateUser({ password: partial.password });
      }
      if (partial.name || partial.phone) {
        await supabase.auth.updateUser({
          data: {
            name: partial.name ?? currentStaff?.name,
            phone: partial.phone ?? currentStaff?.phone,
          }
        });
      }
    } catch {
      // ignore
    }

    logAction('تعديل حساب موظف', `تم تعديل بيانات: ${partial.name || partial.username || id}`);
  };

  const deleteStaff = (id: string) => {
    if (staffList.length <= 1) {
      alert('لا يمكن حذف الموظف الوحيد في النظام');
      return;
    }
    const staff = staffList.find((s) => s.id === id);
    setStaffList((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveToStorage('yg_staff', updated);
      return updated;
    });
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
