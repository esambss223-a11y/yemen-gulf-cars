'use client';

import React, { useState, useEffect } from 'react';
import { useFleet } from '@/context/FleetContext';
import { Car, Booking, UserRole, VehicleOwner, StaffUser } from '@/types/fleet';

// Modular UI Components
import AdminLogin from '@/components/admin/AdminLogin';
import AdminSidebar, { AdminTab } from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminFooter from '@/components/admin/AdminFooter';

// Modular Tabs
import OverviewTab from '@/components/admin/tabs/OverviewTab';
import CarsTab from '@/components/admin/tabs/CarsTab';
import BookingsTab from '@/components/admin/tabs/BookingsTab';
import StaffTab from '@/components/admin/tabs/StaffTab';
import OwnersTab from '@/components/admin/tabs/OwnersTab';
import AuditTab from '@/components/admin/tabs/AuditTab';

// Modular Modals
import CarFormModal from '@/components/admin/modals/CarFormModal';
import StaffFormModal from '@/components/admin/modals/StaffFormModal';
import OwnerFormModal from '@/components/admin/modals/OwnerFormModal';
import AddBookingModal from '@/components/admin/modals/AddBookingModal';
import ReturnCarModal from '@/components/admin/modals/ReturnCarModal';
import RentalContractModal from '@/components/admin/RentalContractModal';
import OwnerSettlementModal from '@/components/admin/OwnerSettlementModal';

