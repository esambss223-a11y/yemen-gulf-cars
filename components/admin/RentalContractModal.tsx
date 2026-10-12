'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { Booking } from '@/types/fleet';
import { Printer, X, ShieldCheck, FileText, CheckCircle2, Phone, MapPin, Calendar, Car } from 'lucide-react';

interface RentalContractModalProps {
  booking: Booking;
  onClose: () => void;
}

export default function RentalContractModal({ booking, onClose }: RentalContractModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      
      {/* Container */}
      <div className="bg-[#080d1a] border border-[#c5a059]/40 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl relative my-auto">
        
        {/* Top Control Bar (شريط التحكم العلوي - لا يظهر في الطباعة) */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0b1324] rounded-t-2xl no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#c5a059]" />
            <h3 className="text-sm font-bold text-white">
              معاينة عقد الإيجار الرسمي وسند التأمين (رقم: <span className="font-mono text-[#c5a059]">{booking.bookingNumber}</span>)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#96793e] hover:from-[#d4af37] hover:to-[#a98845] text-black font-black text-xs flex items-center gap-2 shadow-lg transition-all"
            >
              <Printer className="w-4 h-4" /> طباعة العقد / حفظ PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contract Sheet Area (ورقة العقد القابلة للطباعة) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white text-slate-900 font-arabic text-xs print:p-0 print:m-0 print:text-black">
          
          <div ref={printRef} className="max-w-3xl mx-auto space-y-5 border border-slate-300 p-6 sm:p-8 rounded-xl bg-white shadow-sm print:border-none print:shadow-none print:p-0">
            
            {/* 1. الترويسة الرسمية للشركة */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-[#c5a059] pb-4 gap-4">
              <div className="text-right">
                <h1 className="text-xl font-black text-[#0f172a] tracking-tight">شركة اليمن والخليج لتأجير السيارات</h1>
                <p className="text-[11px] text-slate-600 font-semibold">YEMEN & GULF LUXURY CAR RENTAL</p>
                <p className="text-[10px] text-slate-500 mt-1">سجل تجاري: 109482 | بطاقة ضريبية: 774-892-103</p>
                <p className="text-[10px] text-slate-500">القاهرة - جمهورية مصر العربية | هاتف: +20 103 402 5211</p>
              </div>

              <div className="text-center sm:text-left flex flex-col items-center sm:items-end">
                <div className="w-16 h-16 relative mb-1">
                  <Image src="/logo2.png" alt="شعار الشركة" width={64} height={64} className="object-contain" />
                </div>
                <div className="bg-[#f8f5eb] border border-[#c5a059]/60 px-3 py-1 rounded text-center">
                  <span className="text-[10px] text-slate-600 block">رقم العقد الموحد</span>
                  <span className="font-mono font-black text-sm text-[#8a6d3b]">{booking.bookingNumber}</span>
                </div>
              </div>
            </div>

            {/* عنوان العقد */}
            <div className="text-center py-1 bg-slate-100 rounded border border-slate-200">
              <h2 className="text-sm font-bold text-slate-800">عقد إيجار سيارة سياحية وسند استلام وتسليم</h2>
            </div>

            {/* 2. جدول بيانات المستأجر */}
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <div className="bg-[#f1f5f9] px-3 py-1.5 font-bold text-slate-800 border-b border-slate-300 flex items-center justify-between">
                <span>أولاً: بيانات المستأجر (الطرف الثاني)</span>
                <span className="text-[10px] text-slate-500">تاريخ التحرير: {booking.createdAt}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-white">
                <div>
                  <span className="text-slate-500 text-[10px] block">اسم العميل بالكامل:</span>
                  <strong className="text-slate-900 text-[11px]">{booking.customer.fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">رقم الهاتف / الواتساب:</span>
                  <strong className="text-slate-900 font-mono text-[11px]">{booking.customer.phone}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">الجنسية:</span>
                  <strong className="text-slate-900 text-[11px]">{booking.customer.nationality || 'مواطن / مقيم'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">الرقم القومي / جواز السفر:</span>
                  <strong className="text-slate-900 font-mono text-[11px]">{booking.customer.nationalId}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">رقم رخصة القيادة:</span>
                  <strong className="text-slate-900 font-mono text-[11px]">{booking.customer.licenseNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">صفة التأجير:</span>
                  <strong className="text-slate-900 text-[11px]">قيادة شخصية</strong>
                </div>
              </div>
            </div>

            {/* 3. جدول بيانات المركبة وفترة التأجير */}
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <div className="bg-[#f1f5f9] px-3 py-1.5 font-bold text-slate-800 border-b border-slate-300">
                ثانياً: مواصفات المركبة وبيانات الاستلام
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white">
                <div>
                  <span className="text-slate-500 text-[10px] block">السيارة والموديل:</span>
                  <strong className="text-slate-900 text-[11px]">{booking.carName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">رقم اللوحة:</span>
                  <strong className="text-slate-900 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                    {booking.carPlate}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">تاريخ ووقت الاستلام:</span>
                  <strong className="text-slate-900 font-mono text-[11px]">{booking.startDate} ({booking.startTime})</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">تاريخ ووقت الإرجاع:</span>
                  <strong className="text-slate-900 font-mono text-[11px]">{booking.endDate} ({booking.endTime})</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">مدة التأجير:</span>
                  <strong className="text-slate-900 text-[11px]">{booking.daysCount} أيام</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">قراءة العداد عند الاستلام:</span>
                  <strong className="text-slate-900 font-mono text-[11px]">{booking.startKm.toLocaleString()} كم</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">قراءة العداد عند الإرجاع:</span>
                  <strong className="text-slate-900 font-mono text-[11px]">
                    {booking.returnKm ? `${booking.returnKm.toLocaleString()} كم` : '--- (قيد التشغيل)'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">حالة الوقود والتجهيز:</span>
                  <strong className="text-slate-900 text-[11px]">ممتلئ (Full) ✓</strong>
                </div>
              </div>
            </div>

            {/* 4. الحسابات المالية وسند التأمين المسترد */}
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <div className="bg-[#f1f5f9] px-3 py-1.5 font-bold text-slate-800 border-b border-slate-300">
                ثالثاً: الحساب المالي وسند التأمين المسترد (بالجنيه المصري EGP)
              </div>
              <div className="p-3 bg-white space-y-2">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 text-[11px]">
                      <th className="py-1">البيان</th>
                      <th className="py-1 text-center">المدة / الكمية</th>
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

                {/* سند التأمين المسترد */}
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

            {/* 5. شروط وأحكام العقد القانونية في مصر */}
            <div className="border border-slate-200 p-3 rounded-lg bg-slate-50 text-[9px] text-slate-600 space-y-1 leading-relaxed">
              <strong className="text-slate-800 block text-[10px] mb-0.5">الشروط والأحكام العامة:</strong>
              <p>1. يقر المستأجر بأنه استلم السيارة الموضحة أعلاه بحالة ميكانيكية وهيكلية ممتازة، ويتعهد بإعادتها بنفس الحالة والوقود.</p>
              <p>2. يتحمل المستأجر المسؤولية الجنائية والمدنية الكاملة عن أي مخالفات مرورية أو حوادث أو استخدام مخالف للقوانين المصرية أثناء فترة العقد.</p>
              <p>3. يلتزم المستأجر بعدم قيادة السيارة من قبل أي شخص غير مسجل في هذا العقد، ويحظر تأجيرها من الباطن أو السير بها في الطرق الوعرة غير الممهدة.</p>
              <p>4. في حال التأخير عن موعد التسليم لأكثر من ساعتين دون إذن كتابي من الشركة، يُحتسب يوم إيجار إضافي كامل.</p>
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

      </div>

    </div>
  );
}
