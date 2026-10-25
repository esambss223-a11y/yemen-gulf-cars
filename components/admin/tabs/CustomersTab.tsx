'use client';

import React, { useState } from 'react';
import { Customer, CustomerTier, CustomerSource } from '@/types/fleet';
import { 
  Users, 
  Search, 
  UserPlus, 
  Phone, 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Star, 
  Calendar, 
  Car as CarIcon, 
  Edit3, 
  Trash2, 
  Eye, 
  MessageCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Filter,
  DollarSign
} from 'lucide-react';

interface CustomersTabProps {
  customers: Customer[];
  onOpenAddCustomer: () => void;
  onOpenEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string, name: string) => void;
  onNewBookingForCustomer?: (customer: Customer) => void;
}

const getCustomerSource = (customer: Customer): CustomerSource =>
  customer.source || (customer.id.startsWith('web-') ? 'website' : 'office');

export default function CustomersTab({
  customers,
  onOpenAddCustomer,
  onOpenEditCustomer,
  onDeleteCustomer,
  onNewBookingForCustomer,
}: CustomersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | CustomerTier>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | CustomerSource>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // تصفية العملاء حسب البحث وتصنيف العميل
  const filteredCustomers = customers.filter(c => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      !term ||
      c.fullName.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      (c.whatsapp && c.whatsapp.includes(term)) ||
      c.nationalId.includes(term) ||
      c.licenseNumber.toLowerCase().includes(term) ||
      (c.nationality && c.nationality.toLowerCase().includes(term));

    const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
    const source = getCustomerSource(c);
    const matchesSource = sourceFilter === 'all' || source === sourceFilter;
    return matchesSearch && matchesTier && matchesSource;
  });

  const getTierBadge = (tier?: CustomerTier) => {
    switch (tier) {
      case 'vip_gold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-700 border border-amber-300">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> VIP ذهبي
          </span>
        );
      case 'vip_silver':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <Star className="w-3 h-3 text-slate-400" /> VIP فضي
          </span>
        );
      case 'blacklist':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-700 border border-rose-300">
            <AlertTriangle className="w-3 h-3" /> قائمة سوداء (محظور)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> عميل منتظم
          </span>
        );
    }
  };

  const getRiskIndicator = (risk?: Customer['riskStatus'], trustScore: number = 80) => {
    if (risk === 'high_risk' || trustScore < 50) {
      return (
        <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1" title="مؤشر المخاطر عالي">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> عالي المخاطر
        </span>
      );
    }
    if (risk === 'medium' || trustScore < 75) {
      return (
        <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1" title="مؤشر المخاطر متوسط">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> متوسط
        </span>
      );
    }
    return (
      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1" title="عميل موثوق وآمن">
        <span className="w-2 h-2 rounded-full bg-emerald-500" /> موثوق وآمن
      </span>
    );
  };

  return (
    <div className="admin-section admin-section-customers space-y-4 animate-fadeIn font-arabic">
      
      {/* 1. الترويسة الرئيسية + الإحصائيات السريعة */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" /> دليل العملاء وإدارة العلاقات (Customer CRM)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              سجل تفصيلي لبيانات العملاء، مؤشرات الثقة والمخاطر، تاريخ الاستئجار، والبحث السريع
            </p>
          </div>
          
          <button
            onClick={onOpenAddCustomer}
            className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> تسجيل عميل جديد
          </button>
        </div>

        {/* إحصائيات سريعة للعملاء */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] text-slate-500 font-medium">ملفات العملاء والطلبات</span>
            <p className="text-lg font-black text-slate-900 font-mono mt-0.5">{customers.length}</p>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
            <span className="text-[11px] text-amber-800 font-medium">عملاء VIP ذهبي وفضي</span>
            <p className="text-lg font-black text-amber-700 font-mono mt-0.5">
              {customers.filter(c => c.tier === 'vip_gold' || c.tier === 'vip_silver').length}
            </p>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
            <span className="text-[11px] text-emerald-800 font-medium">طلبات موقع بانتظار التحقق</span>
            <p className="text-lg font-black text-emerald-700 font-mono mt-0.5">
              {customers.filter(c => getCustomerSource(c) === 'website' && !c.identityVerified).length}
            </p>
          </div>
          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/80">
            <span className="text-[11px] text-rose-800 font-medium">القائمة السوداء (محظور)</span>
            <p className="text-lg font-black text-rose-700 font-mono mt-0.5">
              {customers.filter(c => c.tier === 'blacklist').length}
            </p>
          </div>
        </div>
      </div>

      {/* 2. شريط البحث المتقدم وتصفية الفئات */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* حقل البحث الذكي متعدد الحقول */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث بالاسم، رقم الهاتف، الرقم القومي، رقم الرخصة، أو الجنسية..."
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs bg-slate-50/60 font-arabic"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              مسح
            </button>
          )}
        </div>

        {/* أزرار التصفية حسب التصنيف */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <button
            onClick={() => setTierFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              tierFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({customers.length})
          </button>
          <button
            onClick={() => setTierFilter('vip_gold')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              tierFilter === 'vip_gold'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            VIP ذهبي
          </button>
          <button
            onClick={() => setTierFilter('vip_silver')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              tierFilter === 'vip_silver'
                ? 'bg-slate-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            VIP فضي
          </button>
          <button
            onClick={() => setTierFilter('regular')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              tierFilter === 'regular'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            منتظم
          </button>
          <button
            onClick={() => setTierFilter('blacklist')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              tierFilter === 'blacklist'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            القائمة السوداء
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
        <span className="ml-1 text-[11px] font-bold text-slate-500">مصدر التسجيل:</span>
        {([
          ['all', `الكل (${customers.length})`],
          ['website', `طلبات الموقع (${customers.filter((c) => getCustomerSource(c) === 'website').length})`],
          ['office', `عملاء المكتب (${customers.filter((c) => getCustomerSource(c) === 'office').length})`],
        ] as const).map(([source, label]) => (
          <button
            key={source}
            onClick={() => setSourceFilter(source)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${sourceFilter === source ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {label}
          </button>
        ))}
        <span className="mr-auto text-[10px] text-slate-400">طلب الموقع لا يعني أن هوية صاحبه مؤكدة.</span>
      </div>

      {/* 3. شبكة بطاقات العملاء الاحترافية */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h5 className="font-bold text-slate-700 text-sm">لا توجد نتائج مطابقة لبحثك</h5>
          <p className="text-xs text-slate-400 mt-1">
            جرب البحث برقم هاتف آخر أو بطاقة أخرى، أو أضف العميل مباشرة
          </p>
          <button
            onClick={onOpenAddCustomer}
            className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> إضافة عميل جديد
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const trustScore = cust.trustScore ?? 85;
            return (
              <div
                key={cust.id}
                className="bg-white border border-slate-200/90 hover:border-amber-400/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* ترويسة بطاقة العميل */}
                  <div className="admin-customer-card-heading flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-amber-400 flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                        {cust.fullName.charAt(0)}
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                          {cust.fullName}
                        </h5>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500">{cust.nationality || 'مصري'}</span>
                          <span className="text-[10px] text-slate-300">•</span>
                          {getCustomerSource(cust) === 'website' && !cust.identityVerified
                            ? <span className="text-[11px] font-bold text-amber-700">بانتظار التحقق</span>
                            : getRiskIndicator(cust.riskStatus, trustScore)}
                        </div>
                        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${getCustomerSource(cust) === 'website' ? 'bg-sky-50 text-sky-700' : 'bg-violet-50 text-violet-700'}`}>
                          {getCustomerSource(cust) === 'website' ? 'طلب من الموقع' : 'تسجيل من المكتب'}
                          {getCustomerSource(cust) === 'website' && !cust.identityVerified ? ' · الهوية غير متحققة' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {getCustomerSource(cust) === 'website' && !cust.identityVerified
                        ? <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">طلب جديد</span>
                        : getTierBadge(cust.tier)}
                    </div>
                  </div>

                  {/* بيانات الاتصال والهوية */}
                  <div className="space-y-1.5 py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> الهاتف:
                      </span>
                      <a 
                        href={`tel:${cust.phone}`}
                        className="font-mono text-slate-800 font-bold hover:text-amber-600 dir-ltr"
                      >
                        {cust.phone}
                      </a>
                    </div>

                    {cust.whatsapp && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-500" /> واتساب:
                        </span>
                        <a 
                          href={`https://wa.me/${cust.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-emerald-700 font-bold hover:underline dir-ltr text-[11px]"
                        >
                          {cust.whatsapp}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" /> البطاقة / الجواز:
                      </span>
                      <span className="font-mono text-slate-700 font-bold">{cust.nationalId}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" /> رقم الرخصة:
                      </span>
                      <span className="font-mono text-slate-700">{cust.licenseNumber}</span>
                    </div>
                  </div>

                  {/* شريط نقاط الثقة وإحصائيات الحجوزات */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">نقاط الثقة الرقمية:</span>
                      <span className="font-mono font-bold text-slate-800">{trustScore} / 100</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          trustScore >= 85 ? 'bg-emerald-500' :
                          trustScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(10, trustScore))}%` }}
                      />
                    </div>

                    {/* سجل الفحص والتقييم والسلامة */}
                    <div className="flex items-center justify-between bg-amber-50/40 p-2 rounded-xl border border-amber-200/50 text-[11px] mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span className="font-mono font-black text-slate-800">
                          {cust.starRating ? cust.starRating.toFixed(1) : '5.0'}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          ({cust.ratingCount || 0} تقييم)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {cust.cleanlinessScore === 'dirty' ? (
                          <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            ⚠️ سيارة متسخة
                          </span>
                        ) : cust.cleanlinessScore === 'moderate' ? (
                          <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px]">
                            🧽 نظافة مقبولة
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            🧼 نظيف دائماً
                          </span>
                        )}

                        {(cust.damagesCount || 0) > 0 ? (
                          <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {cust.damagesCount} حوادث
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                            🛡️ سليم
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-2 text-[11px]">
                      <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">الحجوزات</span>
                        <strong className="text-slate-800 font-mono text-xs">{cust.totalRentalsCount || 0} مرات</strong>
                      </div>
                      <div className="bg-amber-50/60 p-2 rounded-lg text-center border border-amber-200/50">
                        <span className="text-amber-800 block text-[10px]">نقاط الولاء</span>
                        <strong className="text-amber-700 font-mono text-xs">{cust.loyaltyPoints || 0} نقطة</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">إجمالي الإنفاق</span>
                        <strong className="text-slate-900 font-mono text-xs">{(cust.totalSpentEGP || 0).toLocaleString()} ج.م</strong>
                      </div>
                    </div>
                  </div>

                  {/* ملاحظات العميل إن وجدت */}
                  {cust.notes && (
                    <p className="mt-2.5 text-[11px] text-slate-600 bg-amber-50/50 p-2 rounded-lg border border-amber-200/50 line-clamp-2">
                      {cust.notes}
                    </p>
                  )}
                </div>

                {/* أزرار الإجراءات السريعة */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {onNewBookingForCustomer && (
                    <button
                      onClick={() => onNewBookingForCustomer(cust)}
                      className="flex-1 py-1.5 px-2 bg-[#081225] hover:bg-[#0e1d38] text-amber-400 text-xs font-bold rounded-lg flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                      title="فتح حجز جديد لهذا العميل مباشرة"
                    >
                      <CarIcon className="w-3.5 h-3.5" /> حجز سيارة
                    </button>
                  )}

                  <button
                    onClick={() => onOpenEditCustomer(cust)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="تعديل بيانات العميل"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteCustomer(cust.id, cust.fullName)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="حذف العميل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
