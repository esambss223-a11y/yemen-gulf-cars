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
  UserRole,
  VisitorStats
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
import { supabase } from '@/lib/supabase';

interface FleetContextType {
  // الحساب الحالي النشط
  currentStaff: StaffUser;
  setCurrentStaff: (staff: StaffUser) => void;
  switchStaffRole: (role: UserRole) => void;

  // حالة الاتصال بقاعدة البيانات السحابية
  isCloudConnected: boolean;

  // إدارة الموظفين
  staffList: StaffUser[];
  addStaff: (staff: Omit<StaffUser, 'id'>) => void;
  updateStaff: (id: string, partial: Partial<StaffUser>) => void;
  deleteStaff: (id: string) => void;

  // السيارات
  cars: Car[];
  addCar: (car: Omit<Car, 'id'>) => Promise<void>;
  updateCar: (id: string, car: Partial<Car>) => Promise<void>;
  deleteCar: (id: string) => Promise<void>;

  // الحجوزات
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt'>) => Promise<void>;
  updateBookingStatus: (id: string, status: Booking['status'], returnKm?: number) => Promise<void>;

  // الفواتير
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'issuedAt'>) => Promise<void>;

  // الملاك
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

  // إحصائيات زوار الموقع
  visitorStats: VisitorStats;

  // تهيئة أو استعادة البيانات
  resetToDefault: () => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export function FleetProvider({ children }: { children: React.ReactNode }) {
  const [currentStaff, setCurrentStaff] = useState<StaffUser>(INITIAL_STAFF[0]);
  const [staffList, setStaffList] = useState<StaffUser[]>(INITIAL_STAFF);
  const [cars, setCars] = useState<Car[]>(INITIAL_CARS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [owners, setOwners] = useState<VehicleOwner[]>(INITIAL_OWNERS);
  const [coupons, setCoupons] = useState<PromoCoupon[]>(INITIAL_COUPONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [visitorStats, setVisitorStats] = useState<VisitorStats>({
    today: 0,
    thisMonth: 0,
    total: 0,
    liveNow: 1,
    lastUpdated: 'جاري التحميل...'
  });

  // 1. مزامنة البيانات وتتبع زوار الموقع الحقيقيين
  useEffect(() => {
    async function trackAndLoadVisits() {
      try {
        // إنشاء معرف جلسة فريد لكل متصفح
        let sessionId = sessionStorage.getItem('yg_visitor_session');
        if (!sessionId) {
          sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          sessionStorage.setItem('yg_visitor_session', sessionId);
          
          // تسجيل زيارة حقيقية في Supabase
          const deviceType = window.innerWidth < 640 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
          await supabase.from('site_visits').insert({
            session_id: sessionId,
            device_type: deviceType,
            page_path: window.location.pathname,
          });
        }

        // قراءة عدد الزيارات الحقيقية من جدول site_visits في Supabase
        const todayDateStr = new Date().toISOString().slice(0, 10);
        const startOfMonthStr = `${todayDateStr.slice(0, 7)}-01`;

        const [
          { count: todayCount },
          { count: monthCount },
          { count: totalCount }
        ] = await Promise.all([
          supabase.from('site_visits').select('*', { count: 'exact', head: true }).gte('visited_at', `${todayDateStr}T00:00:00Z`),
          supabase.from('site_visits').select('*', { count: 'exact', head: true }).gte('visited_at', `${startOfMonthStr}T00:00:00Z`),
          supabase.from('site_visits').select('*', { count: 'exact', head: true })
        ]);

        if (totalCount !== null && totalCount !== undefined) {
          setVisitorStats({
            today: todayCount || 1,
            thisMonth: monthCount || 1,
            total: totalCount || 1,
            liveNow: 1,
            lastUpdated: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
          });
        } else {
          // في حال لم يتم رفع الجدول بعد على Supabase: قراءة الزيارات الحقيقية من LocalStorage
          const savedLocalVisits = parseInt(localStorage.getItem('yg_real_total_visits') || '0', 10) + 1;
          localStorage.setItem('yg_real_total_visits', savedLocalVisits.toString());
          setVisitorStats({
            today: 1,
            thisMonth: savedLocalVisits,
            total: savedLocalVisits,
            liveNow: 1,
            lastUpdated: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
          });
        }
      } catch (err) {
        console.warn('Real visits tracking notice:', err);
      }
    }

    trackAndLoadVisits();

    async function loadData() {
      try {
        // فحص السيارات من Supabase
        const { data: cloudCars, error: carsErr } = await supabase.from('cars').select('*');
        if (!carsErr && cloudCars && cloudCars.length > 0) {
          setIsCloudConnected(true);
          const mappedCars: Car[] = cloudCars.map(c => ({
            id: c.id,
            make: c.make,
            model: c.model,
            year: c.year,
            category: c.category,
            plateNumber: c.plate_number,
            color: c.color,
            currentKm: c.current_km,
            dailyPriceEGP: Number(c.daily_price_egp),
            weeklyPriceEGP: c.weekly_price_egp ? Number(c.weekly_price_egp) : undefined,
            monthlyPriceEGP: c.monthly_price_egp ? Number(c.monthly_price_egp) : undefined,
            securityDepositEGP: Number(c.security_deposit_egp),
            status: c.status,
            images: Array.isArray(c.images) ? c.images : ['/car-mercedes.jpg'],
            coverImage: c.cover_image || '/car-mercedes.jpg',
            transmission: c.transmission || 'automatic',
            fuelType: c.fuel_type || 'petrol',
            seats: c.seats || 5,
            ownership: c.ownership || 'company',
            ownerId: c.owner_id,
            ownerName: c.owner_name,
            features: Array.isArray(c.features) ? c.features : [],
            insuranceExpiryDate: c.insurance_expiry_date,
          }));
          setCars(mappedCars);
        } else {
          // fallback to localStorage
          const savedCars = localStorage.getItem('yg_cars');
          if (savedCars) setCars(JSON.parse(savedCars));
        }

        // جلب الحجوزات
        const { data: cloudBookings, error: bkErr } = await supabase.from('bookings').select('*');
        if (!bkErr && cloudBookings && cloudBookings.length > 0) {
          const mappedBk: Booking[] = cloudBookings.map(b => ({
            id: b.id,
            bookingNumber: b.booking_number,
            carId: b.car_id,
            carName: b.car_name,
            carPlate: b.car_plate,
            customer: typeof b.customer === 'string' ? JSON.parse(b.customer) : b.customer,
            startDate: b.start_date,
            startTime: b.start_time,
            endDate: b.end_date,
            endTime: b.end_time,
            actualReturnDate: b.actual_return_date,
            daysCount: b.days_count,
            dailyRateEGP: Number(b.daily_rate_egp),
            totalRentEGP: Number(b.total_rent_egp),
            discountCode: b.discount_code,
            discountAmountEGP: Number(b.discount_amount_egp || 0),
            finalTotalEGP: Number(b.final_total_egp),
            securityDepositEGP: Number(b.security_deposit_egp),
            depositStatus: b.deposit_status,
            startKm: b.start_km,
            returnKm: b.return_km,
            status: b.status,
            staffId: b.staff_id,
            staffName: b.staff_name,
            notes: b.notes,
            createdAt: b.created_at || new Date().toLocaleString('ar-EG'),
          }));
          setBookings(mappedBk);
        } else {
          const savedBookings = localStorage.getItem('yg_bookings');
          if (savedBookings) setBookings(JSON.parse(savedBookings));
        }

        // جلب الفواتير والملاك والكوبونات والسجلات
        const savedInvoices = localStorage.getItem('yg_invoices');
        if (savedInvoices) setInvoices(JSON.parse(savedInvoices));

        const savedStaff = localStorage.getItem('yg_staff');
        if (savedStaff) setStaffList(JSON.parse(savedStaff));

        const savedOwners = localStorage.getItem('yg_owners');
        if (savedOwners) setOwners(JSON.parse(savedOwners));

        const savedCoupons = localStorage.getItem('yg_coupons');
        if (savedCoupons) setCoupons(JSON.parse(savedCoupons));

        const savedLogs = localStorage.getItem('yg_audit_logs');
        if (savedLogs) setAuditLogs(JSON.parse(savedLogs));
      } catch (err) {
        console.warn('Supabase fetch fallback:', err);
      }
    }

    loadData();
  }, []);

  const saveToStorage = (key: string, data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // ignore
    }
  };

  const logAction = async (action: string, details: string) => {
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

    // سحابياً
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
  };

  const switchStaffRole = (role: UserRole) => {
    const staff = INITIAL_STAFF.find(s => s.role === role) || INITIAL_STAFF[0];
    setCurrentStaff(staff);
  };

  // 2. إضافة سيارة (محلياً وسحابياً)
  const addCar = async (newCarData: Omit<Car, 'id'>) => {
    const newCar: Car = {
      ...newCarData,
      id: `car-${Date.now()}`,
    };
    const updated = [newCar, ...cars];
    setCars(updated);
    saveToStorage('yg_cars', updated);

    try {
      await supabase.from('cars').insert({
        id: newCar.id,
        make: newCar.make,
        model: newCar.model,
        year: newCar.year,
        category: newCar.category,
        plate_number: newCar.plateNumber,
        color: newCar.color,
        current_km: newCar.currentKm,
        daily_price_egp: newCar.dailyPriceEGP,
        weekly_price_egp: newCar.weeklyPriceEGP,
        security_deposit_egp: newCar.securityDepositEGP,
        status: newCar.status,
        images: newCar.images,
        cover_image: newCar.coverImage,
        transmission: newCar.transmission,
        fuel_type: newCar.fuelType,
        seats: newCar.seats,
        ownership: newCar.ownership,
        owner_name: newCar.ownerName,
        features: newCar.features,
      });
    } catch (e) {
      console.warn('Cloud car insert warning:', e);
    }

    logAction('إضافة سيارة جديدة', `تمت إضافة ${newCar.make} ${newCar.model} (${newCar.plateNumber})`);
  };

  const updateCar = async (id: string, partial: Partial<Car>) => {
    const updated = cars.map(c => c.id === id ? { ...c, ...partial } : c);
    setCars(updated);
    saveToStorage('yg_cars', updated);

    try {
      const payload: Record<string, any> = {};
      if (partial.status) payload.status = partial.status;
      if (partial.currentKm !== undefined) payload.current_km = partial.currentKm;
      if (partial.dailyPriceEGP !== undefined) payload.daily_price_egp = partial.dailyPriceEGP;
      await supabase.from('cars').update(payload).eq('id', id);
    } catch {
      // ignore
    }

    logAction('تعديل سيارة', `تم تحديث بيانات السيارة ID: ${id}`);
  };

  const deleteCar = async (id: string) => {
    const car = cars.find(c => c.id === id);
    const updated = cars.filter(c => c.id !== id);
    setCars(updated);
    saveToStorage('yg_cars', updated);

    try {
      await supabase.from('cars').delete().eq('id', id);
    } catch {
      // ignore
    }

    logAction('حذف سيارة', `تم حذف السيارة: ${car?.make} ${car?.model}`);
  };

  // 3. الحجوزات (محلياً وسحابياً)
  const addBooking = async (bookingData: Omit<Booking, 'id' | 'bookingNumber' | 'createdAt'>) => {
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
    await updateCar(newBooking.carId, { status: 'rented' });

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

    try {
      await supabase.from('bookings').insert({
        id: newBooking.id,
        booking_number: newBooking.bookingNumber,
        car_id: newBooking.carId,
        car_name: newBooking.carName,
        car_plate: newBooking.carPlate,
        customer: newBooking.customer,
        start_date: newBooking.startDate,
        start_time: newBooking.startTime,
        end_date: newBooking.endDate,
        end_time: newBooking.endTime,
        days_count: newBooking.daysCount,
        daily_rate_egp: newBooking.dailyRateEGP,
        total_rent_egp: newBooking.totalRentEGP,
        discount_code: newBooking.discountCode,
        discount_amount_egp: newBooking.discountAmountEGP,
        final_total_egp: newBooking.finalTotalEGP,
        security_deposit_egp: newBooking.securityDepositEGP,
        deposit_status: newBooking.depositStatus,
        start_km: newBooking.startKm,
        status: newBooking.status,
        staff_id: newBooking.staffId,
        staff_name: newBooking.staffName,
        notes: newBooking.notes,
      });

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
    } catch (e) {
      console.warn('Cloud booking sync warning:', e);
    }

    logAction('إنشاء حجز وفاتورة جديدة', `تم حجز ${newBooking.carName} للعميل ${newBooking.customer.fullName} بقيمة ${newBooking.finalTotalEGP.toLocaleString()} ج.م`);
  };

  const updateBookingStatus = async (id: string, status: Booking['status'], returnKm?: number) => {
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
      await updateCar(booking.carId, {
        status: 'available',
        currentKm: returnKm || booking.startKm,
      });
      logAction('إرجاع سيارة وإغلاق العقد', `تم استلام ${booking.carName} وتسجيل العداد ${returnKm || booking.startKm} كم واسترجاع التأمين`);
    }

    try {
      await supabase.from('bookings').update({
        status,
        return_km: returnKm || booking.startKm,
        deposit_status: status === 'completed' ? 'refunded_full' : booking.depositStatus,
      }).eq('id', id);
    } catch {
      // ignore
    }
  };

  // 4. الفواتير
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
  };

  // 5. الملاك
  const addOwner = async (ownerData: Omit<VehicleOwner, 'id'>) => {
    const newOwner: VehicleOwner = {
      ...ownerData,
      id: `owner-${Date.now()}`,
    };
    const updated = [...owners, newOwner];
    setOwners(updated);
    saveToStorage('yg_owners', updated);
    logAction('إضافة مالك/مستثمر جديد', `تمت إضافة المالك ${newOwner.name}`);
  };

  const updateOwner = (id: string, partial: Partial<VehicleOwner>) => {
    const updated = owners.map(o => o.id === id ? { ...o, ...partial } : o);
    setOwners(updated);
    saveToStorage('yg_owners', updated);
    logAction('تعديل بيانات مالك', `تم تحديث المالك ID: ${id}`);
  };

  const deleteOwner = (id: string) => {
    const owner = owners.find(o => o.id === id);
    const updated = owners.filter(o => o.id !== id);
    setOwners(updated);
    saveToStorage('yg_owners', updated);
    logAction('حذف مالك', `تم حذف المالك: ${owner?.name}`);
  };

  // 6. إدارة الموظفين
  const addStaff = (staffData: Omit<StaffUser, 'id'>) => {
    const newStaff: StaffUser = {
      ...staffData,
      id: `staff-${Date.now()}`,
    };
    const updated = [...staffList, newStaff];
    setStaffList(updated);
    saveToStorage('yg_staff', updated);
    logAction('إضافة موظف جديد', `تمت إضافة الموظف ${newStaff.name} بدور ${newStaff.role}`);
  };

  const updateStaff = (id: string, partial: Partial<StaffUser>) => {
    const updated = staffList.map(s => s.id === id ? { ...s, ...partial } : s);
    setStaffList(updated);
    saveToStorage('yg_staff', updated);
    logAction('تعديل حساب موظف', `تم تعديل بيانات الموظف ID: ${id}`);
  };

  const deleteStaff = (id: string) => {
    if (staffList.length <= 1) {
      alert('لا يمكن حذف الموظف الوحيد في النظام');
      return;
    }
    const staff = staffList.find(s => s.id === id);
    const updated = staffList.filter(s => s.id !== id);
    setStaffList(updated);
    saveToStorage('yg_staff', updated);
    logAction('حذف موظف', `تم حذف حساب الموظف: ${staff?.name}`);
  };

  // 7. الكوبونات
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
    setStaffList(INITIAL_STAFF);
    localStorage.clear();
    logAction('إعادة ضبط المصنع', 'تم استعادة البيانات الافتراضية');
  };

  return (
    <FleetContext.Provider
      value={{
        currentStaff,
        setCurrentStaff,
        switchStaffRole,
        isCloudConnected,
        staffList,
        addStaff,
        updateStaff,
        deleteStaff,
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
        updateOwner,
        deleteOwner,
        coupons,
        applyCoupon,
        auditLogs,
        logAction,
        visitorStats,
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
