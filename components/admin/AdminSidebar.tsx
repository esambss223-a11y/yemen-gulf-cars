'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Car as CarIcon, Calendar, Users, UserCheck, BarChart3,
  Settings, LogOut, ExternalLink, Key, Tag, X } from 'lucide-react';
import { StaffUser } from '@/types/fleet';

export type AdminTab = 'overview' | 'cars' | 'bookings' | 'customers' | 'owners' | 'staff' | 'coupons' | 'audit' | 'profile';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  currentStaff: StaffUser;
  totalCarsCount: number;
  activeBookingsCount: number;
  customersCount?: number;
  ownerCarsCount?: number;
  staffCount: number;
  ownersCount: number;
  couponsCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  handleLogout: () => void;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  currentStaff,
  totalCarsCount,
  activeBookingsCount,
  customersCount = 0,
  staffCount,
  ownersCount,
  couponsCount = 0,
  isMobileOpen = false,
  onCloseMobile,
  handleLogout,
}: AdminSidebarProps) {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
      setDateStr(now.toISOString().split('T')[0]);
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  const allNavItems: { id: AdminTab; label: string; icon: React.ElementType; badge?: number | string }[] = [
    { id: 'overview', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'cars', label: 'السيارات', icon: CarIcon, badge: totalCarsCount },
    { id: 'bookings', label: 'الحجوزات والعقود', icon: Calendar, badge: activeBookingsCount },
    { id: 'customers', label: 'دليل العملاء (CRM)', icon: Users, badge: customersCount },
    { id: 'owners', label: 'الملاك والشركاء', icon: Key, badge: ownersCount },
    { id: 'staff', label: 'فريق العمل والصلاحيات', icon: UserCheck, badge: staffCount },
    { id: 'coupons', label: 'العروض وأكواد الخصم', icon: Tag, badge: couponsCount },
    { id: 'audit', label: 'التقارير وسجل الرقابة', icon: BarChart3 },
    { id: 'profile', label: 'الإعدادات وحسابي', icon: Settings },
  ];

  // تصفية القوائم حسب صلاحية الرتبة الوظيفية
  const allowedTabsByRole: Record<string, AdminTab[]> = {
    super_admin: ['overview', 'cars', 'bookings', 'customers', 'owners', 'staff', 'coupons', 'audit', 'profile'],
    rental_agent: ['overview', 'cars', 'bookings', 'customers', 'profile'],
    accountant: ['overview', 'bookings', 'cars', 'customers', 'owners', 'profile'],
  };

  const userRole = currentStaff.role || 'rental_agent';
  const allowed = allowedTabsByRole[userRole] || allowedTabsByRole.rental_agent;
  const navItems = allNavItems.filter((item) => allowed.includes(item.id));

  const roleLabel = {
    super_admin: 'مدير عام', rental_agent: 'موظف تأجير', accountant: 'محاسب مالي',
  }[userRole] || 'موظف';

  // The drawer only changes presentation; permissions and actions remain shared.
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isMobileOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseMobile?.();
      if (event.key !== 'Tab') return;
      const drawer = closeButtonRef.current?.closest('aside');
      const targets = drawer?.querySelectorAll<HTMLElement>('button, a[href]');
      if (!targets?.length) return;
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); previousFocus?.focus(); };
  }, [isMobileOpen, onCloseMobile]);

  const openTab = (tab: AdminTab) => { setActiveTab(tab); onCloseMobile?.(); };

  return (
    <>
      {isMobileOpen && <button className="admin-drawer-backdrop" onClick={onCloseMobile} aria-label="إغلاق القائمة" tabIndex={-1} />}
      <aside id="admin-navigation" className={`admin-navigation ${isMobileOpen ? 'is-open' : ''}`}
        role={isMobileOpen ? 'dialog' : undefined} aria-modal={isMobileOpen ? true : undefined} aria-label="أقسام لوحة التحكم">
        <div className="admin-drawer-brand">
          <button ref={closeButtonRef} onClick={onCloseMobile} aria-label="إغلاق القائمة"><X size={22} /></button>
          <Image src="/logo2.png" alt="شركة اليمن والخليج لتأجير السيارات" width={180} height={75} />
        </div>
        <nav aria-label="التنقل الرئيسي" className="admin-nav-tabs">
          {navItems.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} onClick={() => openTab(item.id)} aria-current={activeTab === item.id ? 'page' : undefined}
              className={`admin-nav-tab ${activeTab === item.id ? 'is-active' : ''}`}>
              <Icon size={17} aria-hidden="true" /><span>{item.label}</span>
              {item.badge !== undefined && <span className="admin-nav-count">{item.badge}</span>}
            </button>;
          })}
        </nav>
        <div className="admin-nav-utilities">
          <button onClick={() => openTab('profile')} className="admin-nav-profile" title="ملف الموظف">
            <span className="admin-avatar">{currentStaff.name.charAt(0)}</span>
            <span><strong>{currentStaff.name}</strong><small>{roleLabel}</small></span>
          </button>
          <div className="admin-nav-clock"><ClockIcon /><span>{timeStr || '—'}<small>{dateStr || '—'}</small></span></div>
          <span className="admin-nav-system"><i />النظام يعمل بشكل طبيعي</span>
          <Link href="/" title="معاينة الموقع" className="admin-utility-link"><ExternalLink size={16} /><span>عرض الموقع</span></Link>
          <button onClick={handleLogout} className="admin-utility-link admin-logout"><LogOut size={16} /><span>خروج</span></button>
        </div>
      </aside>
    </>
  );
}

function ClockIcon() {
  return <span className="admin-clock-dot" aria-hidden="true" />;
}
