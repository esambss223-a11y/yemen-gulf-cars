'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Booking } from '@/types/fleet';
import { 
  Printer, 
  X, 
  FileText, 
  User, 
  Car as CarIcon, 
  Phone, 
  CreditCard, 
  Calendar, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  MessageCircle,
  ShieldCheck,
  Eye,
  FileCheck2
} from 'lucide-react';

interface RentalContractModalProps {
  booking: Booking;
  onClose: () => void;
}

export default function RentalContractModal({ booking, onClose }: RentalContractModalProps) {
  const [viewMode, setViewMode] = useState<'details' | 'print'>('details');
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    setViewMode('print');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-arabic">
      
      {/* Container */}
      <div className="bg-[#0b1322] border border-[#c5a059]/40 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl relative my-auto overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0e1a30] shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/30">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">
                  عقد وتفاصيل الحجز
                </h3>
                <span className="font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-xs border border-amber-400/20">
                  {booking.bookingNumber}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  booking.status === 'active' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                  booking.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {booking.status === 'active' ? '● ساري حالياً' :
                   booking.status === 'completed' ? '✓ تم الإرجاع والإغلاق' : 'مؤكد'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تاريخ الإنشاء: {booking.createdAt} | المنشئ: {booking.staffName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* أزرار التبديل بين اللوحة والطباعة */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setViewMode('details')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'details'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> لوحة البيانات
              </button>
              <button
                onClick={() => setViewMode('print')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'print'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" /> العقد الرسمي A4
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" /> طباعة
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================================
            نمط 1: لوحة المعلومات التفاعلية المنظمة (Details Dashboard)
            ========================================================= */}
        {viewMode === 'details' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-white">
            
            {/* بطاقتان رئيسيتان: العميل + السيارة */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* بطاقة العميل */}
              <div className="bg-[#101b33] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <User className="w-4 h-4" /> بيانات المستأجر (الطرف الثاني)
                  </span>
                  <span className="text-[11px] text-slate-400">{booking.customer.nationality || 'مصري'}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">الاسم الكامل:</span>
                    <strong className="text-white text-sm font-black">{booking.customer.fullName}</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> الهاتف:
                    </span>
                    <a 
                      href={`tel:${booking.customer.phone}`}
                      className="font-mono text-amber-400 font-bold hover:underline dir-ltr"
                    >
                      {booking.customer.phone}
                    </a>
                  </div>

                  {booking.customer.whatsapp && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> واتساب:
                      </span>
                      <a 
                        href={`https://wa.me/${booking.customer.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-emerald-400 hover:underline dir-ltr text-[11px]"
                      >
                        {booking.customer.whatsapp}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className="text-slate-400 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" /> الرقم القومي / الجواز:
                    </span>
                    <span className="font-mono text-slate-200 font-bold">{booking.customer.nationalId}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">رقم رخصة القيادة:</span>
                    <span className="font-mono text-slate-200">{booking.customer.licenseNumber}</span>
                  </div>
                </div>
              </div>

              {/* بطاقة المركبة */}
              <div className="bg-[#101b33] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <CarIcon className="w-4 h-4" /> بيانات المركبة المؤجرة
                  </span>
                  <span className="font-mono text-xs bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-bold">
                    لوحة: {booking.carPlate}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">السيارة والموديل:</span>
                    <strong className="text-white text-sm font-black">{booking.carName}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 bg-slate-900/80 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-400 block">عداد الاستلام</span>
                      <strong className="font-mono text-white text-xs">{booking.startKm.toLocaleString()} كم</strong>
                    </div>
                    <div className="p-2 bg-slate-900/80 rounded-xl border border-white/5">
                      <span className="text-[10px] text-slate-400 block">عداد التسليم</span>
                      <strong className="font-mono text-amber-400 text-xs">
                        {booking.returnKm ? `${booking.returnKm.toLocaleString()} كم` : 'قيد التشغيل'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className="text-slate-400">حالة الوقود والتسليم:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ممتلئ (Full)
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* بطاقة التوقيت والمدة */}
            <div className="bg-[#101b33] border border-white/10 rounded-2xl p-4">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-3">
                <Calendar className="w-4 h-4" /> مدة الإيجار والجدول الزمني
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5">
                  <span className="text-slate-400 text-[11px] block">تاريخ ووقت الاستلام</span>
                  <strong className="text-white font-mono text-sm block mt-0.5">{booking.startDate}</strong>
                  <span className="text-slate-400 text-[10px] font-mono">الساعة: {booking.startTime}</span>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5">
                  <span className="text-slate-400 text-[11px] block">تاريخ ووقت الإرجاع المتوقع</span>
                  <strong className="text-white font-mono text-sm block mt-0.5">{booking.endDate}</strong>
                  <span className="text-slate-400 text-[10px] font-mono">الساعة: {booking.endTime}</span>
                </div>

                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 flex flex-col justify-center text-center">
                  <span className="text-amber-400 text-[11px] font-bold">إجمالي مدة العقد</span>
                  <span className="text-xl font-black font-mono text-amber-400 mt-0.5">{booking.daysCount} أيام</span>
                </div>
              </div>

              {/* شريحة توضيح شرط التأخير */}
              <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
                <span className="text-amber-300 font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" /> شرط التأخير المعتمد بالعقد:
                </span>
                <span className="text-slate-300 text-[11px]">
                  مع إبلاغ مسبق: <strong className="text-white font-mono">200 ج.م/ساعة</strong> | بدون إبلاغ مسبق: <strong className="text-rose-400 font-mono">غرامة يوم كامل</strong>
                </span>
              </div>
            </div>

            {/* الحسابات المالية والتأمين */}
            <div className="bg-[#101b33] border border-white/10 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" /> البيان المالي والتأمين المسترد
              </span>

              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="p-2.5">البند</th>
                      <th className="p-2.5 text-center">المدة</th>
                      <th className="p-2.5 text-center">السعر اليومي</th>
                      <th className="p-2.5 text-left">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="p-2.5 text-white">إيجار {booking.carName}</td>
                      <td className="p-2.5 text-center font-mono text-slate-300">{booking.daysCount} أيام</td>
                      <td className="p-2.5 text-center font-mono text-slate-300">{booking.dailyRateEGP.toLocaleString()} ج.م</td>
                      <td className="p-2.5 text-left font-mono text-white font-bold">{booking.totalRentEGP.toLocaleString()} ج.م</td>
                    </tr>
                    {booking.discountAmountEGP > 0 && (
                      <tr className="text-emerald-400">
                        <td className="p-2.5">كوبون خصم ({booking.discountCode})</td>
                        <td className="p-2.5 text-center">-</td>
                        <td className="p-2.5 text-center">-</td>
                        <td className="p-2.5 text-left font-mono font-bold">-{booking.discountAmountEGP.toLocaleString()} ج.م</td>
                      </tr>
                    )}
                    <tr className="bg-amber-500/10 font-bold text-amber-400 text-sm">
                      <td className="p-3">صافي الإيجار المستحق والمدفوع:</td>
                      <td colSpan={2}></td>
                      <td className="p-3 text-left font-mono font-black">{booking.finalTotalEGP.toLocaleString()} ج.م</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* سند التأمين */}
              <div className="p-3 bg-slate-900 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-white block">مبلغ التأمين المسترد (Security Deposit):</strong>
                  <span className="text-[11px] text-slate-400">
                    حالة التأمين: {booking.depositStatus === 'refunded_full' ? 'تم استرجاعه بالكامل للعميل ✓' : 'محتجز لدى الشركة لحين الفحص'}
                  </span>
                </div>
                <div className="text-left font-mono font-black text-amber-400 text-base">
                  {booking.securityDepositEGP.toLocaleString()} ج.م
                </div>
              </div>
            </div>

            {/* ملاحظات الحجز */}
            {booking.notes && (
              <div className="p-3 bg-[#101b33] rounded-xl border border-white/10 text-xs">
                <span className="text-slate-400 block mb-1">ملاحظات العقد والتسليم:</span>
                <p className="text-slate-200">{booking.notes}</p>
              </div>
            )}

            {/* شريط الإجراءات في الأسفل */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
              <button
                onClick={() => setViewMode('print')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4 text-amber-400" /> عرض شكل العقد الورقي
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" /> طباعة فورية للعقد (PDF)
              </button>
            </div>

          </div>
        )}

        {/* =========================================================
            نمط 2: ورقة العقد الرسمية للطباعة والحفظ (Print Sheet A4)
            ========================================================= */}
        {viewMode === 'print' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white text-slate-900 font-arabic text-xs print:p-0 print:m-0 print:text-black">
            
            <div ref={printRef} className="max-w-3xl mx-auto space-y-5 border border-slate-300 p-6 sm:p-8 rounded-xl bg-white shadow-sm print:border-none print:shadow-none print:p-0">
              
              {/* 1. الترويسة الرسمية للشركة */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-[#c5a059] pb-4 gap-4">
                <div className="text-right">
                  <h1 className="text-xl font-black text-[#0f172a] tracking-tight">شركة اليمن والخليج لتأجير السيارات</h1>
                  <p className="text-[11px] text-slate-600 font-semibold">YEMEN & GULF LUXURY CAR RENTAL</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">القاهرة - جمهورية مصر العربية | هاتف: 01000000001</p>
                </div>

                <div className="text-center sm:text-left border sm:border-r-2 sm:border-l-0 border-[#c5a059] sm:pr-4 py-1">
                  <span className="text-[10px] text-slate-500 block">رقم العقد التسلسلي:</span>
                  <span className="text-base font-black font-mono text-[#0f172a] tracking-wider block">
                    {booking.bookingNumber}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    تاريخ التحرير: {booking.createdAt}
                  </span>
                </div>
              </div>

              {/* عنوان المستند */}
              <div className="text-center py-1 bg-slate-100 rounded-md border border-slate-200">
                <h2 className="text-sm font-black text-slate-900">
                  عقد إيجار سيارة سياحية وسند تسليم واستلام رسمي
                </h2>
              </div>

              {/* 2. بيانات طرفي العقد */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-[#f1f5f9] px-3 py-1.5 font-bold text-slate-800 border-b border-slate-300">
                  أولاً: بيانات المستأجر (الطرف الثاني)
                </div>
                <div className="p-3 bg-white grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 text-[10px] block">الاسم بالكامل:</span>
                    <strong className="text-slate-900 text-[11px]">{booking.customer.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">الجنسية:</span>
                    <strong className="text-slate-900 text-[11px]">{booking.customer.nationality || 'مصري'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">رقم الهاتف:</span>
                    <strong className="text-slate-900 text-[11px] font-mono">{booking.customer.phone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">الرقم القومي / جواز السفر:</span>
                    <strong className="text-slate-900 text-[11px] font-mono">{booking.customer.nationalId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">رقم رخصة القيادة:</span>
                    <strong className="text-slate-900 text-[11px] font-mono">{booking.customer.licenseNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">الموظف المسؤول:</span>
                    <strong className="text-slate-900 text-[11px]">{booking.staffName}</strong>
                  </div>
                </div>
              </div>

              {/* 3. بيانات المركبة المؤجرة */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-[#f1f5f9] px-3 py-1.5 font-bold text-slate-800 border-b border-slate-300">
                  ثانياً: بيانات المركبة وفترة الاستئجار
                </div>
                <div className="p-3 bg-white grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-500 text-[10px] block">نوع وموديل السيارة:</span>
                    <strong className="text-slate-900 text-[11px]">{booking.carName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">رقم اللوحة:</span>
                    <strong className="text-slate-900 text-[11px] font-mono bg-slate-100 px-1 rounded">{booking.carPlate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">تاريخ ووقت الاستلام:</span>
                    <strong className="text-slate-900 text-[11px] font-mono">{booking.startDate} ({booking.startTime})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">تاريخ ووقت الإرجاع:</span>
                    <strong className="text-slate-900 text-[11px] font-mono">{booking.endDate} ({booking.endTime})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">مدة الإيجار:</span>
                    <strong className="text-slate-900 text-[11px] font-mono">{booking.daysCount} أيام</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">عداد الاستلام (KM Out):</span>
                    <strong className="text-slate-900 text-[11px] font-mono">{booking.startKm.toLocaleString()} كم</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">عداد التسليم (KM In):</span>
                    <strong className="text-slate-900 text-[11px] font-mono">
                      {booking.returnKm ? `${booking.returnKm.toLocaleString()} كم` : '--- (قيد التشغيل)'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">حالة الوقود والتجهيز:</span>
                    <strong className="text-slate-900 text-[11px]">ممتلئ (Full) ✓</strong>
                  </div>
                </div>
              </div>

              {/* 4. الحسابات المالية وسند التأمين */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-[#f1f5f9] px-3 py-1.5 font-bold text-slate-800 border-b border-slate-300">
                  ثالثاً: الحساب المالي وسند التأمين المسترد (بالجنيه المصري EGP)
                </div>
                <div className="p-3 bg-white space-y-2">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600 text-[11px]">
                        <th className="py-1">البيان</th>
                        <th className="py-1 text-center">المدة</th>
                        <th className="py-1 text-center">السعر اليومي</th>
                        <th className="py-1 text-left">المبلغ الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      <tr>
                        <td className="py-2">إيجار سيارة سياحية ({booking.carName})</td>
                        <td className="py-2 text-center font-mono">{booking.daysCount} أيام</td>
                        <td className="py-2 text-center font-mono">{booking.dailyRateEGP.toLocaleString()} ج.م</td>
                        <td className="py-2 text-left font-mono">{booking.totalRentEGP.toLocaleString()} ج.م</td>
                      </tr>
                      {booking.discountAmountEGP > 0 && (
                        <tr className="text-emerald-700">
                          <td className="py-1.5">كوبون خصم ترويجي ({booking.discountCode})</td>
                          <td className="py-1.5 text-center">خصم معتمد</td>
                          <td className="py-1.5 text-center">-</td>
                          <td className="py-1.5 text-left font-mono">-{booking.discountAmountEGP.toLocaleString()} ج.م</td>
                        </tr>
                      )}
                      <tr className="font-bold border-t-2 border-slate-300 text-slate-900 bg-slate-50">
                        <td className="py-2 pr-2">صافي مبلغ الإيجار المدفوع:</td>
                        <td colSpan={2}></td>
                        <td className="py-2 pl-2 text-left font-mono text-sm">{booking.finalTotalEGP.toLocaleString()} ج.م</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center justify-between">
                    <div>
                      <strong className="text-amber-900 text-[11px] block">سند كفالة تأمين مسترد (Security Deposit):</strong>
                      <p className="text-[10px] text-amber-800">
                        يُرد هذا المبلغ كاملاً للمستأجر فور تسليم السيارة وفحص سلامتها ومطابقة الكيلومترات والوقود.
                      </p>
                    </div>
                    <div className="text-left font-mono font-black text-amber-900 text-sm shrink-0 pr-4">
                      {booking.securityDepositEGP.toLocaleString()} ج.م
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. شروط وأحكام العقد القانونية */}
              <div className="border border-slate-200 p-3 rounded-lg bg-slate-50 text-[9px] text-slate-600 space-y-1 leading-relaxed">
                <strong className="text-slate-800 block text-[10px] mb-0.5">الشروط والأحكام العامة وقواعد التأخير:</strong>
                <p>1. يقر المستأجر بأنه استلم السيارة الموضحة أعلاه بحالة ميكانيكية وهيكلية ممتازة، ويتعهد بإعادتها بنفس الحالة والوقود في الموعد المحدد.</p>
                <p>2. يتحمل المستأجر المسؤولية الجنائية والمدنية الكاملة عن أي مخالفات مرورية أو حوادث أو استخدام مخالف للقوانين المصرية أثناء فترة العقد.</p>
                <p>3. يلتزم المستأجر بعدم قيادة السيارة من قبل أي شخص غير مسجل في هذا العقد، ويحظر تأجيرها من الباطن أو السير بها في الطرق الوعرة.</p>
                <p className="text-amber-900 font-bold bg-amber-50 p-1.5 rounded border border-amber-200">
                  4. قواعد التأخير: في حال إبلاغ الشركة مسبقاً بالتأخير وموافقتها، تُحتسب كل ساعة زيادة بقيمة 200 ج.م/ساعة. أما في حال التأخير دون إبلاغ مسبق للشركة، فيتحمل المستأجر غرامة إيجار يوم كامل إضافي.
                </p>
              </div>

              {/* 6. التوقيعات والاعتماد */}
              <div className="pt-4 grid grid-cols-2 gap-8 border-t border-slate-300 text-center">
                <div>
                  <span className="text-slate-500 text-[10px] block mb-6">توقيع المستأجر (الطرف الثاني) بما يفيد الموافقة والاستلام:</span>
                  <div className="border-b border-dashed border-slate-400 w-44 mx-auto mb-1"></div>
                  <strong className="text-[11px] text-slate-800">{booking.customer.fullName}</strong>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] block mb-6">توقيع وختم شركة اليمن والخليج (الطرف الأول):</span>
                  <div className="border-b border-dashed border-slate-400 w-44 mx-auto mb-1"></div>
                  <strong className="text-[11px] text-slate-800">المسؤول: {booking.staffName}</strong>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
