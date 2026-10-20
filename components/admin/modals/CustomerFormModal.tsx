'use client';

import React, { useState, useEffect } from 'react';
import { Customer, CustomerTier, CustomerRiskStatus } from '@/types/fleet';
import { 
  X, 
  User, 
  Phone, 
  CreditCard, 
  FileText, 
  Star, 
  ShieldCheck, 
  AlertTriangle,
  Save,
  MessageCircle
} from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCustomer: Customer | null;
  onSubmit: (data: Omit<Customer, 'id'>) => void;
}

export default function CustomerFormModal({
  isOpen,
  onClose,
  editingCustomer,
  onSubmit,
}: CustomerFormModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [nationality, setNationality] = useState('مصري');
  const [tier, setTier] = useState<CustomerTier>('regular');
  const [riskStatus, setRiskStatus] = useState<CustomerRiskStatus>('safe');
  const [trustScore, setTrustScore] = useState<number>(85);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingCustomer) {
      setFullName(editingCustomer.fullName);
      setPhone(editingCustomer.phone);
      setWhatsapp(editingCustomer.whatsapp || editingCustomer.phone);
      setNationalId(editingCustomer.nationalId);
      setLicenseNumber(editingCustomer.licenseNumber);
      setNationality(editingCustomer.nationality || 'مصري');
      setTier(editingCustomer.tier || 'regular');
      setRiskStatus(editingCustomer.riskStatus || 'safe');
      setTrustScore(editingCustomer.trustScore ?? 85);
      setNotes(editingCustomer.notes || '');
    } else {
      setFullName('');
      setPhone('+20 ');
      setWhatsapp('+20 ');
      setNationalId('');
      setLicenseNumber('');
      setNationality('مصري');
      setTier('regular');
      setRiskStatus('safe');
      setTrustScore(85);
      setNotes('');
    }
  }, [editingCustomer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !nationalId.trim()) {
      alert('يرجى ملء الاسم الكامل، رقم الهاتف، والرقم القومي / الجواز');
      return;
    }

    onSubmit({
      fullName: fullName.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      nationalId: nationalId.trim(),
      licenseNumber: licenseNumber.trim(),
      nationality: nationality.trim() || 'مصري',
      tier,
      riskStatus,
      trustScore: Number(trustScore),
      notes: notes.trim(),
      totalRentalsCount: editingCustomer?.totalRentalsCount || 0,
      totalSpentEGP: editingCustomer?.totalSpentEGP || 0,
      loyaltyPoints: editingCustomer?.loyaltyPoints ?? 100,
      createdAt: editingCustomer?.createdAt || new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-arabic">
      <div className="bg-[#0b1322] border border-[#c5a059]/40 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto animate-scaleUp">
        
        {/* الترويسة */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0e1a30]">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-sm text-white">
              {editingCustomer ? 'تعديل بيانات العميل وملف الثقة' : 'تسجيل عميل جديد في المنظومة'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* النموذج */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          {/* الاسم الكامل والجنسية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">الاسم الكامل للعميل *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: محمد عبد الرحمن القحطاني"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">الجنسية</label>
              <input
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="مثال: مصري، سعودي، كويتي، إماراتي"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* الهاتف والواتساب */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">رقم الهاتف الأساسي *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+20 100 000 0000"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 dir-ltr text-right"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">رقم الواتساب (WhatsApp)</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+20 100 000 0000"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 dir-ltr text-right"
              />
            </div>
          </div>

          {/* الرقم القومي ورقم الرخصة */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">الرقم القومي / جواز السفر *</label>
              <input
                type="text"
                required
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="الرقم القومي أو رقم الجواز"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">رقم رخصة القيادة</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="رقم رخصة القيادة سارية المفعول"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          {/* تصنيف العميل ومؤشر المخاطر */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-white/10 space-y-3">
            <h5 className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> تقييم العميل ومؤشر المخاطر (Customer Risk Scoring)
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">فئة العميل</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as CustomerTier)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs font-bold"
                >
                  <option value="regular">عميل منتظم</option>
                  <option value="vip_silver">VIP فضي</option>
                  <option value="vip_gold">VIP ذهبي</option>
                  <option value="blacklist">قائمة سوداء (محظور)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">مؤشر المخاطر</label>
                <select
                  value={riskStatus}
                  onChange={(e) => setRiskStatus(e.target.value as CustomerRiskStatus)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs font-bold"
                >
                  <option value="safe">🟢 آمن وموثوق</option>
                  <option value="medium">🟡 متوسط الحذر</option>
                  <option value="high_risk">🔴 عالي المخاطر</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">نقاط الثقة (1-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={trustScore}
                  onChange={(e) => setTrustScore(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-amber-400 font-mono text-center font-bold"
                />
              </div>
            </div>
          </div>

          {/* ملاحظات سلوكية */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">ملاحظات خاصة بالعميل أو تنبيهات</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثلاً: يفضل استلام بالمطار، دقيق في المواعيد، يطلب سائق خاص..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400 text-xs"
            />
          </div>

          {/* أزرار الحفظ والإلغاء */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" /> {editingCustomer ? 'حفظ التعديلات' : 'تسجيل العميل'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
