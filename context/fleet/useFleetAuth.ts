'use client';

import { useState, useEffect, useCallback } from 'react';
import { StaffUser, UserRole } from '@/types/fleet';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface UseFleetAuthProps {
  onSignedIn?: () => void;
  logAction: (action: string, details: string) => void;
}

export function useFleetAuth({ onSignedIn, logAction }: UseFleetAuthProps) {
  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [staffListError, setStaffListError] = useState('');

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
      if (!session) {
        setStaffList([]);
        setStaffListError('انتهت جلسة الدخول؛ أعد تسجيل الدخول لتحميل الموظفين.');
        return;
      }
      const response = await fetch('/api/admin/staff', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json();
      if (!response.ok) {
        setStaffList([]);
        setStaffListError(result.error || `تعذر تحميل الموظفين (HTTP ${response.status}).`);
        return;
      }
      if (!Array.isArray(result.staff)) throw new Error('استجابة قائمة الموظفين غير صحيحة.');
      setStaffList(result.staff.map(mapStaffRow));
      setStaffListError('');
    } catch (error) {
      setStaffList([]);
      setStaffListError(error instanceof Error ? error.message : 'تعذر الاتصال بقائمة الموظفين.');
    }
  }, [mapStaffRow]);

  const loadStaffProfile = useCallback(async (userId: string, accessToken: string) => {
    try {
      const response = await fetch(`/api/auth/staff-profile?userId=${encodeURIComponent(userId)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        setCurrentStaff(null);
        await supabase.auth.signOut();
        return;
      }
      const result = await response.json();
      if (!result.staff?.active || result.staff.id !== userId) {
        setCurrentStaff(null);
        await supabase.auth.signOut();
        return;
      }
      setCurrentStaff(mapStaffRow(result.staff));
      await loadStaffList();
    } catch {
      setCurrentStaff(null);
    } finally {
      setIsAuthReady(true);
    }
  }, [loadStaffList, mapStaffRow]);

  // لا تُستعاد هوية الموظف من localStorage؛ كل جلسة يعاد التحقق منها في الخادم.
  useEffect(() => {
    try {
      localStorage.removeItem('yg_current_staff');
      localStorage.removeItem('yg_staff');
    } catch { /* ignore */ }
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        void loadStaffProfile(session.user.id, session.access_token);
        if (event === 'SIGNED_IN') onSignedIn?.();
      } else {
        setCurrentStaff(null);
        setStaffList([]);
        setStaffListError('');
        setIsAuthReady(true);
        if (event === 'SIGNED_OUT') {
          try { localStorage.removeItem('yg_current_staff'); } catch { /* ignore */ }
        }
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) void loadStaffProfile(session.user.id, session.access_token);
      else setIsAuthReady(true);
    }).catch(() => setIsAuthReady(true));

    return () => listener.subscription.unsubscribe();
  }, [loadStaffProfile, onSignedIn]);

  // ========== تسجيل الدخول ==========
  const signIn = async (identifier: string, password: string): Promise<StaffUser> => {
    const username = identifier.trim().toLowerCase();
    if (!/^[a-z0-9._-]{1,64}$/.test(username)) {
      throw new Error('[INVALID_USERNAME_FORMAT] أدخل اسم الموظف بالإنجليزية دون مسافات أو رموز غير مسموحة.');
    }

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
    if (!response.ok || !result.session || !result.staff?.active) {
      throw new Error(`${result.code ? `[${result.code}] ` : ''}${result.error || 'تعذر تسجيل الدخول.'}`);
    }

    const { data, error } = await supabase.auth.setSession(result.session);
    if (error || !data.user || data.user.id !== result.staff.id) {
      await supabase.auth.signOut();
      throw new Error(`SESSION_CREATION_FAILED: تعذر إنشاء جلسة الموظف في المتصفح${error ? ` (${error.message})` : ''}.`);
    }

    const staff = mapStaffRow(result.staff);
    setCurrentStaff(staff);
    setIsAuthReady(true);
    return staff;
  };

  // ========== تسجيل الخروج الصريح ==========
  const signOut = async () => {
    setCurrentStaff(null);
    try { localStorage.removeItem('yg_current_staff'); } catch { /* ignore */ }
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
  };

  // ========== إدارة الموظفين ==========
  const addStaff = async (staffData: Omit<StaffUser, 'id'>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('انتهت جلسة الدخول، سجّل الدخول مجددًا');
    const response = await fetch('/api/admin/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(staffData),
    });
    const result = await response.json();
    if (!response.ok || !result.staff) {
      throw new Error(`${result.code ? `[${result.code}] ` : ''}${result.error || 'تعذرت إضافة الموظف'}`);
    }
    const newStaff = mapStaffRow(result.staff);
    setStaffList((prev) => {
      return [...prev, newStaff];
    });
    setStaffListError('');
    logAction('إضافة موظف جديد', `تمت إضافة الموظف ${newStaff.name} بدور ${newStaff.role}`);
  };

  const updateStaff = async (id: string, partial: Partial<StaffUser>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('انتهت جلسة الدخول، سجّل الدخول مجددًا');
    const response = await fetch('/api/admin/staff', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ id, ...partial }),
    });
    const result = await response.json();
    if (!response.ok || !result.staff) throw new Error(result.error || 'تعذر تحديث الموظف');
    const updatedStaff = mapStaffRow(result.staff);
    setStaffList((prev) => {
      return prev.map((staff) => staff.id === id ? updatedStaff : staff);
    });
    if (currentStaff?.id === id) setCurrentStaff(updatedStaff);
    logAction('تعديل حساب موظف', `تم تعديل بيانات: ${updatedStaff.name}`);
  };

  const updateMyProfile = async (partial: Partial<StaffUser>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('انتهت جلسة الدخول، سجّل الدخول مجددًا');
    const response = await fetch('/api/admin/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(partial),
    });
    const result = await response.json();
    if (!response.ok || !result.staff) throw new Error(result.error || 'تعذر حفظ الملف الشخصي');
    const updatedStaff = mapStaffRow(result.staff);
    setCurrentStaff(updatedStaff);
    setStaffList((prev) => {
      return prev.map((staff) => staff.id === updatedStaff.id ? updatedStaff : staff);
    });
    logAction('تعديل الملف الشخصي', `تم تحديث بيانات: ${updatedStaff.name}`);
  };

  const deleteStaff = async (id: string) => {
    const staff = staffList.find((s) => s.id === id || s.username === id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('انتهت جلسة الدخول، سجّل الدخول مجددًا');
    const params = new URLSearchParams({ id });
    const response = await fetch(`/api/admin/staff?${params}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'تعذر حذف الموظف');
    setStaffList((prev) => {
      return prev.filter((item) => item.id !== id && item.username !== id);
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
