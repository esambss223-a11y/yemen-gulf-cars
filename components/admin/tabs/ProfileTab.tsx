'use client';

import React, { useState, useEffect } from 'react';
import { User, Crown, Briefcase, Calculator, Phone, Calendar, ShieldCheck, Clock,
  CheckCircle2, TrendingUp, KeyRound, Edit3, Save, LogOut, Activity } from 'lucide-react';
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

  // استخراج سجل النشاطات الخاص بالموظف الحالي فقط
  const myAuditLogs = auditLogs.filter(
    log => log.staffName.toLowerCase().includes(currentStaff.username.toLowerCase()) || 
           log.staffName.includes(currentStaff.name) ||
           (currentStaff.role === 'super_admin' && log.staffRole === 'super_admin')
  );

  // إحصائيات الحجوزات الخاصة بهذا الموظف
  const myHandledBookings = bookings.filter(
    b => b.staffId === currentStaff.id || b.staffName.includes(currentStaff.name)
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
      setPermissionMessage('تم إرسال طلبك إلى المدير للمراجعة.');
    } catch (error) {
      setPermissionRequestError(true);
      setPermissionMessage(error instanceof Error ? error.message : 'تعذر إرسال طلب الصلاحية.');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // حفظ التعديلات
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

  // رمز وألوان الرتبة الوظيفية
  const roleConfig = currentStaff.maintenanceAccess ? {
    title: 'مبرمج النظام ومركز الصيانة',
    badge: 'مبرمج النظام',
    icon: ShieldCheck,
    description: 'مركز صيانة خاص لتشخيص الحالة والنسخ والاستعادة وإعادة الضبط، مع إدارة المدراء والموظفين.',
  } : {
    super_admin: {
      title: 'المدير العام للمنظومة (Super Admin)',
      badge: 'مدير عام',
      icon: Crown,
      description: 'كامل الصلاحيات لإدارة الأسطول، الحسابات، الأرباح، وتعيين الموظفين.',
    },
    rental_agent: {
      title: 'مسؤول التأجير والاستقبال (Rental Agent)',
      badge: 'مسؤول تأجير',
      icon: Briefcase,
      description: 'إدارة وتسليم واستلام المركبات، توقيع العقود، وفحص عدادات الكيلومتر.',
    },
    accountant: {
      title: 'المحاسب المالي للشركة (Accountant)',
      badge: 'محاسب مالي',
      icon: Calculator,
      description: 'إصدار الفواتير الرسمية، متابعة الودائع المستردة، وتصفية مستحقات الملاك.',
    },
  }[currentStaff.role];

  const RoleIcon = roleConfig.icon;

  return (
    <div className="admin-profile">
      <div className="admin-page-heading">
        <div><span className="admin-kicker">مساحة الموظف</span><h2>حسابي وإعداداتي</h2><p>بياناتك، صلاحياتك، ونشاطك في مكان واحد.</p></div>
        <span className="profile-session"><ShieldCheck size={16} /> جلسة عمل إدارية مصرحة</span>
      </div>

      <section className="profile-hero" aria-label="هوية الموظف">
        <div className="profile-hero-art" aria-hidden="true"><span /><span /><RoleIcon /></div>
        <div className="profile-identity">
          <div className="profile-avatar">{currentStaff.name.charAt(0)}<span><RoleIcon size={17} /></span></div>
          <div className="profile-identity-copy">
            <span className="profile-role"><RoleIcon size={14} /> {roleConfig.badge}</span>
            <h3>{currentStaff.name}</h3>
            <p>{roleConfig.title}</p>
            <div className="profile-contact"><span dir="ltr">@{currentStaff.username}</span><span><Phone size={13} /><bdi>{currentStaff.phone || '—'}</bdi></span></div>
          </div>
        </div>
        <div className="profile-hero-actions">
          <span className="profile-active"><i /> حساب نشط ومصرح</span>
          <button onClick={() => setIsEditing(!isEditing)} className="admin-button admin-button-lime"><Edit3 size={16} />{isEditing ? 'إلغاء التعديل' : 'تعديل بياناتي'}</button>
        </div>
      </section>

      {saveSuccessMsg && <div role="status" className="profile-feedback is-success"><CheckCircle2 size={18} />{saveSuccessMsg}</div>}

      <div className="profile-layout">
        <section className="profile-panel profile-account">
          <div className="profile-section-heading"><span className="profile-section-icon"><User size={20} /></span><div><h3>المعلومات الشخصية</h3><p>بيانات حسابك ووسائل التواصل</p></div><span className="profile-section-number">01</span></div>
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="profile-edit-form">
              {saveErrorMsg && <div role="alert" className="profile-feedback is-error">{saveErrorMsg}</div>}
              <div className="profile-fields">
                <div><label htmlFor="profile-name">الاسم الكامل</label><input id="profile-name" type="text" required value={nameInput} onChange={(e) => setNameInput(e.target.value)} /></div>
                <div><label htmlFor="profile-username">اسم المستخدم (للدخول)</label><input id="profile-username" type="text" required value={usernameInput} onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/\s+/g, ''))} dir="ltr" /></div>
                <div><label htmlFor="profile-phone">رقم الهاتف</label><input id="profile-phone" type="text" required value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} dir="ltr" /></div>
              </div>
              <div className="profile-password-section"><div><KeyRound size={19} /><h4>كلمة المرور</h4></div><label htmlFor="profile-password">كلمة المرور الجديدة</label><input id="profile-password" type="password" minLength={8} autoComplete="new-password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="اتركها فارغة للاحتفاظ بالقديمة" /><p>اترك الحقل فارغًا للاحتفاظ بكلمة المرور الحالية.</p></div>
              <div className="profile-form-actions"><span>تحديث فوري ينعكس على حسابك</span><button type="button" onClick={() => setIsEditing(false)} className="admin-button admin-button-subtle">إلغاء</button><button type="submit" disabled={isSaving} className="admin-button admin-button-dark"><Save size={16} />{isSaving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</button></div>
            </form>
          ) : (
            <>
              <dl className="profile-readonly"><div><dt>الاسم الكامل</dt><dd>{currentStaff.name}</dd></div><div><dt>اسم المستخدم (للدخول)</dt><dd><bdi>@{currentStaff.username}</bdi></dd></div><div><dt>رقم الهاتف</dt><dd><bdi>{currentStaff.phone || '—'}</bdi></dd></div><div><dt>الدور الوظيفي</dt><dd>{roleConfig.badge}</dd></div></dl>
              <div className="profile-security-note"><KeyRound size={19} /><div><strong>كلمة المرور</strong><p>يمكنك تحديثها من خلال «تعديل بياناتي».</p></div><ShieldCheck size={19} /></div>
            </>
          )}
        </section>

        <section className="profile-panel profile-access">
          <div className="profile-section-heading"><span className="profile-section-icon"><ShieldCheck size={20} /></span><div><h3>الصلاحيات والأمان</h3><p>دورك الحالي في المنظومة</p></div><span className="profile-section-number">02</span></div>
          <div className="profile-access-role"><RoleIcon size={26} /><strong>{roleConfig.badge}</strong><p>{roleConfig.description}</p></div>
          {currentStaff.role !== 'super_admin' && (
            <form onSubmit={handlePermissionRequest} className="profile-permission-form">
              <h4>طلب صلاحية إضافية من المدير</h4>
              <label htmlFor="profile-request-role">الصلاحية المطلوبة</label>
              <select id="profile-request-role" value={requestedRole} onChange={(e) => setRequestedRole(e.target.value as typeof requestedRole)}>
                {currentStaff.role !== 'rental_agent' && <option value="rental_agent">مسؤول تأجير</option>}
                {currentStaff.role !== 'accountant' && <option value="accountant">محاسب</option>}
                <option value="super_admin">مدير عام</option>
              </select>
              <label htmlFor="profile-request-reason">سبب الطلب</label>
              <input id="profile-request-reason" value={permissionReason} onChange={(e) => setPermissionReason(e.target.value)} minLength={5} maxLength={300} required placeholder="اكتب سبب طلب الصلاحية" />
              <button disabled={isRequestingPermission} className="admin-button admin-button-dark">{isRequestingPermission ? 'جارٍ الإرسال...' : 'إرسال الطلب'}</button>
              {permissionMessage && <p role={permissionRequestError ? 'alert' : 'status'} className={`profile-feedback ${permissionRequestError ? 'is-error' : 'is-success'}`}>{permissionMessage}</p>}
            </form>
          )}
          <div className="profile-session-note"><ShieldCheck size={16} /><span>موثق ومحمي · جلسة عمل إدارية مصرحة</span></div>
        </section>
      </div>

      <section className="profile-stats" aria-label="مؤشرات نشاط الموظف">
        <div><span className="profile-stat-icon"><Activity size={19} /></span><span>العمليات المسجلة باسمي</span><strong>{myAuditLogs.length}</strong><small>عملية موثقة في سجل الرقابة</small></div>
        <div><span className="profile-stat-icon"><Calendar size={19} /></span><span>الحجوزات المشرف عليها</span><strong>{myHandledBookings.length}</strong><small>عقود تم تسليمها أو إدارتها</small></div>
        <div><span className="profile-stat-icon"><TrendingUp size={19} /></span><span>إجمالي مبالغ العقود</span><strong>{totalHandledRevenue > 0 ? totalHandledRevenue.toLocaleString() : '—'} <em>ج.م</em></strong><small>إيرادات بإشرافك المباشر</small></div>
        <div><span className="profile-stat-icon"><ShieldCheck size={19} /></span><span>مستوى الأمان والتحقق</span><strong className="profile-stat-text">موثق ومحمي</strong><small>جلسة عمل إدارية مصرحة</small></div>
      </section>

      <section className="profile-panel profile-activity">
        <div className="profile-section-heading"><span className="profile-section-icon"><Activity size={20} /></span><div><h3>سجل نشاطاتي وعملياتي</h3><p>سجل كامل للعمليات والتعديلات على الأسطول والعقود في النظام</p></div><span className="profile-activity-count">إجمالي نشاطاتك: {myAuditLogs.length}</span></div>
        {myAuditLogs.length === 0 ? <div className="profile-empty"><Activity size={28} /><strong>لا توجد عمليات مسجلة باسمك حتى الآن في هذا الجهاز.</strong><p>أي عملية تقوم بها (إضافة سيارة، حجز، تعديل) ستوثق هنا فوراً.</p></div> : (
          <div className="profile-timeline">{myAuditLogs.map((log) => <article key={log.id}><span className="profile-timeline-dot"><CheckCircle2 size={15} /></span><div><h4>{log.action}</h4><p>{log.details}</p></div><time><Clock size={13} />{log.timestamp}</time></article>)}</div>
        )}
      </section>
      <div className="profile-logout"><div><LogOut size={19} /><span>انتهيت من العمل؟<small>يمكنك تسجيل الخروج من حسابك هنا.</small></span></div><button onClick={onLogout} className="admin-button">تسجيل الخروج<LogOut size={15} /></button></div>
    </div>
  );
}
