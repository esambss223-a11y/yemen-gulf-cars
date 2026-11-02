'use client';

import { COMPANY_CONTACT } from '@/lib/company-contact';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { VehicleOwner, Car, Booking } from '@/types/fleet';
import { Printer, X, FileText, CheckCircle2, UserRound, Phone, CreditCard, Building } from 'lucide-react';
import './owner-settlement-print.css';

interface OwnerSettlementModalProps {
  owner: VehicleOwner;
  cars: Car[];
  bookings: Booking[];
  onClose: () => void;
}

export default function OwnerSettlementModal({ owner, cars, bookings, onClose }: OwnerSettlementModalProps) {
  const [mounted, setMounted] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
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
  }, [onClose]);

  // Filter cars and bookings
  const ownerCars = cars.filter(c => c.ownerId === owner.id);
  const ownerCarIds = ownerCars.map(c => c.id);
  const ownerBookings = bookings.filter(b => ownerCarIds.includes(b.carId));

  // Financial calculations
  const totalRevenueEGP = ownerBookings.reduce((sum, b) => sum + (b.finalTotalEGP || b.totalRentEGP || 0), 0);
  const totalRentalDays = ownerBookings.reduce((sum, b) => sum + b.daysCount, 0);

  let ownerPayoutEGP = 0;
  if (owner.commissionModel === 'fixed_monthly') {
    ownerPayoutEGP = owner.fixedMonthlyRateEGP || 35000;
  } else if (owner.commissionModel === 'fixed_daily') {
    ownerPayoutEGP = totalRentalDays * (owner.fixedDailyRateEGP || 1200);
  } else {
    ownerPayoutEGP = Math.round((totalRevenueEGP * (owner.ownerSharePercent || 75)) / 100);
  }

  const companyCommissionEGP = Math.max(0, totalRevenueEGP - ownerPayoutEGP);
  const statementCode = `STMT-${owner.id.slice(-4).toUpperCase()}-${new Date().getFullYear()}`;

  const handlePrint = () => {
    window.print();
  };

  const modalJSX = (
    <div 
      className="owner-settlement-overlay fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden font-arabic text-xs"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="owner-settlement-dialog bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settlement-title"
      >
        {/* Header - Unified Deep Slate Luxury Automotive Tone */}
        <header className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0 no-print">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 flex-shrink-0">
              {statementCode}
            </span>
            <div className="truncate">
              <h3 id="settlement-title" className="text-sm font-bold text-white truncate">
                كشف حساب وتصفية أرباح الشريك: {owner.name}
              </h3>
              <span className="text-[10px] text-slate-400 block truncate">
                تقرير الأداء التشغيلي، الإيرادات المحققة، وحصة المالك المعتمدة
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 transition-colors cursor-pointer shadow-xs"
            >
              <Printer size={14} />
              <span>طباعة كشف الحساب / PDF</span>
            </button>
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

        {/* Printable Statement Sheet */}
        <div className="owner-settlement-scroll flex-1 overflow-y-auto overscroll-contain p-4 sm:p-8 bg-slate-100/60 text-slate-900 text-xs print:p-0 print:m-0 print:bg-white print:text-black">
          
          <div className="owner-settlement-sheet max-w-3xl mx-auto space-y-5 border border-slate-200 p-6 sm:p-8 rounded-2xl bg-white shadow-xs print:border-none print:shadow-none print:p-0 print:rounded-none">
            
            {/* Header / Brand Strip */}
            <div className="owner-settlement-brand flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 pb-4 gap-4">
              <div className="text-right">
                <h1 className="text-lg font-black text-slate-900">شركة اليمن والخليج لتوريد وتأجير السيارات</h1>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">إدارة تشغيل أساطيل المستثمرين ومشاركة الأرباح التعاقدية</p>
                <p className="text-[10px] text-slate-400 mt-1">القاهرة — جمهورية مصر العربية | هاتف: <bdi>{COMPANY_CONTACT.displayPhone}</bdi></p>
              </div>

              <div className="text-center sm:text-left flex flex-col items-center sm:items-end flex-shrink-0">
                <div className="w-14 h-14 relative mb-1">
                  <Image src="/logonew.png" alt="شعار الشركة" width={56} height={56} sizes="112px" className="object-contain" priority />
                </div>
                <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-center">
                  <span className="text-[9px] text-slate-500 block">رقم كشف التصفية</span>
                  <span className="font-mono font-bold text-xs text-slate-900">{statementCode}</span>
                </div>
              </div>
            </div>

            {/* Owner & Account Details Card */}
            <div className="owner-settlement-details bg-slate-50 border border-slate-200/90 p-3.5 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">اسم الشريك / المالك:</span>
                <strong className="text-slate-900 block mt-0.5">{owner.name}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">الرقم القومي / الجواز:</span>
                <strong className="text-slate-900 font-mono block mt-0.5">{owner.nationalId || 'غير مسجل'}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">رقم الهاتف:</span>
                <strong className="text-slate-900 font-mono block mt-0.5" dir="ltr">{owner.phone}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">الحساب البنكي / التحويل:</span>
                <strong className="text-slate-900 font-mono block mt-0.5 truncate" title={owner.bankAccount}>{owner.bankAccount || 'غير مسجل'}</strong>
              </div>
            </div>

            {/* Financial Summary Ribbon */}
            <div className="owner-settlement-summary grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block mb-1">إجمالي إيرادات التأجير</span>
                <strong className="text-sm font-mono text-slate-900 block">{totalRevenueEGP.toLocaleString('ar-EG')} ج.م</strong>
                <span className="text-[9px] text-slate-400 block mt-0.5">({totalRentalDays} أيام تشغيل)</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block mb-1">عمولة الإدارة والتشغيل</span>
                <strong className="text-sm font-mono text-slate-900 block">{companyCommissionEGP.toLocaleString('ar-EG')} ج.م</strong>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  ({owner.commissionModel === 'percentage' ? `${100 - (owner.ownerSharePercent || 75)}% للشركة` : 'باقي الإيراد'})
                </span>
              </div>

              <div className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-2xs">
                <span className="text-[10px] text-amber-300 block mb-1 font-bold">صافي المستحق للمالك</span>
                <strong className="text-base font-mono text-white font-extrabold block">{ownerPayoutEGP.toLocaleString('ar-EG')} ج.م</strong>
                <span className="text-[9px] text-emerald-400 block mt-0.5 font-bold">جاهز للصرف والتحويل ✓</span>
              </div>
            </div>

            {/* Bookings & Fleet Operations Table */}
            <div className="owner-settlement-ledger border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-3.5 py-2 font-bold text-xs text-slate-800 border-b border-slate-200 flex items-center justify-between">
                <span>سجل عقود وتشغيل سيارات الشريك</span>
                <span className="text-[10px] text-slate-500 font-normal">({ownerBookings.length} عقود منفذة)</span>
              </div>
              <table className="owner-settlement-table w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50 text-[11px]">
                    <th className="py-2.5 pr-3 font-semibold">رقم العقد</th>
                    <th className="py-2.5 font-semibold">السيارة واللوحة</th>
                    <th className="py-2.5 text-center font-semibold">مدة التشغيل</th>
                    <th className="py-2.5 text-left font-mono font-semibold">الإيراد</th>
                    <th className="py-2.5 pl-3 text-left font-mono font-semibold">حصة المالك</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ownerBookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                        لا توجد حجوزات مسجلة لهذه السيارات خلال الفترة.
                      </td>
                    </tr>
                  ) : (
                    ownerBookings.map((b) => {
                      const share = Math.round(((b.finalTotalEGP || b.totalRentEGP || 0) * (owner.ownerSharePercent || 75)) / 100);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 pr-3 font-mono font-bold text-slate-800">{b.bookingNumber}</td>
                          <td className="py-2.5">
                            <div className="font-bold text-slate-900">{b.carName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{b.carPlate}</div>
                          </td>
                          <td className="py-2.5 text-center font-mono">{b.daysCount} أيام</td>
                          <td className="py-2.5 text-left font-mono">{(b.finalTotalEGP || b.totalRentEGP || 0).toLocaleString('ar-EG')} ج.م</td>
                          <td className="py-2.5 pl-3 text-left font-mono font-bold text-slate-900">
                            {owner.commissionModel === 'percentage' ? `${share.toLocaleString('ar-EG')} ج.م` : 'مدرج بالمرتب'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Signatures & Authorizations */}
            <div className="owner-settlement-signatures pt-6 grid grid-cols-2 gap-8 border-t border-slate-200 text-center">
              <div>
                <span className="text-slate-500 text-[10px] block mb-6">اعتماد المحاسب المالي للشركة:</span>
                <div className="border-b border-dashed border-slate-300 w-44 mx-auto mb-1"></div>
                <strong className="text-[11px] text-slate-800">إدارة الحسابات والمالية</strong>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] block mb-6">توقيع المستثمر / الشريك بالاستلام:</span>
                <div className="border-b border-dashed border-slate-300 w-44 mx-auto mb-1"></div>
                <strong className="text-[11px] text-slate-800">{owner.name}</strong>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );

  if (typeof document !== 'undefined' && mounted) {
    return createPortal(modalJSX, document.body);
  }

  return modalJSX;
}
