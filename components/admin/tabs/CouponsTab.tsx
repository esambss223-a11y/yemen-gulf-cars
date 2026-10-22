'use client';

import React, { useState, useMemo } from 'react';
import { 
  Tag, 
  Plus, 
  Sparkles, 
  Copy, 
  Check, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Percent, 
  DollarSign, 
  Edit3, 
  Trash2, 
  Power, 
  Search, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  X
} from 'lucide-react';
import { PromoCoupon, StaffUser } from '@/types/fleet';

interface CouponsTabProps {
  coupons: PromoCoupon[];
  currentStaff?: StaffUser;
  onAddCoupon: (coupon: Omit<PromoCoupon, 'id' | 'usedCount'>) => Promise<void>;
  onUpdateCoupon: (id: string, partial: Partial<PromoCoupon>) => Promise<void>;
  onToggleActive: (id: string) => Promise<void>;
  onDeleteCoupon: (id: string) => Promise<void>;
}

export default function CouponsTab({
  coupons,
  currentStaff,
  onAddCoupon,
  onUpdateCoupon,
  onToggleActive,
  onDeleteCoupon,
}: CouponsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // حالة النافذة المنبثقة (إنشاء أو تعديل)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<PromoCoupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // حقول النموذج
  const [formCode, setFormCode] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed_egp'>('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState<number>(10);
  const [formExpiresAt, setFormExpiresAt] = useState<string>('2026-12-31');
  const [formMaxUsage, setFormMaxUsage] = useState<number>(100);

  // إحصائيات سريعة
  const totalCount = coupons.length;
  const activeCount = coupons.filter(c => c.active).length;
  const totalRedeemed = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  // تصفية الأكواد
  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => {
      const matchStatus = 
        statusFilter === 'all' ? true :
        statusFilter === 'active' ? c.active : !c.active;

      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term || 
        c.code.toLowerCase().includes(term) ||
        String(c.discountValue).includes(term);

      return matchStatus && matchSearch;
    });
  }, [coupons, statusFilter, searchTerm]);

  // نسخ الكود للحافظة
  const handleCopy = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // توليد رمز عشوائي فخم
  const generateRandomCode = () => {
    const prefixes = ['GULF', 'VIP', 'YEMEN', 'LUX', 'ROYAL', 'CAR'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(Math.random() * 899) + 100;
    setFormCode(`${prefix}${num}`);
  };

  // فتح نافذة إنشاء كود جديد
  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormCode('');
    setFormDiscountType('percentage');
    setFormDiscountValue(15);
    const date3Months = new Date();
    date3Months.setMonth(date3Months.getMonth() + 3);
    setFormExpiresAt(date3Months.toISOString().split('T')[0]);
    setFormMaxUsage(100);
    setIsModalOpen(true);
  };

  // فتح نافذة تعديل كود موجود
  const handleOpenEdit = (c: PromoCoupon) => {
    setEditingCoupon(c);
    setFormCode(c.code);
    setFormDiscountType(c.discountType);
    setFormDiscountValue(c.discountValue);
    setFormExpiresAt(c.expiresAt);
    setFormMaxUsage(c.maxUsage);
    setIsModalOpen(true);
  };

  // حفظ الكود
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formCode.trim().toUpperCase();
    if (!cleanCode) {
      alert('يرجى إدخال رمز كود الخصم');
      return;
    }
    if (formDiscountValue <= 0) {
      alert('قيمة الخصم يجب أن تكون أكبر من صفر');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCoupon) {
        await onUpdateCoupon(editingCoupon.id, {
          code: cleanCode,
          discountType: formDiscountType,
          discountValue: formDiscountValue,
          expiresAt: formExpiresAt,
          maxUsage: formMaxUsage,
        });
      } else {
        await onAddCoupon({
          code: cleanCode,
          discountType: formDiscountType,
          discountValue: formDiscountValue,
          expiresAt: formExpiresAt,
          maxUsage: formMaxUsage,
          active: true,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حفظ كود الخصم');
    } finally {
      setIsSubmitting(false);
    }
  };

  // تأكيد الحذف
  const handleDelete = async (id: string, code: string) => {
    if (confirm(`هل أنت متأكد من رغبتك في حذف كود الخصم "${code}" نهائياً؟`)) {
      try {
        await onDeleteCoupon(id);
      } catch (err: any) {
        alert(err.message || 'تعذر حذف كود الخصم');
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await onToggleActive(id);
    } catch (err: any) {
      alert(err.message || 'تعذر تغيير حالة كود الخصم');
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn font-arabic">
      
      {/* 1. الترويسة الرئيسية + الإحصائيات الفورية */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-500" /> إدارة العروض وأكواد الخصم الترويجية (Promo Codes)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              توليد أكواد الخصم لعملائك المميزين، التحكم بصلاحيتها، تفعيلها أو تعطيلها بنقرة واحدة
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> إنشاء وتوليد كود خصم جديد
          </button>
        </div>

        {/* الكروت الإحصائية الثلاثية */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">إجمالي الأكواد المسجلة</span>
              <strong className="text-xl font-black text-slate-900 font-mono mt-0.5 block">{totalCount} أكواد</strong>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-800 block font-bold">الأكواد النشطة والجاهزة</span>
              <strong className="text-xl font-black text-emerald-900 font-mono mt-0.5 block">{activeCount} كود نشط</strong>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-blue-800 block font-bold">مرات الاستخدام الفعلية</span>
              <strong className="text-xl font-black text-blue-900 font-mono mt-0.5 block">{totalRedeemed} مرة</strong>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
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
            placeholder="ابحث برمز الكود (مثل YEMEN15) أو قيمة الخصم..."
            className="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 text-xs bg-slate-50/60 font-arabic"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            الكل ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800'
            }`}
          >
            النشطة فقط ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'inactive' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800'
            }`}
          >
            المعطلة ({totalCount - activeCount})
          </button>
        </div>
      </div>

      {/* 3. جدول الأكواد الاحترافي */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3.5 pr-4">رمز الكود (Promo Code)</th>
                <th className="py-3.5">نوع وقيمة الخصم</th>
                <th className="py-3.5">تاريخ الانتهاء</th>
                <th className="py-3.5">معدل الاستخدام</th>
                <th className="py-3.5">الحالة والصلاحية</th>
                <th className="py-3.5 pl-4 text-center">التحكم والإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    لا توجد أكواد خصم تطابق بحثك حالياً
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((cp) => {
                  const isExpired = new Date(cp.expiresAt).getTime() < new Date().getTime();
                  const percentUsed = Math.min(100, Math.round(((cp.usedCount || 0) / (cp.maxUsage || 100)) * 100));

                  return (
                    <tr key={cp.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* رمز الكود + زر النسخ */}
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/90 tracking-wider">
                            {cp.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(cp.code)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="نسخ الكود لمشاركته مع العميل"
                          >
                            {copiedCode === cp.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* نوع وقيمة الخصم */}
                      <td className="py-3.5">
                        {cp.discountType === 'percentage' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200 font-mono">
                            <Percent className="w-3 h-3 text-purple-600" /> خصم {cp.discountValue}% من الإجمالي
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200 font-mono">
                            <DollarSign className="w-3 h-3 text-blue-600" /> خصم ثابت {cp.discountValue.toLocaleString()} ج.م
                          </span>
                        )}
                      </td>

                      {/* تاريخ الانتهاء */}
                      <td className="py-3.5">
                        <div className="font-mono text-xs font-medium text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cp.expiresAt || 'مفتوح'}</span>
                        </div>
                        {isExpired && (
                          <span className="text-[10px] text-rose-600 font-bold block mt-0.5">منتهي الصلاحية</span>
                        )}
                      </td>

                      {/* معدل الاستخدام */}
                      <td className="py-3.5">
                        <div className="w-32">
                          <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-600 font-bold">
                            <span>{cp.usedCount || 0} استخدام</span>
                            <span className="text-slate-400">الحد: {cp.maxUsage}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${percentUsed >= 100 ? 'bg-rose-500' : 'bg-amber-500'}`}
                              style={{ width: `${percentUsed}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* الحالة ومفتاح التفعيل المباشر */}
                      <td className="py-3.5">
                        <button
                          type="button"
                          onClick={() => void handleToggleActive(cp.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                            cp.active && !isExpired
                              ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                          title="اضغط للتفعيل أو الإيقاف الفوري"
                        >
                          <span className={`w-2 h-2 rounded-full ${cp.active && !isExpired ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span>{cp.active && !isExpired ? 'مفعل وجاهز' : 'معطل مؤقتاً'}</span>
                        </button>
                      </td>

                      {/* الإجراءات: تعديل وحذف */}
                      <td className="py-3.5 pl-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cp)}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-amber-700 transition-colors cursor-pointer border border-slate-200"
                            title="تعديل قيمة أو تاريخ الكود"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(cp.id, cp.code)}
                            className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer border border-rose-200"
                            title="حذف كود الخصم نهائياً"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. نافذة منبثقة: توليد / إنشاء أو تعديل كود الخصم */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-arabic">
          <div className="bg-[#0b1324] border border-[#c5a059]/40 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl my-auto animate-scaleUp">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {editingCoupon ? `تعديل كود الخصم: ${editingCoupon.code}` : 'توليد وإنشاء كود خصم جديد'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* رمز الكود + زر التوليد التلقائي */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">رمز كود الخصم (بالحروف الإنجليزية) *</label>
                  {!editingCoupon && (
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> توليد رمز تلقائي
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="مثال: GULF2026 أو SUMMER15"
                  className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-400 text-sm font-mono tracking-widest uppercase font-bold"
                />
              </div>

              {/* نوع وقيمة الخصم */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">نوع الخصم:</label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value as any)}
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed_egp">مبلغ مقطوع ثابت (ج.م)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {formDiscountType === 'percentage' ? 'نسبة الخصم (%):' : 'مبلغ الخصم (ج.م):'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={formDiscountType === 'percentage' ? 100 : 100000}
                    required
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(Number(e.target.value))}
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* تاريخ الانتهاء والحد الأقصى */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">تاريخ انتهاء الصلاحية:</label>
                  <input
                    type="date"
                    required
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">الحد الأقصى لمرات الاستخدام:</label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    required
                    value={formMaxUsage}
                    onChange={(e) => setFormMaxUsage(Number(e.target.value))}
                    className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>
              </div>

              {/* أزرار الإجراء */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition-colors"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingCoupon ? 'حفظ التعديلات' : 'تفعيل ونشر الكود فوراً'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