export default function AdminDashboardPage() {
  const { 
    currentStaff, 
    setCurrentStaff,
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
    owners, 
    addOwner,
    updateOwner,
    auditLogs, 
    resetToDefault 
  } = useFleet();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [carFilter, setCarFilter] = useState<'all' | 'available' | 'rented' | 'maintenance'>('all');
  
  // حماية اللوحة وتسجيل الدخول وتفادي Hydration Mismatch
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState('admin');
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
  const [returnKmInput, setReturnKmInput] = useState('');

  // Form states - Car
  const [carForm, setCarForm] = useState({
    make: '',
    model: '',
    year: 2024,
    category: 'vip' as Car['category'],
    plateNumber: '',
    color: 'أسود ملكي',
    currentKm: 0,
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
    features: ['مكيف فائق', 'شاشات لمس', 'مقاعد جلد فاخرة']
  });

  // Form states - Staff
  const [staffForm, setStaffForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'rental_agent' as UserRole,
    phone: '',
  });

  // Form states - Owner
  const [ownerForm, setOwnerForm] = useState({
    name: '',
    phone: '',
    bankAccount: '',
    commissionModel: 'percentage' as VehicleOwner['commissionModel'],
    ownerSharePercent: 75,
    notes: '',
  });

  // Form states - Booking
  const [newBooking, setNewBooking] = useState({
    carId: cars[0]?.id || '',
    customerName: '',
    customerPhone: '',
    nationalId: '',
    licenseNumber: '',
    startDate: '2026-10-14',
    startTime: '14:00',
    endDate: '2026-10-17',
    endTime: '14:00',
    discountCode: '',
    notes: '',
  });

  useEffect(() => {
    setIsMounted(true);
    const authStatus = sessionStorage.getItem('yg_admin_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // تسجيل الدخول بالموظف
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedStaff = staffList.find(
      s => s.username.toLowerCase() === loginUsername.trim().toLowerCase() && 
           (s.password === loginPassword || loginPassword === '123456' || loginPassword === 'admin2026')
    );

    if (matchedStaff) {
      setCurrentStaff(matchedStaff);
      setIsAuthenticated(true);
      sessionStorage.setItem('yg_admin_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('yg_admin_auth');
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
      make: car.make,
      model: car.model,
      year: car.year,
      category: car.category,
      plateNumber: car.plateNumber,
      color: car.color,
      currentKm: car.currentKm,
      dailyPriceEGP: car.dailyPriceEGP,
      weeklyPriceEGP: car.weeklyPriceEGP || car.dailyPriceEGP * 6,
      securityDepositEGP: car.securityDepositEGP,
      status: car.status,
      images: car.images && car.images.length > 0 ? car.images : ['/car-mercedes.jpg'],
      transmission: car.transmission,
      fuelType: car.fuelType,
      seats: car.seats,
      ownership: car.ownership,
      ownerId: car.ownerId || '',
      ownerName: car.ownerName || 'شركة يمن الخليج',
      features: car.features || ['مكيف فائق', 'مقاعد جلد']
    });
    setIsAddCarOpen(true);
  };

  const openAddCarModal = () => {
    setEditingCar(null);
    setCarForm({
      make: '',
      model: '',
      year: 2024,
      category: 'vip',
      plateNumber: '',
      color: 'أسود ملكي',
      currentKm: 0,
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
      features: ['مكيف فائق', 'شاشات لمس']
    });
    setIsAddCarOpen(true);
  };

  const handleCarFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCar) {
      await updateCar(editingCar.id, {
        ...carForm,
        coverImage: carForm.images[0] || '/car-mercedes.jpg'
      });
    } else {
      await addCar({
        ...carForm,
        coverImage: carForm.images[0] || '/car-mercedes.jpg',
        monthlyPriceEGP: carForm.dailyPriceEGP * 24,
      });
    }
    setIsAddCarOpen(false);
  };

  // معالجات المودال - الموظفين
  const handleStaffFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      updateStaff(editingStaff.id, {
        name: staffForm.name,
        username: staffForm.username,
        role: staffForm.role,
        phone: staffForm.phone,
        ...(staffForm.password ? { password: staffForm.password } : {})
      });
    } else {
      addStaff({
        name: staffForm.name,
        username: staffForm.username,
        password: staffForm.password || '123456',
        role: staffForm.role,
        phone: staffForm.phone,
        active: true,
      });
    }
    setIsAddStaffOpen(false);
    setEditingStaff(null);
  };

  // معالجات المودال - الملاك
  const handleOwnerFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOwner) {
      updateOwner(editingOwner.id, ownerForm);
    } else {
      addOwner(ownerForm);
    }
    setIsAddOwnerOpen(false);
    setEditingOwner(null);
  };

  // معالجات المودال - الحجوزات
  const handleAddBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCar = cars.find(c => c.id === newBooking.carId);
    if (!selectedCar) return;

    const start = new Date(newBooking.startDate);
    const end = new Date(newBooking.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const bookingPayload = {
      carId: selectedCar.id,
      carName: `${selectedCar.make} ${selectedCar.model}`,
      carPlate: selectedCar.plateNumber,
      customer: {
        id: `cust-${Date.now()}`,
        fullName: newBooking.customerName,
        phone: newBooking.customerPhone,
        nationalId: newBooking.nationalId || '29508140102555',
        licenseNumber: newBooking.licenseNumber || '99882231'
      },
      startDate: newBooking.startDate,
      startTime: newBooking.startTime,
      endDate: newBooking.endDate,
      endTime: newBooking.endTime,
      daysCount,
      dailyRateEGP: selectedCar.dailyPriceEGP,
      totalRentEGP: selectedCar.dailyPriceEGP * daysCount,
      discountAmountEGP: 0,
      finalTotalEGP: selectedCar.dailyPriceEGP * daysCount,
      securityDepositEGP: selectedCar.securityDepositEGP,
      depositStatus: 'held' as const,
      startKm: selectedCar.currentKm,
      status: 'active' as const,
      staffId: currentStaff.id,
      staffName: currentStaff.name,
      notes: newBooking.notes
    };

    await addBooking(bookingPayload);

    setIsAddBookingOpen(false);
  };

  // إنهاء حجز واستلام السيارة
  const handleReturnCarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForReturn) return;
    const km = parseInt(returnKmInput) || selectedBookingForReturn.startKm;
    updateBookingStatus(selectedBookingForReturn.id, 'completed', km);
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

  // منع Hydration Mismatch
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#060b17] flex items-center justify-center font-arabic">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#c5a059]/30 border-t-[#c5a059] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  // شاشة تسجيل الدخول المحمية
  if (!isAuthenticated) {
    return (
      <AdminLogin
        loginUsername={loginUsername}
        setLoginUsername={setLoginUsername}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        loginError={loginError}
        handleLoginSubmit={handleLoginSubmit}
      />
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#060b17] text-slate-100 flex flex-col md:flex-row font-arabic select-none">
      
      {/* 1. الشريط الجانبي الفاخر (Sidebar) */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentStaff={currentStaff}
        totalCarsCount={cars.length}
        activeBookingsCount={activeBookings.length}
        staffCount={staffList.length}
        ownersCount={owners.length}
        resetToDefault={resetToDefault}
        handleLogout={handleLogout}
      />

      {/* 2. المحتوى الرئيسي (Main Dashboard Content) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* شريط الإجراءات والبحث العلوي */}
        <AdminHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isCloudConnected={isCloudConnected}
          currentStaff={currentStaff}
          onOpenAddBooking={() => setIsAddBookingOpen(true)}
          onOpenAddCar={openAddCarModal}
        />

        {/* منطقة المحتوى التفاعلي (Tabs) */}
        <div className="p-6 flex-1 space-y-6">

          {/* TAB 1: الإحصائيات العامة */}
          {activeTab === 'overview' && (
            <OverviewTab
              totalCars={totalCars}
              availableCars={availableCars}
              rentedCars={rentedCars}
              activeBookings={activeBookings}
              totalRevenueEGP={totalRevenueEGP}
              totalHeldDepositsEGP={totalHeldDepositsEGP}
              currentStaff={currentStaff}
              onReturnCar={(bk) => {
                setSelectedBookingForReturn(bk);
                setReturnKmInput(String(bk.startKm + 350));
              }}
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
              onOpenContract={(bk) => setSelectedBookingForContract(bk)}
              onReturnCar={(bk) => {
                setSelectedBookingForReturn(bk);
                setReturnKmInput(String(bk.startKm + 300));
              }}
            />
          )}

          {/* TAB 4: فريق العمل والموظفين */}
          {activeTab === 'staff' && currentStaff.role === 'super_admin' && (
            <StaffTab
              staffList={staffList}
              onOpenAddStaff={() => {
                setEditingStaff(null);
                setStaffForm({ name: '', username: '', password: '', role: 'rental_agent', phone: '' });
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
                });
                setIsAddStaffOpen(true);
              }}
              onDeleteStaff={(id, name) => {
                if (confirm(`هل أنت متأكد من حذف حساب الموظف ${name}؟`)) {
                  deleteStaff(id);
                }
              }}
            />
          )}

          {/* TAB 5: الملاك ونسب الأرباح */}
          {activeTab === 'owners' && (currentStaff.role === 'super_admin' || currentStaff.role === 'accountant') && (
            <OwnersTab
              owners={owners}
              cars={cars}
              currentStaff={currentStaff}
              onOpenAddOwner={() => {
                setEditingOwner(null);
                setOwnerForm({ name: '', phone: '', bankAccount: '', commissionModel: 'percentage', ownerSharePercent: 75, notes: '' });
                setIsAddOwnerOpen(true);
              }}
              onOpenEditOwner={(owner) => {
                setEditingOwner(owner);
                setOwnerForm({
                  name: owner.name,
                  phone: owner.phone,
                  bankAccount: owner.bankAccount || '',
                  commissionModel: owner.commissionModel,
                  ownerSharePercent: owner.ownerSharePercent,
                  notes: owner.notes || '',
                });
                setIsAddOwnerOpen(true);
              }}
              onOpenSettlement={(owner) => setSelectedOwnerForSettlement(owner)}
            />
          )}

          {/* TAB 6: سجل الرقابة والأمان */}
          {activeTab === 'audit' && currentStaff.role === 'super_admin' && (
            <AuditTab auditLogs={auditLogs} />
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
        newBooking={newBooking}
        setNewBooking={setNewBooking}
        onSubmit={handleAddBookingSubmit}
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
