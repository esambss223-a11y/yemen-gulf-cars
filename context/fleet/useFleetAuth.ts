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
  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(() =>
    loadFromStorage('yg_current_staff', null)
  );
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [staffList, setStaffList] = useState<StaffUser[]>(() =>
    loadFromStorage('yg_staff', INITIAL_STAFF)
  );

  // ========== قفل حاسم: يمنع onAuthStateChange من التدخل أثناء signIn ==========
  const signInLockRef = useRef(false);

  const mapStaffRow = useCallback((row: Record<string, unknown>): StaffUser => ({
    id: String(row.id),
    name: String(row.name ?? ''),
    username: String(row.username ?? ''),
    role: (row.role as UserRole) ?? 'rental_agent',
    phone: String(row.phone ?? ''),
    active: Boolean(row.active),
  }), []);

  // ========== useEffect: استعادة الجلسة ومراقبة التغييرات ==========
  useEffect(() => {
    // 1. فحص الجلسة المخزنة عند التحميل
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !signInLockRef.current) {
        // جلسة موجودة: حاول تحديث بيانات الموظف من السحابة
        // لكن لا تمسح الموظف المحلي إذا فشل الاستعلام
        (async () => {
          try {
            const { data } = await supabase
              .from('staff')
              .select('id, name, username, role, phone, active')
              .eq('id', session.user.id)
              .maybeSingle();
            if (data) {
              const staff = mapStaffRow(data);
              if (staff.active) {
                setCurrentStaff(staff);
                saveToStorage('yg_current_staff', staff);
              }
            }
            // إذا data == null: لا تفعل شيء، أبقِ الموظف المحلي كما هو
          } catch {
            // فشل الشبكة: لا تمسح الموظف
          } finally {
            setIsAuthReady(true);
          }
        })();
      } else if (!signInLockRef.current) {
        // لا يوجد جلسة وليس هناك عملية دخول جارية
        // إذا كان هناك موظف محلي، أبقِه (ربما فقط انقطع الاتصال)
        setIsAuthReady(true);
      }
    });

    // 2. مراقبة تغييرات حالة المصادقة
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // ===== إذا signIn قيد التنفيذ، تجاهل كل شيء =====
      if (signInLockRef.current) return;

      if (event === 'SIGNED_OUT') {
        // فقط SIGNED_OUT الصريح يمسح الموظف
        setCurrentStaff(null);
        try { localStorage.removeItem('yg_current_staff'); } catch { /* */ }
        setIsAuthReady(true);
      } else if (event === 'SIGNED_IN' && session?.user) {
        if (onSignedIn) onSignedIn();
        // لا نستدعي loadStaffProfile هنا — signIn() تعاملت مع كل شيء
      }
      // TOKEN_REFRESHED, INITIAL_SESSION, USER_UPDATED: لا نتدخل
    });

    return () => listener.subscription.unsubscribe();
  }, [mapStaffRow, onSignedIn]);

  // ========== signIn: تسجيل الدخول الموثق ==========
  const signIn = async (identifier: string, password: string): Promise<StaffUser> => {
    const rawInput = identifier.trim().toLowerCase();
    if (!rawInput) {
      throw new Error('يرجى إدخال اسم المستخدم');
    }

    // ===== تفعيل القفل: لا يتدخل onAuthStateChange =====
    signInLockRef.current = true;

    try {
      // 1. المحاولة عبر مسار الخادم
      let staff: StaffUser | null = null;

      try {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: rawInput, password }),
        });
        const result = await response.json();

        if (response.ok && result.session && result.staff) {
          // حفظ بيانات الموظف أولاً قبل أي شيء
          staff = mapStaffRow(result.staff);
          setCurrentStaff(staff);
          saveToStorage('yg_current_staff', staff);
          setIsAuthReady(true);

          // ثم تعيين الجلسة (هذا يطلق onAuthStateChange لكن القفل يمنعه)
          await supabase.auth.setSession({
            access_token: result.session.access_token,
            refresh_token: result.session.refresh_token,
          });

          return staff;
        } else if (!response.ok && result.error) {
          throw new Error(result.error);
        }
      } catch (e: any) {
        // إذا كان خطأ مصادقة صريح (ليس خطأ شبكة)، أعِده للمستخدم
        if (e.message && !e.message.includes('fetch') && !e.message.includes('Failed')) {
          throw e;
        }
        // خطأ شبكة: نجرب البديل المباشر
      }

      // 2. بديل مباشر عبر عميل Supabase (إذا فشل مسار الخادم)
      const authDomain = new URL(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olpjfipferziqtzrbbbt.supabase.co'
      ).hostname;

      const candidateEmails = rawInput.includes('@')
        ? [rawInput]
        : [
            `${rawInput}@${authDomain}`,
            rawInput === 'esam' ? 'esambss223@gmail.com' : null,
          ].filter(Boolean) as string[];

      for (const email of candidateEmails) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data?.user) {
          staff = {
            id: data.user.id,
            name: (data.user.user_metadata?.name as string) || 'المدير العام',
            username: rawInput,
            role: 'super_admin' as UserRole,
            phone: (data.user.user_metadata?.phone as string) || '+20 100 000 0001',
            active: true,
          };
          setCurrentStaff(staff);
          saveToStorage('yg_current_staff', staff);
          setIsAuthReady(true);
          return staff;
        }
      }

      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    } finally {
      // ===== فك القفل بعد تأخير قصير لضمان انتهاء كل أحداث Auth =====
      setTimeout(() => { signInLockRef.current = false; }, 2000);
    }
  };

  // ========== signOut ==========
  const signOut = async () => {
    setCurrentStaff(null);
    try { localStorage.removeItem('yg_current_staff'); } catch { /* */ }
    try { await supabase.auth.signOut(); } catch { /* */ }
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
    // 1. تحديث فوري في الحالة المحلية
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

    // 2. مزامنة سحابية (fire-and-forget، لا يعلّق الواجهة)
    try {
      const payload: Record<string, unknown> = {};
      if (partial.name !== undefined) payload.name = partial.name;
      if (partial.username !== undefined) payload.username = partial.username;
      if (partial.phone !== undefined) payload.phone = partial.phone;
      if (partial.role !== undefined) payload.role = partial.role;
      if (partial.active !== undefined) payload.active = partial.active;

      if (Object.keys(payload).length > 0) {
        supabase.from('staff').update(payload).eq('id', id).then(() => {});
      }

      if (partial.password && partial.password.trim().length >= 6) {
        supabase.auth.updateUser({ password: partial.password }).then(() => {});
      }

      if (partial.name || partial.phone) {
        supabase.auth.updateUser({
          data: {
            name: partial.name ?? currentStaff?.name,
            phone: partial.phone ?? currentStaff?.phone,
          }
        }).then(() => {});
      }
    } catch {
      // لا نعلّق الواجهة بسبب خطأ سحابي
    }

    logAction('تعديل حساب موظف', `تم تعديل: ${partial.name || id}`);
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
