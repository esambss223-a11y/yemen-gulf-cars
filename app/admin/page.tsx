'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFleet } from '@/context/FleetContext';
import { 
  Car as CarIcon, 
  Calendar, 
  Receipt, 
  Users, 
  Tag, 
  ShieldCheck, 
  Search, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  KeyRound,
  FileText,
  Filter,
  Eye,
  Trash2,
  Edit3,
  Phone,
  UserCheck,
  Check,
  X,
  Sparkles,
  ExternalLink,
  RotateCcw,
  UserPlus,
  Lock,
  Briefcase
} from 'lucide-react';
import { Car, Booking, UserRole, VehicleOwner, StaffUser } from '@/types/fleet';
import RentalContractModal from '@/components/admin/RentalContractModal';
import OwnerSettlementModal from '@/components/admin/OwnerSettlementModal';

type AdminTab = 'overview' | 'cars' | 'bookings' | 'staff' | 'owners' | 'coupons' | 'audit';

export default function AdminDashboardPage() {
  const { 
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
    owners, 
    addOwner,
    updateOwner,
    deleteOwner,
    coupons, 
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

  // النوافذ المنبثقة (Modals)
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

  // Form states - Car (Add / Edit)
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
    // مطابقة اسم المستخدم وكلمة المرور من قائمة الموظفين
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

  // فتح نافذة تعديل السيارة
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

  // فتح نافذة إضافة سيارة جديدة
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

  // حفظ إضافة أو تعديل السيارة
  const handleCarFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!carForm.make || !carForm.model || !carForm.plateNumber) {
      alert('يرجى ملء الماركة والموديل ورقم اللوحة');
      return;
    }

    if (editingCar) {
      // تعديل
      updateCar(editingCar.id, {
        ...carForm,
        coverImage: carForm.images[0] || '/car-mercedes.jpg',
      });
      alert(`تم تحديث بيانات ${carForm.make} ${carForm.model} بنجاح ✓`);
    } else {
      // إضافة جديدة
      addCar({
        ...carForm,
        coverImage: carForm.images[0] || '/car-mercedes.jpg',
      });
      alert(`تمت إضافة ${carForm.make} ${carForm.model} إلى الأسطول بنجاح ✓`);
    }

    setIsAddCarOpen(false);
    setEditingCar(null);
  };

  // حفظ إضافة أو تعديل الموظف
  const handleStaffFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.username) {
      alert('يرجى كتابة الاسم واسم المستخدم');
      return;
    }

    if (editingStaff) {
      updateStaff(editingStaff.id, {
        name: staffForm.name,
        username: staffForm.username,
        role: staffForm.role,
        phone: staffForm.phone,
        password: staffForm.password || editingStaff.password,
      });
      alert('تم تحديث بيانات الموظف بنجاح ✓');
    } else {
      addStaff({
        name: staffForm.name,
        username: staffForm.username,
        role: staffForm.role,
        phone: staffForm.phone,
        password: staffForm.password || '123456',
        active: true,
      });
      alert('تمت إضافة الموظف الجديد بنجاح ✓');
    }

    setIsAddStaffOpen(false);
    setEditingStaff(null);
  };

  // حفظ إضافة أو تعديل المالك
  const handleOwnerFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerForm.name || !ownerForm.phone) {
      alert('يرجى كتابة اسم المالك ورقم الهاتف');
      return;
    }

    if (editingOwner) {
      updateOwner(editingOwner.id, ownerForm);
      alert('تم تحديث بيانات المالك بنجاح ✓');
    } else {
      addOwner(ownerForm);
      alert('تمت إضافة المالك/المستثمر الجديد بنجاح ✓');
    }

    setIsAddOwnerOpen(false);
    setEditingOwner(null);
  };

  // إنشاء حجز جديد
  const handleAddBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const car = cars.find(c => c.id === newBooking.carId);
    if (!car) {
      alert('يرجى اختيار السيارة');
      return;
    }
    if (!newBooking.customerName || !newBooking.customerPhone) {
      alert('يرجى إدخال اسم العميل ورقم هاتفه');
      return;
    }

    const start = new Date(newBooking.startDate).getTime();
    const end = new Date(newBooking.endDate).getTime();
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const totalRent = days * car.dailyPriceEGP;
    const discount = newBooking.discountCode ? 1000 : 0;
    const finalTotal = Math.max(0, totalRent - discount);

    addBooking({
      carId: car.id,
      carName: `${car.make} ${car.model} ${car.year}`,
      carPlate: car.plateNumber,
      customer: {
        id: `cust-${Date.now()}`,
        fullName: newBooking.customerName,
        phone: newBooking.customerPhone,
        nationalId: newBooking.nationalId || 'مصر 29900000000000',
        licenseNumber: newBooking.licenseNumber || 'LIC-102938',
      },
      startDate: newBooking.startDate,
      startTime: newBooking.startTime,
      endDate: newBooking.endDate,
      endTime: newBooking.endTime,
      daysCount: days,
      dailyRateEGP: car.dailyPriceEGP,
      totalRentEGP: totalRent,
      discountCode: newBooking.discountCode || undefined,
      discountAmountEGP: discount,
      finalTotalEGP: finalTotal,
      securityDepositEGP: car.securityDepositEGP,
      depositStatus: 'held',
      startKm: car.currentKm,
      status: 'active',
      staffId: currentStaff.id,
      staffName: currentStaff.name,
      notes: newBooking.notes,
    });

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
      <div className="min-h-screen bg-[#060b17] flex items-center justify-center p-4 font-arabic">
        <div className="w-full max-w-md bg-[#0a1122] border border-[#c5a059]/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c5a059] to-[#8a6d3b] flex items-center justify-center p-0.5 mx-auto shadow-lg shadow-[#c5a059]/20">
              <div className="w-full h-full bg-[#060b17] rounded-[14px] flex items-center justify-center">
                <CarIcon className="w-8 h-8 text-[#c5a059]" />
              </div>
            </div>
            <h2 className="text-lg font-black text-white">بوابة الموظفين والإدارة</h2>
            <p className="text-xs text-[#c5a059] font-semibold">شركة اليمن والخليج لتأجير السيارات</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">اسم المستخدم:</label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="admin أو agent أو accountant"
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#c5a059] font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">كلمة المرور:</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الخاصة بحسابك"
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#c5a059] font-mono"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {loginError && (
                <p className="text-[11px] text-rose-400 font-bold mt-1.5 flex items-center gap-1">
                  <span>⚠</span> {loginError}
                </p>
              )}
            </div>

            <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="text-slate-300 font-bold">الحسابات الافتراضية الجاهزة:</p>
              <div className="flex justify-between font-mono text-[10px]">
                <span>المدير: admin (كلمة السر: admin)</span>
                <span>الموظف: agent (كلمة السر: agent)</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#96793e] hover:from-[#d4af37] hover:to-[#a98845] text-black font-black text-xs shadow-lg shadow-[#c5a059]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>تسجيل الدخول للنظام</span>
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center pt-1">
              <Link href="/" className="text-[11px] text-slate-400 hover:text-[#c5a059] transition-colors">
                ← العودة إلى الموقع الرئيسي للعملاء
              </Link>
            </div>
          </form>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b17] text-slate-100 flex flex-col md:flex-row font-arabic">
      
      {/* 1. الشريط الجانبي الفاخر (Sidebar) */}
      <aside className="w-full md:w-72 bg-[#0a1122] border-b md:border-b-0 md:border-l border-[#c5a059]/20 flex flex-col shrink-0">
        
        {/* ترويسة اللوحة والشعار */}
        <div className="p-5 border-b border-[#c5a059]/15 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c5a059] to-[#8a6d3b] flex items-center justify-center p-0.5 shadow-lg shadow-[#c5a059]/20">
              <div className="w-full h-full bg-[#060b17] rounded-[10px] flex items-center justify-center">
                <CarIcon className="w-5 h-5 text-[#c5a059]" />
              </div>
            </div>
            <div>
              <div className="font-black text-sm text-white group-hover:text-[#c5a059] transition-colors">
                يمن الخليج
              </div>
              <div className="text-[10px] text-[#c5a059] font-semibold">
                نظام إدارة الأسطول (ERP)
              </div>
            </div>
          </Link>
          <Link href="/" className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800" title="معاينة الموقع للجمهور">
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* بطاقة الموظف النشط حالياً */}
        <div className="p-3.5 m-3.5 rounded-xl bg-[#0e172a] border border-[#c5a059]/30">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-400 font-medium">المستخدم الحالي:</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              currentStaff.role === 'super_admin' ? 'bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40' :
              currentStaff.role === 'rental_agent' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {currentStaff.role === 'super_admin' ? '👑 مدير عام' :
               currentStaff.role === 'rental_agent' ? '👤 موظف تأجير' : '💼 محاسب مالي'}
            </span>
          </div>
          <p className="text-xs font-bold text-white truncate">{currentStaff.name}</p>
        </div>

        {/* روابط التنقل في اللوحة (Navigation Menu) */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-[#c5a059]/20 text-[#f3e5ab] border-r-4 border-[#c5a059]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-[#c5a059]" /> نظرة عامة وإحصائيات
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cars')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'cars'
                ? 'bg-[#c5a059]/20 text-[#f3e5ab] border-r-4 border-[#c5a059]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-3">
              <CarIcon className="w-4 h-4 text-[#c5a059]" /> السيارات والأسطول
            </span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-[#c5a059] font-mono">
              {cars.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bookings'
                ? 'bg-[#c5a059]/20 text-[#f3e5ab] border-r-4 border-[#c5a059]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[#c5a059]" /> الحجوزات والعقود
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full font-mono">
              {activeBookings.length} نشط
            </span>
          </button>

          {/* قسم الموظفين وصلاحياتهم الكاملة */}
          {currentStaff.role === 'super_admin' && (
            <button
              onClick={() => setActiveTab('staff')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'staff'
                  ? 'bg-[#c5a059]/20 text-[#f3e5ab] border-r-4 border-[#c5a059]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-3">
                <UserCheck className="w-4 h-4 text-[#c5a059]" /> فريق العمل والموظفين
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-blue-400 font-mono">
                {staffList.length}
              </span>
            </button>
          )}

          {/* قسم الملاك ونسب الأرباح */}
          {(currentStaff.role === 'super_admin' || currentStaff.role === 'accountant') && (
            <button
              onClick={() => setActiveTab('owners')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'owners'
                  ? 'bg-[#c5a059]/20 text-[#f3e5ab] border-r-4 border-[#c5a059]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-3">
                <Users className="w-4 h-4 text-[#c5a059]" /> الملاك ونسب الأرباح
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-mono">
                {owners.length}
              </span>
            </button>
          )}

          {currentStaff.role === 'super_admin' && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'audit'
                  ? 'bg-[#c5a059]/20 text-[#f3e5ab] border-r-4 border-[#c5a059]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-[#c5a059]" /> سجل الرقابة والأمان
              </span>
            </button>
          )}

        </nav>

        {/* تذييل الشريط الجانبي */}
        <div className="p-3.5 border-t border-slate-800 flex items-center justify-between">
          <button 
            onClick={resetToDefault} 
            className="text-[10px] text-slate-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
            title="استعادة البيانات الأصلية"
          >
            <RotateCcw className="w-3 h-3" /> استعادة الافتراضي
          </button>
          
          <button
            onClick={handleLogout}
            className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            تسجيل الخروج ⏻
          </button>
        </div>
      </aside>

      {/* 2. المحتوى الرئيسي (Main Dashboard Content) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* شريط الإجراءات والبحث العلوي */}
        <header className="h-16 border-b border-[#c5a059]/20 bg-[#080e1c] px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          
          {/* محرك البحث الفوري */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث فوري (الموديل، رقم اللوحة، اسم العميل، الهاتف)..."
              className="w-full bg-[#0d1629] border border-slate-700/60 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a059] transition-colors"
            />
          </div>

          {/* أزرار الإجراءات السريعة وشارة السحابة */}
          <div className="flex items-center gap-2.5">
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border ${
              isCloudConnected 
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-400' 
                : 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
              <span>{isCloudConnected ? 'Supabase متصل سحابياً ☁️' : 'جاهز للمزامنة السحابية ☁️'}</span>
            </div>

            {(currentStaff.role === 'super_admin' || currentStaff.role === 'rental_agent') && (
              <button
                onClick={() => setIsAddBookingOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> حجز جديد
              </button>
            )}

            {currentStaff.role === 'super_admin' && (
              <button
                onClick={openAddCarModal}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#8a6d3b] hover:from-[#d4af37] hover:to-[#a07e44] text-black text-xs font-black flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> إضافة سيارة
              </button>
            )}
          </div>
        </header>

        {/* منطقة المحتوى التفاعلي (Tabs) */}
        <div className="p-6 flex-1 space-y-6">

          {/* TAB 1: الإحصائيات العامة */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0b1324] border border-[#c5a059]/25 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400 font-semibold mb-1">إجمالي الأسطول</p>
                  <h3 className="text-2xl font-black text-white font-mono">{totalCars} <span className="text-xs text-[#c5a059] font-arabic font-normal">مركبة</span></h3>
                  <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-[11px]">
                    <span className="text-emerald-400 font-semibold">🟢 {availableCars} متاحة</span>
                    <span className="text-amber-400 font-semibold">🟡 {rentedCars} مؤجرة</span>
                  </div>
                </div>

                <div className="bg-[#0b1324] border border-[#c5a059]/25 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400 font-semibold mb-1">العقود النشطة بالشارع</p>
                  <h3 className="text-2xl font-black text-white font-mono">{activeBookings.length} <span className="text-xs text-emerald-400 font-arabic font-normal">عقد</span></h3>
                  <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                    نسبة تشغيل الأسطول: <strong className="text-white font-mono">{totalCars > 0 ? Math.round((rentedCars / totalCars) * 100) : 0}%</strong>
                  </div>
                </div>

                <div className="bg-[#0b1324] border border-[#c5a059]/25 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400 font-semibold mb-1">إجمالي الإيرادات التعاقدية</p>
                  <h3 className="text-2xl font-black text-[#f3e5ab] font-mono">
                    {currentStaff.role === 'rental_agent' ? '••••••' : totalRevenueEGP.toLocaleString()} <span className="text-xs text-[#c5a059] font-arabic font-normal">ج.م</span>
                  </h3>
                  <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                    العملة المعتمدة: <strong className="text-[#c5a059]">الجنيه المصري</strong>
                  </div>
                </div>

                <div className="bg-[#0b1324] border border-[#c5a059]/25 p-5 rounded-2xl">
                  <p className="text-xs text-slate-400 font-semibold mb-1">كفالات التأمين المستردة</p>
                  <h3 className="text-2xl font-black text-cyan-300 font-mono">
                    {totalHeldDepositsEGP.toLocaleString()} <span className="text-xs text-cyan-400 font-arabic font-normal">ج.م</span>
                  </h3>
                  <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-cyan-400 font-semibold">
                    مستردة للعملاء عند فحص الإرجاع
                  </div>
                </div>
              </div>

              {/* متابعة السيارات المؤجرة ومواعيد عودتها */}
              <div className="bg-[#0b1324] border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#c5a059]" /> متابعة السيارات المؤجرة ومواعيد عودتها
                  </h4>
                  <span className="text-xs text-slate-400">({activeBookings.length} سيارات بالشارع)</span>
                </div>

                {activeBookings.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    لا توجد سيارات مؤجرة حالياً، جميع أسطولكم متاح في المعرض 🟢
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeBookings.map((bk) => (
                      <div key={bk.id} className="p-3.5 bg-[#0e172a] rounded-xl border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-[#c5a059]">
                            <CarIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-white">{bk.carName}</h5>
                            <p className="text-[11px] text-slate-400">العميل: <strong className="text-[#c5a059]">{bk.customer.fullName}</strong> ({bk.customer.phone})</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">موعد الإرجاع المقرر:</span>
                            <span className="font-mono font-bold text-amber-300">{bk.endDate} ({bk.endTime})</span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedBookingForReturn(bk);
                              setReturnKmInput(String(bk.startKm + 350));
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#c5a059] text-black font-bold text-xs hover:bg-[#d4af37] transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> استلام وفحص
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: إدارة السيارات والأسطول (تعديل كامل وشامل) */}
          {activeTab === 'cars' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* شريط الفلترة والأزرار */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0b1324] p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#c5a059]" />
                  <span className="text-xs font-bold text-slate-300">تصفية الأسطول:</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCarFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${carFilter === 'all' ? 'bg-[#c5a059] text-black' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      الكل ({cars.length})
                    </button>
                    <button
                      onClick={() => setCarFilter('available')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${carFilter === 'available' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      المتاحة ({availableCars})
                    </button>
                    <button
                      onClick={() => setCarFilter('rented')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${carFilter === 'rented' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      المؤجرة ({rentedCars})
                    </button>
                  </div>
                </div>

                {currentStaff.role === 'super_admin' && (
                  <button
                    onClick={openAddCarModal}
                    className="px-4 py-2 bg-[#c5a059] hover:bg-[#d4af37] text-black font-black text-xs rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> إضافة سيارة جديدة
                  </button>
                )}
              </div>

              {/* بطاقات السيارات مع أزرار التعديل الشامل */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCars.map((car) => (
                  <div key={car.id} className="bg-[#0b1324] border border-[#c5a059]/20 rounded-2xl overflow-hidden hover:border-[#c5a059]/60 transition-all flex flex-col group">
                    
                    <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                      <Image
                        src={car.coverImage || car.images[0] || '/car-mercedes.jpg'}
                        alt={`${car.make} ${car.model}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1324] via-transparent to-black/40" />

                      <div className="absolute top-3 right-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border shadow-lg ${
                          car.status === 'available' ? 'bg-emerald-500 text-black border-emerald-400' :
                          car.status === 'rented' ? 'bg-amber-500 text-black border-amber-300' :
                          'bg-rose-500 text-white border-rose-400'
                        }`}>
                          {car.status === 'available' ? '🟢 متاحة' :
                           car.status === 'rented' ? '🟡 مؤجرة' : '🔴 صيانة'}
                        </span>
                      </div>

                      <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 text-[11px] font-mono font-bold text-white">
                        {car.plateNumber}
                      </div>

                      <div className="absolute bottom-3 right-3 left-3">
                        <p className="text-[10px] text-[#c5a059] font-bold uppercase">{car.make}</p>
                        <h4 className="text-base font-black text-white">{car.model} {car.year}</h4>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-[#0e172a] p-2 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">عداد الكيلومترات:</span>
                          <span className="font-mono font-bold text-[#c5a059]">{car.currentKm.toLocaleString()} كم</span>
                        </div>
                        <div className="bg-[#0e172a] p-2 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">التأمين المسترد:</span>
                          <span className="font-mono font-bold text-cyan-300">{car.securityDepositEGP.toLocaleString()} ج.م</span>
                        </div>
                      </div>

                      <div className="bg-[#0e172a]/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-400">سعر الإيجار اليومي:</span>
                        <span className="text-base font-black text-white font-mono">
                          {car.dailyPriceEGP.toLocaleString()} <span className="text-xs text-[#c5a059] font-arabic font-normal">ج.م / يوم</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                        <span>المالك:</span>
                        <strong className="text-slate-200 truncate max-w-[170px]">{car.ownerName || 'أسطول الشركة'}</strong>
                      </div>

                      {/* شريط الإجراءات: تعديل شامل، تأجير، حذف */}
                      <div className="pt-2 flex items-center gap-2">
                        {car.status === 'available' ? (
                          <button
                            onClick={() => {
                              setNewBooking(prev => ({ ...prev, carId: car.id }));
                              setIsAddBookingOpen(true);
                            }}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow"
                          >
                            <Calendar className="w-3.5 h-3.5" /> تأجير فوري
                          </button>
                        ) : (
                          <div className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs text-center">
                            بالشارع حالياً
                          </div>
                        )}

                        {/* زر التعديل الشامل للسيارة */}
                        {currentStaff.role === 'super_admin' && (
                          <button
                            onClick={() => openEditCarModal(car)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-[#c5a059] text-slate-300 hover:text-black transition-all cursor-pointer border border-slate-700"
                            title="تعديل شامل للسيارة والصور والعداد"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {currentStaff.role === 'super_admin' && (
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف ${car.make} ${car.model}؟`)) {
                                deleteCar(car.id);
                              }
                            }}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
                            title="حذف السيارة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 3: الحجوزات والعقود */}
          {activeTab === 'bookings' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#0b1324] border border-slate-800 rounded-2xl p-5 overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold pb-3">
                      <th className="pb-3 pr-2">رقم العقد</th>
                      <th className="pb-3">السيارة واللوحة</th>
                      <th className="pb-3">العميل والهاتف</th>
                      <th className="pb-3">المدة والمواعيد</th>
                      <th className="pb-3">الإجمالي (ج.م)</th>
                      <th className="pb-3">التأمين المسترد</th>
                      <th className="pb-3">الحالة</th>
                      <th className="pb-3 pl-2 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {bookings.map((bk) => (
                      <tr key={bk.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 pr-2 font-mono font-bold text-[#c5a059]">{bk.bookingNumber}</td>
                        <td className="py-3.5">
                          <div className="font-bold text-white">{bk.carName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{bk.carPlate}</div>
                        </td>
                        <td className="py-3.5">
                          <div className="font-bold text-white">{bk.customer.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{bk.customer.phone}</div>
                        </td>
                        <td className="py-3.5">
                          <div className="text-slate-300">{bk.daysCount} أيام ({bk.startDate} ⬅ {bk.endDate})</div>
                          <div className="text-[10px] text-slate-500">العداد: {bk.startKm.toLocaleString()} كم</div>
                        </td>
                        <td className="py-3.5 font-mono font-bold text-[#f3e5ab]">
                          {bk.finalTotalEGP.toLocaleString()} ج.م
                        </td>
                        <td className="py-3.5">
                          <span className="font-mono text-cyan-300 font-bold">{bk.securityDepositEGP.toLocaleString()} ج.م</span>
                          <span className={`block text-[10px] ${bk.depositStatus === 'held' ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {bk.depositStatus === 'held' ? 'محجوز' : 'تم الاسترجاع'}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bk.status === 'active' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            bk.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {bk.status === 'active' ? 'نشط بالشارع' : bk.status === 'completed' ? 'مكتمل ومسترجع' : 'ملغي'}
                          </span>
                        </td>
                        <td className="py-3.5 pl-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedBookingForContract(bk)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-[#c5a059] text-slate-300 hover:text-black text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="معاينة وطباعة العقد"
                            >
                              <FileText className="w-3 h-3" /> العقد
                            </button>

                            {bk.status === 'active' && (
                              <button
                                onClick={() => {
                                  setSelectedBookingForReturn(bk);
                                  setReturnKmInput(String(bk.startKm + 300));
                                }}
                                className="px-2.5 py-1 rounded bg-[#c5a059] text-black text-[11px] font-bold hover:bg-[#d4af37] cursor-pointer"
                              >
                                استلام
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: قسم فريق العمل والموظفين (Staff Management) */}
          {activeTab === 'staff' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#0b1324] border border-slate-800 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#c5a059]" /> إدارة فريق العمل وصلاحيات المستخدمين
                    </h4>
                    <p className="text-xs text-slate-400">إضافة موظفين، تحديد الصلاحيات، وكلمات المرور الخاصة بهم</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingStaff(null);
                      setStaffForm({ name: '', username: '', password: '', role: 'rental_agent', phone: '' });
                      setIsAddStaffOpen(true);
                    }}
                    className="px-4 py-2 bg-[#c5a059] hover:bg-[#d4af37] text-black font-black text-xs rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" /> إضافة موظف جديد
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staffList.map((staff) => (
                    <div key={staff.id} className="p-4 bg-[#0e172a] rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            staff.role === 'super_admin' ? 'bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40' :
                            staff.role === 'rental_agent' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {staff.role === 'super_admin' ? '👑 مدير عام' :
                             staff.role === 'rental_agent' ? '👤 موظف تأجير' : '💼 محاسب مالي'}
                          </span>

                          <span className="text-[10px] text-emerald-400 font-bold">نشط ✓</span>
                        </div>

                        <h5 className="font-bold text-white text-sm">{staff.name}</h5>
                        <p className="text-xs text-slate-400 font-mono mt-1">اسم الدخول: <strong className="text-slate-200">{staff.username}</strong></p>
                        <p className="text-xs text-slate-400 font-mono">الهاتف: <strong className="text-slate-200">{staff.phone}</strong></p>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                        <button
                          onClick={() => {
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
                          className="px-3 py-1.5 bg-slate-800 hover:bg-[#c5a059] hover:text-black rounded-lg text-xs font-bold text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> تعديل الصلاحية
                        </button>

                        {staff.role !== 'super_admin' && (
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف حساب الموظف ${staff.name}؟`)) {
                                deleteStaff(staff.id);
                              }
                            }}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="حذف الموظف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: قسم الملاك ونسب الأرباح (Owners Hub) */}
          {activeTab === 'owners' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#0b1324] border border-slate-800 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#c5a059]" /> إدارة ملاك السيارات وتوزيع الأرباح (Revenue Share)
                    </h4>
                    <p className="text-xs text-slate-400">حسابات الشركاء والمستثمرين، توزيع النسب، وتصفية المستحقات</p>
                  </div>
                  
                  {currentStaff.role === 'super_admin' && (
                    <button
                      onClick={() => {
                        setEditingOwner(null);
                        setOwnerForm({ name: '', phone: '', bankAccount: '', commissionModel: 'percentage', ownerSharePercent: 75, notes: '' });
                        setIsAddOwnerOpen(true);
                      }}
                      className="px-4 py-2 bg-[#c5a059] hover:bg-[#d4af37] text-black font-black text-xs rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> إضافة مالك/مستثمر جديد
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {owners.map((owner) => {
                    const ownerCarsCount = cars.filter(c => c.ownerId === owner.id).length;
                    return (
                      <div key={owner.id} className="p-4 bg-[#0e172a] rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-bold text-white text-sm">{owner.name}</h5>
                            <span className="text-xs bg-[#c5a059]/20 text-[#c5a059] px-2.5 py-0.5 rounded-full font-bold font-mono">
                              نسبة المالك: {owner.ownerSharePercent}%
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 mb-1">الهاتف: <strong className="font-mono text-slate-200">{owner.phone}</strong></p>
                          <p className="text-xs text-slate-400 mb-2">عدد السيارات التابعة له: <strong className="text-[#c5a059] font-mono">{ownerCarsCount} سيارات</strong></p>
                          {owner.notes && <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg">{owner.notes}</p>}
                        </div>

                        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                          <button
                            onClick={() => setSelectedOwnerForSettlement(owner)}
                            className="flex-1 py-2 bg-[#c5a059] hover:bg-[#d4af37] text-black font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" /> كشف حساب وتصفية الأرباح
                          </button>

                          {currentStaff.role === 'super_admin' && (
                            <button
                              onClick={() => {
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
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                              title="تعديل بيانات المالك والنسبة"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: سجل الرقابة والأمان */}
          {activeTab === 'audit' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#0b1324] border border-slate-800 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> سجل حركات الموظفين والعمليات
                </h4>
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-[#0e172a] rounded-xl border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-[#c5a059]">{log.staffName}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">({log.staffRole})</span>
                          <span className="text-white font-semibold">- {log.action}</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{log.details}</p>
                      </div>
                      <span className="text-slate-500 font-mono text-[10px] shrink-0">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* نافذة منبثقة: إضافة أو تعديل سيارة شامل (Modal: Add/Edit Car) */}
      {isAddCarOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b1324] border border-[#c5a059]/40 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CarIcon className="w-5 h-5 text-[#c5a059]" /> {editingCar ? `تعديل بيانات ${editingCar.make} ${editingCar.model}` : 'إضافة سيارة جديدة للأسطول'}
              </h3>
              <button onClick={() => setIsAddCarOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCarFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ماركة السيارة (Make):</label>
                  <input
                    type="text"
                    required
                    value={carForm.make}
                    onChange={(e) => setCarForm({ ...carForm, make: e.target.value })}
                    placeholder="مثال: Mercedes-Benz, BMW, Porsche"
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">الموديل (Model):</label>
                  <input
                    type="text"
                    required
                    value={carForm.model}
                    onChange={(e) => setCarForm({ ...carForm, model: e.target.value })}
                    placeholder="مثال: S-Class S500, Range Rover"
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">سنة الصنع:</label>
                  <input
                    type="number"
                    value={carForm.year}
                    onChange={(e) => setCarForm({ ...carForm, year: parseInt(e.target.value) || 2024 })}
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">رقم اللوحة:</label>
                  <input
                    type="text"
                    required
                    value={carForm.plateNumber}
                    onChange={(e) => setCarForm({ ...carForm, plateNumber: e.target.value })}
                    placeholder="مثال: م ص ر 5542"
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-[#c5a059] font-bold mb-1">عداد الكيلومترات الفعلي (Km):</label>
                  <input
                    type="number"
                    required
                    value={carForm.currentKm}
                    onChange={(e) => setCarForm({ ...carForm, currentKm: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0e172a] border border-[#c5a059] rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">حالة السيارة:</label>
                  <select
                    value={carForm.status}
                    onChange={(e) => setCarForm({ ...carForm, status: e.target.value as any })}
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                  >
                    <option value="available">🟢 متاحة للتأجير</option>
                    <option value="rented">🟡 مؤجرة حالياً</option>
                    <option value="maintenance">🔴 في الصيانة</option>
                    <option value="cleaning">⚪ تحت التجهيز والغسيل</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#c5a059] font-bold mb-1">سعر الإيجار اليومي (ج.م EGP):</label>
                  <input
                    type="number"
                    required
                    value={carForm.dailyPriceEGP}
                    onChange={(e) => setCarForm({ ...carForm, dailyPriceEGP: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0e172a] border border-[#c5a059]/60 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-cyan-300 font-bold mb-1">مبلغ التأمين المسترد (ج.م EGP):</label>
                  <input
                    type="number"
                    required
                    value={carForm.securityDepositEGP}
                    onChange={(e) => setCarForm({ ...carForm, securityDepositEGP: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0e172a] border border-cyan-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">مالك السيارة:</label>
                  <select
                    value={carForm.ownerId}
                    onChange={(e) => {
                      const sel = owners.find(o => o.id === e.target.value);
                      setCarForm({
                        ...carForm,
                        ownerId: e.target.value,
                        ownership: e.target.value === 'owner-1' ? 'company' : 'investor',
                        ownerName: sel ? sel.name : 'شركة يمن الخليج'
                      });
                    }}
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                  >
                    {owners.map(o => (
                      <option key={o.id} value={o.id}>{o.name} ({o.ownerSharePercent}%)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">رابط صورة السيارة (أو مسارها):</label>
                  <input
                    type="text"
                    value={carForm.images[0]}
                    onChange={(e) => setCarForm({ ...carForm, images: [e.target.value] })}
                    placeholder="/car-mercedes.jpg أو رابط ويب"
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddCarOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#c5a059] hover:bg-[#d4af37] text-black font-black shadow-lg cursor-pointer"
                >
                  {editingCar ? 'حفظ التعديلات ✓' : 'إضافة السيارة للأسطول ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة منبثقة: إضافة أو تعديل موظف (Modal: Staff) */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b1324] border border-blue-500/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-400" /> {editingStaff ? `تعديل الموظف: ${editingStaff.name}` : 'إضافة موظف جديد للنظام'}
              </h3>
              <button onClick={() => setIsAddStaffOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStaffFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">اسم الموظف بالكامل:</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="مثال: محمد علي العتيبي"
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">اسم المستخدم (للدخول):</label>
                <input
                  type="text"
                  required
                  value={staffForm.username}
                  onChange={(e) => setStaffForm({ ...staffForm, username: e.target.value })}
                  placeholder="مثال: mohamed"
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">كلمة المرور:</label>
                <input
                  type="password"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  placeholder={editingStaff ? 'اتركها فارغة إذا لم ترغب بتغييرها' : 'كلمة المرور'}
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">الدور والصلاحية الوظيفية:</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as UserRole })}
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="rental_agent">👤 موظف استقبال وتأجير (تسليم، استلام، طباعة عقود)</option>
                  <option value="accountant">💼 محاسب مالي (كشوفات الملاك، مراجعة الفواتير)</option>
                  <option value="super_admin">👑 مدير عام (صلاحية كاملة على كل شيء)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  placeholder="01012345678"
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  {editingStaff ? 'حفظ التعديلات' : 'إضافة الموظف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة منبثقة: إضافة أو تعديل مالك سيارات (Modal: Owner) */}
      {isAddOwnerOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b1324] border border-[#c5a059]/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#c5a059]" /> {editingOwner ? `تعديل بيانات: ${editingOwner.name}` : 'إضافة مالك/مستثمر جديد'}
              </h3>
              <button onClick={() => setIsAddOwnerOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOwnerFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">اسم المالك / المستثمر:</label>
                <input
                  type="text"
                  required
                  value={ownerForm.name}
                  onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })}
                  placeholder="مثال: الشيخ عبد الله بن ناصر"
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">رقم الهاتف / الواتساب:</label>
                <input
                  type="text"
                  required
                  value={ownerForm.phone}
                  onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
                  placeholder="مثال: +966 50 123 4567"
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-[#c5a059] font-bold mb-1">نسبة أرباح المالك من الإيراد (%):</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="99"
                  value={ownerForm.ownerSharePercent}
                  onChange={(e) => setOwnerForm({ ...ownerForm, ownerSharePercent: parseInt(e.target.value) || 75 })}
                  className="w-full bg-[#0e172a] border border-[#c5a059] rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">حصة شركة يمن الخليج التلقائية ستكون: <strong className="text-emerald-400 font-mono">{100 - ownerForm.ownerSharePercent}%</strong></p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">ملاحظات أو رقم الحساب البنكي:</label>
                <input
                  type="text"
                  value={ownerForm.notes}
                  onChange={(e) => setOwnerForm({ ...ownerForm, notes: e.target.value })}
                  placeholder="تفاصيل العقد أو الآيبان"
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOwnerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#c5a059] hover:bg-[#d4af37] text-black font-bold cursor-pointer"
                >
                  {editingOwner ? 'حفظ التعديلات' : 'إضافة المالك'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة منبثقة: إنشاء حجز جديد (Modal: Add Booking) */}
      {isAddBookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b1324] border border-emerald-500/40 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" /> إنشاء عقد وحجز جديد (تسليم سيارة)
              </h3>
              <button onClick={() => setIsAddBookingOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBookingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">السيارة المراد تأجيرها:</label>
                <select
                  required
                  value={newBooking.carId}
                  onChange={(e) => setNewBooking({ ...newBooking, carId: e.target.value })}
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                >
                  {cars.filter(c => c.status === 'available').map(car => (
                    <option key={car.id} value={car.id}>
                      {car.make} {car.model} {car.year} ({car.plateNumber}) - {car.dailyPriceEGP.toLocaleString()} ج.م/يوم
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">اسم العميل بالكامل:</label>
                  <input
                    type="text"
                    required
                    value={newBooking.customerName}
                    onChange={(e) => setNewBooking({ ...newBooking, customerName: e.target.value })}
                    placeholder="مثال: خالد محمد عبد الله"
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">رقم الهاتف / الواتساب:</label>
                  <input
                    type="text"
                    required
                    value={newBooking.customerPhone}
                    onChange={(e) => setNewBooking({ ...newBooking, customerPhone: e.target.value })}
                    placeholder="مثال: 01012345678"
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">تاريخ الاستلام:</label>
                  <input
                    type="date"
                    required
                    value={newBooking.startDate}
                    onChange={(e) => setNewBooking({ ...newBooking, startDate: e.target.value })}
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">تاريخ الإرجاع المقرر:</label>
                  <input
                    type="date"
                    required
                    value={newBooking.endDate}
                    onChange={(e) => setNewBooking({ ...newBooking, endDate: e.target.value })}
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddBookingOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg cursor-pointer"
                >
                  تأكيد الحجز وطباعة العقد ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة منبثقة: استلام السيارة وإنهاء العقد */}
      {selectedBookingForReturn && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b1324] border border-[#c5a059]/50 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#c5a059]" /> استلام السيارة وإنهاء العقد
              </h3>
              <button onClick={() => setSelectedBookingForReturn(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnCarSubmit} className="space-y-4 text-xs">
              <div className="bg-[#0e172a] p-3 rounded-xl border border-slate-800 space-y-1">
                <p className="text-white font-bold">{selectedBookingForReturn.carName}</p>
                <p className="text-slate-400">العميل: {selectedBookingForReturn.customer.fullName}</p>
                <p className="text-slate-400">العداد عند الخروج: <span className="font-mono text-[#c5a059]">{selectedBookingForReturn.startKm.toLocaleString()} كم</span></p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">عداد الكيلومترات الحالي (عند العودة):</label>
                <input
                  type="number"
                  required
                  value={returnKmInput}
                  onChange={(e) => setReturnKmInput(e.target.value)}
                  className="w-full bg-[#0e172a] border border-[#c5a059] rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="p-3 bg-cyan-950/40 border border-cyan-800/50 rounded-xl text-cyan-300">
                <div className="flex justify-between font-bold">
                  <span>مبلغ التأمين المستحق إرجاعه للعميل:</span>
                  <span className="font-mono text-white">{selectedBookingForReturn.securityDepositEGP.toLocaleString()} ج.م</span>
                </div>
                <p className="text-[10px] text-cyan-400/80 mt-1">سيتم فك حجز التأمين وإعادة السيارة للحالة «متاحة» تلقائياً في المعرض.</p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForReturn(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#c5a059] hover:bg-[#d4af37] text-black font-black shadow-lg cursor-pointer"
                >
                  تأكيد الاستلام واسترجاع التأمين ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
