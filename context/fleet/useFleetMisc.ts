'use client';

import { useState, useCallback } from 'react';
import { Invoice, PromoCoupon, AuditLogItem, VisitorStats, StaffUser } from '@/types/fleet';
import {
  INITIAL_INVOICES,
  INITIAL_COUPONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CARS,
  INITIAL_BOOKINGS,
  INITIAL_OWNERS,
  INITIAL_CUSTOMERS,
} from '@/lib/initial-data';
import { supabase } from '@/lib/supabase';
import { saveToStorage, loadFromStorage } from './fleetStorage';

interface UseFleetMiscProps {
  currentStaffName?: string;
  currentStaffRole?: string;
}

export function useFleetMisc({ currentStaffName, currentStaffRole }: UseFleetMiscProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    loadFromStorage('yg_invoices', INITIAL_INVOICES)
  );
  const [coupons, setCoupons] = useState<PromoCoupon[]>(() =>
    loadFromStorage('yg_coupons', INITIAL_COUPONS)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() =>
    loadFromStorage('yg_audit_logs', INITIAL_AUDIT_LOGS)
  );
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [visitorStats, setVisitorStats] = useState<VisitorStats>({
    today: 0,
    thisMonth: 0,
    total: 0,
    liveNow: 0,
    lastUpdated: 'جاري التحميل...',
    available: false,
  });

  const logAction = useCallback(
    async (action: string, details: string) => {
      const newLog: AuditLogItem = {
        id: `log-${Date.now()}`,
        action,
        staffName: currentStaffName ?? 'النظام',
        staffRole: (currentStaffRole as any) ?? 'rental_agent',
        timestamp: new Date().toLocaleString('ar-EG'),
        details,
      };

      setAuditLogs((prev) => {
        const updated = [newLog, ...prev];
        saveToStorage('yg_audit_logs', updated);
        return updated;
      });

      try {
        await supabase.from('audit_logs').insert({
          id: newLog.id,
          action: newLog.action,
          staff_name: newLog.staffName,
          staff_role: newLog.staffRole,
          timestamp: newLog.timestamp,
          details: newLog.details,
        });
      } catch {
        // ignore
      }
    },
    [currentStaffName, currentStaffRole]
  );

  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'issuedAt'>) => {
    const seq = invoices.length + 1;
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`,
      issuedAt: new Date().toLocaleString('ar-EG'),
    };
    const updated = [newInvoice, ...invoices];
    setInvoices(updated);
    saveToStorage('yg_invoices', updated);

    try {
      await supabase.from('invoices').insert({
        id: newInvoice.id,
        invoice_number: newInvoice.invoiceNumber,
        booking_id: newInvoice.bookingId,
        customer_name: newInvoice.customerName,
        customer_phone: newInvoice.customerPhone,
        car_details: newInvoice.carDetails,
        total_amount_egp: newInvoice.totalAmountEGP,
        deposit_amount_egp: newInvoice.depositAmountEGP,
        payment_method: newInvoice.paymentMethod,
        paid: newInvoice.paid,
        issued_at: newInvoice.issuedAt,
        issued_by: newInvoice.issuedBy,
      });
    } catch {
      // ignore
    }
  };

  const applyCoupon = (code: string): PromoCoupon | null => {
    const found = coupons.find((c) => c.code.toUpperCase() === code.toUpperCase() && c.active);
    return found || null;
  };

  const addCoupon = async (couponData: Omit<PromoCoupon, 'id' | 'usedCount'>) => {
    const tempId = `cp-${Date.now()}`;
    const newCoupon: PromoCoupon = {
      ...couponData,
      id: tempId,
      usedCount: 0,
      active: true,
    };
    setCoupons((prev) => {
      const updated = [newCoupon, ...prev];
      saveToStorage('yg_coupons', updated);
      return updated;
    });

    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponData),
      });
      const data = await res.json();
      if (res.ok && data?.coupon) {
        setCoupons((prev) => {
          const updated = prev.map((c) => (c.id === tempId ? data.coupon : c));
          saveToStorage('yg_coupons', updated);
          return updated;
        });
      }
    } catch {
      // ignore
    }

    logAction('إنشاء كود خصم', `تم إنشاء كود الخصم: ${newCoupon.code}`);
  };

  const updateCoupon = async (id: string, partial: Partial<PromoCoupon>) => {
    setCoupons((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...partial } : c));
      saveToStorage('yg_coupons', updated);
      return updated;
    });

    try {
      await fetch('/api/admin/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...partial }),
      });
    } catch {
      // ignore
    }

    logAction('تعديل كود خصم', `تم تحديث بيانات كود الخصم ID: ${id}`);
  };

  const toggleCouponActive = async (id: string) => {
    const target = coupons.find((c) => c.id === id);
    if (!target) return;
    const newActive = !target.active;
    await updateCoupon(id, { active: newActive });
    logAction('تغيير حالة كود خصم', `تم ${newActive ? 'تفعيل' : 'تعطيل'} كود الخصم: ${target.code}`);
  };

  const deleteCoupon = async (id: string) => {
    const target = coupons.find((c) => c.id === id);
    setCoupons((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveToStorage('yg_coupons', updated);
      return updated;
    });

    try {
      await fetch(`/api/admin/coupons?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      // ignore
    }

    logAction('حذف كود خصم', `تم حذف كود الخصم: ${target?.code || id}`);
  };

  const trackAndLoadVisits = useCallback(async (pathname: string, isAdmin: boolean) => {
    try {
      const isPublicPage = !pathname.startsWith('/admin');
      if (isPublicPage && typeof window !== 'undefined') {
        let sessionId = sessionStorage.getItem('yg_visitor_session');
        if (!sessionId) {
          sessionId = `sess_${typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
          sessionStorage.setItem('yg_visitor_session', sessionId);
          const deviceType =
            window.innerWidth < 640 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
          const { error } = await supabase.from('site_visits').insert({
            session_id: sessionId,
            device_type: deviceType,
            page_path: pathname,
          });
          if (error) {
            sessionStorage.removeItem('yg_visitor_session');
            throw error;
          }
        }
      }

      // Visitor totals are private admin data; never substitute local/demo values.
      if (!isAdmin) return;

      const todayDateStr = new Date().toISOString().slice(0, 10);
      const startOfMonthStr = `${todayDateStr.slice(0, 7)}-01`;
      const recentCutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const publicVisits = () => supabase.from('site_visits').select('*', { count: 'exact', head: true })
        .not('page_path', 'like', '/admin%');

      const [todayResult, monthResult, totalResult, recentResult] = await Promise.all([
        publicVisits().gte('visited_at', `${todayDateStr}T00:00:00Z`),
        publicVisits().gte('visited_at', `${startOfMonthStr}T00:00:00Z`),
        publicVisits(),
        publicVisits().gte('visited_at', recentCutoff),
      ]);

      const resultError = todayResult.error || monthResult.error || totalResult.error || recentResult.error;
      if (resultError) throw resultError;
      setVisitorStats({
        today: todayResult.count ?? 0,
        thisMonth: monthResult.count ?? 0,
        total: totalResult.count ?? 0,
        liveNow: recentResult.count ?? 0,
        lastUpdated: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        available: true,
      });
    } catch (err) {
      console.warn('Real visits tracking notice:', err);
      setVisitorStats((previous) => ({ ...previous, available: false, lastUpdated: 'تعذر تحميل الإحصائيات' }));
    }
  }, []);

  const createResetFunction = (
    setCars: (c: typeof INITIAL_CARS) => void,
    setBookings: (b: typeof INITIAL_BOOKINGS) => void,
    setOwners: (o: typeof INITIAL_OWNERS) => void,
    setStaffList: (staff: StaffUser[]) => void,
    setCustomers: (cust: typeof INITIAL_CUSTOMERS) => void
  ) => {
    return () => {
      setCars(INITIAL_CARS);
      setBookings(INITIAL_BOOKINGS);
      setInvoices(INITIAL_INVOICES);
      setOwners(INITIAL_OWNERS);
      setCoupons(INITIAL_COUPONS);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      setStaffList([]);
      setCustomers(INITIAL_CUSTOMERS);
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      logAction('إعادة ضبط المصنع', 'تم استعادة البيانات الافتراضية');
    };
  };

  return {
    invoices,
    setInvoices,
    addInvoice,
    coupons,
    setCoupons,
    applyCoupon,
    addCoupon,
    updateCoupon,
    toggleCouponActive,
    deleteCoupon,
    auditLogs,
    setAuditLogs,
    logAction,
    isCloudConnected,
    setIsCloudConnected,
    visitorStats,
    trackAndLoadVisits,
    createResetFunction,
  };
}
