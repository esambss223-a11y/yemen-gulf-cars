'use client';

import React, { createContext, useContext, useEffect, useCallback } from 'react';
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
  ReturnInspectionPayload
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

  // إدارة الموظفين
  staffList: StaffUser[];
  addStaff: (staff: Omit<StaffUser, 'id'>) => void;
  updateStaff: (id: string, partial: Partial<StaffUser>) => void;
  deleteStaff: (id: string) => void;

  // إدارة العملاء وسجل CRM
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => Customer;
  updateCustomer: (id: string, partial: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // أسطول السيارات
  cars: Car[];
  addCar: (car: Omit<Car, 'id'>) => Promise<void>;
  updateCar: (id: string, car: Partial<Car>) => Promise<void>;
  deleteCar: (id: string) => Promise<void>;

  // الحجوزات والعقود
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt'>) => Promise<void>;
  updateBookingStatus: (
    id: string, 
    status: Booking['status'], 
    returnKm?: number,
    delayDetails?: ReturnInspectionPayload
  ) => Promise<void>;

  // الفواتير
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'issuedAt'>) => Promise<void>;

  // الملاك والشركاء
  owners: VehicleOwner[];
  addOwner: (owner: Omit<VehicleOwner, 'id'>) => Promise<void>;
  updateOwner: (id: string, partial: Partial<VehicleOwner>) => void;
  deleteOwner: (id: string) => void;

  // الكوبونات
  coupons: PromoCoupon[];
  applyCoupon: (code: string) => PromoCoupon | null;

  // سجل الرقابة
  auditLogs: AuditLogItem[];
  logAction: (action: string, details: string) => void;

  // إحصائيات الزوار
  visitorStats: VisitorStats;

  // إعادة ضبط المصنع
  resetToDefault: () => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export function FleetProvider({ children }: { children: React.ReactNode }) {
  // 1. الوحدة المساعدة: السجلات، الفواتير، الزيارات، وإحصائيات السحابة
  const misc = useFleetMisc({});

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

  // مزامنة السحابة عند بدء التشغيل
  const loadCloudData = useCallback(async () => {
    try {
      // جلب السيارات
      const { data: cloudCars, error: carsErr } = await supabase.from('cars').select('*');
      if (!carsErr && cloudCars && cloudCars.length > 0) {
        misc.setIsCloudConnected(true);
        fleetCars.setCars(cloudCars.map(fleetCars.mapCloudCar));
      }

      // جلب الحجوزات
      const { data: cloudBookings, error: bkErr } = await supabase.from('bookings').select('*');
      if (!bkErr && cloudBookings && cloudBookings.length > 0) {
        fleetBookings.setBookings(cloudBookings.map(fleetBookings.mapCloudBooking));
      }

      // جلب الملاك
      const { data: cloudOwners, error: ownersErr } = await supabase.from('owners').select('*');
      if (!ownersErr && cloudOwners && cloudOwners.length > 0) {
        fleetOwners.setOwners(cloudOwners.map(fleetOwners.mapCloudOwner));
      }
    } catch (err) {
      console.warn('Supabase cloud fetch fallback:', err);
    }
  }, [fleetCars, fleetBookings, fleetOwners, misc]);

  useEffect(() => {
    misc.trackAndLoadVisits();
    loadCloudData();
  }, [misc, loadCloudData]);

  // دالة إعادة ضبط المصنع
  const resetToDefault = misc.createResetFunction(
    fleetCars.setCars,
    fleetBookings.setBookings,
    fleetOwners.setOwners,
    auth.setStaffList,
    fleetCustomers.setCustomers
  );

  return (
    <FleetContext.Provider
      value={{
        currentStaff: auth.currentStaff,
        isAuthReady: auth.isAuthReady,
        signIn: auth.signIn,
        signOut: auth.signOut,
        isCloudConnected: misc.isCloudConnected,
        staffList: auth.staffList,
        addStaff: auth.addStaff,
        updateStaff: auth.updateStaff,
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
        invoices: misc.invoices,
        addInvoice: misc.addInvoice,
        owners: fleetOwners.owners,
        addOwner: fleetOwners.addOwner,
        updateOwner: fleetOwners.updateOwner,
        deleteOwner: fleetOwners.deleteOwner,
        coupons: misc.coupons,
        applyCoupon: misc.applyCoupon,
        auditLogs: misc.auditLogs,
        logAction: misc.logAction,
        visitorStats: misc.visitorStats,
        resetToDefault,
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
