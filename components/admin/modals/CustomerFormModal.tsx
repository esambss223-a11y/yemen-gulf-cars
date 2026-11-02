'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Customer, CustomerTier } from '@/types/fleet';
import { 
  X, 
  UserRound, 
  Phone, 
  CreditCard, 
  FileText, 
  MapPin, 
  Briefcase, 
  Save, 
  AlertTriangle,
  UserCheck,
  Building,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface CustomerFormModalProps {
  operationError?: string;
  isOpen: boolean;
  onClose: () => void;
  editingCustomer: Customer | null;
  onSubmit: (data: Omit<Customer, 'id'>) => Promise<boolean> | boolean;
}

export default function CustomerFormModal({
  isOpen,
  onClose,
  editingCustomer,
  operationError,
  onSubmit,
}: CustomerFormModalProps) {
  const [activeSection, setActiveSection] = useState<'tenant' | 'license_residence' | 'driver'>('tenant');

  // 1. Tenant Basic & Contact
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [idIssuer, setIdIssuer] = useState('');
  const [nationality, setNationality] = useState('مصري');

  // 2. License & Residence
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseType, setLicenseType] = useState('خاصة');
  const [licenseIssuer, setLicenseIssuer] = useState('');
  const [licenseIssuedAt, setLicenseIssuedAt] = useState('');
  const [licenseExpiresAt, setLicenseExpiresAt] = useState('');

  const [address, setAddress] = useState('');
  const [governorate, setGovernorate] = useState('القاهرة');
  const [workAddress, setWorkAddress] = useState('');

  // 3. Driver & Classification
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverAddress, setDriverAddress] = useState('');
  const [driverNationalId, setDriverNationalId] = useState('');
  const [driverLicenseNumber, setDriverLicenseNumber] = useState('');
  const [driverLicenseType, setDriverLicenseType] = useState('خاصة');
  const [driverLicenseIssuer, setDriverLicenseIssuer] = useState('');
  const [driverLicenseIssuedAt, setDriverLicenseIssuedAt] = useState('');
  const [driverLicenseExpiresAt, setDriverLicenseExpiresAt] = useState('');

  const [tier, setTier] = useState<CustomerTier>('regular');
  const [notes, setNotes] = useState('');

  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = React.useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSaveError('');
    if (editingCustomer) {
      setFullName(editingCustomer.fullName || '');
      setPhone(editingCustomer.phone || '');
      setWhatsapp(editingCustomer.whatsapp || editingCustomer.phone || '');
      setSecondaryPhone(editingCustomer.secondaryPhone || '');
      setNationalId(editingCustomer.nationalId || '');
      setIdIssuer(editingCustomer.idIssuer || '');
      setNationality(editingCustomer.nationality || 'مصري');

      setLicenseNumber(editingCustomer.licenseNumber || '');
      setLicenseType(editingCustomer.licenseType || 'خاصة');
      setLicenseIssuer(editingCustomer.licenseIssuer || '');
      setLicenseIssuedAt(editingCustomer.licenseIssuedAt || '');
      setLicenseExpiresAt(editingCustomer.licenseExpiresAt || '');

      setAddress(editingCustomer.address || '');
      setGovernorate(editingCustomer.governorate || 'القاهرة');
      setWorkAddress(editingCustomer.workAddress || '');

      setDriverName(editingCustomer.driverName || '');
      setDriverPhone(editingCustomer.driverPhone || '');
      setDriverAddress(editingCustomer.driverAddress || '');
      setDriverNationalId(editingCustomer.driverNationalId || '');
      setDriverLicenseNumber(editingCustomer.driverLicenseNumber || '');
      setDriverLicenseType(editingCustomer.driverLicenseType || 'خاصة');
      setDriverLicenseIssuer(editingCustomer.driverLicenseIssuer || '');
      setDriverLicenseIssuedAt(editingCustomer.driverLicenseIssuedAt || '');
      setDriverLicenseExpiresAt(editingCustomer.driverLicenseExpiresAt || '');

      setTier(editingCustomer.tier || 'regular');
      setNotes(editingCustomer.notes || '');
    } else {
      setFullName('');
      setPhone('+20 ');
      setWhatsapp('');
      setSecondaryPhone('');
      setNationalId('');
      setIdIssuer('');
      setNationality('مصري');

      setLicenseNumber('');
      setLicenseType('خاصة');
      setLicenseIssuer('');
      setLicenseIssuedAt('');
      setLicenseExpiresAt('');

      setAddress('');
      setGovernorate('القاهرة');
      setWorkAddress('');

      setDriverName('');
      setDriverPhone('');
      setDriverAddress('');
      setDriverNationalId('');
      setDriverLicenseNumber('');
      setDriverLicenseType('خاصة');
      setDriverLicenseIssuer('');
      setDriverLicenseIssuedAt('');
      setDriverLicenseExpiresAt('');

      setTier('regular');
      setNotes('');
    }
  }, [editingCustomer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !nationalId.trim()) {
      alert('يرجى إدخال الاسم الكامل، رقم الهاتف، والرقم القومي / الجواز كحد أدنى.');
      return;
    }

    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError('');
    try {
      const saved = await onSubmit({
        fullName: fullName.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        secondaryPhone: secondaryPhone.trim(),
        nationalId: nationalId.trim(),
        idIssuer: idIssuer.trim(),
        nationality: nationality.trim() || 'مصري',

        licenseNumber: licenseNumber.trim(),
        licenseType: licenseType.trim(),
        licenseIssuer: licenseIssuer.trim(),
        licenseIssuedAt: licenseIssuedAt.trim(),
        licenseExpiresAt: licenseExpiresAt.trim(),

        address: address.trim(),
        governorate: governorate.trim(),
        workAddress: workAddress.trim(),

        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        driverAddress: driverAddress.trim(),
        driverNationalId: driverNationalId.trim(),
        driverLicenseNumber: driverLicenseNumber.trim(),
        driverLicenseType: driverLicenseType.trim(),
        driverLicenseIssuer: driverLicenseIssuer.trim(),
        driverLicenseIssuedAt: driverLicenseIssuedAt.trim(),
        driverLicenseExpiresAt: driverLicenseExpiresAt.trim(),

        tier,
        notes: notes.trim(),
        riskStatus: editingCustomer?.riskStatus || (tier === 'blacklist' ? 'high_risk' : 'safe'),
        trustScore: editingCustomer?.trustScore ?? (tier === 'blacklist' ? 20 : 85),
        totalRentalsCount: editingCustomer?.totalRentalsCount || 0,
        totalSpentEGP: editingCustomer?.totalSpentEGP || 0,
        loyaltyPoints: editingCustomer?.loyaltyPoints ?? 100,
        createdAt: editingCustomer?.createdAt || new Date().toISOString().split('T')[0],
      });
      if (!saved) setSaveError('لم يتم حفظ العميل. راجع سبب الخطأ وأعد المحاولة.');
    } catch {
      setSaveError('تعذر حفظ بيانات العميل. أعد المحاولة.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const modalJSX = (
    <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden font-arabic text-xs" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col h-[92vh] max-h-[760px]">
        
        {/* Header - Unified Deep Slate Luxury Automotive Tone */}
        <header className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-amber-300 border border-slate-700 flex items-center justify-center font-bold">
              <UserRound size={16} />
            </div>
            <div>
              <strong className="text-sm font-bold block text-white">
                {editingCustomer ? 'تعديل ملف العميل وبيانات العقد الرسمية' : 'تسجيل عميل جديد وتوثيق بيانات العقد'}
              </strong>
              <span className="text-[10px] text-slate-400 block">
                كافة معلومات المستأجر والسكن والرخصة المعتمدة في بنود العقد الرسمي
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg grid place-items-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-2 border-b border-slate-200 bg-slate-50/80 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection('tenant')}
            className={`px-3.5 py-2 font-bold border-b-2 transition-colors cursor-pointer text-xs rounded-t-lg ${
              activeSection === 'tenant'
                ? 'border-slate-900 text-slate-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. الهوية والتواصل
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('license_residence')}
            className={`px-3.5 py-2 font-bold border-b-2 transition-colors cursor-pointer text-xs rounded-t-lg ${
              activeSection === 'license_residence'
                ? 'border-slate-900 text-slate-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            2. الرخصة والسكن والعمل
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('driver')}
            className={`px-3.5 py-2 font-bold border-b-2 transition-colors cursor-pointer text-xs rounded-t-lg ${
              activeSection === 'driver'
                ? 'border-slate-900 text-slate-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            3. السائق الإضافي والتصنيف
          </button>
        </div>

        {/* Single Scroll Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3.5">
          
          {/* TAB 1: TENANT IDENTITY & CONTACT */}
          {activeSection === 'tenant' && (
            <div className="space-y-3">
              {/* الاسم والجنسية */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">الاسم بالكامل (كما في الهوية) *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="اسم العميل الثلاثي / الرباعي"
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">الجنسية</label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="مصري، سعودي..."
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* أرقام التواصل الكاملة للعقد */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">الهاتف الأساسي *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+20 100 000 0000"
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs dir-ltr text-right"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">واتساب</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="رقم الواتساب"
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs dir-ltr text-right"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">هاتف إضافي بالعقد</label>
                  <input
                    type="text"
                    value={secondaryPhone}
                    onChange={(e) => setSecondaryPhone(e.target.value)}
                    placeholder="هاتف بديل أو طوارئ"
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs dir-ltr text-right"
                  />
                </div>
              </div>

              {/* الرقم القومي وجهة الإصدار */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">الرقم القومي / جواز السفر *</label>
                  <input
                    type="text"
                    required
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="الرقم القومي (14 رقماً) أو الجواز"
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">جهة إصدار الهوية</label>
                  <input
                    type="text"
                    value={idIssuer}
                    onChange={(e) => setIdIssuer(e.target.value)}
                    placeholder="سجل مدني، مصلحة الأحوال المدنية"
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LICENSE & RESIDENCE & WORK */}
          {activeSection === 'license_residence' && (
            <div className="space-y-3">
              {/* رخصة القيادة: الرقم والنوع وجهة الإصدار */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">رقم رخصة القيادة</label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="رقم الرخصة"
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">نوع الرخصة</label>
                  <select
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs font-semibold"
                  >
                    <option value="خاصة">رخصة خاصة</option>
                    <option value="مهنية درجة أولى">مهنية درجة أولى</option>
                    <option value="مهنية درجة ثانية">مهنية درجة ثانية</option>
                    <option value="مهنية درجة ثالثة">مهنية درجة ثالثة</option>
                    <option value="دولية">رخصة دولية</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">جهة إصدار الرخصة</label>
                  <input
                    type="text"
                    value={licenseIssuer}
                    onChange={(e) => setLicenseIssuer(e.target.value)}
                    placeholder="مرور فيصل، مرور العجوزة..."
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* تواريخ الرخصة: الإصدار والانتهاء */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">تاريخ إصدار الرخصة</label>
                  <input
                    type="date"
                    value={licenseIssuedAt}
                    onChange={(e) => setLicenseIssuedAt(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">تاريخ انتهاء الرخصة</label>
                  <input
                    type="date"
                    value={licenseExpiresAt}
                    onChange={(e) => setLicenseExpiresAt(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-[11px]"
                  />
                </div>
              </div>

              {/* عنوان السكن والمحافظة */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">عنوان المنزل / السكن بالتفصيل *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="الشارع، الحي، عمارة شقة (المعتمد بالعقد)"
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">المحافظة</label>
                  <input
                    type="text"
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    placeholder="القاهرة، الجيزة..."
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* عنوان العمل */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-[11px]">عنوان العمل / الوظيفة بالعقد</label>
                <input
                  type="text"
                  value={workAddress}
                  onChange={(e) => setWorkAddress(e.target.value)}
                  placeholder="مقر العمل، الشركة، أو المهنة"
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                />
              </div>
            </div>
          )}

          {/* TAB 3: ADDITIONAL DRIVER & TIER */}
          {activeSection === 'driver' && (
            <div className="space-y-3">
              {/* السائق الإضافي المصرّح له بالعقد */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-[11px] block">
                  السائق الإضافي المعتمد في العقد (اختياري):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1 text-[10px]">اسم السائق</label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="اسم السائق الثلاثي"
                      className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1 text-[10px]">هاتف السائق</label>
                    <input
                      type="text"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="+20 100 000 0000"
                      className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono text-xs dir-ltr text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1 text-[10px]">الرقم القومي / جواز السائق</label>
                    <input
                      type="text"
                      value={driverNationalId}
                      onChange={(e) => setDriverNationalId(e.target.value)}
                      placeholder="رقم هوية السائق"
                      className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1 text-[10px]">رقم رخصة السائق</label>
                    <input
                      type="text"
                      value={driverLicenseNumber}
                      onChange={(e) => setDriverLicenseNumber(e.target.value)}
                      placeholder="رقم رخصة السائق"
                      className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* فئة العميل والملاحظات */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">تصنيف العميل</label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value as CustomerTier)}
                    className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                  >
                    <option value="regular">منتظم</option>
                    <option value="vip_silver">VIP فضي</option>
                    <option value="vip_gold">VIP ذهبي</option>
                    <option value="blacklist">محظور (قائمة سوداء)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">ملاحظات سلوك العميل</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="تفضيلات، تنبيهات، سائق خاص..."
                    className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {(operationError || saveError) && (
            <p role="alert" className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-center gap-1.5">
              <AlertTriangle size={13} className="flex-shrink-0" />
              <span>{operationError || saveError}</span>
            </p>
          )}

        </form>

        {/* Sticky Footer Actions - Always Visible at the Bottom */}
        <footer className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            {activeSection !== 'tenant' && (
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'driver' ? 'license_residence' : 'tenant')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer transition-colors"
              >
                السابق
              </button>
            )}
            {activeSection !== 'driver' && (
              <button
                type="button"
                onClick={() => setActiveSection(activeSection === 'tenant' ? 'license_residence' : 'driver')}
                className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-300 cursor-pointer transition-colors"
              >
                التالي
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={(e) => {
                const form = document.querySelector('form');
                if (form) form.requestSubmit();
              }}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Save size={13} />
              <span>{saving ? 'جارٍ الحفظ…' : editingCustomer ? 'حفظ كافة البيانات' : 'تسجيل العميل'}</span>
            </button>
          </div>
        </footer>

      </div>
    </div>
  );

  if (typeof document !== 'undefined' && mounted) {
    return createPortal(modalJSX, document.body);
  }

  return modalJSX;
}
