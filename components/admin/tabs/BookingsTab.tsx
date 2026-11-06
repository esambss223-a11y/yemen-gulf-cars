'use client';

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  ShieldCheck, 
  X, 
  LayoutGrid, 
  List, 
  CreditCard,
  Bell,
  Plus
} from 'lucide-react';
import type { Booking, BookingStatus, PromoCoupon, StaffUser, BookingReviewInput } from '@/types/fleet';
import BookingReviewModal from '@/components/admin/modals/BookingReviewModal';
import BookingCard from './BookingCard';
import BookingRow from './BookingRow';

interface BookingsTabProps {
  bookings: Booking[];
  coupons: PromoCoupon[];
  currentStaff?: StaffUser;
  onOpenContract: (booking: Booking) => void;
  onReturnCar: (booking: Booking) => void;
  onActivateBooking?: (booking: Booking) => Promise<void>;
  onApproveBooking?: (booking: Booking, details: BookingReviewInput) => Promise<void>;
  onRejectBooking?: (booking: Booking, reason: string) => Promise<void>;
  onOpenAddBooking?: () => void;
}

type ViewSection = 'pending' | 'active' | 'completed' | 'rejected' | 'all';

function bookingCreatedAt(booking: Booking) {
  const parsed = Date.parse(booking.createdAt || '');
  if (Number.isFinite(parsed)) return parsed;
  const localIdTimestamp = /^bk-(\d+)$/.exec(booking.id)?.[1];
  return localIdTimestamp ? Number(localIdTimestamp) : 0;
}

function newestFirst(bookings: Booking[]) {
  return [...bookings].sort((a, b) => bookingCreatedAt(b) - bookingCreatedAt(a));
}

