'use client';

import React, { useState, useEffect } from 'react';
import { useFleet } from '@/context/FleetContext';
import { Car, Booking, BookingReviewInput, UserRole, VehicleOwner, StaffUser, OwnerCompensationType, Customer, ReturnInspectionPayload } from '@/types/fleet';

// Modular UI Components
import AdminLogin from '@/components/admin/AdminLogin';
import AdminSidebar, { AdminTab } from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminFooter from '@/components/admin/AdminFooter';

// Modular Tabs
import OverviewTab from '@/components/admin/tabs/OverviewTab';
import CarsTab from '@/components/admin/tabs/CarsTab';
import BookingsTab from '@/components/admin/tabs/BookingsTab';
import CustomersTab from '@/components/admin/tabs/CustomersTab';
import StaffTab from '@/components/admin/tabs/StaffTab';
import OwnersTab from '@/components/admin/tabs/OwnersTab';
import AuditTab from '@/components/admin/tabs/AuditTab';
import ProfileTab from '@/components/admin/tabs/ProfileTab';
import CouponsTab from '@/components/admin/tabs/CouponsTab';

// Modular Modals
import CarFormModal, { CarFormState } from '@/components/admin/modals/CarFormModal';
import StaffFormModal from '@/components/admin/modals/StaffFormModal';
import OwnerFormModal, { OwnerFormState } from '@/components/admin/modals/OwnerFormModal';
import CustomerFormModal from '@/components/admin/modals/CustomerFormModal';
import AddBookingModal from '@/components/admin/modals/AddBookingModal';
import ReturnCarModal from '@/components/admin/modals/ReturnCarModal';
import RentalContractModal from '@/components/admin/RentalContractModal';
import OwnerSettlementModal from '@/components/admin/OwnerSettlementModal';

