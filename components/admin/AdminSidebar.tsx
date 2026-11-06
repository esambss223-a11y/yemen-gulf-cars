'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Car, 
  Calendar, 
  Users, 
  UserCheck, 
  BarChart3, 
  Settings, 
  ExternalLink, 
  Key, 
  Tag, 
  X, 
  PanelRightClose, 
  PanelRightOpen, 
  Plus, 
  ClipboardList 
} from 'lucide-react';
import type { StaffUser } from '@/types/fleet';
import { type AdminTab, getAdminSections } from './admin-navigation';
export type { AdminTab } from './admin-navigation';

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
  onOpenAddBooking: () => void;
  onOpenAddCar: () => void;
}

const icons: Record<AdminTab, React.ElementType> = {
  overview: LayoutDashboard,
  cars: Car,
  bookings: Calendar,
  customers: Users,
  owners: Key,
  staff: UserCheck,
  coupons: Tag,
  audit: BarChart3,
  profile: Settings,
};

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
  onOpenAddBooking,
  onOpenAddCar,
}: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isMobileOpen) return;
    const wideScreen = window.matchMedia('(min-width: 1200px)');
    if (wideScreen.matches) { onCloseMobile?.(); return; }
    const previousFocus = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const closeOnDesktop = () => { if (wideScreen.matches) onCloseMobile?.(); };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onCloseMobile?.(); }
      if (event.key !== 'Tab') return;
      const targets = Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('button, a[href]') || [])
        .filter((element) => element.getClientRects().length > 0);
      if (!targets.length) return;
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    wideScreen.addEventListener('change', closeOnDesktop);
    document.addEventListener('keydown', handleKey);
    return () => {
      wideScreen.removeEventListener('change', closeOnDesktop);
      document.removeEventListener('keydown', handleKey);
      previousFocus?.focus();
    };
  }, [isMobileOpen, onCloseMobile]);

  const badges: Partial<Record<AdminTab, number>> = {
    cars: totalCarsCount,
    bookings: activeBookingsCount,
    customers: customersCount,
    staff: staffCount,
    owners: ownersCount,
    coupons: couponsCount,
  };

  const openTab = (tab: AdminTab) => {
    setActiveTab(tab);
    onCloseMobile?.();
  };

  const canBook = currentStaff.role === 'super_admin' || currentStaff.role === 'rental_agent';
  const canAddCar = currentStaff.role === 'super_admin' || currentStaff.role === 'fleet_entry';

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          className="admin-drawer-backdrop"
          onClick={onCloseMobile}
          aria-label="إغلاق القائمة"
          tabIndex={-1}
        />
      )}

      <aside
        ref={sidebarRef}
        id="admin-navigation"
        className={`admin-navigation ${isCollapsed ? 'is-collapsed' : ''} ${isMobileOpen ? 'is-open' : ''}`}
        role={isMobileOpen ? 'dialog' : undefined}
        aria-modal={isMobileOpen ? true : undefined}
        aria-label="أقسام لوحة التحكم"
      >
        {/* Brand Header */}
        <div className="admin-navigation-brand">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 shrink-0 flex items-center justify-center">
              <Image
                src="/logonew.png"
                alt="شركة اليمن والخليج"
                width={1254}
                height={1254}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="admin-brand-text min-w-0 leading-tight">
              <span className="text-sm font-black text-slate-900 tracking-tight block truncate">اليمن والخليج</span>
              <span className="text-[11px] text-slate-500 block truncate font-medium">لتأجير وتوريد السيارات</span>
            </div>
          </div>

          <button
            type="button"
            className="admin-sidebar-collapse"
            onClick={() => setIsCollapsed((collapsed) => !collapsed)}
            title={isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
            aria-label={isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
          </button>

          <button
            ref={closeButtonRef}
            type="button"
            className="admin-drawer-close"
            onClick={onCloseMobile}
            aria-label="إغلاق القائمة"
          >
            <X size={18} />
          </button>
        </div>

        {/* Section Caption */}
        <p className="admin-navigation-caption">مساحة العمل</p>

        {/* Navigation Tabs */}
        <nav aria-label="التنقل الرئيسي" className="admin-nav-tabs">
          {getAdminSections(currentStaff).map((item) => {
            const Icon = icons[item.id];
            const isActive = activeTab === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => openTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                title={item.label}
                className={`admin-nav-tab ${isActive ? 'is-active' : ''}`}
              >
                <Icon size={17} aria-hidden="true" />
                <span className="admin-nav-label">{item.label}</span>
                {badges[item.id] !== undefined && (
                  <span className="admin-nav-count">{badges[item.id]}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile Quick Action Drawer Items */}
        {(canBook || canAddCar) && (
          <div className="admin-navigation-create" aria-label="إجراءات جديدة">
            <span>إنشاء وإضافة سريعة</span>
            {canBook && (
              <button
                type="button"
                onClick={() => {
                  onCloseMobile?.();
                  onOpenAddBooking();
                }}
              >
                <ClipboardList size={16} className="text-amber-600" aria-hidden="true" />
                <span>عقد وحجز جديد</span>
              </button>
            )}
            {canAddCar && (
              <button
                type="button"
                onClick={() => {
                  onCloseMobile?.();
                  onOpenAddCar();
                }}
              >
                <Car size={16} className="text-slate-800" aria-hidden="true" />
                <span>إضافة سيارة للأسطول</span>
              </button>
            )}
          </div>
        )}

        {/* Bottom Utilities */}
        <div className="admin-nav-utilities">
          <Link
            href="/"
            title="عرض موقع العملاء"
            aria-label="عرض موقع العملاء"
            className="admin-public-site"
          >
            <ExternalLink size={15} aria-hidden="true" />
            <span>عرض موقع العملاء</span>
          </Link>

          <div className="admin-status-pill px-2.5 py-1.5 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-600 font-semibold">النظام نشط</span>
            </span>
            <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
              ERP v2.4
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