export default function BookingsTab({
  bookings,
  coupons,
  currentStaff,
  onOpenContract,
  onReturnCar,
  onActivateBooking,
  onApproveBooking,
  onRejectBooking,
  onOpenAddBooking,
}: BookingsTabProps) {
  const [activeSection, setActiveSection] = useState<ViewSection>(
    () => bookings.some((b) => b.status === 'pending_approval') ? 'pending' : 'active'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [bookingForReview, setBookingForReview] = useState<Booking | null>(null);
  const [activatingBookingId, setActivatingBookingId] = useState<string | null>(null);
  const canBook = currentStaff?.role === 'super_admin' || currentStaff?.role === 'rental_agent';

  const todayParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const cairoNowMinute = `${todayParts.find((p) => p.type === 'year')?.value}-${todayParts.find((p) => p.type === 'month')?.value}-${todayParts.find((p) => p.type === 'day')?.value}T${todayParts.find((p) => p.type === 'hour')?.value}:${todayParts.find((p) => p.type === 'minute')?.value}`;

  const handleActivateBooking = async (booking: Booking) => {
    if (!onActivateBooking) return;
    setActivatingBookingId(booking.id);
    try {
      await onActivateBooking(booking);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'تعذر بدء العقد.');
    } finally {
      setActivatingBookingId(null);
    }
  };

  // Groupings
  const pendingBookings = useMemo(() => newestFirst(bookings.filter(b => b.status === 'pending_approval')), [bookings]);
  const activeBookings = useMemo(() => newestFirst(bookings.filter(b => b.status === 'active' || b.status === 'confirmed')), [bookings]);
  const completedBookings = useMemo(() => newestFirst(bookings.filter(b => b.status === 'completed')), [bookings]);
  const rejectedBookings = useMemo(() => newestFirst(bookings.filter(b => b.status === 'cancelled')), [bookings]);

  // Overall Financial Telemetry
  const pendingCount = pendingBookings.length;
  const totalHeldDeposits = activeBookings.reduce((sum, b) => sum + (b.securityDepositEGP || 0), 0);
  const totalActiveRevenue = activeBookings.reduce((sum, b) => sum + (b.finalTotalEGP || 0), 0);

  // Search Filter
  const matchesSearch = (bk: Booking, term: string) => {
    if (!term) return true;
    const clean = term.toLowerCase().trim();
    return (
      bk.bookingNumber.toLowerCase().includes(clean) ||
      bk.carName.toLowerCase().includes(clean) ||
      bk.carPlate.includes(clean) ||
      bk.customer.fullName.toLowerCase().includes(clean) ||
      bk.customer.phone.includes(clean) ||
      (bk.customer.nationalId && bk.customer.nationalId.includes(clean)) ||
      (bk.staffName && bk.staffName.toLowerCase().includes(clean))
    );
  };

  const currentDisplayList = useMemo(() => {
    let list: Booking[] = [];
    if (activeSection === 'pending') list = pendingBookings;
    else if (activeSection === 'active') list = activeBookings;
    else if (activeSection === 'completed') list = completedBookings;
    else if (activeSection === 'rejected') list = rejectedBookings;
    else list = newestFirst(bookings);

    return list.filter(b => matchesSearch(b, searchTerm));
  }, [activeSection, pendingBookings, activeBookings, completedBookings, rejectedBookings, bookings, searchTerm]);

  const tabs: { id: ViewSection; label: string; count: number; alert?: boolean; dot?: string }[] = [
    { id: 'pending', label: 'طلبات جديدة', count: pendingCount, alert: pendingCount > 0, dot: 'bg-amber-500' },
    { id: 'active', label: 'سارية بالشارع', count: activeBookings.length, dot: 'bg-emerald-500' },
    { id: 'completed', label: 'مستلمة ومغلقة', count: completedBookings.length, dot: 'bg-slate-400' },
    { id: 'rejected', label: 'المرفوضة', count: rejectedBookings.length, dot: 'bg-rose-500' },
    { id: 'all', label: 'الكل', count: bookings.length },
  ];

  return (
    <div className="space-y-3 max-w-[1600px] mx-auto text-slate-800 font-arabic" dir="rtl">
      
      {/* 1. Contract Operations Console (Unified, Single-Tier, Zero Space Waste) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
        
        {/* Right side: Title, Financial Telemetry & Lifecycle Tabs */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 flex-shrink-0">
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">العقود</h2>
            
            {/* Live Financial Badges */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200" title="إجمالي قيمة العقود السارية">
                <CreditCard size={11} className="text-emerald-600" />
                <span>{totalActiveRevenue.toLocaleString('ar-EG')} ج.م</span>
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200" title="إجمالي التأمينات المحتجزة أمانات">
                <ShieldCheck size={11} className="text-slate-500" />
                <span>تأمين: {totalHeldDeposits.toLocaleString('ar-EG')} ج.م</span>
              </span>
            </div>
          </div>

          {/* Integrated Lifecycle Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            {tabs.map((tab) => {
              const active = activeSection === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {tab.alert ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  ) : tab.dot ? (
                    <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />
                  ) : null}
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    active
                      ? 'bg-slate-800 text-slate-200'
                      : tab.alert
                      ? 'bg-amber-100 text-amber-800 font-extrabold'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.count.toLocaleString('ar-EG')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Left side: Search & View Toggle */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap mr-auto lg:mr-0">
          {/* Instant Search */}
          <div className="relative flex-1 sm:w-60 min-w-[160px]">
            <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث برقم العقد، العميل، اللوحة…"
              className="w-full h-8 pr-7 pl-6 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                title="مسح البحث"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="عرض البطاقات"
            >
              <LayoutGrid size={13} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="عرض الجدول المدمج"
            >
              <List size={13} />
            </button>
          </div>

          {canBook && onOpenAddBooking && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-colors shadow-xs shrink-0 cursor-pointer"
              onClick={onOpenAddBooking}
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>عقد وحجز جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Contracts Content (Dual Mode: Grid Cards or Table Rows) */}
      {currentDisplayList.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center gap-2 bg-white border border-dashed border-slate-300 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <FileText size={20} />
          </div>
          <h3 className="text-xs font-bold text-slate-900">
            {searchTerm ? 'لا توجد عقود تطابق البحث' : 'لا توجد عقود مسجلة في هذا القسم'}
          </h3>
          <p className="text-[11px] text-slate-500 max-w-sm">
            {searchTerm ? 'جرّب البحث باسم عميل أو رقم حجز مختلف.' : 'ستظهر العقود هنا فور تسجيلها أو الانتقال لقسم آخر.'}
          </p>
          {searchTerm && (
            <button
              type="button"
              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
              onClick={() => setSearchTerm('')}
            >
              إلغاء البحث
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
          {currentDisplayList.map((bk) => {
            const canStart = bk.status === 'confirmed' && `${bk.startDate}T${(bk.startTime || '14:00').slice(0, 5)}` <= cairoNowMinute && !!onActivateBooking && currentStaff?.role === 'super_admin';

            return (
              <BookingCard
                key={bk.id}
                booking={bk}
                canStart={canStart}
                activatingBookingId={activatingBookingId}
                currentStaff={currentStaff}
                onOpenContract={onOpenContract}
                onReturnCar={onReturnCar}
                onActivateBooking={onActivateBooking ? () => void handleActivateBooking(bk) : undefined}
                onReviewBooking={setBookingForReview}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {currentDisplayList.map((bk) => {
            const canStart = bk.status === 'confirmed' && `${bk.startDate}T${(bk.startTime || '14:00').slice(0, 5)}` <= cairoNowMinute && !!onActivateBooking && currentStaff?.role === 'super_admin';

            return (
              <BookingRow
                key={bk.id}
                booking={bk}
                canStart={canStart}
                activatingBookingId={activatingBookingId}
                currentStaff={currentStaff}
                onOpenContract={onOpenContract}
                onReturnCar={onReturnCar}
                onActivateBooking={onActivateBooking ? () => void handleActivateBooking(bk) : undefined}
                onReviewBooking={setBookingForReview}
              />
            );
          })}
        </div>
      )}

      {/* Review & Approval Modal */}
      {bookingForReview && onApproveBooking && onRejectBooking && (
        <BookingReviewModal
          booking={bookingForReview}
          coupons={coupons}
          onClose={() => setBookingForReview(null)}
          onApprove={(details) => onApproveBooking(bookingForReview, details)}
          onReject={(reason) => onRejectBooking(bookingForReview, reason)}
        />
      )}
    </div>
  );
}