export default function AdminDashboardPage() {
  const { 
    currentStaff, 
    signIn,
    signOut,
    isAuthReady,
    isCloudConnected,
    cloudSyncError,
    dataOperationError,
    clearDataOperationError,
    staffList,
    staffListError,
    addStaff,
    updateStaff,
    updateMyProfile,
    deleteStaff,
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    cars, 
    addCar, 
    updateCar, 
    deleteCar, 
    bookings, 
    addBooking, 
    updateBookingStatus, 
    reviewPendingBooking,
    owners, 
    addOwner,
    updateOwner,
    coupons,
    addCoupon,
    updateCoupon,
    toggleCouponActive,
    deleteCoupon,
    auditLogs, 
    visitorStats
  } = useFleet();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [carFilter, setCarFilter] = useState<'all' | 'available' | 'rented' | 'maintenance'>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // حماية اللوحة وتسجيل الدخول وتفادي Hydration Mismatch
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // النوافذ المنبثقة (Modals Visibility)
  const [isAddCarOpen, setIsAddCarOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [selectedBookingForReturn, setSelectedBookingForReturn] = useState<Booking | null>(null);
  const [selectedBookingForContract, setSelectedBookingForContract] = useState<Booking | null>(null);
  const [selectedOwnerForSettlement, setSelectedOwnerForSettlement] = useState<VehicleOwner | null>(null);
  const [isAddOwnerOpen, setIsAddOwnerOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<VehicleOwner | null>(null);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [returnKmInput, setReturnKmInput] = useState('');

  // Form states - Car
  const [carForm, setCarForm] = useState<CarFormState>({
    carCode: '',
    make: '',
    model: '',
    year: 2024,
    category: 'vip' as Car['category'],
    plateNumber: '',
    color: 'أسود ملكي',
    currentKm: 0,
    initialHandoverKm: 0,
    fleetEntryDate: new Date().toISOString().split('T')[0],
    contractStartDate: new Date().toISOString().split('T')[0],
    contractEndDate: '',
    licenseExpiryDate: '',
    licenseRenewalDate: '',
    nextServiceKm: 10000,
    nextServiceDate: '',
    serviceResponsibleParty: 'company' as 'company' | 'owner',
    dailyPriceEGP: 5000,
    weeklyPriceEGP: 32000,
    securityDepositEGP: 10000,
    status: 'available' as Car['status'],
    images: ['/car-mercedes.jpg'],
    transmission: 'automatic' as Car['transmission'],
    fuelType: 'petrol' as Car['fuelType'],
    seats: 5,
    ownership: 'company' as Car['ownership'],
    ownerId: '',
    ownerName: 'شركة يمن الخليج',
    ownerCompensationType: 'fixed_monthly' as OwnerCompensationType,
    ownerAgreedRateEGP: 35000,
    features: ['مكيف فائق', 'شاشات لمس', 'مقاعد جلد فاخرة']
  });

  // Form states - Staff
  const [staffForm, setStaffForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'rental_agent' as UserRole,
    phone: '',
    active: true,
  });

  // Form states - Owner
  const [ownerForm, setOwnerForm] = useState<OwnerFormState>({
    name: '',
    phone: '',
    nationalId: '',
    bankAccount: '',
    commissionModel: 'fixed_monthly' as VehicleOwner['commissionModel'],
    ownerSharePercent: 75,
    fixedMonthlyRateEGP: 35000,
    fixedDailyRateEGP: 1200,
    monthlyPayoutDay: 1,
    notes: '',
  });

  // Form states - Booking
  const [newBooking, setNewBooking] = useState({
    carId: cars[0]?.id || '',
    customerName: '',
    customerPhone: '',
    nationalId: '',
    licenseNumber: '',
    nationality: 'مصري',
    loyaltyPointsRedeemed: 0,
    loyaltyDiscountEGP: 0,
    promoDiscountEGP: 0,
    startDate: '2026-10-14',
    startTime: '14:00',
    endDate: '2026-10-17',
    endTime: '14:00',
    discountCode: '',
    notes: '',
  });

  useEffect(() => {
    // تهيئة العرض بعد التهيئة فقط، لأن حالة المصادقة
    // تُستعاد بشكل غير متزامن من Supabase Auth
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // تسجيل الدخول بالموظف عبر Supabase Auth والتحقق من دليل staff
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await signIn(loginUsername.trim(), loginPassword);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  // إحصائيات الأسطول
  const totalCars = cars.length;
  const availableCars = cars.filter(c => c.status === 'available').length;
  const rentedCars = cars.filter(c => c.status === 'rented').length;
  const totalRevenueEGP = bookings.reduce((sum, b) => sum + b.finalTotalEGP, 0);
  const totalHeldDepositsEGP = bookings.filter(b => b.depositStatus === 'held').reduce((sum, b) => sum + b.securityDepositEGP, 0);
  const activeBookings = bookings.filter(b => b.status === 'active');

  // معالجات المودال - سيارات
  const openEditCarModal = (car: Car) => {
    setEditingCar(car);
    setCarForm({
      carCode: car.carCode || '',
      make: car.make,
      model: car.model,
      year: car.year,
      category: car.category,
      plateNumber: car.plateNumber,
      color: car.color,
      currentKm: car.currentKm,
      initialHandoverKm: car.initialHandoverKm ?? 0,
      fleetEntryDate: car.fleetEntryDate || '',
      contractStartDate: car.contractStartDate || '',
      contractEndDate: car.contractEndDate || '',
      licenseExpiryDate: car.licenseExpiryDate || '',
      licenseRenewalDate: car.licenseRenewalDate || '',
      nextServiceKm: car.nextServiceKm ?? 10000,
      nextServiceDate: car.nextServiceDate || '',
      serviceResponsibleParty: car.serviceResponsibleParty || 'company',
      dailyPriceEGP: car.dailyPriceEGP,
      weeklyPriceEGP: car.weeklyPriceEGP || car.dailyPriceEGP * 6,
      securityDepositEGP: car.securityDepositEGP,
      status: car.status,
      images: car.images && car.images.length > 0 ? car.images : ['/car-mercedes.jpg'],
      transmission: car.transmission,
      fuelType: car.fuelType,
      seats: car.seats,
      ownership: car.ownership || 'company',
      ownerId: car.ownerId || '',
      ownerName: car.ownerName || 'شركة يمن الخليج',
      ownerCompensationType: car.ownerCompensationType || 'fixed_monthly',
      ownerAgreedRateEGP: car.ownerAgreedRateEGP || 35000,
      features: car.features || ['مكيف فائق', 'مقاعد جلد']
    });
    setIsAddCarOpen(true);
  };

  const openAddCarModal = () => {
    setEditingCar(null);
    setCarForm({
      carCode: '',
      make: '',
      model: '',
      year: 2024,
      category: 'vip',
      plateNumber: '',
      color: 'أسود ملكي',
      currentKm: 0,
      initialHandoverKm: 0,
      fleetEntryDate: new Date().toISOString().split('T')[0],
      contractStartDate: new Date().toISOString().split('T')[0],
      contractEndDate: '',
      licenseExpiryDate: '',
      licenseRenewalDate: '',
      nextServiceKm: 10000,
      nextServiceDate: '',
      serviceResponsibleParty: 'company',
      dailyPriceEGP: 5000,
      weeklyPriceEGP: 32000,
      securityDepositEGP: 10000,
      status: 'available',
      images: ['/car-mercedes.jpg'],
      transmission: 'automatic',
      fuelType: 'petrol',
      seats: 5,
      ownership: 'company',
      ownerId: '',
      ownerName: 'شركة يمن الخليج',
      ownerCompensationType: 'fixed_monthly',
      ownerAgreedRateEGP: 35000,
      features: ['مكيف فائق', 'شاشات لمس']
    });
    setIsAddCarOpen(true);
  };

  const handleCarFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let saved = false;
    if (editingCar) {
      saved = await updateCar(editingCar.id, {
        ...carForm,
        coverImage: carForm.images[0] || '/car-mercedes.jpg'
      });
    } else {
      saved = await addCar({
        ...carForm,
        coverImage: carForm.images[0] || '/car-mercedes.jpg',
        monthlyPriceEGP: carForm.dailyPriceEGP * 24,
      });
    }
    if (!saved) return;
    setIsAddCarOpen(false);
    setEditingCar(null);
  };

  // معالجات المودال - الموظفين
  const handleStaffFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await updateStaff(editingStaff.id, {
          name: staffForm.name,
          username: staffForm.username,
          role: staffForm.role,
          phone: staffForm.phone,
          active: staffForm.active,
          ...(staffForm.password ? { password: staffForm.password } : {})
        });
      } else {
        await addStaff({
          name: staffForm.name,
          username: staffForm.username,
          password: staffForm.password,
          role: staffForm.role,
          phone: staffForm.phone,
          active: true,
        });
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'تعذر حفظ بيانات الموظف');
      return;
    }
    setIsAddStaffOpen(false);
    setEditingStaff(null);
    if (!editingStaff) {
      alert(`تم إنشاء الموظف بنجاح. اسم الدخول: ${staffForm.username.trim().toLowerCase()} — استخدم كلمة المرور التي أدخلتها.`);
      setStaffForm({ name: '', username: '', password: '', role: 'rental_agent', phone: '', active: true });
    }
  };

  // معالجات المودال - الملاك
  const handleOwnerFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let saved = false;
    if (editingOwner) {
      saved = await updateOwner(editingOwner.id, ownerForm);
    } else {
      saved = await addOwner(ownerForm);
    }
    if (!saved) return;
    setIsAddOwnerOpen(false);
    setEditingOwner(null);
  };

  // معالجات المودال - الحجوزات
  const handleAddBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCar = cars.find(c => c.id === newBooking.carId);
    if (!selectedCar) return;
    // الموظف الحالي مثبت بعد بوابة المصادقة
    const staff = currentStaff;
    if (!staff) return;

    const start = new Date(newBooking.startDate);
    const end = new Date(newBooking.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const baseRent = selectedCar.dailyPriceEGP * daysCount;
    const loyaltyDiscount = newBooking.loyaltyDiscountEGP || 0;
    const promoDiscount = newBooking.promoDiscountEGP || 0;
    const totalDiscount = loyaltyDiscount + promoDiscount;
    const finalTotal = Math.max(0, baseRent - totalDiscount);

    const bookingPayload = {
      carId: selectedCar.id,
      carName: `${selectedCar.make} ${selectedCar.model}`,
      carPlate: selectedCar.plateNumber,
      customer: {
        id: `cust-${Date.now()}`,
        fullName: newBooking.customerName,
        phone: newBooking.customerPhone,
        nationalId: newBooking.nationalId || '29508140102555',
        licenseNumber: newBooking.licenseNumber || '99882231',
        nationality: newBooking.nationality || 'مصري',
      },
      startDate: newBooking.startDate,
      startTime: newBooking.startTime,
      endDate: newBooking.endDate,
      endTime: newBooking.endTime,
      daysCount,
      dailyRateEGP: selectedCar.dailyPriceEGP,
      totalRentEGP: baseRent,
      discountCode: newBooking.discountCode || undefined,
      discountAmountEGP: totalDiscount,
      loyaltyPointsRedeemed: newBooking.loyaltyPointsRedeemed,
      loyaltyDiscountEGP: loyaltyDiscount,
      finalTotalEGP: finalTotal,
      securityDepositEGP: selectedCar.securityDepositEGP,
      depositStatus: 'held' as const,
      startKm: selectedCar.currentKm,
      status: 'active' as const,
      staffId: staff.id,
      staffName: staff.name,
      notes: newBooking.notes
    };

    const saved = await addBooking(bookingPayload);
    if (saved) setIsAddBookingOpen(false);
  };

  // إنهاء حجز واستلام السيارة والفحص الشامل
  const handleReturnCarSubmit = async (
    e: React.FormEvent,
    inspectionData?: ReturnInspectionPayload
  ) => {
    e.preventDefault();
    if (!selectedBookingForReturn) return;
    const km = parseInt(returnKmInput) || selectedBookingForReturn.startKm;
    const saved = await updateBookingStatus(selectedBookingForReturn.id, 'completed', km, {
      ...inspectionData,
      staffName: currentStaff?.name,
    });
    if (!saved) return;
    setSelectedBookingForReturn(null);
    setReturnKmInput('');
  };

  // تصفية السيارات بالبحث والحالة
  const filteredCars = cars.filter(car => {
    const matchesSearch = 
      car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.plateNumber.includes(searchQuery);
    const matchesFilter = carFilter === 'all' || car.status === carFilter;
    return matchesSearch && matchesFilter;
  });

  // منع Hydration Mismatch وانتظار استعادة جلسة المصادقة
  if (!isMounted || !isAuthReady) {
    return (
      <div className="min-h-screen bg-[#060b17] flex items-center justify-center font-arabic">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#c5a059]/30 border-t-[#c5a059] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  // شاشة تسجيل الدخول المحمية (غير مصادق عليه)
  if (!currentStaff) {
    return (
      <AdminLogin
        loginUsername={loginUsername}
        setLoginUsername={setLoginUsername}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        loginError={loginError}
        isLoggingIn={isLoggingIn}
        handleLoginSubmit={handleLoginSubmit}
      />
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#f4f6fa] text-slate-800 flex flex-col md:flex-row font-arabic select-none">
      
      {/* 1. الشريط الجانبي الفاخر (Sidebar) */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        currentStaff={currentStaff}
        totalCarsCount={cars.length}
        activeBookingsCount={activeBookings.length}
        customersCount={customers.length}
        ownerCarsCount={cars.filter(c => c.ownership === 'investor' || (c.ownerId && c.ownerId !== 'owner-1')).length}
        staffCount={staffList.length}
        ownersCount={owners.length}
        couponsCount={coupons.length}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        handleLogout={handleLogout}
      />

      {/* 2. المحتوى الرئيسي (Main Dashboard Content) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#f4f6fa]">
        
        {/* شريط الإجراءات والبحث العلوي */}
        <AdminHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isCloudConnected={isCloudConnected}
          currentStaff={currentStaff}
          onOpenAddBooking={() => setIsAddBookingOpen(true)}
          onOpenAddCar={openAddCarModal}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          onOpenProfile={() => setActiveTab('profile')}
          onOpenTab={(tab) => setActiveTab(tab)}
        />

        {cloudSyncError && (
          <div
            role="status"
            className="mx-3.5 mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:mx-6"
          >
            {cloudSyncError}
          </div>
        )}

        {dataOperationError && (
          <div
            role="alert"
            className="mx-3.5 mt-3 flex items-start justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 sm:mx-6"
          >
            <span>{dataOperationError}</span>
            <button type="button" onClick={clearDataOperationError} className="shrink-0 font-bold underline">
              إغلاق
            </button>
          </div>
        )}

        {/* منطقة المحتوى التفاعلي (Tabs) */}
        <div className="p-3.5 sm:p-6 flex-1 space-y-6">

          {/* TAB 1: الإحصائيات العامة */}
          {activeTab === 'overview' && (
            <OverviewTab
              totalCars={totalCars}
              availableCars={availableCars}
              rentedCars={rentedCars}
              activeBookings={activeBookings}
              totalRevenueEGP={totalRevenueEGP}
              totalHeldDepositsEGP={totalHeldDepositsEGP}
              customersCount={customers.length}
              currentStaff={currentStaff}
              visitorStats={visitorStats}
              cars={cars}
              bookings={bookings}
              onReturnCar={(bk) => {
                setSelectedBookingForReturn(bk);
                setReturnKmInput(String(bk.startKm + 350));
              }}
              onOpenAddBooking={() => setIsAddBookingOpen(true)}
              onOpenContract={(bk) => setSelectedBookingForContract(bk)}
              setActiveTab={setActiveTab}
            />
          )}

          {/* TAB 2: إدارة السيارات والأسطول */}
          {activeTab === 'cars' && (
            <CarsTab
              cars={cars}
              filteredCars={filteredCars}
              carFilter={carFilter}
              setCarFilter={setCarFilter}
              availableCarsCount={availableCars}
              rentedCarsCount={rentedCars}
              currentStaff={currentStaff}
              onOpenAddCar={openAddCarModal}
              onOpenEditCar={openEditCarModal}
              onOpenQuickBook={(car) => {
                setNewBooking(prev => ({ ...prev, carId: car.id }));
                setIsAddBookingOpen(true);
              }}
              onDeleteCar={(id, name) => {
                if (confirm(`هل أنت متأكد من حذف ${name}؟`)) {
                  deleteCar(id);
                }
              }}
            />
          )}

          {/* TAB 3: الحجوزات والعقود */}
          {activeTab === 'bookings' && (
            <BookingsTab
              bookings={bookings}
              currentStaff={currentStaff}
              onOpenContract={(bk) => setSelectedBookingForContract(bk)}
              onReturnCar={(bk) => {
                setSelectedBookingForReturn(bk);
                setReturnKmInput(String(bk.startKm + 300));
              }}
              onApproveBooking={(bk, details: BookingReviewInput) => reviewPendingBooking(bk, 'approved', details)}
              onRejectBooking={(bk, reason) => reviewPendingBooking(bk, 'rejected', undefined, reason)}
            />
          )}

          {/* TAB 4: دليل العملاء وإدارة العلاقات (CRM) */}
          {activeTab === 'customers' && (
            <CustomersTab
              customers={customers}
              onOpenAddCustomer={() => {
                setEditingCustomer(null);
                setIsCustomerModalOpen(true);
              }}
              onOpenEditCustomer={(cust) => {
                setEditingCustomer(cust);
                setIsCustomerModalOpen(true);
              }}
              onDeleteCustomer={(id, name) => {
                if (confirm(`هل أنت متأكد من حذف العميل "${name}" من الدليل؟`)) {
                  deleteCustomer(id);
                }
              }}
              onNewBookingForCustomer={(cust) => {
                setNewBooking(prev => ({
                  ...prev,
                  customerName: cust.fullName,
                  customerPhone: cust.phone,
                  nationalId: cust.nationalId,
                  licenseNumber: cust.licenseNumber,
                }));
                setIsAddBookingOpen(true);
              }}
            />
          )}

          {/* TAB 5: الملاك والشركاء (حسابات وأسطول العقود) */}
          {activeTab === 'owners' && (currentStaff.role === 'super_admin' || currentStaff.role === 'accountant') && (
            <OwnersTab
              owners={owners}
              cars={cars}
              bookings={bookings}
              currentStaff={currentStaff}
              onOpenAddOwner={() => {
                setEditingOwner(null);
                setOwnerForm({
                  name: '',
                  phone: '',
                  nationalId: '',
                  bankAccount: '',
                  commissionModel: 'fixed_monthly',
                  ownerSharePercent: 75,
                  fixedMonthlyRateEGP: 35000,
                  fixedDailyRateEGP: 1200,
                  monthlyPayoutDay: 1,
                  notes: ''
                });
                setIsAddOwnerOpen(true);
              }}
              onOpenEditOwner={(owner) => {
                setEditingOwner(owner);
                setOwnerForm({
                  name: owner.name,
                  phone: owner.phone,
                  nationalId: owner.nationalId || '',
                  bankAccount: owner.bankAccount || '',
                  commissionModel: owner.commissionModel || 'fixed_monthly',
                  ownerSharePercent: owner.ownerSharePercent || 75,
                  fixedMonthlyRateEGP: owner.fixedMonthlyRateEGP || 35000,
                  fixedDailyRateEGP: owner.fixedDailyRateEGP || 1200,
                  monthlyPayoutDay: owner.monthlyPayoutDay || 1,
                  notes: owner.notes || '',
                });
                setIsAddOwnerOpen(true);
              }}
              onOpenSettlement={(owner) => setSelectedOwnerForSettlement(owner)}
              onOpenAddCar={openAddCarModal}
              onOpenEditCar={openEditCarModal}
            />
          )}

          {/* TAB 6: فريق العمل والموظفين */}
          {activeTab === 'staff' && currentStaff.role === 'super_admin' && (
            <StaffTab
              staffList={staffList}
              staffListError={staffListError}
              currentStaffId={currentStaff.id}
              onOpenAddStaff={() => {
                setEditingStaff(null);
                setStaffForm({ name: '', username: '', password: '', role: 'rental_agent', phone: '', active: true });
                setIsAddStaffOpen(true);
              }}
              onOpenEditStaff={(staff) => {
                setEditingStaff(staff);
                setStaffForm({
                  name: staff.name,
                  username: staff.username,
                  password: '',
                  role: staff.role,
                  phone: staff.phone,
                  active: staff.active,
                });
                setIsAddStaffOpen(true);
              }}
              onDeleteStaff={async (id, name) => {
                if (confirm(`هل أنت متأكد من حذف حساب الموظف ${name}؟`)) {
                  try {
                    await deleteStaff(id);
                  } catch (error) {
                    alert(error instanceof Error ? error.message : 'تعذر حذف الموظف');
                  }
                }
              }}
            />
          )}

          {/* TAB 7: العروض وأكواد الخصم */}
          {activeTab === 'coupons' && (
            <CouponsTab
              coupons={coupons}
              currentStaff={currentStaff}
              onAddCoupon={addCoupon}
              onUpdateCoupon={updateCoupon}
              onToggleActive={toggleCouponActive}
              onDeleteCoupon={deleteCoupon}
            />
          )}

          {/* TAB 8: سجل الرقابة والأمان */}
          {activeTab === 'audit' && currentStaff.role === 'super_admin' && (
            <AuditTab auditLogs={auditLogs} />
          )}

          {/* TAB 7: حسابي الشخصي وسجل نشاطاتي */}
          {activeTab === 'profile' && (
            <ProfileTab
              currentStaff={currentStaff}
              bookings={bookings}
              auditLogs={auditLogs}
              onUpdateStaff={updateMyProfile}
              onLogout={handleLogout}
            />
          )}

        </div>

        {/* 3. شريط الحالة السفلي للبرنامج */}
        <AdminFooter
          totalCars={totalCars}
          availableCars={availableCars}
          rentedCars={rentedCars}
        />

      </main>

      {/* النوافذ المنبثقة المنفصلة (Modular Modals) */}
      <CarFormModal
        isOpen={isAddCarOpen}
        onClose={() => setIsAddCarOpen(false)}
        editingCar={editingCar}
        carForm={carForm}
        setCarForm={setCarForm}
        owners={owners}
        onSubmit={handleCarFormSubmit}
      />

      <StaffFormModal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        editingStaff={editingStaff}
        staffForm={staffForm}
        setStaffForm={setStaffForm}
        onSubmit={handleStaffFormSubmit}
      />

      <OwnerFormModal
        isOpen={isAddOwnerOpen}
        onClose={() => setIsAddOwnerOpen(false)}
        editingOwner={editingOwner}
        ownerForm={ownerForm}
        setOwnerForm={setOwnerForm}
        onSubmit={handleOwnerFormSubmit}
      />

      <AddBookingModal
        isOpen={isAddBookingOpen}
        onClose={() => setIsAddBookingOpen(false)}
        cars={cars}
        customers={customers}
        newBooking={newBooking}
        setNewBooking={setNewBooking}
        onSubmit={handleAddBookingSubmit}
      />

      {/* نافذة منبثقة: تسجيل / تعديل عميل */}
      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        editingCustomer={editingCustomer}
        onSubmit={async (data) => {
          let saved = false;
          if (editingCustomer) {
            saved = await updateCustomer(editingCustomer.id, data);
          } else {
            saved = Boolean(await addCustomer(data));
          }
          if (saved) setIsCustomerModalOpen(false);
          return saved;
        }}
      />

      <ReturnCarModal
        booking={selectedBookingForReturn}
        onClose={() => setSelectedBookingForReturn(null)}
        returnKmInput={returnKmInput}
        setReturnKmInput={setReturnKmInput}
        onSubmit={handleReturnCarSubmit}
      />

      {/* نافذة منبثقة: عقد الإيجار الرسمي للطباعة */}
      {selectedBookingForContract && (
        <RentalContractModal
          booking={selectedBookingForContract}
          onClose={() => setSelectedBookingForContract(null)}
        />
      )}

      {/* نافذة منبثقة: كشف حساب وتصفية أرباح المالك للطباعة */}
      {selectedOwnerForSettlement && (
        <OwnerSettlementModal
          owner={selectedOwnerForSettlement}
          cars={cars}
          bookings={bookings}
          onClose={() => setSelectedOwnerForSettlement(null)}
        />
      )}

    </div>
  );
}
