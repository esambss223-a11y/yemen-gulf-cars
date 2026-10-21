'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  X, 
  User, 
  Phone, 
  CreditCard, 
  ShieldCheck, 
  AlertTriangle, 
  Star, 
  CheckCircle2, 
  UserPlus, 
  Sparkles,
  Award,
  Globe,
  Tag,
  Gift
} from 'lucide-react';
import { Car, Customer } from '@/types/fleet';

export interface NewBookingFormState {
  carId: string;
  customerName: string;
  customerPhone: string;
  nationalId: string;
  licenseNumber: string;
  nationality: string;
  loyaltyPointsRedeemed: number;
  loyaltyDiscountEGP: number;
  promoDiscountEGP: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  discountCode: string;
  notes: string;
}

interface AddBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  cars: Car[];
  customers?: Customer[];
  newBooking: NewBookingFormState;
  setNewBooking: React.Dispatch<React.SetStateAction<NewBookingFormState>>;
  onSubmit: (e: React.FormEvent) => void;
}

const COMMON_NATIONALITIES = [
  { code: 'eg', name: 'مصري 🇪🇬' },
  { code: 'sa', name: 'سعودي 🇸🇦' },
  { code: 'ae', name: 'إماراتي 🇦🇪' },
  { code: 'kw', name: 'كويتي 🇰🇼' },
  { code: 'qa', name: 'قطري 🇶🇦' },
  { code: 'ye', name: 'يمني 🇾🇪' },
  { code: 'om', name: 'عماني 🇴🇲' },
  { code: 'bh', name: 'بحريني 🇧🇭' },
  { code: 'other', name: 'أجنبي / أخرى 🌐' },
];

