'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Car, 
  Booking, 
  Invoice, 
  VehicleOwner, 
  PromoCoupon, 
  StaffUser, 
  AuditLogItem,
  UserRole
} from '@/types/fleet';
import {
  INITIAL_CARS,
  INITIAL_BOOKINGS,
  INITIAL_INVOICES,
  INITIAL_OWNERS,
  INITIAL_COUPONS,
  INITIAL_STAFF,
  INITIAL_AUDIT_LOGS
} from '@/lib/initial-data';

interface FleetContextType {
  // الحساب الحالي النشط
  currentStaff: StaffUser;
  setCurrentStaff: (staff: StaffUser) => void;
  switchStaffRole: (role: UserRole) => void;

  // السيارات
  cars: Car[];
  addCar: (car: Omit<Car, 'id'>) => void;
  updateCar: (id: string, car: Partial<Car>) => void;
  deleteCar: (id: string) => void;

  // الحجوزات
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt'>) => void;
  updateBookingStatus: (id: string, status: Booking['status'], returnKm?: number) => void;

  // الفواتير
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'issuedAt'>) => void;

  // الملاك
  owners: VehicleOwner[];
  addOwner: (owner: Omit<VehicleOwner, 'id'>) => void;

  // الكوبونات
  coupons: PromoCoupon[];
  applyCoupon: (code: string) => PromoCoupon | null;

  // سجل الرقابة
  auditLogs: AuditLogItem[];
  logAction: (action: string, details: string) => void;

  // تهيئة أو استعادة البيانات
  resetToDefault: () => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export function FleetProvider({ children }: { children: React.ReactNode }) {
  const [currentStaff, setCurrentStaff] = useState<StaffUser>(INITIAL_STAFF[0]);
  const [cars, setCars] = useState<Car[]>(INITIAL_CARS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [owners, setOwners] = useState<VehicleOwner[]>(INITIAL_OWNERS);
  const [coupons, setCoupons] = useState<PromoCoupon[]>(INITIAL_COUPONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);

  // استرجاع البيانات من LocalStorage إن وجدت
  useEffect(() => {
    try {
      const savedCars = localStorage.getItem('yg_cars');
      if (savedCars) setCars(JSON.parse(savedCars));

      const savedBookings = localStorage.getItem('yg_bookings');
      if (savedBookings) setBookings(JSON.parse(savedBookings));

      const savedInvoices = localStorage.getItem('yg_invoices');
      if (savedInvoices) setInvoices(JSON.parse(savedInvoices));

      const savedOwners = localStorage.getItem('yg_owners');
      if (savedOwners) setOwners(JSON.parse(savedOwners));

      const savedCoupons = localStorage.getItem('yg_coupons');
      if (savedCoupons) setCoupons(JSON.parse(savedCoupons));

      const savedLogs = localStorage.getItem('yg_audit_logs');
      if (savedLogs) setAuditLogs(JSON.parse(savedLogs));
    } catch {
      // LocalStorage not available or parse error
    }
  }, []);

  // حفظ التغييرات في LocalStorage
  const saveToStorage = (key: string, data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // ignore
    }
  };

  const logAction = (action: string, details: string) => {
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      action,
      staffName: currentStaff.name,
      staffRole: currentStaff.role,
      timestamp: new Date().toLocaleString('ar-EG'),
      details,
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    saveToStorage('yg_audit_logs', updated);
  };

  const switchStaffRole = (role: UserRole) => {
    const staff = INITIAL_STAFF.find(s => s.role === role) || INITIAL_STAFF[0];
    setCurrentStaff(staff);
  };

  // 1. إضافة وتعديل السيارات
  const addCar = (newCarData: Omit<Car, 'id'>) => {
    const newCar: Car = {
      ...newCarData,
      id: `car-${Date.now()}`,
    };
    const updated = [newCar, ...cars];
    setCars(updated);
    saveToStorage('yg_cars', updated);
    logAction('إضافة سيارة جديدة', `تمت إضافة ${newCar.make} ${newCar.model} (${newCar.plateNumber})`);
  };

  const updateCar = (id: string, partial: Partial<Car>) => {
    const updated = cars.map(c => c.id === id ? { ...c, ...partial } : c);
    setCars(updated);
    saveToStorage('yg_cars', updated);
    logAction('تعديل سيارة', `تم تحديث بيانات السيارة ID: ${id}`);
  };

  const deleteCar = (id: string) => {
    const car = cars.find(c => c.id === id);
    const updated = cars.filter(c => c.id !== id);
    setCars(updated);
    saveToStorage('yg_cars', updated);
    logAction('حذف سيارة', `تم حذف السيارة: ${car?.make} ${car?.model}`);
  };

  // 2. الحجوزات
  const addBooking = (bookingData: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt'>) => {
    const seq = bookings.length + 1;
    const bookingNumber = `BK-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;
    const newBooking: Booking = {
      ...bookingData,
      id: `bk-${Date.now()}`,
      bookingNumber,
      createdAt: new Date().toLocaleString('ar-EG'),
    };
    const updated = [newBooking, ...bookings];
    setBookings(updated);
    saveToStorage('yg_bookings', updated);

    // تحديث حالة السيارة تلقائياً إلى مؤجرة
    updateCar(newBooking.carId, { status: 'rented' });

    // إنشاء فاتورة تلقائياً
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
      bookingId: newBooking.id,
      customerName: newBooking.customer.fullName,
      customerPhone: newBooking.customer.phone,
      carDetails: `${newBooking.carName} (${newBooking.carPlate})`,
      totalAmountEGP: newBooking.finalTotalEGP,
      depositAmountEGP: newBooking.securityDepositEGP,
      paymentMethod: 'cash',
      paid: true,
      issuedAt: new Date().toLocaleString('ar-EG'),
      issuedBy: currentStaff.name,
    };
    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    saveToStorage('yg_invoices', updatedInvoices);

    logAction('إنشاء حجز وفاتورة جديدة', `تم حجز ${newBooking.carName} للعميل ${newBooking.customer.fullName} بقيمة ${newBooking.finalTotalEGP.toLocaleString()} ج.م`);
  };

  const updateBookingStatus = (id: string, status: Booking['status'], returnKm?: number) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    const updated = bookings.map(b => {
      if (b.id === id) {
        return {
          ...b,
          status,
          returnKm: returnKm || b.returnKm,
          actualReturnDate: status === 'completed' ? new Date().toISOString().split('T')[0] : b.actualReturnDate,
          depositStatus: status === 'completed' ? ('refunded_full' as const) : b.depositStatus,
        };
      }
      return b;
    });

    setBookings(updated);
    saveToStorage('yg_bookings', updated);

    // إذا اكتمل الحجز، نعيد السيارة لحالة متاحة ونحدث الكيلومترات
    if (status === 'completed') {
      updateCar(booking.carId, {
        status: 'available',
        currentKm: returnKm || booking.startKm,
      });
      logAction('إرجاع سيارة وإغلاق العقد', `تم استلام ${booking.carName} وتسجيل العداد ${returnKm || booking.startKm} كم واسترجاع التأمين`);
    }
  };

  // 3. الفواتير
  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'issuedAt'>) => {
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
  };

  // 4. الملاك
  const addOwner = (ownerData: Omit<VehicleOwner, 'id'>) => {
    const newOwner: VehicleOwner = {
      ...ownerData,
      id: `owner-${Date.now()}`,
    };
    const updated = [...owners, newOwner];
    setOwners(updated);
    saveToStorage('yg_owners', updated);
    logAction('إضافة مالك/مستثمر جديد', `تمت إضافة المالك ${newOwner.name}`);
  };

  // 5. الكوبونات
  const applyCoupon = (code: string): PromoCoupon | null => {
    const found = coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.active);
    return found || null;
  };

  // استعادة البيانات الأصلية
  const resetToDefault = () => {
    setCars(INITIAL_CARS);
    setBookings(INITIAL_BOOKINGS);
    setInvoices(INITIAL_INVOICES);
    setOwners(INITIAL_OWNERS);
    setCoupons(INITIAL_COUPONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    localStorage.clear();
    logAction('إعادة ضبط المصنع', 'تم استعادة البيانات الافتراضية');
  };

  return (
    <FleetContext.Provider
      value={{
        currentStaff,
        setCurrentStaff,
        switchStaffRole,
        cars,
        addCar,
        updateCar,
        deleteCar,
        bookings,
        addBooking,
        updateBookingStatus,
        invoices,
        addInvoice,
        owners,
        addOwner,
        coupons,
        applyCoupon,
        auditLogs,
        logAction,
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
