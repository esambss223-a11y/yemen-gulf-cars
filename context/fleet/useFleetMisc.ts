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
    liveNow: 1,
    lastUpdated: 'جاري التحميل...',
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

  const trackAndLoadVisits = useCallback(async () => {
    try {
      let sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('yg_visitor_session') : null;
      if (!sessionId && typeof window !== 'undefined') {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        sessionStorage.setItem('yg_visitor_session', sessionId);

        const deviceType =
          window.innerWidth < 640 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
        await supabase.from('site_visits').insert({
          session_id: sessionId,
          device_type: deviceType,
          page_path: window.location.pathname,
        });
      }

      const todayDateStr = new Date().toISOString().slice(0, 10);
      const startOfMonthStr = `${todayDateStr.slice(0, 7)}-01`;

      const [{ count: todayCount }, { count: monthCount }, { count: totalCount }] = await Promise.all([
        supabase
          .from('site_visits')
          .select('*', { count: 'exact', head: true })
          .gte('visited_at', `${todayDateStr}T00:00:00Z`),
        supabase
          .from('site_visits')
          .select('*', { count: 'exact', head: true })
          .gte('visited_at', `${startOfMonthStr}T00:00:00Z`),
        supabase.from('site_visits').select('*', { count: 'exact', head: true }),
      ]);

      if (totalCount !== null && totalCount !== undefined) {
        setVisitorStats({
          today: todayCount || 1,
          thisMonth: monthCount || 1,
          total: totalCount || 1,
          liveNow: 1,
          lastUpdated: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        });
      } else {
        const savedLocalVisits = parseInt(localStorage.getItem('yg_real_total_visits') || '0', 10) + 1;
        localStorage.setItem('yg_real_total_visits', savedLocalVisits.toString());
        setVisitorStats({
          today: 1,
          thisMonth: savedLocalVisits,
          total: savedLocalVisits,
          liveNow: 1,
          lastUpdated: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        });
      }
    } catch (err) {
      console.warn('Real visits tracking notice:', err);
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