export default function AddBookingModal({
  isOpen,
  onClose,
  cars,
  customers = [],
  newBooking,
  setNewBooking,
  onSubmit,
}: AddBookingModalProps) {
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ text: string; success: boolean } | null>(null);

  const AVAILABLE_COUPONS = [
    { code: 'YEMEN15', label: 'خصم 15% (يمن الخليج)', type: 'percentage', value: 15 },
    { code: 'VIP2026', label: 'خصم 5,000 ج.م ثابت', type: 'fixed_egp', value: 5000 },
    { code: 'GULF10', label: 'خصم 10% لعملاء الخليج', type: 'percentage', value: 10 },
    { code: 'WELCOME', label: 'خصم ترحيبي 1,000 ج.م', type: 'fixed_egp', value: 1000 },
    { code: 'VIP20', label: 'خصم VIP الخاص 20%', type: 'percentage', value: 20 },
  ];

  const handleApplyPromo = (codeToApply?: string) => {
    const code = (codeToApply || newBooking.discountCode || '').trim().toUpperCase();
    if (!code) {
      setNewBooking(prev => ({ ...prev, discountCode: '', promoDiscountEGP: 0 }));
      setPromoMessage(null);
      return;
    }

    const found = AVAILABLE_COUPONS.find(c => c.code === code);
    if (found) {
      const discount = found.type === 'percentage'
        ? Math.round((baseRentTotal * found.value) / 100)
        : Math.min(found.value, baseRentTotal);
      setNewBooking(prev => ({
        ...prev,
        discountCode: found.code,
        promoDiscountEGP: discount
      }));
      setPromoMessage({
        text: `تم تفعيل كود الخصم (${found.code}): خصم ${discount.toLocaleString()} ج.م ✓`,
        success: true
      });
    } else {
      setNewBooking(prev => ({ ...prev, promoDiscountEGP: 0 }));
      setPromoMessage({ text: 'كود الخصم المدخل غير صالح أو غير معتمد', success: false });
    }
  };

  // الكشف الفوري التلقائي أثناء الكتابة (الجسد الواحد المتكامل)
  useEffect(() => {
    const cleanPhone = newBooking.customerPhone.trim();
    const cleanId = newBooking.nationalId.trim();
    const cleanName = newBooking.customerName.trim().toLowerCase();

    if (cleanPhone.length >= 4 || cleanId.length >= 4 || cleanName.length >= 3) {
      const found = customers.find(c => 
        (cleanPhone.length >= 4 && c.phone.includes(cleanPhone)) ||
        (cleanId.length >= 4 && c.nationalId.includes(cleanId)) ||
        (cleanName.length >= 3 && c.fullName.toLowerCase().includes(cleanName))
      );

      if (found) {
        setMatchedCustomer(found);
        return;
      }
    }
    setMatchedCustomer(null);
  }, [newBooking.customerPhone, newBooking.nationalId, newBooking.customerName, customers]);

  // حساب الأيام والإيجار الأساسي
  const start = new Date(newBooking.startDate);
  const end = new Date(newBooking.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const selectedCar = cars.find(c => c.id === newBooking.carId) || cars[0];
  const baseRentTotal = (selectedCar?.dailyPriceEGP || 5000) * calculatedDays;

  // إدارة خصم نقاط الولاء التلقائي
  useEffect(() => {
    if (useLoyaltyPoints && matchedCustomer && matchedCustomer.loyaltyPoints) {
      // كل 10 نقاط = 10 جنيه خصم (أو 100 نقطة = 100 ج.م) بحد أقصى 20% من قيمة الإيجار
      const maxDiscount = Math.floor(baseRentTotal * 0.20);
      const discountVal = Math.min(matchedCustomer.loyaltyPoints, maxDiscount);
      setNewBooking(prev => ({
        ...prev,
        loyaltyPointsRedeemed: discountVal,
        loyaltyDiscountEGP: discountVal,
      }));
    } else {
      setNewBooking(prev => ({
        ...prev,
        loyaltyPointsRedeemed: 0,
        loyaltyDiscountEGP: 0,
      }));
    }
  }, [useLoyaltyPoints, matchedCustomer, baseRentTotal, setNewBooking]);

  if (!isOpen) return null;

  const handleSelectCustomer = (cust: Customer) => {
    setNewBooking(prev => ({
      ...prev,
      customerName: cust.fullName,
      customerPhone: cust.phone,
      nationalId: cust.nationalId,
      licenseNumber: cust.licenseNumber,
      nationality: cust.nationality || 'مصري',
    }));
    setMatchedCustomer(cust);
  };

  const currentLoyaltyPoints = matchedCustomer?.loyaltyPoints || 0;
  const loyaltyDiscount = newBooking.loyaltyDiscountEGP || 0;
  const promoDiscount = newBooking.promoDiscountEGP || 0;
  const finalPayable = Math.max(0, baseRentTotal - loyaltyDiscount - promoDiscount);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-arabic">
      <div className="bg-[#0b1324] border border-[#c5a059]/40 rounded-2xl w-full max-w-2xl max-h-[94vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl my-auto animate-scaleUp">
        
        {/* الترويسة */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              إنشاء عقد وحجز جديد (تسليم سيارة)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          
          {/* 1. اختيار السيارة المراد تأجيرها */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">السيارة المراد تأجيرها:</label>
            <select
              required
              value={newBooking.carId}
              onChange={(e) => setNewBooking({ ...newBooking, carId: e.target.value })}
              className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 text-xs font-bold cursor-pointer"
            >
              {cars.filter(c => c.status === 'available' || c.id === newBooking.carId).map(car => (
                <option key={car.id} value={car.id}>
                  {car.make} {car.model} {car.year} ({car.plateNumber}) - {car.dailyPriceEGP.toLocaleString()} ج.م/يوم
                </option>
              ))}
            </select>
          </div>

          {/* ========================================================
              2. نظام التعرف اللحظي والربط الذكي بالعميل (الجسد الواحد)
              ======================================================== */}
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-bold flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-amber-400" /> التعرف الذكي ونقاط ولاء العميل (Live CRM & Rewards)
              </span>

              {/* بطاقة الحالة التلقائية للعميل */}
              {matchedCustomer ? (
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  matchedCustomer.tier === 'blacklist' 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                    : matchedCustomer.tier === 'vip_gold'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {matchedCustomer.tier === 'blacklist' ? '⚠️ عميل محظور (قائمة سوداء)' :
                   matchedCustomer.tier === 'vip_gold' ? '⭐ عميل VIP ذهبي' :
                   matchedCustomer.tier === 'vip_silver' ? '🥈 عميل VIP فضي' : '✓ عميل مسجل'}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">
                  عميل جديد (سيحصل على 50 نقطة ترحيبية وتوثيق تلقائي)
                </span>
              )}
            </div>

            {/* إذا تم التعرف على عميل مسجل مسبقاً */}
            {matchedCustomer && (
              <div className="p-3 bg-[#0e1b36] border border-amber-400/40 rounded-xl space-y-2 animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-white text-sm">{matchedCustomer.fullName}</strong>
                      <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded">
                        {matchedCustomer.nationality || 'مصري'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-300 mt-1 font-mono">
                      <span>الهاتف: {matchedCustomer.phone}</span>
                      <span>الرقم القومي: {matchedCustomer.nationalId}</span>
                      <span>نقاط الثقة: {matchedCustomer.trustScore ?? 85}%</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectCustomer(matchedCustomer)}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs cursor-pointer shadow-xs"
                  >
                    تعبئة بياناته المعتمدة ✓
                  </button>
                </div>

                {/* استبدال نقاط الولاء إن وجدت */}
                {currentLoyaltyPoints > 0 && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-amber-300">
                      <Gift className="w-4 h-4 text-amber-400" />
                      <span>رصيد نقاط الولاء المتاح: <strong className="font-mono text-white">{currentLoyaltyPoints} نقطة</strong> (تساوي {currentLoyaltyPoints} ج.م)</span>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useLoyaltyPoints}
                        onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                        className="w-4 h-4 text-amber-500 rounded bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs text-slate-200 font-bold">تطبيق خصم النقاط على الفاتورة</span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* الحقول الأساسية لبيانات العميل (تتسجل وتتطابق أوتوماتيكياً) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">اسم العميل بالكامل *</label>
                <input
                  type="text"
                  required
                  value={newBooking.customerName}
                  onChange={(e) => setNewBooking({ ...newBooking, customerName: e.target.value })}
                  placeholder="مثال: محمد عبد الرحمن القحطاني"
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">الجنسية *</label>
                <select
                  value={newBooking.nationality || 'مصري'}
                  onChange={(e) => setNewBooking({ ...newBooking, nationality: e.target.value })}
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs font-bold cursor-pointer"
                >
                  {COMMON_NATIONALITIES.map(nat => (
                    <option key={nat.code} value={nat.name.split(' ')[0]}>
                      {nat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">رقم الهاتف / الواتساب *</label>
                <input
                  type="text"
                  required
                  value={newBooking.customerPhone}
                  onChange={(e) => setNewBooking({ ...newBooking, customerPhone: e.target.value })}
                  placeholder="+20 100 000 0000"
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs dir-ltr text-right font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">الرقم القومي / جواز السفر *</label>
                <input
                  type="text"
                  required
                  value={newBooking.nationalId}
                  onChange={(e) => setNewBooking({ ...newBooking, nationalId: e.target.value })}
                  placeholder="الرقم القومي أو رقم الجواز"
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">رقم رخصة القيادة السارية *</label>
                <input
                  type="text"
                  required
                  value={newBooking.licenseNumber}
                  onChange={(e) => setNewBooking({ ...newBooking, licenseNumber: e.target.value })}
                  placeholder="رقم رخصة القيادة المعتمدة"
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* 3. فترات ومواعيد الاستلام والإرجاع */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">تاريخ ووقت الاستلام:</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={newBooking.startDate}
                  onChange={(e) => setNewBooking({ ...newBooking, startDate: e.target.value })}
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                />
                <input
                  type="time"
                  required
                  value={newBooking.startTime}
                  onChange={(e) => setNewBooking({ ...newBooking, startTime: e.target.value })}
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">تاريخ ووقت الإرجاع المقرر:</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  required
                  value={newBooking.endDate}
                  onChange={(e) => setNewBooking({ ...newBooking, endDate: e.target.value })}
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                />
                <input
                  type="time"
                  required
                  value={newBooking.endTime}
                  onChange={(e) => setNewBooking({ ...newBooking, endTime: e.target.value })}
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* 3.1 كود الخصم الترويجي (Promo Code) */}
          <div className="p-3 bg-[#070e1c] border border-amber-500/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" /> كود الخصم الترويجي (Promo Code):
              </label>
              {promoMessage && (
                <span className={`text-[11px] font-bold ${promoMessage.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {promoMessage.text}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newBooking.discountCode}
                onChange={(e) => {
                  setNewBooking({ ...newBooking, discountCode: e.target.value.toUpperCase() });
                  if (!e.target.value) {
                    setNewBooking(prev => ({ ...prev, discountCode: '', promoDiscountEGP: 0 }));
                    setPromoMessage(null);
                  }
                }}
                placeholder="أدخل الرمز مثل YEMEN15 أو VIP2026..."
                className="flex-1 bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs font-mono tracking-wider uppercase"
              />
              <button
                type="button"
                onClick={() => handleApplyPromo()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors cursor-pointer"
              >
                تطبيق الخصم
              </button>
            </div>

            {/* أزرار سريعة للأكواد المعتمدة */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400">أكواد سريعة:</span>
              {AVAILABLE_COUPONS.map(cp => (
                <button
                  key={cp.code}
                  type="button"
                  onClick={() => handleApplyPromo(cp.code)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                    newBooking.discountCode === cp.code
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-amber-400/50'
                  }`}
                >
                  {cp.code} ({cp.label})
                </button>
              ))}
            </div>
          </div>

          {/* 4. الحساب المالي المباشر ونقاط الخصم */}
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>مدة الإيجار ({calculatedDays} أيام × {(selectedCar?.dailyPriceEGP || 5000).toLocaleString()} ج.م):</span>
              <span className="font-mono text-white font-bold">{baseRentTotal.toLocaleString()} ج.م</span>
            </div>

            {newBooking.promoDiscountEGP && newBooking.promoDiscountEGP > 0 ? (
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>خصم كود البروموكود ({newBooking.discountCode}):</span>
                <span className="font-mono">-{newBooking.promoDiscountEGP.toLocaleString()} ج.م</span>
              </div>
            ) : null}

            {newBooking.loyaltyDiscountEGP && newBooking.loyaltyDiscountEGP > 0 ? (
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>خصم نقاط الولاء المستبدلة ({newBooking.loyaltyPointsRedeemed} نقطة):</span>
                <span className="font-mono">-{newBooking.loyaltyDiscountEGP.toLocaleString()} ج.م</span>
              </div>
            ) : null}

            <div className="flex justify-between text-amber-400 font-bold text-sm pt-1 border-t border-slate-800">
              <span>صافي الإجمالي المستحق:</span>
              <span className="font-mono font-black text-white text-base">{finalPayable.toLocaleString()} ج.م</span>
            </div>

            <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800/60">
              <span>مبلغ التأمين المسترد المحتجز:</span>
              <span className="font-mono font-bold text-slate-200">{(selectedCar?.securityDepositEGP || 10000).toLocaleString()} ج.م</span>
            </div>
          </div>

          {/* 5. أزرار الإجراء والاعتماد */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 cursor-pointer transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> تأكيد الصفقة وتوثيق العميل ونقاطه تلقائياً ✓
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
