'use client';

import { useState, useCallback } from 'react';
import { Invoice, PromoCoupon, AuditLogItem, VisitorStats } from '@/types/fleet';
import { supabase } from '@/lib/supabase';
import { reportFleetWriteError } from './fleetStorage';

interface UseFleetMiscProps {
  currentStaffName?: string;
  currentStaffRole?: string;
}

export function useFleetMisc({ currentStaffName, currentStaffRole }: UseFleetMiscProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [coupons, setCoupons] = useState<PromoCoupon[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [visitorStats, setVisitorStats] = useState<VisitorStats>({
    today: 0,
    thisMonth: 0,
    total: 0,
    liveNow: 0,
    lastUpdated: 'جاري التحميل...',
    available: false,
  });

  const getAdminAuthHeaders = useCallback(async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.access_token) throw new Error('انتهت جلسة الدخول. سجّل الدخول مجددًا.');
    return { Authorization: `Bearer ${session.access_token}` };
  }, []);

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

      try {
        const { error } = await supabase.from('audit_logs').insert({
          id: newLog.id,
          action: newLog.action,
          staff_name: newLog.staffName,
          staff_role: newLog.staffRole,
          timestamp: newLog.timestamp,
          details: newLog.details,
        });
        if (error) throw error;
        setAuditLogs((prev) => [newLog, ...prev]);
      } catch (error) {
        console.warn('Audit log insert failed:', error);
        reportFleetWriteError('تم تنفيذ الإجراء، لكن تعذر تسجيله في سجل الرقابة بقاعدة البيانات.');
      }
    },
    [currentStaffName, currentStaffRole]
  );

  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'issuedAt'>): Promise<boolean> => {
    const seq = invoices.length + 1;
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`,
      issuedAt: new Date().toLocaleString('ar-EG'),
    };
    try {
      const { error } = await supabase.from('invoices').insert({
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
      if (error) throw error;
    } catch (error) {
      console.warn('Invoice insert failed:', error);
      reportFleetWriteError('تم حفظ الحجز، لكن تعذر حفظ الفاتورة في قاعدة البيانات.');
      return false;
    }

    const updated = [newInvoice, ...invoices];
    setInvoices(updated);
    return true;
  };

  const applyCoupon = (code: string): PromoCoupon | null => {
    const found = coupons.find((c) => c.code.toUpperCase() === code.toUpperCase() && c.active);
    return found || null;
  };

  const addCoupon = async (couponData: Omit<PromoCoupon, 'id' | 'usedCount'>) => {
    let coupon: PromoCoupon;
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAdminAuthHeaders()) },
        body: JSON.stringify(couponData),
      });
      const data = await res.json();
      if (!res.ok || !data?.coupon) throw new Error(data?.error || 'تعذر إنشاء كود الخصم.');
      coupon = data.coupon as PromoCoupon;
    } catch (error) {
      reportFleetWriteError(error instanceof Error ? error.message : 'تعذر إنشاء كود الخصم.');
      throw error;
    }
    setCoupons((prev) => {
      const updated = [coupon, ...prev];
      return updated;
    });

    logAction('إنشاء كود خصم', `تم إنشاء كود الخصم: ${coupon.code}`);
  };

  const updateCoupon = async (id: string, partial: Partial<PromoCoupon>) => {
    let coupon: PromoCoupon;
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(await getAdminAuthHeaders()) },
        body: JSON.stringify({ id, ...partial }),
      });
      const data = await res.json();
      if (!res.ok || !data?.coupon) throw new Error(data?.error || 'تعذر تحديث كود الخصم.');
      coupon = data.coupon as PromoCoupon;
    } catch (error) {
      reportFleetWriteError(error instanceof Error ? error.message : 'تعذر تحديث كود الخصم.');
      throw error;
    }
    setCoupons((prev) => {
      const updated = prev.map((c) => (c.id === id ? coupon : c));
      return updated;
    });

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
    try {
      const res = await fetch(`/api/admin/coupons?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: await getAdminAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'تعذر حذف كود الخصم.');
    } catch (error) {
      reportFleetWriteError(error instanceof Error ? error.message : 'تعذر حذف كود الخصم.');
      throw error;
    }
    setCoupons((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      return updated;
    });

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
  };
}
