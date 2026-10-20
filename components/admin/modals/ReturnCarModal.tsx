'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  ShieldAlert, 
  Phone, 
  Sparkles, 
  Wrench, 
  Star, 
  UserCheck, 
  UserX, 
  Car as CarIcon,
  Gauge,
  FileCheck
} from 'lucide-react';
import { Booking, ReturnInspectionPayload } from '@/types/fleet';

interface ReturnCarModalProps {
  booking: Booking | null;
  onClose: () => void;
  returnKmInput: string;
  setReturnKmInput: (val: string) => void;
  onSubmit: (e: React.FormEvent, inspectionData?: ReturnInspectionPayload) => void;
}

export default function ReturnCarModal({
  booking,
  onClose,
  returnKmInput,
  setReturnKmInput,
  onSubmit,
}: ReturnCarModalProps) {
  // 1. نظام التأخير
  const [hasDelay, setHasDelay] = useState(false);
  const [lateNoticeGiven, setLateNoticeGiven] = useState(true);
  const [lateHours, setLateHours] = useState(1);

  // 2. نظام النظافة
  const [cleanlinessScore, setCleanlinessScore] = useState<'clean' | 'moderate' | 'dirty'>('clean');
  const [cleanlinessFee, setCleanlinessFee] = useState(0);

  // 3. نظام الخدوش والأضرار
  const [hasDamages, setHasDamages] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [damageFee, setDamageFee] = useState(0);

  // 4. تقييم العميل وسلوكه
  const [customerRatingStars, setCustomerRatingStars] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [customerRecommendation, setCustomerRecommendation] = useState<'recommend' | 'caution' | 'blacklist'>('recommend');
  const [inspectionNotes, setInspectionNotes] = useState('');

  if (!booking) return null;

  // تغيير حالة النظافة وتحديد الرسوم
  const handleCleanlinessChange = (score: 'clean' | 'moderate' | 'dirty') => {
    setCleanlinessScore(score);
    if (score === 'dirty') {
      setCleanlinessFee(250); // رسم غسيل عميق وتنظيف داخلي
    } else {
      setCleanlinessFee(0);
    }
  };

  // حساب غرامة التأخير بناءً على شروط العقد:
  // 1. مع إبلاغ مسبق: 200 ج.م لكل ساعة
  // 2. بدون إبلاغ مسبق: غرامة إيجار يوم كامل
  const calculatePenalty = () => {
    if (!hasDelay) return 0;
    if (lateNoticeGiven) {
      return lateHours * 200;
    } else {
      return booking.dailyRateEGP;
    }
  };

  const penaltyFee = calculatePenalty();
  const actualDamageFee = hasDamages ? Math.max(0, damageFee) : 0;
  const totalDeductions = penaltyFee + cleanlinessFee + actualDamageFee;
  const netRefundableDeposit = Math.max(0, booking.securityDepositEGP - totalDeductions);
  const clientOwesExtra = Math.max(0, totalDeductions - booking.securityDepositEGP);

  // حساب المسافة المقطوعة
  const currentReturnKm = parseInt(returnKmInput) || booking.startKm;
  const distanceDriven = Math.max(0, currentReturnKm - booking.startKm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e, {
      lateNoticeGiven: hasDelay ? lateNoticeGiven : true,
      lateHours: hasDelay ? lateHours : 0,
      penaltyFee,
      cleanlinessScore,
      cleanlinessFee,
      hasDamages,
      damageDescription: hasDamages ? damageDescription : undefined,
      damageFee: actualDamageFee,
      customerRatingStars,
      customerRecommendation,
      inspectionNotes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-arabic">
      <div className="bg-[#0b1324] border border-[#c5a059]/50 rounded-2xl w-full max-w-2xl p-5 sm:p-6 space-y-4 shadow-2xl my-auto animate-scaleUp max-h-[92vh] overflow-y-auto">
        
        {/* الترويسة الفاخرة */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#c5a059]">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                استلام السيارة وفحص السلامة وتقييم العميل
              </h3>
              <p className="text-xs text-slate-400">
                عقد رقم: <span className="font-mono text-[#c5a059] font-bold">{booking.bookingNumber}</span>
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* 1. ملخص المركبة والعقد */}
          <div className="bg-[#0e172a] p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CarIcon className="w-4 h-4 text-amber-400" />
                <strong className="text-white text-sm">{booking.carName}</strong>
              </div>
              <span className="font-mono text-xs bg-slate-800 px-2.5 py-1 rounded-lg text-amber-300 font-bold border border-slate-700">
                لوحة: {booking.carPlate}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400 pt-1 border-t border-slate-800/80">
              <div>
                <span>العميل المستأجر: </span>
                <strong className="text-slate-200">{booking.customer.fullName}</strong>
                <span className="font-mono text-slate-400 text-[11px] block dir-ltr text-right">{booking.customer.phone}</span>
              </div>
              <div className="sm:text-left">
                <span>موعد الإرجاع المجدول: </span>
                <span className="font-mono text-amber-400 font-bold block">{booking.endDate} ({booking.endTime})</span>
              </div>
            </div>
          </div>

          {/* 2. عداد الكيلومترات والمسافة المقطوعة */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-bold flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-amber-400" /> قراءة العداد عند الاستلام (KM In):
              </label>
              <span className="text-slate-400 text-[11px]">
                العداد عند الخروج: <strong className="font-mono text-[#c5a059]">{booking.startKm.toLocaleString()} كم</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                required
                min={booking.startKm}
                value={returnKmInput}
                onChange={(e) => setReturnKmInput(e.target.value)}
                className="flex-1 bg-[#0e172a] border border-[#c5a059] rounded-xl px-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a059]/30"
                placeholder="سجل قراءة العداد الحالية..."
              />
              <div className="bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-xl text-center shrink-0">
                <span className="text-[10px] text-slate-400 block">المسافة المستهلكة</span>
                <span className="font-mono font-bold text-emerald-400 text-xs">+{distanceDriven.toLocaleString()} كم</span>
              </div>
            </div>
          </div>

          {/* 3. تدقيق التأخير وغرامات شروط العقد */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> هل تأخر العميل عن موعد التسليم المحدد؟
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHasDelay(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !hasDelay ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  في الموعد ✓
                </button>
                <button
                  type="button"
                  onClick={() => setHasDelay(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    hasDelay ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  يوجد تأخير ⚠️
                </button>
              </div>
            </div>

            {hasDelay && (
              <div className="pt-2.5 border-t border-slate-800 space-y-3 animate-fadeIn">
                <div className="text-[11px] text-amber-400 font-medium">
                  حدد حالة الإبلاغ المسبق لتطبيق غرامة العقد المعتمدة:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLateNoticeGiven(true)}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                      lateNoticeGiven
                        ? 'bg-blue-950/60 border-blue-500 text-white'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <strong className="block text-xs font-bold text-blue-200">1. تم إبلاغ الشركة مسبقاً</strong>
                    <span className="text-[10px] text-blue-300">يُحسب 200 ج.م عن كل ساعة تأخير</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLateNoticeGiven(false)}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                      !lateNoticeGiven
                        ? 'bg-rose-950/60 border-rose-500 text-white'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400'
                    }`}
                  >
                    <strong className="block text-xs font-bold text-rose-300">2. لم يتم إبلاغ الشركة</strong>
                    <span className="text-[10px] text-rose-400">غرامة إيجار يوم كامل إضافي</span>
                  </button>
                </div>

                {lateNoticeGiven && (
                  <div className="flex items-center justify-between bg-slate-800/90 p-2.5 rounded-lg border border-slate-700">
                    <span className="text-slate-300 text-xs font-medium">عدد ساعات التأخير الإضافية:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="72"
                        value={lateHours}
                        onChange={(e) => setLateHours(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono text-center text-xs font-bold focus:border-amber-400 outline-none"
                      />
                      <span className="text-slate-400 text-xs">ساعة</span>
                    </div>
                  </div>
                )}

                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center justify-between text-rose-300">
                  <span>قيمة غرامة التأخير المحتسبة بالعقد:</span>
                  <strong className="font-mono text-white text-sm">+{penaltyFee.toLocaleString()} ج.م</strong>
                </div>
              </div>
            )}
          </div>

          {/* 4. فحص نظافة السيارة */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-400" /> حالة نظافة السيارة (الداخلية والخارجية):
              </span>
              {cleanlinessFee > 0 && (
                <span className="text-amber-400 font-mono font-bold text-xs">+{cleanlinessFee} ج.م غسيل</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleCleanlinessChange('clean')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  cleanlinessScore === 'clean'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="block text-sm mb-0.5">🧼</span>
                نظيفة وممتازة
              </button>

              <button
                type="button"
                onClick={() => handleCleanlinessChange('moderate')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  cleanlinessScore === 'moderate'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-200 font-bold'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="block text-sm mb-0.5">🧽</span>
                نظافة مقبولة
              </button>

              <button
                type="button"
                onClick={() => handleCleanlinessChange('dirty')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  cleanlinessScore === 'dirty'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-200 font-bold'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="block text-sm mb-0.5">⚠️</span>
                تحتاج غسيل عميق
              </button>
            </div>
          </div>

          {/* 5. فحص الخدوش والأضرار الجديدة */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-500" /> فحص الخدوش والأضرار والتلفيات:
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHasDamages(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !hasDamages ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  سليمة 100% ✓
                </button>
                <button
                  type="button"
                  onClick={() => setHasDamages(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    hasDamages ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  يوجد أضرار ⚠️
                </button>
              </div>
            </div>

            {hasDamages && (
              <div className="pt-2 border-t border-slate-800 space-y-2.5 animate-fadeIn">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium text-[11px]">وصف الأضرار أو الخدوش:</label>
                  <input
                    type="text"
                    required={hasDamages}
                    value={damageDescription}
                    onChange={(e) => setDamageDescription(e.target.value)}
                    placeholder="مثال: حكة بالصدام الخلفي، كسر بالفانوس الأيمن..."
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-rose-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-slate-300 text-xs">تكلفة الإصلاح المخصومة من التأمين:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={damageFee}
                      onChange={(e) => setDamageFee(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-24 px-2 py-1 rounded bg-slate-900 border border-rose-500 text-white font-mono text-center text-xs font-bold"
                    />
                    <span className="text-slate-400 text-xs">ج.م</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. تقييم سلوك العميل وتحديث ملف الـ CRM */}
          <div className="p-3.5 bg-[#0e172a] rounded-xl border border-[#c5a059]/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400" /> تقييم العميل وسلوكه (يُحدّث ملفه فوراً):
              </span>
              
              {/* النجوم التفاعلية */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCustomerRatingStars(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 transition-colors ${
                        (hoverRating || customerRatingStars) >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="font-mono text-white font-bold mr-1 text-xs">{customerRatingStars} / 5</span>
              </div>
            </div>

            {/* التوصية بالتعامل */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCustomerRecommendation('recommend')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  customerRecommendation === 'recommend'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                عميل ممتاز وموثوق
              </button>

              <button
                type="button"
                onClick={() => setCustomerRecommendation('caution')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  customerRecommendation === 'caution'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-200 font-bold'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                تعامل بحذر ومتابعة
              </button>

              <button
                type="button"
                onClick={() => setCustomerRecommendation('blacklist')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  customerRecommendation === 'blacklist'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-200 font-black'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400'
                }`}
              >
                <UserX className="w-3.5 h-3.5 text-rose-400" />
                قائمة سوداء (حظر 🚫)
              </button>
            </div>

            {/* ملاحظات الفحص وسلوك العميل */}
            <textarea
              rows={2}
              value={inspectionNotes}
              onChange={(e) => setInspectionNotes(e.target.value)}
              placeholder="سجل ملاحظات الموظف الفاحص حول حالة السيارة أو سلوك العميل وتفضيلاته لحفظها بملفه..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:border-amber-400 outline-none"
            />
          </div>

          {/* 7. التصفية المالية والحساب النهائي لمبلغ التأمين */}
          <div className="p-3.5 bg-emerald-950/20 border border-emerald-700/40 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>مبلغ التأمين المحجوز بالعقد:</span>
              <span className="font-mono font-bold text-white">{booking.securityDepositEGP.toLocaleString()} ج.م</span>
            </div>

            {totalDeductions > 0 && (
              <div className="space-y-1 pt-1 border-t border-slate-800 text-rose-400 text-[11px]">
                {penaltyFee > 0 && (
                  <div className="flex justify-between">
                    <span>خصم غرامة التأخير ({lateNoticeGiven ? `${lateHours} س` : 'بدون إبلاغ'}):</span>
                    <span className="font-mono font-bold">-{penaltyFee.toLocaleString()} ج.م</span>
                  </div>
                )}
                {cleanlinessFee > 0 && (
                  <div className="flex justify-between">
                    <span>خصم رسوم غسيل عميق:</span>
                    <span className="font-mono font-bold">-{cleanlinessFee.toLocaleString()} ج.م</span>
                  </div>
                )}
                {actualDamageFee > 0 && (
                  <div className="flex justify-between">
                    <span>خصم تكلفة صيانة الأضرار:</span>
                    <span className="font-mono font-bold">-{actualDamageFee.toLocaleString()} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-rose-300 pt-1 border-t border-rose-900/40">
                  <span>إجمالي الخصومات المستقطعة:</span>
                  <span className="font-mono">-{totalDeductions.toLocaleString()} ج.م</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center text-sm pt-2 border-t border-emerald-900/60 font-bold">
              {clientOwesExtra > 0 ? (
                <>
                  <span className="text-rose-400 flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4" /> مبالغ إضافية مستحقة على العميل:
                  </span>
                  <span className="font-mono text-rose-400 font-black text-base">+{clientOwesExtra.toLocaleString()} ج.م</span>
                </>
              ) : (
                <>
                  <span className="text-emerald-400">صافي التأمين المستحق رده للعميل الآن:</span>
                  <span className="font-mono text-white font-black text-base">{netRefundableDeposit.toLocaleString()} ج.م</span>
                </>
              )}
            </div>
          </div>

          {/* أزرار الإجراء */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5a059] hover:from-[#e0bc45] hover:to-[#d4af37] text-slate-950 font-black shadow-lg cursor-pointer transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> اعتماد الاستلام وتحديث ملف العميل والمركبة
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
