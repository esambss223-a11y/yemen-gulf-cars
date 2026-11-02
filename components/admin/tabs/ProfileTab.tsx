'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Crown, 
  Briefcase, 
  Calculator, 
  Car,
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  Edit3, 
  Save, 
  LogOut, 
  Activity,
  AlertCircle,
  KeyRound,
  ArrowUpRight,
  Send,
  Calendar,
  CreditCard,
  Clock
} from 'lucide-react';
import { StaffUser, Booking, AuditLogItem } from '@/types/fleet';
import { supabase } from '@/lib/supabase';

interface ProfileTabProps {
  currentStaff: StaffUser;
  bookings: Booking[];
  auditLogs: AuditLogItem[];
  onUpdateStaff: (partial: Partial<StaffUser>) => Promise<void>;
  onLogout: () => void;
}

export default function ProfileTab({
  currentStaff,
  bookings,
  auditLogs,
  onUpdateStaff,
  onLogout,
}: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(currentStaff.name);
  const [usernameInput, setUsernameInput] = useState(currentStaff.username);
  const [phoneInput, setPhoneInput] = useState(currentStaff.phone);
  const [passwordInput, setPasswordInput] = useState(currentStaff.password || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [requestedRole, setRequestedRole] = useState<'super_admin' | 'rental_agent' | 'accountant'>(
    currentStaff.role === 'accountant' ? 'rental_agent' : 'accountant'
  );
  const [permissionReason, setPermissionReason] = useState('');
  const [permissionMessage, setPermissionMessage] = useState('');
  const [permissionRequestError, setPermissionRequestError] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setNameInput(currentStaff.name);
      setUsernameInput(currentStaff.username);
      setPhoneInput(currentStaff.phone);
    }
  }, [currentStaff, isEditing]);

  // Activity logs by this staff member
  const myAuditLogs = auditLogs.filter(
    log => log.staffName.toLowerCase().includes(currentStaff.username.toLowerCase()) || 
           log.staffName.includes(currentStaff.name) ||
           (currentStaff.role === 'super_admin' && log.staffRole === 'super_admin')
  );

  // Bookings handled by this staff member
  const myHandledBookings = bookings.filter(
    b => b.staffId === currentStaff.id || (b.staffName && b.staffName.includes(currentStaff.name))
  );

  const totalHandledRevenue = myHandledBookings.reduce((sum, b) => sum + b.finalTotalEGP, 0);

  const handlePermissionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRequestingPermission(true);
    setPermissionMessage('');
    setPermissionRequestError(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/permission-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ requestedRole, reason: permissionReason }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'تعذر إرسال طلب الصلاحية.');
      setPermissionReason('');
      setPermissionMessage('تم إرسال طلبك للمدير العام للمراجعة والاعتماد.');
    } catch (error) {
      setPermissionRequestError(true);
      setPermissionMessage(error instanceof Error ? error.message : 'تعذر إرسال طلب الصلاحية.');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = usernameInput.trim().toLowerCase();
    setIsSaving(true);
    setSaveErrorMsg('');
    try {
      await onUpdateStaff({
        name: nameInput.trim(),
        username: cleanUsername,
        phone: phoneInput.trim(),
        ...(passwordInput ? { password: passwordInput } : {}),
      });
      setIsEditing(false);
      setPasswordInput('');
      setSaveSuccessMsg('تم حفظ بيانات حسابك بنجاح ✓');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (error) {
      setSaveErrorMsg(error instanceof Error ? error.message : 'تعذر حفظ التعديلات');
    } finally {
      setIsSaving(false);
    }
  };

  const roleConfig = currentStaff.maintenanceAccess ? {
    title: 'مبرمج المنظومة المعتمد',
    badge: 'مبرمج المنظومة',
    icon: ShieldCheck,
    description: 'صلاحيات تقنية متقدمة لتشخيص النظام والنسخ الاحتياطي وإدارة المنظومة.',
  } : {
    super_admin: {
      title: 'المدير العام للمنظومة',
      badge: 'مدير عام',
      icon: Crown,
      description: 'كامل الصلاحيات التنفيذية لإدارة الأسطول، العقود، الحسابات، وتعيين الموظفين.',
    },
    rental_agent: {
      title: 'مسؤول التأجير والاستقبال',
      badge: 'مسؤول تأجير',
      icon: Briefcase,
      description: 'تسليم واستلام المركبات، توثيق العقود الرسمية، وتحديث عدادات الكيلومتر.',
    },
    accountant: {
      title: 'المحاسب المالي للشركة',
      badge: 'محاسب مالي',
      icon: Calculator,
      description: 'إصدار الفواتير الرسمية، متابعة الودائع، وتصفية مستحقات الملاك والشركاء.',
    },
    fleet_entry: {
      title: 'مسؤول إدخال أسطول السيارات',
      badge: 'إدخال أسطول',
      icon: Car,
      description: 'إدخال وتحديث بيانات السيارات والأسطول، التأمينات، والعدادات دون الاطلاع على العقود أو الحسابات.',
    },
  }[currentStaff.role];

  const RoleIcon = roleConfig.icon;

  return (
    <div className="space-y-3.5 max-w-[1600px] mx-auto text-slate-800 font-arabic" dir="rtl">
      {/* 1. Header & Live Profile Strip */}
      <header className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-white font-black text-lg flex items-center justify-center flex-shrink-0">
            {currentStaff.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-white truncate">
                {currentStaff.name}
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300">
                <RoleIcon size={12} className="text-amber-400" />
                <span>{roleConfig.badge}</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                نشط ومصرّح
              </span>
            </div>

            {/* Quick Metrics in Header */}
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap font-mono">
              <span>@{currentStaff.username}</span>
              {currentStaff.phone && (
                <>
                  <span>·</span>
                  <span dir="ltr">{currentStaff.phone}</span>
                </>
              )}
              <span>·</span>
              <span className="text-slate-300 font-sans">
                {myAuditLogs.length} عملية موثقة
              </span>
              {myHandledBookings.length > 0 && (
                <>
                  <span>·</span>
                  <span className="text-slate-300 font-sans">
                    {myHandledBookings.length} عقود بإشرافك
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              isEditing
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                : 'bg-white text-slate-900 hover:bg-slate-100 shadow-2xs'
            }`}
          >
            <Edit3 size={13} />
            <span>{isEditing ? 'إلغاء التعديل' : 'تعديل بياناتي'}</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-300 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut size={13} />
            <span>خروج</span>
          </button>
        </div>
      </header>

      {/* Save Success Alert */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
          <span className="font-semibold">{saveSuccessMsg}</span>
        </div>
      )}

      {/* 2. Main 2-Column Split Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Right 2 Cols: Personal Details & Edit Form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <User size={15} className="text-slate-600" />
              <h3 className="text-xs font-bold text-slate-900">المعلومات الشخصية وبيانات الدخول</h3>
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              {saveErrorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-lg flex items-center gap-2 text-xs">
                  <AlertCircle size={14} className="shrink-0 text-rose-600" />
                  <span>{saveErrorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    الاسم الكامل <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    اسم المستخدم (للدخول) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-slate-900 font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    رقم الهاتف المعتمد
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-slate-900 font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    كلمة المرور الجديدة (اختياري)
                  </label>
                  <input
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="اتركها فارغة للاحتفاظ بالحالية"
                    className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Save size={13} />
                  <span>{isSaving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200/70">
                <div>
                  <span className="text-[10px] text-slate-400 block">الاسم الكامل</span>
                  <strong className="text-slate-900 font-bold block mt-0.5">{currentStaff.name}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">اسم المستخدم</span>
                  <span className="text-slate-900 font-mono font-bold block mt-0.5" dir="ltr">@{currentStaff.username}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">الهاتف المعتمد</span>
                  <span className="text-slate-900 font-mono block mt-0.5" dir="ltr">{currentStaff.phone || 'غير مسجل'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">الرتبة الوظيفية</span>
                  <strong className="text-slate-900 font-bold block mt-0.5">{roleConfig.badge}</strong>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound size={14} className="text-slate-500" />
                  <span className="text-[11px] text-slate-600">كلمة المرور مشفرة ومؤمنة في النظام</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-slate-900 font-bold underline hover:text-slate-700 cursor-pointer"
                >
                  تغيير كلمة المرور
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Left 1 Col: Role Scope & Promotion Request */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-slate-600" />
                <h3 className="text-xs font-bold text-slate-900">نطاق الصلاحيات</h3>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 mt-3 space-y-1">
              <div className="flex items-center gap-1.5">
                <RoleIcon size={14} className="text-slate-700" />
                <strong className="text-xs font-bold text-slate-900">{roleConfig.title}</strong>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {roleConfig.description}
              </p>
            </div>

            {/* Request Upgrade for Non-Admins */}
            {currentStaff.role !== 'super_admin' && (
              <form onSubmit={handlePermissionRequest} className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center gap-1 font-bold text-slate-900 text-[11px]">
                  <ArrowUpRight size={13} className="text-amber-600" />
                  <span>طلب ترقية صلاحية إضافية</span>
                </div>

                <div>
                  <select
                    value={requestedRole}
                    onChange={(e) => setRequestedRole(e.target.value as typeof requestedRole)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    {currentStaff.role !== 'rental_agent' && <option value="rental_agent">مسؤول تأجير واستقبال</option>}
                    {currentStaff.role !== 'accountant' && <option value="accountant">محاسب مالي</option>}
                    <option value="super_admin">مدير عام للنظام</option>
                  </select>
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={permissionReason}
                    onChange={(e) => setPermissionReason(e.target.value)}
                    required
                    minLength={5}
                    placeholder="سبب طلب الصلاحية..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRequestingPermission}
                  className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send size={12} />
                  <span>{isRequestingPermission ? 'جارٍ الإرسال...' : 'إرسال الطلب'}</span>
                </button>

                {permissionMessage && (
                  <p className={`text-[10px] p-2 rounded-lg ${permissionRequestError ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {permissionMessage}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* 3. Personal Activity Log Feed */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-slate-600" />
            <h3 className="text-xs font-bold text-slate-900">سجل نشاطاتي وإجراءاتي في النظام</h3>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
            {myAuditLogs.length} عملية
          </span>
        </div>

        {myAuditLogs.length === 0 ? (
          <p className="py-6 text-center text-slate-400 text-xs">لا توجد عمليات مسجلة باسمك حتى الآن.</p>
        ) : (
          <div className="space-y-1.5 max-h-[260px] overflow-y-auto scrollbar-thin">
            {myAuditLogs.slice(0, 8).map((log) => (
              <div
                key={log.id}
                className="p-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/70 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <strong className="text-slate-900 font-bold text-xs truncate">{log.action}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">#{log.id.slice(-5)}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] truncate mt-0.5">{log.details}</p>
                </div>

                <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px] flex-shrink-0" dir="ltr">
                  <Clock size={11} />
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
