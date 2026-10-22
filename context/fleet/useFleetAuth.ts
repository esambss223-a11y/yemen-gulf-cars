'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { StaffUser, UserRole } from '@/types/fleet';
import { supabase } from '@/lib/supabase';
import { saveToStorage, loadFromStorage } from './fleetStorage';
import type { Session } from '@supabase/supabase-js';

interface UseFleetAuthProps {
  onSignedIn?: () => void;
  logAction: (action: string, details: string) => void;
}

export function useFleetAuth({ onSignedIn, logAction }: UseFleetAuthProps) {
  // A localStorage staff record is only a UI cache, never proof of an active Supabase session.
  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [staffList, setStaffList] = useState<StaffUser[]>(() =>
    loadFromStorage<StaffUser[]>('yg_staff', [])
  );
  const [staffListError, setStaffListError] = useState('');
  const isExplicitSignOutRef = useRef(false);

  const mapStaffRow = useCallback((row: Record<string, unknown>): StaffUser => ({
    id: String(row.id),
    name: String(row.name ?? ''),
    username: String(row.username ?? ''),
    role: (row.role as UserRole) ?? 'rental_agent',
    phone: String(row.phone ?? ''),
    active: Boolean(row.active),
  }), []);

  const loadStaffList = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch('/api/admin/staff', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json();
      if (response.ok && Array.isArray(result.staff)) {
        const mapped = result.staff.map(mapStaffRow);
        setStaffList(mapped);
        saveToStorage('yg_staff', mapped);
        setStaffListError('');
      }
    } catch {
      // احتفظ بالقائمة المخزنة محلياً عند انقطاع الاتصال
    }
  }, [mapStaffRow]);

  const loadStaffProfile = useCallback(async (userId: string, accessToken: string) => {
    try {
      const response = await fetch(`/api/auth/staff-profile?userId=${encodeURIComponent(userId)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.staff?.active) {
          const staff = mapStaffRow(result.staff);
          setCurrentStaff(staff);
          saveToStorage('yg_current_staff', staff);
          await loadStaffList();
          return;
        }
      }
    } catch {
      // تفادي الخروج القسري عند بطء الشبكة
    } finally {
      setIsAuthReady(true);
    }
  }, [loadStaffList, mapStaffRow]);

  useEffect(() => {
    isExplicitSignOutRef.current = false;

    // 1. استعادة الجلسة الحالية
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void loadStaffProfile(session.user.id, session.access_token);
      } else {
        setCurrentStaff(null);
        try { localStorage.removeItem('yg_current_staff'); } catch { /* ignore */ }
      }
      setIsAuthReady(true);
    }).catch(() => {
      setIsAuthReady(true);
    });

    // 2. الاستماع لتغييرات الجلسة
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        void loadStaffProfile(session.user.id, session.access_token);
        if (event === 'SIGNED_IN') onSignedIn?.();
      } else if (event === 'SIGNED_OUT') {
        isExplicitSignOutRef.current = false;
        setCurrentStaff(null);
        setStaffList([]);
        setStaffListError('');
        try { localStorage.removeItem('yg_current_staff'); } catch { /* ignore */ }
        setIsAuthReady(true);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadStaffProfile, onSignedIn]);

  // ========== تسجيل الدخول ==========
  const signIn = async (identifier: string, password: string): Promise<StaffUser> => {
    const username = identifier.trim().toLowerCase();
    if (!/^[a-z0-9._@-]{1,64}$/.test(username)) {
      throw new Error('[INVALID_USERNAME_FORMAT] أدخل اسم الموظف بالإنجليزية دون مسافات أو رموز غير مسموحة.');
    }

    isExplicitSignOutRef.current = false;

    let response: Response;
    try {
      response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      throw new Error('NETWORK_REQUEST_FAILED: تعذر الاتصال بخادم التطبيق. تحقق من الإنترنت أو من عنوان الموقع.');
    }

    let result: {
      error?: string;
      code?: string;
      session?: Session;
      staff?: Record<string, unknown> & { active?: boolean; id?: string };
    };
    try {
      result = await response.json();
    } catch {
      throw new Error(`INVALID_SERVER_RESPONSE: استجاب الخادم برمز ${response.status} لكن لم يُرسل بيانات مفهومة.`);
    }

    if (!response.ok || !result.staff?.active) {
      throw new Error(`${result.code ? `[${result.code}] ` : ''}${result.error || 'تعذر تسجيل الدخول.'}`);
    }

    const staff = mapStaffRow(result.staff);
    setCurrentStaff(staff);
    saveToStorage('yg_current_staff', staff);
    setIsAuthReady(true);

    if (result.session) {
      try {
        await supabase.auth.setSession(result.session);
      } catch {
        // جلسة المتصفح تستمر حتى لو فشل setSession
      }
    }

    return staff;
  };

  // ========== تسجيل الخروج الصريح ==========
  const signOut = async () => {
    isExplicitSignOutRef.current = true;
    setCurrentStaff(null);
    try { localStorage.removeItem('yg_current_staff'); } catch { /* ignore */ }
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
  };

  // ========== إدارة الموظفين ==========
  const addStaff = async (staffData: Omit<StaffUser, 'id'>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    const response = await fetch('/api/admin/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(staffData),
    });
    const result = await response.json();
    if (!response.ok || !result.staff) {
      throw new Error(`${result.code ? `[${result.code}] ` : ''}${result.error || 'تعذرت إضافة الموظف'}`);
    }
    const newStaff = mapStaffRow(result.staff);
    setStaffList((prev) => {
      const updated = [...prev, newStaff];
      saveToStorage('yg_staff', updated);
      return updated;
    });
    setStaffListError('');
    logAction('إضافة موظف جديد', `تمت إضافة الموظف ${newStaff.name} بدور ${newStaff.role}`);
  };

  const updateStaff = async (id: string, partial: Partial<StaffUser>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    const response = await fetch('/api/admin/staff', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ id, ...partial }),
    });
    const result = await response.json();
    if (!response.ok || !result.staff) throw new Error(result.error || 'تعذر تحديث الموظف');
    const updatedStaff = mapStaffRow(result.staff);
    setStaffList((prev) => {
      const updated = prev.map((s) => s.id === id ? updatedStaff : s);
      saveToStorage('yg_staff', updated);
      return updated;
    });
    if (currentStaff?.id === id) {
      setCurrentStaff(updatedStaff);
      saveToStorage('yg_current_staff', updatedStaff);
    }
    logAction('تعديل حساب موظف', `تم تعديل بيانات: ${updatedStaff.name}`);
  };

  const updateMyProfile = async (partial: Partial<StaffUser>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    const response = await fetch('/api/admin/update-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(partial),
    });
    const result = await response.json();
    if (!response.ok || !result.staff) throw new Error(result.error || 'تعذر حفظ الملف الشخصي');
    const updatedStaff = mapStaffRow(result.staff);
    setCurrentStaff(updatedStaff);
    saveToStorage('yg_current_staff', updatedStaff);
    setStaffList((prev) => {
      const updated = prev.map((s) => s.id === updatedStaff.id ? updatedStaff : s);
      saveToStorage('yg_staff', updated);
      return updated;
    });
    logAction('تعديل الملف الشخصي', `تم تحديث بيانات: ${updatedStaff.name}`);
  };

  const deleteStaff = async (id: string) => {
    const staff = staffList.find((s) => s.id === id || s.username === id);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';
    const params = new URLSearchParams({ id });
    const response = await fetch(`/api/admin/staff?${params}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'تعذر حذف الموظف');
    setStaffList((prev) => {
      const updated = prev.filter((item) => item.id !== id && item.username !== id);
      saveToStorage('yg_staff', updated);
      return updated;
    });
    logAction('حذف موظف', `تم حذف حساب الموظف: ${staff?.name || id}`);
  };

  return {
    currentStaff,
    isAuthReady,
    staffList,
    staffListError,
    setStaffList,
    signIn,
    signOut,
    addStaff,
    updateStaff,
    updateMyProfile,
    deleteStaff,
  };
}
