'use client';

import React, { useState } from 'react';
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
  DollarSign
} from 'lucide-react';
import { Booking, BookingStatus, StaffUser } from '@/types/fleet';

interface BookingsTabProps {
  bookings: Booking[];
  currentStaff?: StaffUser;
  onOpenContract: (booking: Booking) => void;
  onReturnCar: (booking: Booking) => void;
  onApproveBooking?: (booking: Booking) => void;
}

export default function BookingsTab({
  bookings,
  currentStaff,
  onOpenContract,
  onReturnCar,
  onApproveBooking,
}: BookingsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all');

  // تصفية الحجوزات
  const filteredBookings = bookings.filter(bk => {
    const matchesStatus = statusFilter === 'all' || bk.status === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    if (!term) return matchesStatus;

    const matchesSearch = 
      bk.bookingNumber.toLowerCase().includes(term) ||
      bk.carName.toLowerCase().includes(term) ||
      bk.carPlate.includes(term) ||
      bk.customer.fullName.toLowerCase().includes(term) ||
      bk.customer.phone.includes(term) ||
      bk.customer.nationalId.includes(term) ||
      bk.staffName.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  // إحصائيات سريعة
  const pendingCount = bookings.filter(b => b.status === 'pending_approval').length;
  const activeCount = bookings.filter(b => b.status === 'active').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'pending_approval':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
            <Clock className="w-3 h-3 text-amber-600" /> بانتظار تدقيق الموظف
          </span>
        );
      case 'active':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 bg-blue-100 text-blue-900 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" /> ساري بالتشغيل
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-200">
            ✓ تم الاستلام والإغلاق
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

  return (
    <div className="space-y-4 animate-fadeIn font-arabic">
      
      {/* 1. الترويسة الرئيسية + مؤشرات الحجوزات */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" /> إدارة الصفقات والعقود المعتمدة (Secure Contracts)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              لا يتم اعتماد أي صفقة إلا عبر موظف مسؤول، مع توثيق العداد، التأمين، وشروط التأخير المعتمدة
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">إجمالي العقود: <strong className="font-mono text-slate-900">{bookings.length}</strong></span>
          </div>
        </div>

        {/* كروت سريعة للمراحل */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <button
            onClick={() => setStatusFilter(statusFilter === 'pending_approval' ? 'all' : 'pending_approval')}
            className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
              statusFilter === 'pending_approval'
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                : 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/70 text-amber-900'
            }`}
          >
            <span className="text-[11px] font-bold block">1. بانتظار فحص وتأكيد الموظف</span>
            <strong className="text-xl font-black font-mono block mt-0.5">{pendingCount} صفقات</strong>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
            className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-blue-50/70 border-blue-200/80 hover:bg-blue-100/70 text-blue-900'
            }`}
          >
            <span className="text-[11px] font-bold block">2. عقود سارية في الشارع</span>
            <strong className="text-xl font-black font-mono block mt-0.5">{activeCount} عقود</strong>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
            className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-100/70 text-emerald-900'
            }`}
          >
            <span className="text-[11px] font-bold block">3. عقود مكتملة ومستلمة</span>
            <strong className="text-xl font-black font-mono block mt-0.5">{completedCount} عقود</strong>
          </button>
        </div>
      </div>

      {/* 2. شريط البحث والتصفية */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث برقم العقد، اسم العميل، الهاتف، السيارة، أو الموظف المسؤول..."
            className="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs bg-slate-50/60 font-arabic"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            الكل ({bookings.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'active' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800'
            }`}
          >
            السارية ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'completed' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            المكتملة ({completedCount})
          </button>
        </div>
      </div>

      {/* 3. جدول الصفقات والعقود الاحترافي */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3.5 pr-4">العقد والمسؤول</th>
                <th className="py-3.5">السيارة واللوحة</th>
                <th className="py-3.5">العميل والهاتف</th>
                <th className="py-3.5">المدة وموعد الإرجاع</th>
                <th className="py-3.5">قيمة الإيجار</th>
                <th className="py-3.5">التأمين المسترد</th>
                <th className="py-3.5">الحالة</th>
                <th className="py-3.5 pl-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    لا توجد عقود أو صفقات مطابقة لبحثك
                  </td>
                </tr>
              ) : (
                filteredBookings.map((bk) => (
                  <tr key={bk.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* رقم العقد والموظف المسؤول */}
                    <td className="py-3.5 pr-4">
                      <span className="font-mono font-bold text-amber-700 block text-xs">{bk.bookingNumber}</span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <UserCheck className="w-3 h-3 text-slate-400" /> المسؤول: {bk.staffName}
                      </span>
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
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" /> الإرجاع: {bk.endDate}
                      </div>
                    </td>

                    {/* الإجمالي */}
                    <td className="py-3.5 font-mono font-bold text-slate-900 text-xs">
                      {bk.finalTotalEGP.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">ج.م</span>
                    </td>

                    {/* التأمين */}
                    <td className="py-3.5">
                      <span className="font-mono font-bold text-slate-800 text-xs">{bk.securityDepositEGP.toLocaleString()} ج.م</span>
                      <span className={`block text-[10px] font-bold ${
                        bk.depositStatus === 'held' ? 'text-amber-600' :
                        bk.depositStatus === 'refunded_partial' ? 'text-blue-600' : 'text-emerald-600'
                      }`}>
                        {bk.depositStatus === 'held' ? '● محجوز' :
                         bk.depositStatus === 'refunded_partial' ? '✓ تم خصم الغرامة' : '✓ مسترد'}
                      </span>
                    </td>

                    {/* الحالة */}
                    <td className="py-3.5">
                      {getStatusBadge(bk.status)}
                    </td>

                    {/* الإجراءات */}
                    <td className="py-3.5 pl-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* زر اعتماد الحجز إن كان معلقاً */}
                        {bk.status === 'pending_approval' && onApproveBooking && (
                          <button
                            onClick={() => onApproveBooking(bk)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                            title="فحص رخصة العميل واعتماد تسليم السيارة"
                          >
                            <Check className="w-3.5 h-3.5" /> اعتماد الصفقة
                          </button>
                        )}

                        {/* زر لوحة العقد والطباعة */}
                        <button
                          onClick={() => onOpenContract(bk)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#081225] text-slate-700 hover:text-amber-400 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border border-slate-200"
                          title="عرض لوحة العقد والشروط وطباعة PDF"
                        >
                          <FileText className="w-3.5 h-3.5" /> العقد
                        </button>

                        {/* زر استلام السيارة وتدقيق التأخير */}
                        {bk.status === 'active' && (
                          <button
                            onClick={() => onReturnCar(bk)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black flex items-center gap-1 cursor-pointer shadow-xs"
                            title="فحص العداد وتدقيق التأخير واسترجاع التأمين"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> استلام وفحص
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

    </div>
  );
}
