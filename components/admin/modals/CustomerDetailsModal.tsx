'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Customer, Booking, CustomerTier } from '@/types/fleet';
import { 
  X, 
  UserRound,
  Phone, 
  MessageSquare, 
  CreditCard, 
  FileText, 
  MapPin, 
  Car, 
  Pencil, 
  Calendar,
  ExternalLink,
  ShieldCheck, 
  UserCheck, 
  AlertTriangle,
  Award,
  TrendingUp,
  CheckCircle2,
  Clock,
  Briefcase,
  Building
} from 'lucide-react';
import { BOOKING_STATUS_LABELS } from '@/lib/car-record';

interface CustomerDetailsModalProps {
  customer: Customer | null;
  bookings: Booking[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
  onNewBooking: (customer: Customer) => void;
  onOpenContract?: (booking: Booking) => void;
}

export default function CustomerDetailsModal({
  customer,
  bookings,
  isOpen,
  onClose,
  onEdit,
  onNewBooking,
  onOpenContract,
}: CustomerDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'contracts' | 'safety'>('profile');
  const [mounted, setMounted] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      closeBtnRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Find all bookings for this customer
  const customerBookings = useMemo(() => {
    if (!customer) return [];
    return bookings.filter(b => 
      b.customer.id === customer.id || 
      b.customer.phone === customer.phone || 
      (b.customer.nationalId && b.customer.nationalId === customer.nationalId)
    ).sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [customer, bookings]);

  // Resolve all contract fields from customer record or from their existing signed contracts
  const c = useMemo(() => {
    if (!customer) return null;
    const latestDetails = customerBookings.find(b => b.contractRecord?.details?.tenantAddress)?.contractRecord?.details;
    return {
      fullName: customer.fullName,
      nationality: customer.nationality || 'مصري',
      phone: customer.phone,
      whatsapp: customer.whatsapp || customer.phone,
      secondaryPhone: customer.secondaryPhone || latestDetails?.secondaryPhone || '',
      nationalId: customer.nationalId,
      idIssuer: customer.idIssuer || latestDetails?.idIssuer || '',
      governorate: customer.governorate || latestDetails?.governorate || 'القاهرة',
      address: customer.address || latestDetails?.tenantAddress || '',
      workAddress: customer.workAddress || latestDetails?.workAddress || '',
      licenseNumber: customer.licenseNumber,
      licenseType: customer.licenseType || latestDetails?.licenseType || 'خاصة',
      licenseIssuer: customer.licenseIssuer || latestDetails?.licenseIssuer || '',
      licenseIssuedAt: customer.licenseIssuedAt || latestDetails?.licenseIssuedAt || '',
      licenseExpiresAt: customer.licenseExpiresAt || latestDetails?.licenseExpiresAt || '',
      driverName: customer.driverName || latestDetails?.driverName || '',
      driverPhone: customer.driverPhone || '',
      driverAddress: customer.driverAddress || latestDetails?.driverAddress || '',
      driverNationalId: customer.driverNationalId || latestDetails?.driverNationalId || '',
      driverLicenseNumber: customer.driverLicenseNumber || latestDetails?.driverLicenseNumber || '',
      driverLicenseType: customer.driverLicenseType || latestDetails?.driverLicenseType || 'خاصة',
      tier: customer.tier || 'regular',
      trustScore: customer.trustScore ?? 85,
      cleanlinessScore: customer.cleanlinessScore || 'clean',
      damagesCount: customer.damagesCount ?? 0,
      notes: customer.notes || '',
    };
  }, [customer, customerBookings]);

  if (!isOpen || !customer || !c) return null;

  const isBlacklisted = customer.tier === 'blacklist';
  const isLicenseExpired = c.licenseExpiresAt && new Date(c.licenseExpiresAt) < new Date();
  const customerCode = `YG-CUST-${customer.id.slice(-4).toUpperCase()}`;

  const tierBadgeMap: Record<CustomerTier, { label: string; badgeClass: string }> = {
    vip_gold: { label: 'VIP ذهبي', badgeClass: 'bg-amber-400 text-slate-950 font-extrabold' },
    vip_silver: { label: 'VIP فضي', badgeClass: 'bg-slate-200 text-slate-800 font-bold' },
    blacklist: { label: 'محظور (قائمة سوداء)', badgeClass: 'bg-rose-600 text-white font-bold' },
    regular: { label: 'عميل منتظم', badgeClass: 'bg-slate-800 text-slate-200 font-semibold' },
  };

  const currentTierBadge = tierBadgeMap[c.tier] || tierBadgeMap.regular;

  const modalJSX = (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-hidden font-arabic text-xs"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Dialog Card: Constrained height, strictly single inner scroll */}
      <div 
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] h-auto animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-details-modal-title"
      >
        {/* 1. Top Header: Luxury Deep Slate Automotive Tone */}
        <header className="flex-shrink-0 px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 flex-shrink-0">
              {customerCode}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="customer-details-modal-title" className="text-base font-extrabold truncate text-white">
                  {c.fullName}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${currentTierBadge.badgeClass}`}>
                  {currentTierBadge.label}
                </span>
                {customer.identityVerified && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950/90 text-emerald-300 border border-emerald-700 font-bold inline-flex items-center gap-1">
                    <CheckCircle2 size={11} /> هوية موثقة
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>الجنسية: <b className="text-slate-300 font-normal">{c.nationality}</b></span>
                <span>·</span>
                <span>المحافظة: <b className="text-slate-300 font-normal">{c.governorate}</b></span>
                <span>·</span>
                <span className="font-mono text-slate-300" dir="ltr">{c.phone}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg grid place-items-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="إغلاق النافذة"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* 2. Unified Navigation Tabs */}
        <div className="flex-shrink-0 flex items-center gap-1 px-5 pt-2.5 border-b border-slate-200 bg-slate-50/80">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-slate-900 text-slate-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserRound size={14} />
            <span>بيانات العقد والسكن</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contracts')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'contracts'
                ? 'border-slate-900 text-slate-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Car size={14} />
            <span>سجل العقود ({customerBookings.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('safety')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'safety'
                ? 'border-slate-900 text-slate-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck size={14} />
            <span>مؤشر الأمان والمخاطر</span>
          </button>
        </div>

        {/* 3. Single Smooth Scroll Body (Only this container scrolls) */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3.5 text-xs">
          
          {/* TAB 1: PROFILE & CONTRACT FACTS */}
          {activeTab === 'profile' && (
            <div className="space-y-3.5">
              
              {/* Quick Contact & Action Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${c.phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-bold text-slate-800 text-xs shadow-2xs transition-colors"
                  >
                    <Phone size={13} className="text-slate-700" />
                    <span>اتصال بالهاتف:</span>
                    <span className="font-mono dir-ltr">{c.phone}</span>
                  </a>

                  {c.whatsapp && (
                    <a
                      href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold text-white text-xs shadow-2xs transition-colors"
                    >
                      <MessageSquare size={13} />
                      <span>واتساب</span>
                    </a>
                  )}
                </div>

                <div className="text-left font-mono text-[11px] text-slate-600">
                  <span className="text-slate-400">هاتف الطوارئ بالعقد: </span>
                  <strong className="text-slate-900 font-bold">{c.secondaryPhone || 'غير مسجل'}</strong>
                </div>
              </div>

              {/* 2-Column Responsive Cards Grid (1 col on mobile, 2 col on md+) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* CARD 1: IDENTITY & ID FACTS */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <CreditCard size={14} className="text-slate-700" />
                      بيانات الهوية والتوثيق المعتمدة
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {customer.identityVerified ? 'موثقة رسمياً' : 'قيد التدقيق'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 font-medium block">الرقم القومي / جواز السفر</span>
                      <strong className="font-mono text-slate-900 font-bold block mt-0.5 truncate" dir="auto">
                        {c.nationalId || 'غير مسجل'}
                      </strong>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 font-medium block">جهة إصدار الهوية</span>
                      <strong className="text-slate-800 font-bold block mt-0.5 truncate" title={c.idIssuer}>
                        {c.idIssuer || 'غير محددة'}
                      </strong>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 font-medium block">الجنسية المعتمدة</span>
                      <strong className="text-slate-800 font-bold block mt-0.5 truncate">
                        {c.nationality}
                      </strong>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 font-medium block">هاتف الطوارئ بالعقد</span>
                      <strong className="font-mono text-slate-800 font-bold block mt-0.5 truncate">
                        {c.secondaryPhone || 'لا يوجد'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* CARD 2: DRIVING LICENSE SPECS */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <FileText size={14} className="text-slate-700" />
                      رخصة القيادة الرسمية بالعقد
                    </span>
                    {c.licenseExpiresAt && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isLicenseExpired ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isLicenseExpired ? '⚠️ منتهية' : '✅ سارية'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 font-medium block">رقم رخصة القيادة</span>
                      <strong className="font-mono text-slate-900 font-bold block mt-0.5" dir="auto">
                        {c.licenseNumber || 'غير مسجلة'}
                      </strong>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 font-medium block">نوع وتصنيف الرخصة</span>
                      <strong className="text-slate-800 font-bold block mt-0.5">
                        {c.licenseType || 'خاصة'}
                      </strong>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 font-medium block">جهة الإصدار / وحدة المرور</span>
                      <strong className="text-slate-800 font-bold block mt-0.5 truncate" title={c.licenseIssuer}>
                        {c.licenseIssuer || 'غير مسجلة'}
                      </strong>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 font-medium block">فترة الصلاحية والانتهاء</span>
                      <strong className="font-mono text-slate-900 font-bold block mt-0.5 text-[11px]" dir="auto">
                        {[c.licenseIssuedAt, c.licenseExpiresAt].filter(Boolean).join(' → ') || 'غير محددة'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* CARD 3: RESIDENCE & WORKPLACE */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <MapPin size={14} className="text-slate-700" />
                      محل الإقامة ومقر العمل الموثق
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      محافظة {c.governorate}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 font-medium block">عنوان السكن والمنزل بالتفصيل</span>
                      <strong className="text-slate-900 font-bold block mt-0.5 leading-snug">
                        {c.address ? `${c.address} — محافظة ${c.governorate}` : 'لم يتم تسجيل عنوان سكن بعد'}
                      </strong>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 font-medium block">مقر وجهة العمل</span>
                      <strong className="text-slate-800 font-bold block mt-0.5 truncate" title={c.workAddress}>
                        {c.workAddress || 'غير محدد'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* CARD 4: AUTHORIZED ADDITIONAL DRIVER */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <UserCheck size={14} className="text-slate-700" />
                      السائق الإضافي المصرّح له في العقد
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {c.driverName ? 'مصرّح له بالقيادة' : 'المستأجر فقط'}
                    </span>
                  </div>

                  {c.driverName ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 font-medium block">اسم السائق</span>
                        <strong className="text-slate-900 font-bold block mt-0.5 truncate">{c.driverName}</strong>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 font-medium block">هاتف السائق</span>
                        <strong className="font-mono text-slate-800 font-bold block mt-0.5">{c.driverPhone || 'غير مسجل'}</strong>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 font-medium block">الرقم القومي / الجواز</span>
                        <strong className="font-mono text-slate-800 font-bold block mt-0.5">{c.driverNationalId || 'غير مسجل'}</strong>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 font-medium block">رخصة السائق</span>
                        <strong className="font-mono text-slate-800 font-bold block mt-0.5">
                          {c.driverLicenseNumber || 'غير مسجلة'} ({c.driverLicenseType || 'خاصة'})
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-center text-slate-500">
                      <p className="font-bold text-slate-800 text-xs">المستأجر هو السائق المعتمد الوحيد</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">لم يتم إضافة سائق إضافي في بنود العقد لهذا العميل.</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Financial & Rental Activity Ribbon */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/80">
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  سجل النشاط المالي والتعاقدي للعميل
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200/90 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-medium block">إجمالي العقود المنفذة</span>
                    <strong className="text-sm font-extrabold text-slate-900 block mt-0.5 font-mono">
                      {customerBookings.length}
                    </strong>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200/90 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-medium block">إجمالي الإنفاق</span>
                    <strong className="text-sm font-extrabold text-slate-900 block mt-0.5 font-mono">
                      {(customer.totalSpentEGP || 0).toLocaleString('ar-EG')} <small className="text-[10px] font-normal text-slate-500">ج.م</small>
                    </strong>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200/90 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-medium block">نقاط الولاء</span>
                    <strong className="text-sm font-extrabold text-slate-900 block mt-0.5 font-mono">
                      {customer.loyaltyPoints || 0}
                    </strong>
                  </div>

                  <div className="p-2.5 bg-white rounded-lg border border-slate-200/90 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-medium block">مؤشر الثقة الرقمي</span>
                    <strong className="text-sm font-extrabold text-slate-900 block mt-0.5 font-mono flex items-center justify-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${c.trustScore >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {c.trustScore} / 100
                    </strong>
                  </div>
                </div>
              </div>

              {/* Special Notes & Preferences */}
              {c.notes && (
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-[11px] text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 block font-bold mb-0.5">ملاحظات وتفضيلات العميل:</strong>
                  <p>{c.notes}</p>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: CONTRACTS & BOOKINGS HISTORY */}
          {activeTab === 'contracts' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 block">إجمالي العقود</span>
                  <strong className="text-slate-900 font-mono text-sm block mt-0.5">
                    {customerBookings.length}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">نقاط الولاء</span>
                  <strong className="text-slate-900 font-mono text-sm block mt-0.5">
                    {customer.loyaltyPoints || 0}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">إجمالي الإنفاق</span>
                  <strong className="text-slate-900 font-mono text-sm block mt-0.5">
                    {(customer.totalSpentEGP || 0).toLocaleString('ar-EG')} <small className="text-[10px] font-normal text-slate-500">ج.م</small>
                  </strong>
                </div>
              </div>

              {customerBookings.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                  <Car size={24} className="mx-auto text-slate-400 mb-1" />
                  <p className="font-bold text-slate-800 text-xs">لا توجد عقود سابقة مسجلة لهذا العميل</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">استخدم زر "حجز سيارة لهذا العميل فوراً" بالأسفل لإنشاء أول عقد.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {customerBookings.map((bk) => (
                    <div
                      key={bk.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-wrap items-center justify-between gap-2.5 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-slate-900 font-bold">{bk.carName}</strong>
                          <span className="font-mono text-[10px] text-slate-500">({bk.carPlate})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar size={11} className="text-slate-400" />
                          <span>{bk.startDate} إلى {bk.endDate} ({bk.daysCount} أيام)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-left font-mono">
                          <strong className="text-slate-900 text-xs block">
                            {(bk.finalTotalEGP || bk.totalRentEGP).toLocaleString('ar-EG')} ج.م
                          </strong>
                          <span className="text-[10px] text-slate-500 block">
                            {BOOKING_STATUS_LABELS[bk.status] || bk.status}
                          </span>
                        </div>

                        {onOpenContract && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenContract(bk);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                            title="عرض ملف العقد والطباعة"
                          >
                            <ExternalLink size={12} />
                            <span>عرض العقد</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAFETY & DIGITAL RISK */}
          {activeTab === 'safety' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-slate-700" />
                    مؤشر الثقة والأمان الرقمي للعميل
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900">{c.trustScore} / 100</span>
                </div>

                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      c.trustScore >= 80 ? 'bg-slate-900' : c.trustScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, c.trustScore))}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] font-medium">مستوى نظافة السيارة المعتاد</span>
                    <strong className="text-slate-800 mt-0.5 block font-bold">
                      {c.cleanlinessScore === 'dirty' ? 'يحتاج تنظيف وتنبيه' : 'ممتاز ونظيف دائماً'}
                    </strong>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] font-medium">سجل الحوادث والأضرار</span>
                    <strong className="text-slate-800 mt-0.5 block font-bold">
                      {c.damagesCount ? `${c.damagesCount} حوادث مسجلة` : 'سجل نظيف تماماً'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 4. Sticky Footer: Always Visible and Pinned at Bottom */}
        <footer className="flex-shrink-0 px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            كود العميل: <b className="font-mono text-slate-700">{customerCode}</b>
          </span>

          <div className="flex items-center gap-2 mr-auto sm:mr-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(customer);
              }}
              className="py-2 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="تعديل كافة بيانات العميل والسكن والرخصة"
            >
              <Pencil size={13} />
              <span>تعديل بيانات العميل</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onNewBooking(customer);
              }}
              disabled={isBlacklisted}
              className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-extrabold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="حجز سيارة لهذا العميل فوراً"
            >
              <Car size={13} className="text-amber-300" />
              <span>حجز سيارة لهذا العميل فوراً</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-medium text-xs cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </footer>

      </div>
    </div>
  );

  // Render via portal directly to document.body when mounted in browser
  if (typeof document !== 'undefined' && mounted) {
    return createPortal(modalJSX, document.body);
  }

  return modalJSX;
}
