'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Search, Plus, Menu, Bell, X, Check, XCircle, CalendarClock, ClipboardList, ShieldCheck } from 'lucide-react';
import { StaffUser } from '@/types/fleet';
import { supabase } from '@/lib/supabase';

type NotificationItem = {
  id: string;
  type: 'booking' | 'license' | 'insurance' | 'contract' | 'permission';
  title: string;
  detail: string;
  target: 'bookings' | 'cars' | 'staff';
  requestId?: string;
};

interface AdminHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isCloudConnected: boolean;
  currentStaff: StaffUser;
  onOpenAddBooking: () => void;
  onOpenAddCar: () => void;
  onToggleMobileMenu?: () => void;
  onOpenProfile?: () => void;
  onOpenTab: (tab: 'bookings' | 'cars' | 'staff') => void;
}

export default function AdminHeader({
  searchQuery,
  setSearchQuery,
  isCloudConnected,
  currentStaff,
  onOpenAddBooking,
  onOpenAddCar,
  onToggleMobileMenu,
  onOpenProfile,
  onOpenTab,
}: AdminHeaderProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [reviewingRequest, setReviewingRequest] = useState<string | null>(null);

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
    <header className="h-16 sm:h-20 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-6 sticky top-0 z-20 font-arabic shadow-xs">
      
      {/* 1. الجانب الأيمن: شعار وهوية شركة اليمن والخليج في كبسولة كحلية فاخرة */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors shrink-0"
          title="فتح القائمة"
        >
          <Menu className="w-5 h-5 text-slate-800" />
        </button>

        <div className="flex items-center gap-3 bg-[#081225] text-white py-1.5 px-3 sm:px-4 rounded-2xl shadow-sm">
          <div className="text-right hidden sm:block">
            <h1 className="text-xs sm:text-sm font-black text-white leading-tight">
              شركة اليمن والخليج
            </h1>
            <p className="text-[10px] text-[#c5a059] font-medium leading-none mt-0.5">
              لتأجير السيارات
            </p>
          </div>
          <div className="h-8 sm:h-10 w-auto flex items-center justify-center shrink-0">
            <Image
              src="/logo2.png"
              alt="شركة اليمن والخليج"
              width={120}
              height={40}
              priority
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* 2. المنتصف: شريط البحث المستدير الأنيق المطابق للصورة */}
      <div className="flex-1 max-w-xl mx-auto">
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن سيارة، حجز، عميل، أو رقم مرجعي..."
            className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200/90 focus:border-[#c5a059] rounded-full pr-10 pl-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c5a059]/20 transition-all font-arabic text-right shadow-inner"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 3. الجانب الأيسر: زر الإشعارات والأزرار التشغيلية */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* شارة الاتصال السحابي */}
        <div className={`hidden lg:flex px-2.5 py-1.5 rounded-full text-[10px] font-bold items-center gap-1.5 border shadow-2xs ${
          isCloudConnected 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
            : 'bg-cyan-50 border-cyan-200 text-cyan-700'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-cyan-500'}`} />
          <span>{isCloudConnected ? 'سحابي متصل ✓' : 'مزامنة محلية ☁️'}</span>
        </div>

        {/* زر الإشعارات */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen((open) => !open)}
            aria-label="فتح التنبيهات"
            aria-expanded={notificationsOpen}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors relative cursor-pointer"
            title="الإشعارات والتنبيهات التشغيلية"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
                {notifications.length > 99 ? '99+' : notifications.length}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute left-0 top-full mt-2 w-[min(24rem,calc(100vw-1.5rem))] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden text-right">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <button onClick={() => setNotificationsOpen(false)} className="p-1 text-slate-400 hover:text-slate-700" aria-label="إغلاق التنبيهات">
                  <X className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-sm font-black text-slate-800">التنبيهات</h3>
                  <p className="text-[10px] text-slate-500">تتحدث تلقائيًا كل دقيقة</p>
                </div>
              </div>

              {notificationsError && <p role="alert" className="px-4 py-2 text-xs text-rose-700 bg-rose-50">{notificationsError}</p>}
              <div className="max-h-[min(65vh,28rem)] overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="p-6 text-center text-xs text-slate-500">لا توجد تنبيهات حالية.</p>
                ) : notifications.map((item) => (
                  <div key={item.id} className="p-3.5 hover:bg-slate-50">
                    <button onClick={() => { onOpenTab(item.target); setNotificationsOpen(false); }} className="w-full text-right">
                      <span className="flex items-center justify-end gap-2 text-xs font-black text-slate-800">
                        {item.title}{notificationIcon(item.type)}
                      </span>
                      <span className="block mt-1 text-[11px] leading-relaxed text-slate-600">{item.detail}</span>
                    </button>
                    {item.type === 'permission' && item.requestId && currentStaff.role === 'super_admin' && (
                      <div className="mt-2 flex justify-end gap-2">
                        <button disabled={reviewingRequest === item.requestId} onClick={() => void handlePermissionReview(item.requestId!, 'approved')} className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold disabled:opacity-50 flex items-center gap-1">
                          <Check className="w-3 h-3" /> موافقة
                        </button>
                        <button disabled={reviewingRequest === item.requestId} onClick={() => void handlePermissionReview(item.requestId!, 'rejected')} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-bold disabled:opacity-50 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> رفض
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* زر حجز جديد المباشر */}
        {(currentStaff.role === 'super_admin' || currentStaff.role === 'rental_agent') && (
          <button
            onClick={onOpenAddBooking}
            className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c5a059] hover:from-[#e0bc43] hover:to-[#cca74a] text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-[#c5a059]/20 transition-all cursor-pointer"
            title="إنشاء عقد وحجز جديد"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">حجز جديد</span>
          </button>
        )}

        {/* زر إضافة سيارة للمدير */}
        {currentStaff.role === 'super_admin' && (
          <button
            onClick={onOpenAddCar}
            className="hidden xl:flex px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold items-center gap-1.5 transition-all cursor-pointer"
            title="إضافة مركبة جديدة للأسطول"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة سيارة</span>
          </button>
        )}

      </div>

    </header>
  );
}
