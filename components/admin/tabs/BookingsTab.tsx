'use client';

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  UserCheck, 
  User, 
  Car as CarIcon, 
  Phone, 
  CreditCard, 
  Filter,
  Check,
  XCircle,
  Building,
  DollarSign,
  Archive,
  Layers,
  CalendarCheck,
  ArrowRight,
  TrendingUp,
  Gauge,
  Key
} from 'lucide-react';
import { Booking, BookingStatus, PromoCoupon, StaffUser } from '@/types/fleet';
import BookingReviewModal from '@/components/admin/modals/BookingReviewModal';
import { BookingReviewInput } from '@/types/fleet';

interface BookingsTabProps {
  bookings: Booking[];
  coupons: PromoCoupon[];
  currentStaff?: StaffUser;
  onOpenContract: (booking: Booking) => void;
  onReturnCar: (booking: Booking) => void;
  onActivateBooking?: (booking: Booking) => Promise<void>;
  onApproveBooking?: (booking: Booking, details: BookingReviewInput) => Promise<void>;
  onRejectBooking?: (booking: Booking, reason: string) => Promise<void>;
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
}: BookingsTabProps) {
  // افتح الطلبات المعلقة مباشرة إذا كانت تحتاج مراجعة.
  const [activeSection, setActiveSection] = useState<ViewSection>(
    () => bookings.some((booking) => booking.status === 'pending_approval') ? 'pending' : 'active',
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all');
  const [bookingForReview, setBookingForReview] = useState<Booking | null>(null);
  const [activatingBookingId, setActivatingBookingId] = useState<string | null>(null);
  const todayParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const cairoNowMinute = `${todayParts.find((part) => part.type === 'year')?.value}-${todayParts.find((part) => part.type === 'month')?.value}-${todayParts.find((part) => part.type === 'day')?.value}T${todayParts.find((part) => part.type === 'hour')?.value}:${todayParts.find((part) => part.type === 'minute')?.value}`;

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

  // فرز العقود حسب حالتها (الحالية vs المستلمة)
  const activeBookings = useMemo(() => {
    return newestFirst(bookings.filter(b => b.status === 'active' || b.status === 'pending_approval' || b.status === 'confirmed'));
  }, [bookings]);

  const completedBookings = useMemo(() => {
    return newestFirst(bookings.filter(b => b.status === 'completed'));
  }, [bookings]);

  const rejectedBookings = useMemo(() => {
    return newestFirst(bookings.filter(b => b.status === 'cancelled'));
  }, [bookings]);

  // إحصائيات عامة
  const pendingCount = bookings.filter(b => b.status === 'pending_approval').length;
  const runningCount = bookings.filter(b => b.status === 'active').length;
  const deliveredCount = bookings.filter(b => b.status === 'completed').length;
  const totalHeldDeposits = activeBookings.reduce((sum, b) => sum + (b.securityDepositEGP || 0), 0);
  const totalActiveRevenue = activeBookings.reduce((sum, b) => sum + (b.finalTotalEGP || 0), 0);
  const totalCompletedRevenue = completedBookings.reduce((sum, b) => sum + (b.finalTotalEGP || 0), 0);

  // دالة البحث الشامل
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

  const filteredActive = useMemo(() => {
    return activeBookings.filter(bk => {
      const matchStatus = statusFilter === 'all' || bk.status === statusFilter;
      return matchStatus && matchesSearch(bk, searchTerm);
    });
  }, [activeBookings, statusFilter, searchTerm]);

  const pendingBookings = useMemo(
    () => newestFirst(bookings.filter((booking) => booking.status === 'pending_approval' && matchesSearch(booking, searchTerm))),
    [bookings, searchTerm],
  );

  const filteredCompleted = useMemo(() => {
    return completedBookings.filter(bk => {
      const matchStatus = statusFilter === 'all' || bk.status === statusFilter;
      return matchStatus && matchesSearch(bk, searchTerm);
    });
  }, [completedBookings, statusFilter, searchTerm]);

  const filteredRejected = useMemo(
    () => rejectedBookings.filter((booking) => matchesSearch(booking, searchTerm)),
    [rejectedBookings, searchTerm],
  );

  const renderPendingCards = () => (
    <div className="space-y-3">
      {pendingBookings.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-sm font-bold text-amber-900">
          لا يوجد طلب بانتظار الموافقة هنا. إذا كان الطلب ظاهرًا في قائمة أخرى، أرسل صورة للشاشة لنحدد حالته.
        </div>
      ) : pendingBookings.map((booking) => (
        <article key={booking.id} className="rounded-2xl border border-amber-200 bg-white p-4 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-right">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="font-mono text-sm text-amber-800">{booking.bookingNumber}</strong>
                {getStatusBadge(booking.status)}
              </div>
              <p className="font-black text-slate-900">{booking.customer.fullName} <span dir="ltr" className="font-mono text-xs font-medium text-slate-500">{booking.customer.phone}</span></p>
              <p className="text-xs text-slate-700">{booking.carName} · {booking.carPlate}</p>
              <p className="text-xs text-slate-600">الاستلام: {booking.startDate} {booking.startTime || '14:00'} — الإرجاع: {booking.endDate} {booking.endTime || '14:00'}</p>
              <p className="text-xs font-bold text-slate-700">السعر المسجل: {booking.finalTotalEGP.toLocaleString()} ج.م · التأمين: {booking.securityDepositEGP.toLocaleString()} ج.م</p>
            </div>
            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:min-w-56">
              {currentStaff?.role === 'super_admin' && onApproveBooking && onRejectBooking ? (
                <button
                  onClick={() => setBookingForReview(booking)}
                  className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-black text-white shadow-xs hover:bg-amber-500"
                  title="إدخال الرقم القومي والرخصة ومراجعة الموعد والسعر ثم الموافقة أو الرفض"
                >
                  فتح بيانات الطلب للمراجعة
                </button>
              ) : (
                <span className="rounded-xl bg-rose-50 px-4 py-3 text-center text-xs font-bold text-rose-800">
                  يلزم الدخول بحساب المدير العام للموافقة أو الرفض.
                </span>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'pending_approval':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
            <Clock className="w-3 h-3 text-amber-600" /> بانتظار موافقة الإدارة
          </span>
        );
      case 'active':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 bg-blue-100 text-blue-900 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" /> ساري بالتشغيل (بالشارع)
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-200">
            <CalendarCheck className="w-3 h-3 text-emerald-700" /> مؤكد — بانتظار التسليم
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> تم الاستلام والتسوية
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 bg-rose-100 text-rose-900 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> ملغي
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            مؤكد
          </span>
        );
    }
  };

  // جدول العقود السارية (الحالية)
  const renderActiveTable = (items: Booking[]) => (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-50/80 via-white to-white border-b border-blue-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-600 animate-ping" />
          <h5 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" /> {activeSection === 'pending' ? 'طلبات الحجز بانتظار الموافقة' : 'العقود الحالية والسارية بالتشغيل'}
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-blue-100 text-blue-800 font-bold">
              {items.length} {activeSection === 'pending' ? 'طلبات معلقة' : 'عقود/حجوزات'}
            </span>
          </h5>
        </div>
        <span className="text-xs text-slate-500 font-arabic hidden sm:inline">
          {activeSection === 'pending' ? 'افتح مراجعة الطلب لإدخال بيانات الهوية والرخصة ثم الموافقة أو الرفض.' : 'السيارات قيد التأجير في الشارع أو بانتظار خروجها'}
        </span>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
              <th className="py-3.5 pr-4">رقم العقد والمسؤول</th>
              <th className="py-3.5">السيارة واللوحة</th>
              <th className="py-3.5">العميل ورقم الهاتف</th>
              <th className="py-3.5">تاريخ البداية وموعد الإرجاع</th>
              <th className="py-3.5">قيمة الإيجار</th>
              <th className="py-3.5">التأمين المحتجز</th>
              <th className="py-3.5">الحالة</th>
              <th className="py-3.5 pl-4 text-center">الإجراء الفوري</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  {activeSection === 'pending'
                    ? 'لا يوجد طلب بانتظار الموافقة هنا. إذا وصلك الطلب على الموقع فقط، افتح لوحة الموقع نفسها أو تأكد أن المحلي والموقع متصلان بمشروع Supabase نفسه.'
                    : 'لا توجد عقود سارية حالياً تطابق بحثك'}
                </td>
              </tr>
            ) : (
              items.map((bk) => (
                <tr key={bk.id} className="hover:bg-blue-50/30 transition-colors">
                  {/* رقم العقد والموظف المسؤول */}
                  <td className="py-3.5 pr-4">
                    <span className="font-mono font-bold text-amber-700 block text-xs">{bk.bookingNumber}</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <UserCheck className="w-3 h-3 text-slate-400" /> المسؤول: {bk.staffName}
                    </span>
                    {bk.status === 'pending_approval' && currentStaff?.role === 'super_admin' && onApproveBooking && onRejectBooking && (
                      <button
                        onClick={() => setBookingForReview(bk)}
                        className="mt-2 rounded-lg bg-amber-600 px-3 py-2 text-[11px] font-black text-white shadow-xs hover:bg-amber-500"
                        title="إدخال بيانات الهوية والرخصة ومراجعة الطلب"
                      >
                        فتح المراجعة والموافقة أو الرفض
                      </button>
                    )}
                    {bk.status === 'pending_approval' && currentStaff && currentStaff.role !== 'super_admin' && (
                      <span className="mt-2 block text-[10px] font-bold text-rose-700">الموافقة والرفض متاحان لحساب المدير العام فقط.</span>
                    )}
                  </td>

                  {/* السيارة */}
                  <td className="py-3.5">
                    <strong className="text-slate-900 block text-xs">{bk.carName}</strong>
                    <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">
                      {bk.carPlate}
                    </span>
                  </td>

                  {/* العميل */}
                  <td className="py-3.5">
                    <strong className="text-slate-900 block text-xs">{bk.customer.fullName}</strong>
                    <span className="text-[10px] text-slate-500 font-mono dir-ltr block text-right">{bk.customer.phone}</span>
                  </td>

                  {/* المدة والإرجاع */}
                  <td className="py-3.5">
                    <div className="font-medium text-slate-800">{bk.daysCount} أيام</div>
                    <div className="text-[10px] text-slate-600 font-mono">الاستلام: {bk.startDate} ({bk.startTime || '14:00'})</div>
                    <div className="text-[10px] text-blue-700 font-bold flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-blue-600" /> الإرجاع: {bk.endDate} ({bk.endTime || '14:00'})
                    </div>
                  </td>

                  {/* الإجمالي */}
                  <td className="py-3.5 font-mono font-bold text-slate-900 text-xs">
                    {bk.finalTotalEGP.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">ج.م</span>
                  </td>

                  {/* التأمين */}
                  <td className="py-3.5">
                    <span className="font-mono font-bold text-slate-800 text-xs">{bk.securityDepositEGP.toLocaleString()} ج.م</span>
                    <span className="block text-[10px] font-bold text-amber-600">● محجوز لدى الشركة</span>
                  </td>

                  {/* الحالة */}
                  <td className="py-3.5">
                    {getStatusBadge(bk.status)}
                  </td>

                  {/* الإجراءات */}
                  <td className="py-3.5 pl-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* اعتماد الحجز المعلق */}
                      {bk.status === 'pending_approval' && onApproveBooking && onRejectBooking && currentStaff?.role === 'super_admin' && (
                        <button
                          onClick={() => setBookingForReview(bk)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                          title="أدخل بيانات الهوية والرخصة ثم وافق أو ارفض الطلب"
                        >
                          <FileText className="w-3.5 h-3.5" /> مراجعة / موافقة / رفض
                        </button>
                      )}

                      {bk.status === 'confirmed' && `${bk.startDate}T${(bk.startTime || '14:00').slice(0, 5)}` <= cairoNowMinute && onActivateBooking && currentStaff?.role === 'super_admin' && (
                        <button
                          onClick={() => void handleActivateBooking(bk)}
                          disabled={activatingBookingId === bk.id}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                          title="بدء العقد عند استلام السيارة"
                        >
                          <Key className="w-3.5 h-3.5" /> {activatingBookingId === bk.id ? 'جارٍ البدء…' : 'بدء العقد والتسليم'}
                        </button>
                      )}

                      {/* زر استلام السيارة وفحصها - بارز ومباشر */}
                      {bk.status === 'active' && (
                        <button
                          onClick={() => onReturnCar(bk)}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-[11px] font-black flex items-center gap-1 cursor-pointer shadow-xs transition-all"
                          title="استلام السيارة من العميل، فحص العداد، وتسوية التأمين"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> استلام وفحص
                        </button>
                      )}

                      {/* زر طباعة العقد */}
                      {bk.status !== 'pending_approval' && (
                        <button
                          onClick={() => onOpenContract(bk)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#081225] text-slate-700 hover:text-amber-400 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border border-slate-200"
                          title="عرض العقد وطباعة نسخة PDF"
                        >
                          <FileText className="w-3.5 h-3.5" /> العقد
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // جدول العقود المستلمة والمنتهية (الأرشيف)
  const renderCompletedTable = (items: Booking[]) => (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-emerald-50/80 via-white to-white border-b border-emerald-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <h5 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <Archive className="w-4 h-4 text-emerald-600" /> العقود التي تم تسليمها وإغلاقها (أرشيف العمليات)
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-100 text-emerald-800 font-bold">
              {items.length} عقود مكتملة
            </span>
          </h5>
        </div>
        <span className="text-xs text-slate-500 font-arabic hidden sm:inline">
          تم فحص العداد واسترجاع السيارات وتسوية التأمينات للعملاء
        </span>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
              <th className="py-3.5 pr-4">رقم العقد</th>
              <th className="py-3.5">السيارة واللوحة</th>
              <th className="py-3.5">العميل</th>
              <th className="py-3.5">فترة الإيجار وتاريخ التسليم</th>
              <th className="py-3.5">المسافة المستهلكة (كم)</th>
              <th className="py-3.5">المبلغ المحصّل</th>
              <th className="py-3.5">مصير التأمين</th>
              <th className="py-3.5">الحالة</th>
              <th className="py-3.5 pl-4 text-center">الوثائق</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  لا توجد عقود مستلمة مسجلة تطابق بحثك
                </td>
              </tr>
            ) : (
              items.map((bk) => {
                const kmUsed = bk.returnKm && bk.startKm ? bk.returnKm - bk.startKm : null;

                return (
                  <tr key={bk.id} className="hover:bg-emerald-50/20 transition-colors">
                    {/* رقم العقد */}
                    <td className="py-3.5 pr-4">
                      <span className="font-mono font-bold text-slate-800 block text-xs">{bk.bookingNumber}</span>
                      <span className="text-[10px] text-slate-400">أُنشئ: {bk.createdAt?.split('T')[0] || bk.startDate}</span>
                    </td>

                    {/* السيارة */}
                    <td className="py-3.5">
                      <strong className="text-slate-900 block text-xs">{bk.carName}</strong>
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {bk.carPlate}
                      </span>
                    </td>

                    {/* العميل */}
                    <td className="py-3.5">
                      <strong className="text-slate-900 block text-xs">{bk.customer.fullName}</strong>
                      <span className="text-[10px] text-slate-500 font-mono dir-ltr block text-right">{bk.customer.phone}</span>
                    </td>

                    {/* فترة الإيجار وتاريخ التسليم */}
                    <td className="py-3.5">
                      <span className="text-slate-700 font-bold block">{bk.daysCount} أيام إيجار</span>
                      <span className="text-[10px] text-emerald-700 font-mono block">
                        سلّمت بتاريخ: {bk.actualReturnDate || bk.endDate}
                      </span>
                    </td>

                    {/* الكيلومترات */}
                    <td className="py-3.5 font-mono text-xs">
                      {kmUsed !== null ? (
                        <div>
                          <strong className="text-slate-900 block font-bold">{kmUsed.toLocaleString()} كم</strong>
                          <span className="text-[10px] text-slate-400 block">من {bk.startKm.toLocaleString()} إلى {bk.returnKm?.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* المبلغ النهائي */}
                    <td className="py-3.5 font-mono font-bold text-emerald-800 text-xs">
                      {bk.finalTotalEGP.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">ج.م</span>
                    </td>

                    {/* مصير التأمين */}
                    <td className="py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                        bk.depositStatus === 'refunded_full'
                          ? 'text-emerald-700'
                          : bk.depositStatus === 'refunded_partial'
                          ? 'text-blue-700'
                          : 'text-slate-600'
                      }`}>
                        {bk.depositStatus === 'refunded_full' ? '✓ مسترد بالكامل' :
                         bk.depositStatus === 'refunded_partial' ? '✓ تم خصم تسوية' : '✓ مغلق'}
                      </span>
                      {bk.latePenaltyFeeEGP ? (
                        <span className="block text-[10px] text-rose-600 font-mono">
                          غرامة تأخير: {bk.latePenaltyFeeEGP} ج.م
                        </span>
                      ) : null}
                    </td>

                    {/* الحالة */}
                    <td className="py-3.5">
                      {getStatusBadge(bk.status)}
                    </td>

                    {/* وثيقة العقد */}
                    <td className="py-3.5 pl-4 text-center">
                      <button
                        onClick={() => onOpenContract(bk)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer border border-slate-200"
                        title="عرض العقد المغلق والمخالصة"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-600" /> عرض العقد
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRejectedTable = (items: Booking[]) => (
    <div className="bg-white border border-rose-200 rounded-2xl shadow-xs overflow-hidden">
      <div className="p-4 bg-rose-50/80 border-b border-rose-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
          <h5 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600" /> طلبات الحجز المرفوضة
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-rose-100 text-rose-800 font-bold">{items.length}</span>
          </h5>
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline">أرشيف الطلبات التي لم تتم الموافقة عليها</span>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <th className="py-3 pr-4">رقم الطلب</th>
              <th className="py-3">السيارة</th>
              <th className="py-3">العميل</th>
              <th className="py-3">الفترة المطلوبة</th>
              <th className="py-3">المبلغ والتأمين</th>
              <th className="py-3">سبب الرفض</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400">لا توجد طلبات مرفوضة.</td></tr>
            ) : items.map((booking) => {
              const rejection = booking.notes?.split(/\r?\n/).find((line) => line.startsWith('رفض الطلب بواسطة'));
              return (
                <tr key={booking.id} className="align-top hover:bg-rose-50/30">
                  <td className="py-3.5 pr-4"><span className="font-mono font-bold text-slate-800">{booking.bookingNumber}</span><span className="block mt-1 text-[10px] text-slate-400">{booking.createdAt?.split('T')[0] || '—'}</span></td>
                  <td className="py-3.5"><strong className="block text-slate-900">{booking.carName}</strong><span className="text-[10px] text-slate-500">{booking.carPlate}</span></td>
                  <td className="py-3.5"><strong className="block text-slate-900">{booking.customer.fullName}</strong><span dir="ltr" className="block text-right text-[10px] text-slate-500">{booking.customer.phone}</span></td>
                  <td className="py-3.5 font-mono text-[11px] text-slate-700"><span className="block">استلام: {booking.startDate} {booking.startTime}</span><span className="block mt-1">إرجاع: {booking.endDate} {booking.endTime}</span></td>
                  <td className="py-3.5"><strong className="block font-mono text-slate-800">{booking.finalTotalEGP.toLocaleString()} ج.م</strong><span className="mt-1 block text-[10px] text-slate-500">التأمين: {booking.securityDepositEGP.toLocaleString()} ج.م</span></td>
                  <td className="max-w-xs py-3.5 pl-4 text-rose-800">{rejection || 'لم يُسجّل سبب الرفض'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fadeIn font-arabic">
      
      {/* 1. الترويسة الرئيسية والبطاقات الإحصائية المنفصلة */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" /> إدارة العقود والتشغيل المالي
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              أقسام منفصلة للحجوزات الحالية والعقود المكتملة وطلبات الحجز المرفوضة
            </p>
          </div>

          {/* تبويبات التبديل الرئيسية البارزة (القسم الأول vs القسم الثاني) */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveSection('pending');
                setStatusFilter('all');
              }}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeSection === 'pending' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>بانتظار الموافقة</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeSection === 'pending' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-900'
              }`}>
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSection('active');
                setStatusFilter('all');
              }}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeSection === 'active'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>العقود الحالية بالشارع</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeSection === 'active' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {activeBookings.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSection('rejected');
                setStatusFilter('all');
              }}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeSection === 'rejected'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>الطلبات المرفوضة</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeSection === 'rejected' ? 'bg-rose-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {rejectedBookings.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSection('completed');
                setStatusFilter('all');
              }}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeSection === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>العقود التي تم تسليمها</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeSection === 'completed' ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {completedBookings.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveSection('all');
                setStatusFilter('all');
              }}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="عرض جميع أقسام الحجوزات"
            >
              الكل ({bookings.length})
            </button>
          </div>
        </div>

        {/* كروت المؤشرات السريعة */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-blue-800 block font-bold">عقود سارية في الشارع</span>
              <strong className="text-xl font-black font-mono text-blue-900 block mt-0.5">{runningCount} عقود</strong>
              <span className="text-[10px] text-blue-600 font-mono mt-0.5 block">
                إيراد التشغيل: {totalActiveRevenue.toLocaleString()} ج.م
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Key className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-900 block font-bold">تأمينات محجوزة حالياً</span>
              <strong className="text-xl font-black font-mono text-amber-900 block mt-0.5">
                {totalHeldDeposits.toLocaleString()} ج.م
              </strong>
              <span className="text-[10px] text-amber-700 block mt-0.5">
                {pendingCount > 0 ? `${pendingCount} صفقات بانتظار الاعتماد` : 'جميع الصفقات معتمدة'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-900 block font-bold">عقود مستلمة ومغلقة</span>
              <strong className="text-xl font-black font-mono text-emerald-900 block mt-0.5">{deliveredCount} عقود</strong>
              <span className="text-[10px] text-emerald-700 font-mono mt-0.5 block">
                المحصّل الكلي: {totalCompletedRevenue.toLocaleString()} ج.م
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Archive className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. شريط البحث والتصفية الموحد */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث برقم العقد، اسم العميل، رقم الهاتف، اسم السيارة، رقم اللوحة، أو الموظف المسؤول..."
            className="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs bg-slate-50/60 font-arabic"
          />
        </div>

        {/* فلاتر إضافية حسب القسم المختار */}
        {activeSection === 'active' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              الكل ({activeBookings.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'active' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800'
              }`}
            >
              سارية بالشارع ({runningCount})
            </button>
            {pendingCount > 0 && (
              <button
                onClick={() => setStatusFilter('pending_approval')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'pending_approval' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-amber-50 text-amber-800'
                }`}
              >
                بانتظار الاعتماد ({pendingCount})
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. عرض الأقسام وفق التبويب المختار */}
      {activeSection === 'pending' && renderPendingCards()}
      {activeSection === 'active' && renderActiveTable(filteredActive)}
      {activeSection === 'completed' && renderCompletedTable(filteredCompleted)}
      {activeSection === 'rejected' && renderRejectedTable(filteredRejected)}
      {activeSection === 'all' && (
        <div className="space-y-6">
          {renderActiveTable(filteredActive)}
          {renderCompletedTable(filteredCompleted)}
          {renderRejectedTable(filteredRejected)}
        </div>
      )}

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
