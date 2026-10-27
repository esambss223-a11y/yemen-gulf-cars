'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, ArrowDownToLine, ArrowUpFromLine, Check, Database, ExternalLink, LockKeyhole, RefreshCw, ShieldCheck, Terminal, TriangleAlert, Users, Wrench } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MAINTENANCE_LABELS, MAINTENANCE_PHRASES, MAINTENANCE_TABLES, type MaintenanceBackup, type MaintenanceHealth, type MaintenanceOperation } from '@/types/maintenance';
import './developer-center.css';

type Prepared = { operation: MaintenanceOperation; ticket: string; url: string; filename: string };
export default function DeveloperCenter({ onManageStaff }: { onManageStaff: () => void }) {
  const [health, setHealth] = useState<MaintenanceHealth | null>(null);
  const [busy, setBusy] = useState<string | null>('health');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [restore, setRestore] = useState<MaintenanceBackup | null>(null);
  const [restoreDate, setRestoreDate] = useState('');
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const [saved, setSaved] = useState(false);
  const downloadUrl = useRef<string | null>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const api = useCallback(async (body?: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('انتهت الجلسة. سجّل الدخول مرة أخرى.');
    const response = await fetch('/api/admin/maintenance', { method: body ? 'POST' : 'GET', cache: 'no-store',
      headers: { Authorization: `Bearer ${session.access_token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'تعذر الاتصال بمركز الصيانة.');
    return data;
  }, []);
  const refresh = useCallback(async () => {
    setBusy('health'); setError('');
    try { setHealth(await api()); } catch (e) { setError(e instanceof Error ? e.message : 'تعذر فحص النظام.'); }
    finally { setBusy(null); }
  }, [api]);
  useEffect(() => {
    let active = true;
    api().then((data) => { if (active) { setHealth(data); setBusy(null); } })
      .catch((e) => { if (active) { setError(e instanceof Error ? e.message : 'تعذر فحص النظام.'); setBusy(null); } });
    return () => { active = false; };
  }, [api]);
  useEffect(() => () => { if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current); }, []);
  useEffect(() => { if (prepared) confirmRef.current?.focus(); }, [prepared]);

  const download = (backup: MaintenanceBackup) => {
    if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup)], { type: 'application/json' }));
    downloadUrl.current = url;
    const filename = `ygcars-data-${backup.createdAt.replace(/[:.]/g, '-')}.json`;
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    return { url, filename };
  };
  const begin = async (operation?: MaintenanceOperation) => {
    setBusy(operation || 'backup'); setError(''); setNotice(''); setPrepared(null); setPassword(''); setConfirmation(''); setSaved(false);
    try {
      const data = await api({ action: operation ? 'prepare' : 'backup', operation, ...(operation === 'restore' ? { backup: restore } : {}) });
      const file = download(data.backup);
      if (operation) setPrepared({ operation, ticket: data.ticket, ...file });
      else setNotice('تم إنشاء نسخة بيانات التشغيل وتنزيلها. احفظها في مكان خاص وآمن.');
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر تجهيز النسخة.'); }
    finally { setBusy(null); }
  };
  const inspect = async (file?: File) => {
    setRestore(null); setRestoreDate(''); setPrepared(null); setError(''); setNotice('');
    if (!file) return;
    setBusy('inspect');
    try {
      if (file.size > 2_950_000) throw new Error('الملف أكبر من الحد المسموح هنا. استخدم نسخة Supabase الكاملة.');
      const backup = JSON.parse(await file.text());
      const data = await api({ action: 'inspect', backup });
      setRestore(backup); setRestoreDate(data.createdAt);
      setNotice('توقيع النسخة سليم وتخص هذا المشروع. لم تُستعد أي بيانات بعد.');
    } catch (e) { setError(e instanceof Error ? e.message : 'الملف غير صالح.'); }
    finally { setBusy(null); }
  };
  const apply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prepared || busy) return;
    setBusy('apply'); setError(''); setNotice('');
    try {
      const result = await api({ action: 'apply', ticket: prepared.ticket, password, confirmation, backupSaved: saved,
        ...(prepared.operation === 'restore' ? { backup: restore } : {}) });
      setPrepared(null); setPassword(''); setConfirmation(''); setRestore(null); setRestoreDate('');
      setNotice(`اكتملت العملية بنجاح. عدد السجلات المتأثرة: ${result.affected}. حسابات الموظفين محفوظة. حدّث الصفحة قبل متابعة العمل.`);
      setHealth(await api());
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذّر إكمال العملية.'); setPassword(''); }
    finally { setBusy(null); }
  };
  const date = (value: string) => new Date(value).toLocaleString('ar-EG');
  const total = health ? Object.values(health.counts).reduce((sum, n) => sum + (n ?? 0), 0) : null;
  const ready = !!health?.engineReady && !busy;

  return <section className="developer-center" aria-label="مركز صيانة المبرمج" aria-busy={!!busy}>
    <header className="dev-hero">
      <div><span className="dev-eyebrow"><Terminal size={16} aria-hidden="true" /> مساحة المبرمج</span>
        <h1>كل ما تحتاجه لاستقرار النظام.</h1>
        <p>راقب الحالة، احفظ بيانات التشغيل، ونفّذ الصيانة بخطوات واضحة.</p>
        <div className="dev-hero-meta"><span><LockKeyhole size={14} aria-hidden="true" /> وصول خاص بحساب المبرمج</span><span>حسابات الموظفين محمية من التصفير</span></div>
      </div>
      <button type="button" className="dev-button dev-button-light" onClick={refresh} disabled={!!busy}><RefreshCw size={17} aria-hidden="true" />{busy === 'health' ? 'جارٍ الفحص…' : 'فحص النظام'}</button>
    </header>
    <div className="dev-feedback" aria-live="polite" aria-atomic="true">{error && <p className="dev-error" role="alert">{error}</p>}{notice && <p className="dev-notice">{notice}</p>}</div>
    <div className="dev-status-grid">
      {[{ label: 'قاعدة البيانات', ok: health?.database, icon: Database, detail: health ? `${health.latencyMs} مللي ثانية للفحص` : 'بانتظار الفحص' },
        { label: 'خدمة حسابات الدخول', ok: health?.auth, icon: ShieldCheck, detail: health ? `${health.staffCount ?? '—'} حساب موظف · ${health.authCount ?? '—'} حساب دخول` : 'بانتظار الفحص' },
        { label: 'خدمة الملفات', ok: health?.storage, icon: Activity, detail: health ? `${health.buckets ?? '—'} مساحة ملفات مسجلة` : 'بانتظار الفحص' }].map(({ label, ok, icon: Icon, detail }) =>
        <article className="dev-status" key={label}><span className="dev-status-icon"><Icon size={21} aria-hidden="true" /></span><div><h2>{label}</h2><strong className={ok === false ? 'dev-text-error' : ''}>{ok === undefined ? 'جارٍ التحقق' : ok ? 'متصلة' : 'تحتاج مراجعة'}</strong><p>{detail}</p></div></article>)}
    </div>
    {health && !health.engineReady && <div className="dev-setup"><TriangleAlert size={22} aria-hidden="true" /><div><strong>خطوة إعداد واحدة متبقية داخل Supabase</strong><p>وظائف الصيانة غير مثبتة أو تعذر الوصول إليها. تبقى الاستعادة والتصفير مقفلتين حتى نجاح فحص الاتصال بها.</p></div></div>}
    <div className="dev-tool-grid">
      <article className="dev-panel"><div className="dev-panel-heading"><span className="dev-tool-icon"><ArrowDownToLine size={22} aria-hidden="true" /></span><span className="dev-tag">حماية البيانات</span></div>
        <h2>نسخة بيانات التشغيل</h2><p>ملف موقّع يشمل السيارات والعملاء والحجوزات والفواتير وبقية جداول التشغيل التسعة.</p>
        <div className="dev-number">{total === null ? '—' : total.toLocaleString('ar-EG')} <small>سجل حاليًا</small></div>
        <p className="dev-small">لا يشمل كلمات مرور الدخول أو الصور المحفوظة خارج الجداول أو كود الموقع. هذه النسخة ليست بديلًا عن النسخة الكاملة من Supabase.</p>
        <button className="dev-button dev-button-primary" disabled={!ready} onClick={() => begin()}><ArrowDownToLine size={17} aria-hidden="true" />{busy === 'backup' ? 'جارٍ إنشاء النسخة…' : 'إنشاء وتنزيل نسخة الآن'}</button>
        <a className="dev-link" href={`https://supabase.com/dashboard/project/${health?.project || 'olpjfipferziqtzrbbbt'}/database/backups`} target="_blank" rel="noopener noreferrer">النسخ الكامل في Supabase <ExternalLink size={14} aria-hidden="true" /></a>
      </article>
      <article className="dev-panel"><div className="dev-panel-heading"><span className="dev-tool-icon"><ArrowUpFromLine size={22} aria-hidden="true" /></span><span className="dev-tag">استعادة مدروسة</span></div>
        <h2>استعادة بيانات التشغيل</h2><p>اختر نسخة صادرة من هذا المركز. نفحص توقيعها ومشروعها قبل السماح بالاستعادة.</p>
        <label className="dev-file-label" htmlFor="dev-restore-file">اختر ملف النسخة الاحتياطية</label>
        <input id="dev-restore-file" type="file" accept=".json,application/json" disabled={!ready || !!prepared} onChange={(event) => inspect(event.target.files?.[0])} />
        {restore && <p className="dev-file-ok"><Check size={16} aria-hidden="true" /> نسخة موثوقة بتاريخ {date(restoreDate)}</p>}
        <p className="dev-small">الاستعادة تستبدل بيانات التشغيل الحالية بتاريخ النسخة. نأخذ نسخة من الوضع الحالي أولًا، ولا نغيّر حسابات الدخول.</p>
        <button className="dev-button" disabled={!ready || !restore} onClick={() => begin('restore')}>مراجعة الاستعادة وأخذ نسخة حالية</button>
      </article>
      <article className="dev-panel"><div className="dev-panel-heading"><span className="dev-tool-icon"><Wrench size={22} aria-hidden="true" /></span><span className="dev-tag">تشخيص وصيانة</span></div>
        <h2>فحص الأخطاء ومعالجة التعارض</h2><p>نفحص اتصال الخدمات وتوافق حالة السيارة مع العقود النشطة. تظهر المشكلة قبل تنفيذ أي معالجة.</p>
        <ul className="dev-checks">{health?.issues.map((issue) => <li key={issue.label}><span>{issue.label}</span><strong>{issue.count}</strong></li>)}</ul>
        {health?.errors.map((message) => <p className="dev-error" key={message}>{message}</p>)}
        {health?.engineReady && health.issues.every((issue) => issue.count === 0) && <p className="dev-file-ok"><Check size={16} aria-hidden="true" /> لم يظهر تعارض في الفحوص المتاحة.</p>}
        <p className="dev-small">المعالجة تغيّر السيارة المتاحة إلى «مؤجرة» فقط إذا كان لديها عقد نشط. أخطاء الكود والاستضافة تحتاج تشخيصًا منفصلًا.</p>
        <button className="dev-button" disabled={!ready || !health?.issues[0]?.count} onClick={() => begin('repair')}>مراجعة معالجة حالة السيارات</button>
      </article>
      <article className="dev-panel dev-accounts"><div className="dev-panel-heading"><span className="dev-tool-icon"><Users size={22} aria-hidden="true" /></span><span className="dev-tag">إدارة النظام</span></div>
        <h2>المدراء وفريق العمل</h2><p>أنشئ مديرًا جديدًا، وعدّل صلاحيات الموظفين من شاشة إدارة الحسابات الحالية.</p>
        <div className="dev-account-number">{health?.staffCount ?? '—'} <span>حساب موظف محفوظ</span></div>
        <p className="dev-small">صلاحية مركز الصيانة منفصلة عن صلاحية «مدير عام». إنشاء مدير جديد لا يمنحه أدوات المبرمج.</p>
        <button className="dev-button" onClick={onManageStaff}><Users size={17} aria-hidden="true" />إدارة المدراء والموظفين</button>
      </article>
    </div>
    <article className="dev-panel dev-danger"><div><span className="dev-eyebrow"><TriangleAlert size={17} aria-hidden="true" /> إعادة ضبط بيانات التجارب</span><h2>بداية نظيفة، مع بقاء فريقك.</h2><p>تُحذف بيانات التشغيل وسجل نشاط الموظفين. تبقى حساباتهم وكلمات مرورهم وصلاحياتهم، ويبقى سجل عمليات الصيانة الجديد.</p></div>
      <details><summary>مراجعة الجداول التي يشملها التصفير</summary><ul className="dev-checks">{MAINTENANCE_TABLES.map((table) => <li key={table}><span>{MAINTENANCE_LABELS[table]}</span><strong>{health?.counts[table] ?? '—'}</strong></li>)}</ul></details>
      <button className="dev-button dev-button-danger" disabled={!ready} onClick={() => begin('reset')}>أخذ نسخة ومراجعة التصفير</button>
    </article>
    {prepared && <form className="dev-panel dev-confirm" onSubmit={apply} aria-labelledby="dev-confirm-title">
      <h2 id="dev-confirm-title">تأكيد: {MAINTENANCE_PHRASES[prepared.operation]}</h2>
      <p>جُهّزت نسخة من الوضع الحالي. صلاحية التأكيد خمس دقائق؛ إذا تغيّرت البيانات نوقف العملية ونطلب نسخة جديدة.</p>
      <a className="dev-link" href={prepared.url} download={prepared.filename}>تنزيل نسخة ما قبل العملية مرة أخرى <ArrowDownToLine size={16} aria-hidden="true" /></a>
      <label className="dev-checkbox"><input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} required />حفظت نسخة ما قبل العملية وأفهم أثر الإجراء.</label>
      <label htmlFor="dev-confirm-text">اكتب: «{MAINTENANCE_PHRASES[prepared.operation]}»</label>
      <input ref={confirmRef} id="dev-confirm-text" autoComplete="off" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required />
      <label htmlFor="dev-confirm-password">كلمة مرور حساب المبرمج</label>
      <input id="dev-confirm-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <div className="dev-confirm-actions"><button className="dev-button dev-button-danger" disabled={!!busy || !saved || confirmation !== MAINTENANCE_PHRASES[prepared.operation] || !password}>{busy === 'apply' ? 'جارٍ التنفيذ…' : 'تنفيذ العملية المؤكدة'}</button><button type="button" className="dev-button" disabled={!!busy} onClick={() => { setPrepared(null); setPassword(''); }}>إلغاء</button></div>
    </form>}
    <article className="dev-panel dev-history"><h2>آخر عمليات الصيانة</h2>{!health?.history.length ? <p>لا توجد عمليات صيانة مسجلة حتى الآن.</p> : <ul>{health.history.map((event) => <li key={event.id}><strong>{MAINTENANCE_PHRASES[event.operation as MaintenanceOperation] || event.operation}</strong><span>{date(event.created_at)}</span><span>{event.affected} سجل</span></li>)}</ul>}</article>
    <p className="dev-last-check">آخر فحص: {health ? date(health.checkedAt) : 'جارٍ التحميل…'} · لا توجد عمليات تلقائية للحذف أو الاستعادة.</p>
  </section>;
}
