'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tag, Plus, Copy, Check, Pencil, Trash2, Search, X, LayoutGrid, List } from 'lucide-react';
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
  onAddCoupon,
  onUpdateCoupon,
  onToggleActive,
  onDeleteCoupon,
}: CouponsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<PromoCoupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form Fields
  const [formCode, setFormCode] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed_egp'>('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState<number>(15);
  const [formExpiresAt, setFormExpiresAt] = useState<string>('2026-12-31');
  const [formMaxUsage, setFormMaxUsage] = useState<number>(100);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filtered List
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
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

  // Copy with feedback
  const handleCopy = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1800);
    }
  };

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormCode('GULF' + Math.floor(Math.random() * 899 + 100));
    setFormDiscountType('percentage');
    setFormDiscountValue(15);
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    setFormExpiresAt(d.toISOString().split('T')[0]);
    setFormMaxUsage(100);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: PromoCoupon) => {
    setEditingCoupon(c);
    setFormCode(c.code);
    setFormDiscountType(c.discountType);
    setFormDiscountValue(c.discountValue);
    setFormExpiresAt(c.expiresAt);
    setFormMaxUsage(c.maxUsage);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formCode.trim().toUpperCase();
    if (!cleanCode) return alert('يرجى إدخال رمز الكود');
    if (formDiscountValue <= 0) return alert('قيمة الخصم يجب أن تكون أكبر من صفر');

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
      alert(err.message || 'حدث خطأ أثناء حفظ الكود');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (confirm(`حذف كود الخصم "${code}" نهائياً؟`)) {
      try {
        await onDeleteCoupon(id);
      } catch (err: any) {
        alert(err.message || 'تعذر الحذف');
      }
    }
  };

  // Modal Dialog
  const modalJSX = isModalOpen ? (
    <div 
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-arabic text-xs"
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <span className="font-bold text-sm">
            {editingCoupon ? `تعديل الكود: ${editingCoupon.code}` : 'إضافة كود خصم جديد'}
          </span>
          <button 
            type="button" 
            onClick={() => setIsModalOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1 text-[11px]">رمز الكود *</label>
            <input
              type="text"
              required
              value={formCode}
              onChange={(e) => setFormCode(e.target.value.toUpperCase())}
              placeholder="GULF20"
              className="w-full h-8 px-2.5 rounded-lg border border-slate-200 font-mono font-bold tracking-wider uppercase text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">نوع الخصم</label>
              <select
                value={formDiscountType}
                onChange={(e) => setFormDiscountType(e.target.value as any)}
                className="w-full h-8 px-2 rounded-lg border border-slate-200 font-bold text-slate-800 focus:outline-none focus:border-slate-900"
              >
                <option value="percentage">نسبة مئوية (%)</option>
                <option value="fixed_egp">مبلغ ثابت (ج.م)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                {formDiscountType === 'percentage' ? 'النسبة (%) *' : 'المبلغ (ج.م) *'}
              </label>
              <input
                type="number"
                min={1}
                max={formDiscountType === 'percentage' ? 100 : 100000}
                required
                value={formDiscountValue}
                onChange={(e) => setFormDiscountValue(Number(e.target.value))}
                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">تاريخ الانتهاء *</label>
              <input
                type="date"
                required
                value={formExpiresAt}
                onChange={(e) => setFormExpiresAt(e.target.value)}
                className="w-full h-8 px-2 rounded-lg border border-slate-200 font-mono text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">أقصى استخدام *</label>
              <input
                type="number"
                min={1}
                max={10000}
                required
                value={formMaxUsage}
                onChange={(e) => setFormMaxUsage(Number(e.target.value))}
                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold"
            >
              {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <div className="admin-section space-y-3 font-arabic text-slate-800 animate-fadeIn">
      {mounted && typeof document !== 'undefined' && modalJSX && createPortal(modalJSX, document.body)}

      {/* 1. Integrated Single-Line Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
        
        {/* Right: Section Name & Status Filter Pills */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 text-sm whitespace-nowrap pl-2 border-l border-slate-200">
            أكواد الخصم
          </span>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل ({coupons.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'active' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              النشطة ({coupons.filter(c => c.active).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                statusFilter === 'inactive' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              المعطلة ({coupons.filter(c => !c.active).length})
            </button>
          </div>
        </div>

        {/* Left: Search, Layout Toggle & Create Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالكود أو القيمة..."
              className="w-40 sm:w-52 h-8 pr-7 pl-6 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white"
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')} 
                className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
              title="بطاقات"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
              title="جدول"
            >
              <List size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Plus size={14} />
            <span>كود جديد</span>
          </button>
        </div>

      </div>

      {/* 2. Coupons Content (Data-First) */}
      {filteredCoupons.length === 0 ? (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-xs">
          لا توجد أكواد مطابقة للبحث
        </div>
      ) : viewMode === 'grid' ? (
        
        /* Clean Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {filteredCoupons.map((cp) => {
            const isExpired = Boolean(cp.expiresAt && new Date(cp.expiresAt).getTime() < new Date().getTime());
            const percentUsed = Math.min(100, Math.round(((cp.usedCount || 0) / (cp.maxUsage || 100)) * 100));

            return (
              <div 
                key={cp.id}
                className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div className="space-y-2.5">
                  {/* Code & Toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white tracking-wider">
                        {cp.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(cp.code)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded"
                        title="نسخ"
                      >
                        {copiedCode === cp.code ? <Check size={12} className="text-slate-900" /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Instant Switch */}
                    <button
                      type="button"
                      onClick={() => void onToggleActive(cp.id)}
                      className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ${
                        cp.active && !isExpired ? 'bg-slate-900' : 'bg-slate-200'
                      }`}
                      title={cp.active ? 'نشط' : 'معطل'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition duration-200 ${
                          cp.active && !isExpired ? '-translate-x-3' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Value & Expiry */}
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">الخصم</span>
                      <strong className="text-slate-900 font-mono text-sm">
                        {cp.discountType === 'percentage' ? `${cp.discountValue}%` : `${cp.discountValue.toLocaleString('ar-EG')} ج.م`}
                      </strong>
                    </div>
                    <div className="text-left font-mono text-[11px] text-slate-500">
                      <span className="text-[10px] text-slate-400 block font-sans">الصلاحية</span>
                      <span className={isExpired ? 'text-slate-900 font-bold' : ''}>
                        {cp.expiresAt || 'دائم'}
                      </span>
                    </div>
                  </div>

                  {/* Usage Meter */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>استخدم: {cp.usedCount || 0} / {cp.maxUsage}</span>
                      <span>{percentUsed}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                      <div className="bg-slate-900 h-full rounded-full" style={{ width: `${percentUsed}%` }} />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">
                    {isExpired ? 'منتهي' : cp.active ? 'نشط' : 'معطل'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cp)}
                      className="p-1 text-slate-500 hover:text-slate-900 rounded"
                      title="تعديل"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cp.id, cp.code)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                      title="حذف"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      ) : (

        /* Clean Compact Table */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
              <tr>
                <th className="py-2.5 px-3">الكود</th>
                <th className="py-2.5 px-3">الخصم</th>
                <th className="py-2.5 px-3">الاستخدام</th>
                <th className="py-2.5 px-3">الانتهاء</th>
                <th className="py-2.5 px-3 text-center">الحالة</th>
                <th className="py-2.5 px-3 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredCoupons.map((cp) => (
                <tr key={cp.id} className="hover:bg-slate-50/60">
                  <td className="py-2 px-3 font-bold text-slate-900">{cp.code}</td>
                  <td className="py-2 px-3 text-slate-900">
                    {cp.discountType === 'percentage' ? `${cp.discountValue}%` : `${cp.discountValue} ج.م`}
                  </td>
                  <td className="py-2 px-3 text-slate-600">{cp.usedCount || 0} / {cp.maxUsage}</td>
                  <td className="py-2 px-3 text-slate-600">{cp.expiresAt || '—'}</td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => void onToggleActive(cp.id)}
                      className={`relative inline-flex h-3.5 w-6 cursor-pointer rounded-full border border-transparent transition-colors ${
                        cp.active ? 'bg-slate-900' : 'bg-slate-200'
                      }`}
                    >
                      <span className={`inline-block h-2.5 w-2.5 rounded-full bg-white transition ${cp.active ? '-translate-x-2.5' : 'translate-x-0'}`} />
                    </button>
                  </td>
                  <td className="py-2 px-3 text-left">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleOpenEdit(cp)} className="p-1 text-slate-500 hover:text-slate-900"><Pencil size={12} /></button>
                      <button onClick={() => handleDelete(cp.id, cp.code)} className="p-1 text-slate-400 hover:text-slate-700"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      )}

    </div>
  );
}
