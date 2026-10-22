'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Car, 
  Booking, 
  Invoice, 
  VehicleOwner, 
  PromoCoupon, 
  StaffUser, 
  AuditLogItem,
  VisitorStats,
  Customer,
  ReturnInspectionPayload,
  BookingReviewInput,
} from '@/types/fleet';
import { supabase } from '@/lib/supabase';
import { useFleetMisc } from './fleet/useFleetMisc';
import { useFleetAuth } from './fleet/useFleetAuth';
import { useFleetCars } from './fleet/useFleetCars';
import { useFleetOwners } from './fleet/useFleetOwners';
import { useFleetCustomers } from './fleet/useFleetCustomers';
import { useFleetBookings } from './fleet/useFleetBookings';

export interface FleetContextType {
  // المصادقة والحساب النشط
  currentStaff: StaffUser | null;
  isAuthReady: boolean;
  signIn: (identifier: string, password: string) => Promise<StaffUser>;
  signOut: () => Promise<void>;

  // حالة الاتصال السحابي
  isCloudConnected: boolean;
  cloudSyncError: string;
  dataOperationError: string;
  clearDataOperationError: () => void;

  // إدارة الموظفين
  staffList: StaffUser[];
  staffListError: string;
  addStaff: (staff: Omit<StaffUser, 'id'>) => void;
  updateStaff: (id: string, partial: Partial<StaffUser>) => void;
  updateMyProfile: (partial: Partial<StaffUser>) => Promise<void>;
  deleteStaff: (id: string) => void;

  // إدارة العملاء وسجل CRM
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer | null>;
  updateCustomer: (id: string, partial: Partial<Customer>) => Promise<boolean>;
  deleteCustomer: (id: string) => Promise<boolean>;

  // أسطول السيارات
  cars: Car[];
  addCar: (car: Omit<Car, 'id'>) => Promise<boolean>;
  updateCar: (id: string, car: Partial<Car>) => Promise<boolean>;
  deleteCar: (id: string) => Promise<boolean>;

  // الحجوزات والعقود
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt'>) => Promise<boolean>;
  updateBookingStatus: (
    id: string, 
    status: Booking['status'], 
    returnKm?: number,
    delayDetails?: ReturnInspectionPayload
  ) => Promise<boolean>;
  reviewPendingBooking: (
    booking: Booking,
    decision: 'approved' | 'rejected',
    details?: BookingReviewInput,
    reason?: string,
  ) => Promise<void>;

  // الفواتير
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'issuedAt'>) => Promise<boolean>;

  // الملاك والشركاء
  owners: VehicleOwner[];
  addOwner: (owner: Omit<VehicleOwner, 'id'>) => Promise<boolean>;
  updateOwner: (id: string, partial: Partial<VehicleOwner>) => Promise<boolean>;
  deleteOwner: (id: string) => Promise<boolean>;

  // الكوبونات وأكواد الخصم
  coupons: PromoCoupon[];
  applyCoupon: (code: string) => PromoCoupon | null;
  addCoupon: (coupon: Omit<PromoCoupon, 'id' | 'usedCount'>) => Promise<void>;
  updateCoupon: (id: string, partial: Partial<PromoCoupon>) => Promise<void>;
  toggleCouponActive: (id: string) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;

  // سجل الرقابة
  auditLogs: AuditLogItem[];
  logAction: (action: string, details: string) => void;

  // إحصائيات الزوار
  visitorStats: VisitorStats;

}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

const PUBLIC_CAR_FIELDS = 'id, make, model, year, category, color, current_km, daily_price_egp, weekly_price_egp, monthly_price_egp, security_deposit_egp, status, images, cover_image, transmission, fuel_type, seats, features';

