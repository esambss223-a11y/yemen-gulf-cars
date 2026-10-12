'use client';

import React, { useState } from 'react';
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
  RotateCcw
} from 'lucide-react';
import { Car, Booking, UserRole, VehicleOwner } from '@/types/fleet';
import RentalContractModal from '@/components/admin/RentalContractModal';
import OwnerSettlementModal from '@/components/admin/OwnerSettlementModal';

type AdminTab = 'overview' | 'cars' | 'bookings' | 'invoices' | 'owners' | 'coupons' | 'audit';

export default function AdminDashboardPage() {
  const { 
    currentStaff, 
    switchStaffRole, 
    cars, 
    addCar, 
    updateCar, 
    deleteCar, 
    bookings, 
    addBooking, 
    updateBookingStatus, 
    invoices, 
    owners, 
    coupons, 
    auditLogs, 
    resetToDefault 
  } = useFleet();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [carFilter, setCarFilter] = useState<'all' | 'available' | 'rented' | 'maintenance'>('all');
  
  // Modals state
  const [isAddCarOpen, setIsAddCarOpen] = useState(false);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [selectedBookingForReturn, setSelectedBookingForReturn] = useState<Booking | null>(null);
  const [selectedBookingForContract, setSelectedBookingForContract] = useState<Booking | null>(null);
  const [selectedOwnerForSettlement, setSelectedOwnerForSettlement] = useState<VehicleOwner | null>(null);
  const [returnKmInput, setReturnKmInput] = useState('');

  // Form states - Add Car
  const [newCar, setNewCar] = useState({
    make: '',
    model: '',
    year: 2024,
    category: 'vip' as Car['category'],
    plateNumber: '',
    color: 'أسود ملكي',
    currentKm: 0,
    dailyPriceEGP: 5000,
    securityDepositEGP: 10000,
    status: 'available' as Car['status'],
    images: ['/car-mercedes.jpg'],
    transmission: 'automatic' as const,
    fuelType: 'petrol' as const,
    seats: 5,
    ownership: 'company' as const,
    ownerName: 'شركة يمن الخليج',
    features: ['مكيف فائق', 'شاشات لمس', 'مقاعد جلد فاخرة']
  });

  // Form states - Add Booking
  const [newBooking, setNewBooking] = useState({
    carId: cars[0]?.id || '',
    customerName: '',
    customerPhone: '',
    nationalId: '',
    licenseNumber: '',
    startDate: '2026-10-12',
    startTime: '14:00',
    endDate: '2026-10-15',
    endTime: '14:00',
    discountCode: '',
    notes: '',
  });

  // Calculate Metrics
  const totalCars = cars.length;
  const availableCars = cars.filter(c => c.status === 'available').length;
  const rentedCars = cars.filter(c => c.status === 'rented').length;
  const maintenanceCars = cars.filter(c => c.status === 'maintenance').length;
  const totalRevenueEGP = bookings.reduce((sum, b) => sum + b.finalTotalEGP, 0);
  const totalHeldDepositsEGP = bookings.filter(b => b.depositStatus === 'held').reduce((sum, b) => sum + b.securityDepositEGP, 0);

  // Return upcoming or overdue bookings
  const activeBookings = bookings.filter(b => b.status === 'active');

  // Handle Add Car Submit
  const handleAddCarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCar.make || !newCar.model || !newCar.plateNumber) {
      alert('يرجى ملء الحقول الأساسية: الماركة، الموديل، ورقم اللوحة');
      return;
    }
    addCar({
      ...newCar,
      coverImage: newCar.images[0] || '/car-mercedes.jpg',
    });
    setIsAddCarOpen(false);
    setNewCar({
      make: '',
      model: '',
      year: 2024,
      category: 'vip',
      plateNumber: '',
      color: 'أسود ملكي',
      currentKm: 0,
      dailyPriceEGP: 5000,
      securityDepositEGP: 10000,
      status: 'available',
      images: ['/car-mercedes.jpg'],
      transmission: 'automatic',
      fuelType: 'petrol',
      seats: 5,
      ownership: 'company',
      ownerName: 'شركة يمن الخليج',
      features: ['مكيف فائق', 'شاشات لمس']
    });
  };

  // Handle Add Booking Submit
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
    const discount = newBooking.discountCode ? 1000 : 0; // خصم تجريبي
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

  // Handle Return Car Submit
  const handleReturnCarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForReturn) return;
    const km = parseInt(returnKmInput) || selectedBookingForReturn.startKm;
    updateBookingStatus(selectedBookingForReturn.id, 'completed', km);
    setSelectedBookingForReturn(null);
    setReturnKmInput('');
  };

  // Filtered cars
  const filteredCars = cars.filter(car => {
    const matchesSearch = 
      car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.plateNumber.includes(searchQuery);
    const matchesFilter = carFilter === 'all' || car.status === carFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#060b17] text-slate-100 flex flex-col md:flex-row font-arabic">
      
      {/* 1. الشريط الجانبي الفاخر (Sidebar) */}
      <aside className="w-full md:w-72 bg-[#0a1122] border-b md:border-b-0 md:border-l border-[#c5a059]/20 flex flex-col shrink-0">
        
        {/* ترويسة اللوحة والشعار */}
        <div className="p-6 border-b border-[#c5a059]/15 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c5a059] to-[#8a6d3b] flex items-center justify-center p-0.5 shadow-lg shadow-[#c5a059]/20">
              <div className="w-full h-full bg-[#060b17] rounded-[10px] flex items-center justify-center">
                <CarIcon className="w-5 h-5 text-[#c5a059]" />
              </div>
            </div>
            <div>
              <div className="font-black text-sm tracking-wide text-white group-hover:text-[#c5a059] transition-colors">
                يمن الخليج
              </div>
              <div className="text-[10px] text-[#c5a059] tracking-wider uppercase font-semibold">
                نظام إدارة الأسطول (ERP)
              </div>
            </div>
          </Link>
          <Link href="/" className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60" title="الموقع العام">
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* بطاقة الحساب النشط وصلاحيات الموظف (Active Staff Role Switcher) */}
        <div className="p-4 m-4 rounded-xl bg-[#0e172a] border border-[#c5a059]/30 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-400 font-medium">المستخدم الحالي:</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              currentStaff.role === 'super_admin' ? 'bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40' :
              currentStaff.role === 'rental_agent' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {currentStaff.role === 'super_admin' ? '👑 مدير عام' :
               currentStaff.role === 'rental_agent' ? '👤 موظف تأجير' : '💼 محاسب مالي'}
            </span>
          </div>
          <p className="text-xs font-bold text-white truncate mb-3">{currentStaff.name}</p>
          
          {/* مبدل الأدوار التجريبي الفوري */}
          <div className="pt-2 border-t border-slate-700/50">
            <label className="text-[10px] text-slate-400 block mb-1.5 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-[#c5a059]" /> تجربة الصلاحيات الحية:
            </label>
            <div className="grid grid-cols-3 gap-1">
              <button 
                onClick={() => switchStaffRole('super_admin')}
                className={`text-[10px] py-1 rounded transition-colors ${currentStaff.role === 'super_admin' ? 'bg-[#c5a059] text-black font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                مدير
              </button>
              <button 
                onClick={() => switchStaffRole('rental_agent')}
                className={`text-[10px] py-1 rounded transition-colors ${currentStaff.role === 'rental_agent' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                تأجير
              </button>
              <button 
                onClick={() => switchStaffRole('accountant')}
                className={`text-[10px] py-1 rounded transition-colors ${currentStaff.role === 'accountant' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                محاسب
              </button>
            </div>
          </div>
        </div>

        {/* روابط التنقل في اللوحة (Navigation Menu) */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-[#c5a059]/20 to-transparent text-[#f3e5ab] border-r-4 border-[#c5a059]'
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
                ? 'bg-gradient-to-r from-[#c5a059]/20 to-transparent text-[#f3e5ab] border-r-4 border-[#c5a059]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-3">
              <CarIcon className="w-4 h-4 text-[#c5a059]" /> إدارة الأسطول والسيارات
            </span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-[#c5a059] font-mono">
              {cars.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'bookings'
                ? 'bg-gradient-to-r from-[#c5a059]/20 to-transparent text-[#f3e5ab] border-r-4 border-[#c5a059]'
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

          <button
            onClick={() => setActiveTab('invoices')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'invoices'
                ? 'bg-gradient-to-r from-[#c5a059]/20 to-transparent text-[#f3e5ab] border-r-4 border-[#c5a059]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="flex items-center gap-3">
              <Receipt className="w-4 h-4 text-[#c5a059]" /> الفواتير وسندات التأمين
            </span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-mono">
              {invoices.length}
            </span>
          </button>

          {/* للمدير والمحاسب فقط: ملاك السيارات */}
          {(currentStaff.role === 'super_admin' || currentStaff.role === 'accountant') && (
            <button
              onClick={() => setActiveTab('owners')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'owners'
                  ? 'bg-gradient-to-r from-[#c5a059]/20 to-transparent text-[#f3e5ab] border-r-4 border-[#c5a059]'
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

          {/* للمدير فقط: أكواد الخصم وسجل الرقابة */}
          {currentStaff.role === 'super_admin' && (
            <>
              <button
                onClick={() => setActiveTab('coupons')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'coupons'
                    ? 'bg-gradient-to-r from-[#c5a059]/20 to-transparent text-[#f3e5ab] border-r-4 border-[#c5a059]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-[#c5a059]" /> أكواد الخصم والعروض
                </span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-mono">
                  {coupons.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'audit'
                    ? 'bg-gradient-to-r from-[#c5a059]/20 to-transparent text-[#f3e5ab] border-r-4 border-[#c5a059]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-[#c5a059]" /> سجل الرقابة والأمان
                </span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-mono">
                  {auditLogs.length}
                </span>
              </button>
            </>
          )}
        </nav>

        {/* تذييل الشريط الجانبي */}
        <div className="p-4 border-t border-slate-800/60 flex items-center justify-between">
          <button 
            onClick={resetToDefault} 
            className="text-[10px] text-slate-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
            title="استعادة البيانات الأصلية"
          >
            <RotateCcw className="w-3 h-3" /> استعادة البيانات الافتراضية
          </button>
          <span className="text-[10px] font-mono text-[#c5a059]">v2.0 EGP</span>
        </div>
      </aside>

      {/* 2. المحتوى الرئيسي (Main Dashboard Content) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* شريط الإجراءات والبحث العلوي (Top Header Bar) */}
        <header className="h-16 border-b border-[#c5a059]/20 bg-[#080e1c] px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          
          {/* محرك البحث الفوري (Live Search) */}
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

          {/* أزرار الإجراءات السريعة (Action Buttons) */}
          <div className="flex items-center gap-3">
            {/* زر حجز جديد متاح لمسؤول التأجير والمدير */}
            {(currentStaff.role === 'super_admin' || currentStaff.role === 'rental_agent') && (
              <button
                onClick={() => setIsAddBookingOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all"
              >
                <Plus className="w-4 h-4" /> حجز جديد (تسليم)
              </button>
            )}

            {/* زر إضافة سيارة للمدير العام فقط */}
            {currentStaff.role === 'super_admin' && (
              <button
                onClick={() => setIsAddCarOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#8a6d3b] hover:from-[#d4af37] hover:to-[#a07e44] text-black text-xs font-black flex items-center gap-2 shadow-lg shadow-[#c5a059]/20 transition-all"
              >
                <Plus className="w-4 h-4" /> إضافة سيارة
              </button>
            )}
          </div>
        </header>

        {/* منطقة المحتوى التفاعلي (Tabs Content) */}
        <div className="p-6 flex-1 space-y-6">

          {/* TAB 1: الإحصائيات العامة (Overview Tab) */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* بطاقات الإحصاءات العلوية المعتمدة بالجنيه المصري EGP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* إجمالي السيارات والأسطول */}
                <div className="bg-[#0b1324] border border-[#c5a059]/25 p-5 rounded-2xl relative overflow-hidden group hover:border-[#c5a059]/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold mb-1">إجمالي الأسطول</p>
                      <h3 className="text-2xl font-black text-white font-mono">{totalCars} <span className="text-xs text-[#c5a059] font-arabic font-normal">مركبة</span></h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
                      <CarIcon className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">🟢 {availableCars} جاهزة ومتاحة</span>
                    <span className="text-amber-400 flex items-center gap-1 font-semibold">🟡 {rentedCars} قيد التأجير</span>
                  </div>
                </div>

                {/* الحجوزات النشطة اليوم */}
                <div className="bg-[#0b1324] border border-[#c5a059]/25 p-5 rounded-2xl relative overflow-hidden group hover:border-[#c5a059]/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold mb-1">العقود النشطة الحالية</p>
                      <h3 className="text-2xl font-black text-white font-mono">{activeBookings.length} <span className="text-xs text-emerald-400 font-arabic font-normal">عقد نشط</span></h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>نسبة إشغال الأسطول:</span>
                    <span className="font-bold text-white font-mono">{totalCars > 0 ? Math.round((rentedCars / totalCars) * 100) : 0}%</span>
                  </div>
                </div>

                {/* إجمالي المداخيل بالجنيه المصري (EGP) - يظهر للمدير والمحاسب */}
                <div className="bg-[#0b1324] border border-[#c5a059]/25 p-5 rounded-2xl relative overflow-hidden group hover:border-[#c5a059]/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold mb-1">إجمالي الإيرادات التعاقدية</p>
                      <h3 className="text-2xl font-black text-[#f3e5ab] font-mono">
                        {currentStaff.role === 'rental_agent' ? '••••••' : totalRevenueEGP.toLocaleString()} 
                        <span className="text-xs text-[#c5a059] font-arabic font-normal mr-1">ج.م</span>
                      </h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>العملة المعتمدة:</span>
                    <span className="text-[#c5a059] font-bold">الجنيه المصري (EGP)</span>
                  </div>
                </div>

                {/* كفالات التأمين المستردة المحجوزة */}
                <div className="bg-[#0b1324] border border-[#c5a059]/25 p-5 rounded-2xl relative overflow-hidden group hover:border-[#c5a059]/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold mb-1">أموال التأمين المحجوزة (الضمان)</p>
                      <h3 className="text-2xl font-black text-cyan-300 font-mono">
                        {totalHeldDepositsEGP.toLocaleString()} <span className="text-xs text-cyan-400 font-arabic font-normal mr-1">ج.م</span>
                      </h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>حالة الضمان:</span>
                    <span className="text-cyan-400 font-semibold">مسترد للعملاء عند الإرجاع</span>
                  </div>
                </div>
              </div>

              {/* تنبيهات الحجوزات والمتابعة اللحظية */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* قائمة السيارات المؤجرة ومواعيد الإرجاع */}
                <div className="lg:col-span-2 bg-[#0b1324] border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#c5a059]" /> متابعة السيارات المؤجرة ومواعيد عودتها
                    </h4>
                    <span className="text-xs text-slate-400">({activeBookings.length} سيارات بالشارع)</span>
                  </div>

                  {activeBookings.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      لا توجد سيارات مؤجرة حالياً، جميع الأسطول متاح في المعرض 🟢
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeBookings.map((bk) => (
                        <div key={bk.id} className="p-3.5 bg-[#0e172a] rounded-xl border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#c5a059]/40 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-[#c5a059] font-bold">
                              <CarIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-white">{bk.carName}</h5>
                              <p className="text-[11px] text-slate-400">العميل: <span className="text-[#c5a059] font-semibold">{bk.customer.fullName}</span> ({bk.customer.phone})</p>
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
                              className="px-3 py-1.5 rounded-lg bg-[#c5a059] text-black font-bold text-xs hover:bg-[#d4af37] transition-all flex items-center gap-1 shadow"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> استلام وفحص
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* سجل العمليات الحية (Recent Audit Activity) */}
                <div className="bg-[#0b1324] border border-slate-800 rounded-2xl p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> سجل حركات الموظفين
                    </h4>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">لحظي</span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[340px] pr-1">
                    {auditLogs.slice(0, 6).map((log) => (
                      <div key={log.id} className="p-3 bg-[#0d1628] rounded-xl border border-slate-800 text-xs">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-[#c5a059]">{log.staffName}</span>
                          <span className="text-slate-500 font-mono text-[10px]">{log.timestamp}</span>
                        </div>
                        <p className="text-white font-medium text-[11px]">{log.action}</p>
                        <p className="text-[10px] text-slate-400 mt-1 truncate">{log.details}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: إدارة الأسطول والسيارات (Cars Fleet Tab) */}
          {activeTab === 'cars' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* شريط الفلترة وإحصائيات السيارات */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0b1324] p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-[#c5a059]" />
                  <span className="text-xs font-bold text-slate-300">تصفية الحالة:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCarFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${carFilter === 'all' ? 'bg-[#c5a059] text-black' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      الكل ({cars.length})
                    </button>
                    <button
                      onClick={() => setCarFilter('available')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${carFilter === 'available' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      المتاحة ({availableCars})
                    </button>
                    <button
                      onClick={() => setCarFilter('rented')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${carFilter === 'rented' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      المؤجرة ({rentedCars})
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-400 font-medium">
                  عرض {filteredCars.length} من أصل {cars.length} سيارة
                </div>
              </div>

              {/* بطاقات وجدول عرض السيارات */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCars.map((car) => (
                  <div key={car.id} className="bg-[#0b1324] border border-[#c5a059]/20 rounded-2xl overflow-hidden hover:border-[#c5a059]/60 transition-all flex flex-col group">
                    
                    {/* صورة السيارة مع شارة الحالة */}
                    <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                      <Image
                        src={car.coverImage || car.images[0] || '/car-mercedes.jpg'}
                        alt={`${car.make} ${car.model}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1324] via-transparent to-black/40" />

                      {/* شارة الحالة الفورية */}
                      <div className="absolute top-3 right-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border shadow-lg ${
                          car.status === 'available' ? 'bg-emerald-500/90 text-black border-emerald-400' :
                          car.status === 'rented' ? 'bg-amber-500/90 text-black border-amber-300' :
                          'bg-rose-500/90 text-white border-rose-400'
                        }`}>
                          {car.status === 'available' ? '🟢 متاحة للتأجير' :
                           car.status === 'rented' ? '🟡 مؤجرة حالياً' : '🔴 في الصيانة'}
                        </span>
                      </div>

                      {/* رقم اللوحة والموديل */}
                      <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 text-[11px] font-mono font-bold text-white">
                        {car.plateNumber}
                      </div>

                      {/* أسفل الصورة: الماركة والموديل */}
                      <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] text-[#c5a059] font-bold uppercase tracking-wider">{car.make}</p>
                          <h4 className="text-base font-black text-white">{car.model} {car.year}</h4>
                        </div>
                      </div>
                    </div>

                    {/* بيانات وتفاصيل السيارة */}
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

                      {/* الملكية والمالك */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                        <span>المالك:</span>
                        <span className="text-slate-200 font-semibold truncate max-w-[170px]">{car.ownerName || 'أسطول الشركة'}</span>
                      </div>

                      {/* إجراءات السيارة حسب الصلاحية */}
                      <div className="pt-2 flex items-center gap-2">
                        {car.status === 'available' ? (
                          <button
                            onClick={() => {
                              setNewBooking(prev => ({ ...prev, carId: car.id }));
                              setIsAddBookingOpen(true);
                            }}
                            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow"
                          >
                            <Calendar className="w-3.5 h-3.5" /> تأجير فوري
                          </button>
                        ) : (
                          <div className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs text-center">
                            السيارة بالشارع حالياً
                          </div>
                        )}

                        {/* صلاحيات الحذف والتعديل للمدير العام فقط */}
                        {currentStaff.role === 'super_admin' && (
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف ${car.make} ${car.model}؟`)) {
                                deleteCar(car.id);
                              }
                            }}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 transition-all"
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

          {/* TAB 3: الحجوزات والعقود (Bookings Tab) */}
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
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-[#c5a059] text-slate-300 hover:text-black text-[11px] font-bold transition-all flex items-center gap-1"
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
                                className="px-2.5 py-1 rounded bg-[#c5a059] text-black text-[11px] font-bold hover:bg-[#d4af37]"
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

          {/* TAB 4: الفواتير وسندات التأمين (Invoices Tab) */}
          {activeTab === 'invoices' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#0b1324] border border-slate-800 rounded-2xl p-5 overflow-x-auto">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#c5a059]" /> سجل الفواتير الرسمية الصادرة
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">الإجمالي: {invoices.length} فواتير</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="p-4 bg-[#0e172a] rounded-xl border border-[#c5a059]/20 hover:border-[#c5a059]/50 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                          <span className="font-mono font-bold text-[#c5a059]">{inv.invoiceNumber}</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                            مدفوعة بالكامل ✓
                          </span>
                        </div>
                        <h5 className="font-bold text-white text-xs mb-1">{inv.customerName}</h5>
                        <p className="text-[11px] text-slate-400 mb-2">{inv.carDetails}</p>
                        
                        <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg text-xs font-mono">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-arabic">مبلغ الإيجار:</span>
                            <span className="font-bold text-white">{inv.totalAmountEGP.toLocaleString()} ج.م</span>
                          </div>
                          <div className="flex justify-between text-cyan-300">
                            <span className="font-arabic">التأمين المسترد:</span>
                            <span>{inv.depositAmountEGP.toLocaleString()} ج.م</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">{inv.issuedAt}</span>
                        <button 
                          onClick={() => window.print()}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-[#c5a059] hover:text-black rounded text-[11px] font-bold transition-colors flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" /> طباعة PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: الملاك والشركاء (Owners Tab) */}
          {activeTab === 'owners' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#0b1324] border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">إدارة ملاك ومستثمري السيارات (Revenue Share)</h4>
                    <p className="text-xs text-slate-400">حسابات الشركاء وتوزيع نسب الأرباح الآلية</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {owners.map((owner) => (
                    <div key={owner.id} className="p-4 bg-[#0e172a] rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-bold text-white text-sm">{owner.name}</h5>
                        <span className="text-xs bg-[#c5a059]/20 text-[#c5a059] px-2 py-0.5 rounded font-bold font-mono">
                          نسبة المالك: {owner.ownerSharePercent}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-1">الهاتف: <span className="font-mono text-slate-300">{owner.phone}</span></p>
                      <p className="text-xs text-slate-400 mb-3">{owner.notes}</p>
                      <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-xs">
                        <div>
                          <span className="text-slate-500">حصة شركة يمن الخليج: </span>
                          <span className="font-bold text-emerald-400 font-mono">{100 - owner.ownerSharePercent}%</span>
                        </div>
                        <button
                          onClick={() => setSelectedOwnerForSettlement(owner)}
                          className="px-3 py-1.5 rounded-lg bg-[#c5a059] hover:bg-[#d4af37] text-black text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" /> كشف حساب وتصفية الأرباح
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: أكواد الخصم (Coupons Tab) */}
          {activeTab === 'coupons' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#0b1324] border border-slate-800 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-white mb-4">أكواد الخصم الترويجية النشطة</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {coupons.map((cp) => (
                    <div key={cp.id} className="p-4 bg-[#0e172a] rounded-xl border border-dashed border-[#c5a059]/40 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-black text-lg text-[#f3e5ab] tracking-wider">{cp.code}</span>
                        <span className="text-xs font-bold text-emerald-400">نشط ✓</span>
                      </div>
                      <p className="text-xs text-slate-300 font-bold mb-2">
                        قيمة الخصم: {cp.discountType === 'percentage' ? `${cp.discountValue}%` : `${cp.discountValue.toLocaleString()} ج.م`}
                      </p>
                      <div className="text-[10px] text-slate-500 flex justify-between">
                        <span>مرات الاستخدام: {cp.usedCount} من {cp.maxUsage}</span>
                        <span>ينتهي: {cp.expiresAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: سجل الرقابة والأمان (Audit Tab) */}
          {activeTab === 'audit' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#0b1324] border border-slate-800 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> سجل الرقابة والعمليات التفصيلي
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

      {/* 3. نافذة منبثقة: إضافة سيارة جديدة (Modal: Add Car) */}
      {isAddCarOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1324] border border-[#c5a059]/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CarIcon className="w-5 h-5 text-[#c5a059]" /> إضافة سيارة جديدة للأسطول
              </h3>
              <button onClick={() => setIsAddCarOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCarSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ماركة السيارة (Make):</label>
                  <input
                    type="text"
                    required
                    value={newCar.make}
                    onChange={(e) => setNewCar({ ...newCar, make: e.target.value })}
                    placeholder="مثال: Mercedes-Benz, BMW, Porsche"
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">الموديل (Model):</label>
                  <input
                    type="text"
                    required
                    value={newCar.model}
                    onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
                    placeholder="مثال: S-Class S500, Range Rover"
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">سنة الصنع:</label>
                  <input
                    type="number"
                    value={newCar.year}
                    onChange={(e) => setNewCar({ ...newCar, year: parseInt(e.target.value) || 2024 })}
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">رقم اللوحة:</label>
                  <input
                    type="text"
                    required
                    value={newCar.plateNumber}
                    onChange={(e) => setNewCar({ ...newCar, plateNumber: e.target.value })}
                    placeholder="مثال: م ص ر 5542"
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">عداد الكيلومترات الحالي:</label>
                  <input
                    type="number"
                    value={newCar.currentKm}
                    onChange={(e) => setNewCar({ ...newCar, currentKm: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">لون السيارة:</label>
                  <input
                    type="text"
                    value={newCar.color}
                    onChange={(e) => setNewCar({ ...newCar, color: e.target.value })}
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-[#c5a059] font-bold mb-1">سعر الإيجار اليومي (بالجنيه EGP):</label>
                  <input
                    type="number"
                    required
                    value={newCar.dailyPriceEGP}
                    onChange={(e) => setNewCar({ ...newCar, dailyPriceEGP: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0e172a] border border-[#c5a059]/60 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-cyan-300 font-bold mb-1">مبلغ التأمين المسترد (بالجنيه EGP):</label>
                  <input
                    type="number"
                    required
                    value={newCar.securityDepositEGP}
                    onChange={(e) => setNewCar({ ...newCar, securityDepositEGP: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0e172a] border border-cyan-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ملكية السيارة:</label>
                  <select
                    value={newCar.ownership}
                    onChange={(e) => setNewCar({ 
                      ...newCar, 
                      ownership: e.target.value as any,
                      ownerName: e.target.value === 'company' ? 'شركة يمن الخليج' : 'مستثمر خارجي'
                    })}
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                  >
                    <option value="company">ملك شركة يمن الخليج</option>
                    <option value="investor">ملك مستثمر / شريك خارجي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">رابط صورة السيارة:</label>
                  <input
                    type="text"
                    value={newCar.images[0]}
                    onChange={(e) => setNewCar({ ...newCar, images: [e.target.value] })}
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddCarOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#c5a059] hover:bg-[#d4af37] text-black font-black shadow-lg"
                >
                  حفظ السيارة بالأسطول ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. نافذة منبثقة: إنشاء حجز جديد (Modal: Add Booking) */}
      {isAddBookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1324] border border-emerald-500/40 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" /> إنشاء عقد وحجز جديد (تسليم سيارة)
              </h3>
              <button onClick={() => setIsAddBookingOpen(false)} className="text-slate-400 hover:text-white">
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

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">كود الخصم (إن وجد):</label>
                  <input
                    type="text"
                    value={newBooking.discountCode}
                    onChange={(e) => setNewBooking({ ...newBooking, discountCode: e.target.value })}
                    placeholder="مثال: VIP2026"
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white uppercase focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ملاحظات العقد / مكان الاستلام:</label>
                  <input
                    type="text"
                    value={newBooking.notes}
                    onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                    placeholder="مثال: استلام مطار القاهرة الدولي"
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddBookingOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg"
                >
                  تأكيد الحجز وطباعة الفاتورة ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. نافذة منبثقة: فحص واستلام السيارة وإرجاع التأمين (Modal: Check-In Return) */}
      {selectedBookingForReturn && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1324] border border-[#c5a059]/50 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#c5a059]" /> استلام السيارة وإنهاء العقد
              </h3>
              <button onClick={() => setSelectedBookingForReturn(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnCarSubmit} className="space-y-4 text-xs">
              <div className="bg-[#0e172a] p-3 rounded-xl border border-slate-800 space-y-1">
                <p className="text-white font-bold">{selectedBookingForReturn.carName}</p>
                <p className="text-slate-400">العميل: {selectedBookingForReturn.customer.fullName}</p>
                <p className="text-slate-400">قراءة العداد عند الخروج: <span className="font-mono text-[#c5a059]">{selectedBookingForReturn.startKm.toLocaleString()} كم</span></p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">قراءة عداد الكيلومترات الحالية (عند العودة):</label>
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
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#c5a059] hover:bg-[#d4af37] text-black font-black shadow-lg"
                >
                  تأكيد الاستلام واسترجاع التأمين ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. نافذة منبثقة: عقد الإيجار الرسمي وسند التأمين للطباعة (Modal: Printable Contract) */}
      {selectedBookingForContract && (
        <RentalContractModal
          booking={selectedBookingForContract}
          onClose={() => setSelectedBookingForContract(null)}
        />
      )}

      {/* 7. نافذة منبثقة: كشف حساب وتصفية أرباح المالك للطباعة (Modal: Owner Settlement) */}
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
