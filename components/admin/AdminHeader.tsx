'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Search, Plus, Menu, Bell, X, Check, XCircle, CalendarClock, ClipboardList, ShieldCheck, LogOut, ChevronDown, UserRound, Car, Cloud, CloudOff } from 'lucide-react';
import { StaffUser } from '@/types/fleet';
import { supabase } from '@/lib/supabase';
import { type AdminTab, getAdminSectionTitle, getStaffRoleLabel } from './admin-navigation';

type HeaderPanel = 'search' | 'notifications' | 'create' | 'account';

type NotificationItem = {
  id: string;
  type: 'booking' | 'license' | 'insurance' | 'contract' | 'permission';
  title: string;
  detail: string;
  target: 'bookings' | 'cars' | 'staff';
  requestId?: string;
};

interface AdminHeaderProps {
  activeTab: AdminTab;
  isNavigationOpen?: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCloudConnected: boolean;
  currentStaff: StaffUser;
  onOpenAddBooking: () => void;
  onOpenAddCar: () => void;
  onToggleMobileMenu?: () => void;
  onOpenProfile?: () => void;
  onOpenTab: (tab: 'bookings' | 'cars' | 'staff') => void;
  onLogout?: () => void;
}

export default function AdminHeader({
  activeTab,
  isNavigationOpen = false,
  searchQuery,
  setSearchQuery,
  isCloudConnected,
  currentStaff,
  onOpenAddBooking,
  onOpenAddCar,
  onToggleMobileMenu,
  onOpenProfile,
  onOpenTab,
  onLogout,
}: AdminHeaderProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [panel, setPanel] = useState<HeaderPanel | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const triggers = useRef<Partial<Record<HeaderPanel, HTMLButtonElement | null>>>({});
  const [notificationsError, setNotificationsError] = useState('');
  const [reviewingRequest, setReviewingRequest] = useState<string | null>(null);

  const canBook = currentStaff.role === 'super_admin' || currentStaff.role === 'rental_agent';
  const canAddCar = currentStaff.role === 'super_admin' || currentStaff.role === 'fleet_entry';
  const togglePanel = (next: HeaderPanel) => setPanel((previous) => previous === next ? null : next);
  const closePanel = () => {
    setPanel(null);
    if (panel) triggers.current[panel]?.focus();
  };

  useEffect(() => {
    if (!panel) return;
    const root = headerRef.current?.querySelector<HTMLElement>(`[data-header-panel="${panel}"]`);
    root?.querySelector<HTMLElement>('[data-panel-content] :is(input, button, a[href])')?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !root?.contains(event.target)) setPanel(null);
    };
    const onFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Node && !root?.contains(event.target)) setPanel(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setPanel(null);
      triggers.current[panel]?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [panel]);

  useEffect(() => {
    let isMounted = true;
    const loadNotifications = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          if (isMounted) setNotifications([]);
          return;
        }
        const response = await fetch('/api/admin/notifications', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const result = await response.json();
        if (!isMounted) return;
        if (!response.ok) {
          setNotificationsError(result.error || 'تعذر تحميل التنبيهات.');
          return;
        }
        setNotifications(result.notifications || []);
        setNotificationsError('');
      } catch {
        if (isMounted) setNotificationsError('تعذر الاتصال بخدمة التنبيهات.');
      }
    };

    void loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 60_000);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [currentStaff.id]);

  const handlePermissionReview = async (requestId: string, decision: 'approved' | 'rejected') => {
    setReviewingRequest(requestId);
    setNotificationsError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/permission-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ id: requestId, decision }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'تعذرت مراجعة طلب الصلاحية.');
      setNotifications((items) => items.filter((item) => item.requestId !== requestId));
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : 'تعذرت مراجعة طلب الصلاحية.');
    } finally {
      setReviewingRequest(null);
    }
  };

  const notificationIcon = (type: NotificationItem['type']) => {
    if (type === 'booking') return <ClipboardList className="w-4 h-4 text-amber-500" />;
    if (type === 'permission') return <ShieldCheck className="w-4 h-4 text-sky-600" />;
    return <CalendarClock className={`w-4 h-4 ${type === 'contract' ? 'text-violet-500' : 'text-rose-500'}`} />;
  };

  return (
    <header ref={headerRef} className="admin-header">
      <div className="admin-header-heading">
        <button type="button" onClick={() => { setPanel(null); onToggleMobileMenu?.(); }} className="admin-menu-toggle"
          aria-label="فتح قائمة الأقسام" aria-controls="admin-navigation" aria-expanded={isNavigationOpen}>
          <Menu size={20} aria-hidden="true" />
        </button>
        <div className="admin-mobile-brand"><Image src="/logonew.png" alt="شركة اليمن والخليج لتأجير وتوريد السيارات" width={1254} height={1254} priority /></div>
        <h1 className="admin-header-title">{getAdminSectionTitle(activeTab, currentStaff)}</h1>
      </div>

      <div className={`admin-header-search ${panel === 'search' ? 'is-open' : ''}`} data-header-panel="search">
        <button ref={(node) => { triggers.current.search = node; }} type="button" className="admin-icon-button admin-search-toggle"
          onClick={() => togglePanel('search')} aria-label={searchQuery ? `البحث: ${searchQuery}` : 'فتح البحث'} aria-controls="admin-global-search" aria-expanded={panel === 'search'}>
          <Search size={20} aria-hidden="true" />{searchQuery && <span className="admin-search-dot" />}
        </button>
        <div className="admin-search-field" id="admin-global-search" data-panel-content>
          <label htmlFor="admin-search-input" className="sr-only">البحث في بيانات القسم الحالي</label>
          <Search size={18} aria-hidden="true" />
          <input id="admin-search-input" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="البحث في بيانات القسم..." autoComplete="off" />
          <button type="button" onClick={closePanel} className="admin-search-close admin-icon-button" aria-label="إغلاق البحث"><X size={18} /></button>
        </div>
      </div>

      <div className="admin-header-actions">
        {(canBook || canAddCar) && <div className="admin-header-create" data-header-panel="create">
          <button ref={(node) => { triggers.current.create = node; }} type="button" className="admin-create-toggle"
            onClick={() => togglePanel('create')} aria-expanded={panel === 'create'} aria-controls="admin-create-panel">
            <Plus size={18} aria-hidden="true" /><span>جديد</span><ChevronDown size={14} aria-hidden="true" />
          </button>
          {panel === 'create' && <div id="admin-create-panel" className="admin-header-popover admin-create-panel" data-panel-content aria-label="إجراءات جديدة">
            {canBook && <button type="button" onClick={() => { closePanel(); onOpenAddBooking(); }}><ClipboardList size={18} aria-hidden="true" /><span>إنشاء عقد وحجز جديد<small>تسليم سيارة للعميل</small></span></button>}
            {canAddCar && <button type="button" onClick={() => { closePanel(); onOpenAddCar(); }}><Car size={18} aria-hidden="true" /><span>إضافة سيارة<small>إضافة مركبة إلى الأسطول</small></span></button>}
          </div>}
        </div>}

        <div className="admin-notifications-root" data-header-panel="notifications">
          <button ref={(node) => { triggers.current.notifications = node; }} type="button" onClick={() => togglePanel('notifications')}
            aria-label={`التنبيهات${notifications.length ? `، ${notifications.length} تنبيه` : ''}`} aria-controls="admin-notifications-panel" aria-expanded={panel === 'notifications'}
            className="admin-icon-button admin-notification-toggle" title="الإشعارات والتنبيهات التشغيلية">
            <Bell size={20} aria-hidden="true" />
            {notifications.length > 0 && <span className="admin-notification-count" aria-hidden="true">{notifications.length > 99 ? '99+' : notifications.length}</span>}
          </button>
          {panel === 'notifications' && <div id="admin-notifications-panel" className="admin-header-popover admin-notifications-panel" data-panel-content role="region" aria-label="التنبيهات">
            <div className="admin-popover-heading"><div><h2>التنبيهات</h2><p>تتحدث تلقائيًا كل دقيقة</p></div><button type="button" className="admin-icon-button" onClick={closePanel} aria-label="إغلاق التنبيهات"><X size={18} /></button></div>
            {notificationsError && <p role="alert" className="admin-notification-error">{notificationsError}</p>}
            <div className="admin-notifications-list">
              {notifications.length === 0 ? <p className="admin-notification-empty">لا توجد تنبيهات حالية.</p> : notifications.map((item) => (
                <div key={item.id} className="admin-notification-item">
                  <button type="button" onClick={() => { closePanel(); onOpenTab(item.target); }} className="admin-notification-link">
                    {notificationIcon(item.type)}<span><strong>{item.title}</strong><small>{item.detail}</small></span>
                  </button>
                  {item.type === 'permission' && item.requestId && currentStaff.role === 'super_admin' && <div className="admin-notification-review">
                    <button type="button" disabled={reviewingRequest === item.requestId} onClick={() => void handlePermissionReview(item.requestId!, 'approved')}><Check size={16} /> موافقة</button>
                    <button type="button" disabled={reviewingRequest === item.requestId} onClick={() => void handlePermissionReview(item.requestId!, 'rejected')}><XCircle size={16} /> رفض</button>
                  </div>}
                </div>
              ))}
            </div>
          </div>}
        </div>

        <div className="admin-account-root" data-header-panel="account">
          <button ref={(node) => { triggers.current.account = node; }} type="button" className="admin-account-toggle" onClick={() => togglePanel('account')}
            aria-expanded={panel === 'account'} aria-controls="admin-account-panel" aria-label={`حساب ${currentStaff.name}`} title={`حساب ${currentStaff.name}`}>
            <span className="admin-account-avatar" aria-hidden="true">{currentStaff.name.trim().charAt(0) || <UserRound size={18} />}</span>
            <span className="admin-account-summary"><strong>{currentStaff.name}</strong><small>{getStaffRoleLabel(currentStaff)}</small></span>
            <ChevronDown size={14} className="admin-account-chevron" aria-hidden="true" />
          </button>
          {panel === 'account' && <div id="admin-account-panel" className="admin-header-popover admin-account-panel" data-panel-content aria-label="خيارات الحساب">
            <div className="admin-account-identity"><strong>{currentStaff.name}</strong><small>{getStaffRoleLabel(currentStaff)}</small></div>
            <div className={`admin-account-connection ${isCloudConnected ? 'is-connected' : ''}`}>
              {isCloudConnected ? <Cloud size={17} /> : <CloudOff size={17} />}<span>{isCloudConnected ? 'متصل بقاعدة البيانات' : 'غير متصل بقاعدة البيانات'}</span>
            </div>
            <button type="button" onClick={() => { closePanel(); onOpenProfile?.(); }}><UserRound size={18} aria-hidden="true" />الملف الشخصي والإعدادات</button>
            {onLogout && <button type="button" className="admin-account-logout" onClick={() => { closePanel(); onLogout(); }}><LogOut size={18} aria-hidden="true" />تسجيل الخروج</button>}
          </div>}
        </div>
      </div>
    </header>
  );
}