export function FleetProvider({ children }: { children: React.ReactNode }) {
  const [cloudSyncError, setCloudSyncError] = useState('');
  const [dataOperationError, setDataOperationError] = useState('');
  const pathname = usePathname();

  // 1. الوحدة المساعدة: السجلات، الفواتير، الزيارات، وإحصائيات السحابة
  const misc = useFleetMisc({});

  useEffect(() => {
    const handleWriteError = (event: Event) => {
      const message = (event as CustomEvent<string>).detail;
      setDataOperationError(typeof message === 'string' ? message : 'تعذر حفظ التغيير في قاعدة البيانات.');
    };
    window.addEventListener('fleet:write-error', handleWriteError);
    return () => window.removeEventListener('fleet:write-error', handleWriteError);
  }, []);

  // 2. وحدة المصادقة والموظفين
  const auth = useFleetAuth({
    logAction: misc.logAction,
  });

  // 3. وحدة أسطول السيارات
  const fleetCars = useFleetCars({
    logAction: misc.logAction,
  });

  // 4. وحدة الملاك والمستثمرين
  const fleetOwners = useFleetOwners({
    logAction: misc.logAction,
  });

  // 5. وحدة العملاء و CRM
  const fleetCustomers = useFleetCustomers({
    logAction: misc.logAction,
  });

  // 6. وحدة الحجوزات والعقود
  const fleetBookings = useFleetBookings({
    cars: fleetCars.cars,
    updateCar: fleetCars.updateCar,
    customers: fleetCustomers.customers,
    addCustomer: fleetCustomers.addCustomer,
    updateCustomer: fleetCustomers.updateCustomer,
    addInvoice: misc.addInvoice,
    logAction: misc.logAction,
    currentStaffName: auth.currentStaff?.name,
  });

  useEffect(() => {
    let active = true;

    const fetchInitialData = async () => {
      if (auth.currentStaff) {
        misc.setIsCloudConnected(false);
        setCloudSyncError('جارٍ تحميل البيانات المشتركة…');
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const hasSession = Boolean(session?.user);
        const [{ data: cloudCars, error: carsErr }, privateResults] = await Promise.all([
          supabase.from('cars').select(hasSession ? '*' : PUBLIC_CAR_FIELDS),
          hasSession
            ? Promise.all([
                supabase.from('bookings').select('*'),
                supabase.from('owners').select('*'),
                supabase.from('customers').select('*'),
                supabase.from('coupons').select('*').order('created_at', { ascending: false }),
                supabase.from('invoices').select('*').order('created_at', { ascending: false }),
                supabase.from('audit_logs').select('*').order('created_at', { ascending: false }),
              ])
            : Promise.resolve(null),
        ]);
        if (!active) return;

        const failures: string[] = [];
        if (carsErr) failures.push('السيارات');
        if (privateResults) {
          const [bookingsResult, ownersResult, customersResult, couponsResult, invoicesResult, auditResult] = privateResults;
          const { data: cloudBookings, error: bkErr } = bookingsResult;
          const { data: cloudOwners, error: ownersErr } = ownersResult;
          const { data: cloudCustomers, error: custErr } = customersResult;
          const { data: cloudCoupons, error: couponsErr } = couponsResult;
          const { data: cloudInvoices, error: invoicesErr } = invoicesResult;
          const { data: cloudAuditLogs, error: auditErr } = auditResult;

          if (bkErr) failures.push('الحجوزات');
          if (ownersErr) failures.push('الملاك');
          if (custErr) failures.push('العملاء');
          if (couponsErr) failures.push('أكواد الخصم');
          if (invoicesErr) failures.push('الفواتير');
          if (auditErr) failures.push('سجل العمليات');

          if (!couponsErr && cloudCoupons) {
            const mapped = cloudCoupons.map((c: any): PromoCoupon => ({
              id: c.id,
              code: c.code,
              discountType: c.discount_type || 'percentage',
              discountValue: Number(c.discount_value || 0),
              expiresAt: c.expires_at || '',
              maxUsage: Number(c.max_usage || 100),
              usedCount: Number(c.used_count || 0),
              active: Boolean(c.active),
            }));
            misc.setCoupons(mapped);
          }

          if (!bkErr && cloudBookings) {
            const mapped = cloudBookings.map(fleetBookings.mapCloudBooking);
            fleetBookings.setBookings(mapped);
          }

          if (!ownersErr && cloudOwners) {
            const mapped = cloudOwners.map(fleetOwners.mapCloudOwner);
            fleetOwners.setOwners(mapped);
          }

          if (!custErr && cloudCustomers) {
            const mapped = cloudCustomers.map((c: any) => ({
              id: c.id,
              fullName: c.full_name,
              phone: c.phone,
              whatsapp: c.whatsapp,
              nationalId: c.national_id,
              licenseNumber: c.license_number,
              nationality: c.nationality || 'مصري',
              tier: c.tier || 'regular',
              riskStatus: c.risk_status || 'safe',
              trustScore: Number(c.trust_score ?? 85),
              starRating: Number(c.star_rating ?? 5),
              ratingCount: Number(c.rating_count ?? 1),
              cleanlinessScore: c.cleanliness_score || 'clean',
              damagesCount: Number(c.damages_count ?? 0),
              loyaltyPoints: Number(c.loyalty_points ?? 0),
              totalRentalsCount: Number(c.total_rentals_count ?? 0),
              totalSpentEGP: Number(c.total_spent_egp ?? 0),
              notes: c.notes,
              createdAt: c.created_at,
            }));
            fleetCustomers.setCustomers(mapped);
          }

          if (!invoicesErr && cloudInvoices) {
            const mapped = cloudInvoices.map((invoice: any): Invoice => ({
              id: invoice.id,
              invoiceNumber: invoice.invoice_number,
              bookingId: invoice.booking_id,
              customerName: invoice.customer_name,
              customerPhone: invoice.customer_phone,
              carDetails: invoice.car_details,
              totalAmountEGP: Number(invoice.total_amount_egp || 0),
              depositAmountEGP: Number(invoice.deposit_amount_egp || 0),
              paymentMethod: ['cash', 'bank_transfer', 'instapay', 'card'].includes(invoice.payment_method)
                ? invoice.payment_method
                : 'cash',
              paid: Boolean(invoice.paid),
              issuedAt: invoice.issued_at || invoice.created_at,
              issuedBy: invoice.issued_by || '',
            }));
            misc.setInvoices(mapped);
          }

          if (!auditErr && cloudAuditLogs) {
            const mapped = cloudAuditLogs.map((log: any): AuditLogItem => ({
              id: log.id,
              action: log.action,
              staffName: log.staff_name,
              staffRole: log.staff_role,
              timestamp: log.timestamp,
              details: log.details,
            }));
            misc.setAuditLogs(mapped);
          }
        }

        if (!carsErr && cloudCars) {
          const mapped = cloudCars.map(fleetCars.mapCloudCar);
          fleetCars.setCars(mapped);
        }

        misc.setIsCloudConnected(failures.length === 0);
        setCloudSyncError(failures.length
          ? `تعذرت مزامنة أقسام: ${failures.join('، ')}. قد تكون البيانات الظاهرة غير مكتملة.`
          : '');
      } catch (err) {
        console.warn('Initial data load notice:', err);
        if (active && auth.currentStaff) {
          misc.setIsCloudConnected(false);
          setCloudSyncError('تعذر تحميل البيانات المشتركة من Supabase؛ تحقق من الاتصال ثم حدّث الصفحة.');
        }
      }
    };

    void fetchInitialData();
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') void fetchInitialData();
    };
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);
    return () => {
      active = false;
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, [auth.currentStaff]);

  useEffect(() => {
    const currentPath = pathname || '/';
    const isAdminPage = currentPath.startsWith('/admin');
    const canReadVisitorStats = auth.currentStaff?.role === 'super_admin';
    const refreshVisitorStats = () => {
      void misc.trackAndLoadVisits(currentPath, isAdminPage && canReadVisitorStats);
    };

    refreshVisitorStats();
    if (!isAdminPage || !canReadVisitorStats) return;
    const intervalId = window.setInterval(refreshVisitorStats, 60_000);
    window.addEventListener('focus', refreshVisitorStats);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshVisitorStats);
    };
  }, [pathname, auth.currentStaff, misc.trackAndLoadVisits]);

  return (
    <FleetContext.Provider
      value={{
        currentStaff: auth.currentStaff,
        isAuthReady: auth.isAuthReady,
        signIn: auth.signIn,
        signOut: auth.signOut,
        isCloudConnected: misc.isCloudConnected,
        cloudSyncError,
        dataOperationError,
        clearDataOperationError: () => setDataOperationError(''),
        staffList: auth.staffList,
        staffListError: auth.staffListError,
        addStaff: auth.addStaff,
        updateStaff: auth.updateStaff,
        updateMyProfile: auth.updateMyProfile,
        deleteStaff: auth.deleteStaff,
        customers: fleetCustomers.customers,
        addCustomer: fleetCustomers.addCustomer,
        updateCustomer: fleetCustomers.updateCustomer,
        deleteCustomer: fleetCustomers.deleteCustomer,
        cars: fleetCars.cars,
        addCar: fleetCars.addCar,
        updateCar: fleetCars.updateCar,
        deleteCar: fleetCars.deleteCar,
        bookings: fleetBookings.bookings,
        addBooking: fleetBookings.addBooking,
        updateBookingStatus: fleetBookings.updateBookingStatus,
        reviewPendingBooking: fleetBookings.reviewPendingBooking,
        invoices: misc.invoices,
        addInvoice: misc.addInvoice,
        owners: fleetOwners.owners,
        addOwner: fleetOwners.addOwner,
        updateOwner: fleetOwners.updateOwner,
        deleteOwner: fleetOwners.deleteOwner,
        coupons: misc.coupons,
        applyCoupon: misc.applyCoupon,
        addCoupon: misc.addCoupon,
        updateCoupon: misc.updateCoupon,
        toggleCouponActive: misc.toggleCouponActive,
        deleteCoupon: misc.deleteCoupon,
        auditLogs: misc.auditLogs,
        logAction: misc.logAction,
        visitorStats: misc.visitorStats,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet() {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
}
