'use client';

import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  Printer, 
  X, 
  LayoutGrid, 
  List, 
  Activity,
  Calendar,
  Car,
  Briefcase
} from 'lucide-react';
import { AuditLogItem } from '@/types/fleet';
import AuditItem, { ActionCategory, getLogCategory } from './AuditItem';

interface AuditTabProps {
  auditLogs: AuditLogItem[];
}

type TimeFilter = 'all' | 'today' | 'week';

export default function AuditTab({ auditLogs }: AuditTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'super_admin' | 'rental_agent' | 'accountant'>('all');
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  // Check if timestamp is within timeframe
  const isWithinTimeframe = (timestampStr: string, timeframe: TimeFilter): boolean => {
    if (timeframe === 'all') return true;
    try {
      const logDate = new Date(timestampStr);
      if (isNaN(logDate.getTime())) return true;
      const now = new Date();
      const diffMs = now.getTime() - logDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (timeframe === 'today') return diffDays <= 1;
      if (timeframe === 'week') return diffDays <= 7;
      return true;
    } catch {
      return true;
    }
  };

  // KPI telemetry
  const kpiStats = useMemo(() => {
    let bookingActions = 0;
    let fleetActions = 0;
    let financialStaffActions = 0;

    auditLogs.forEach((log) => {
      const cat = getLogCategory(log.action, log.details);
      if (cat === 'bookings') bookingActions++;
      else if (cat === 'fleet') fleetActions++;
      else if (cat === 'owners' || cat === 'staff' || cat === 'coupons') financialStaffActions++;
    });

    return {
      total: auditLogs.length,
      bookings: bookingActions,
      fleet: fleetActions,
      financialStaff: financialStaffActions,
    };
  }, [auditLogs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return auditLogs.filter((log) => {
      if (q) {
        const matchStaff = (log.staffName || '').toLowerCase().includes(q);
        const matchRole = (log.staffRole || '').toLowerCase().includes(q);
        const matchAction = (log.action || '').toLowerCase().includes(q);
        const matchDetails = (log.details || '').toLowerCase().includes(q);
        const matchTime = (log.timestamp || '').toLowerCase().includes(q);
        if (!matchStaff && !matchRole && !matchAction && !matchDetails && !matchTime) {
          return false;
        }
      }

      if (selectedRole !== 'all' && log.staffRole !== selectedRole) {
        return false;
      }

      if (selectedCategory !== 'all') {
        const cat = getLogCategory(log.action, log.details);
        if (cat !== selectedCategory) return false;
      }

      if (!isWithinTimeframe(log.timestamp, timeFilter)) {
        return false;
      }

      return true;
    });
  }, [auditLogs, searchQuery, selectedRole, selectedCategory, timeFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['المعرف', 'الموظف المسؤول', 'الرتبة الوظيفية', 'الإجراء', 'التفاصيل', 'التوقيت'];
    const rows = filteredLogs.map(l => [
      `"${l.id}"`,
      `"${l.staffName.replace(/"/g, '""')}"`,
      `"${l.staffRole.replace(/"/g, '""')}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.timestamp.replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-3 max-w-[1600px] mx-auto text-slate-800 font-arabic" dir="rtl">
      {/* 1. Header & Security Telemetry */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">سجل الرقابة والعمليات التشغيلية (Audit Trail)</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {auditLogs.length.toLocaleString('ar-EG')} عملية موثقة
            </span>
          </div>

          {/* Telemetry Capsules */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              <Calendar size={11} className="text-emerald-600" />
              <span>عقود: {kpiStats.bookings}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-bold">
              <Car size={11} className="text-slate-600" />
              <span>أسطول: {kpiStats.fleet}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-bold">
              <Briefcase size={11} className="text-amber-600" />
              <span>مالي وإداري: {kpiStats.financialStaff}</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 no-print">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="تصدير السجل كملف CSV"
          >
            <Download size={13} />
            <span>تصدير CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            title="طباعة تقرير الرقابة"
          >
            <Printer size={13} />
            <span>طباعة</span>
          </button>
        </div>
      </header>

      {/* 2. Unified Intelligent Controls Strip */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 p-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث فوري: اسم الموظف، العملية، التفاصيل، أو التاريخ…"
            className="w-full h-8 pr-8 pl-8 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              title="مسح البحث"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {[
            { value: 'all', label: 'كافة الأقسام' },
            { value: 'bookings', label: 'العقود' },
            { value: 'fleet', label: 'الأسطول' },
            { value: 'customers', label: 'العملاء' },
            { value: 'owners', label: 'الملاك' },
            { value: 'staff', label: 'الموظفون' },
            { value: 'coupons', label: 'العروض' },
          ].map((cat) => {
            const active = selectedCategory === cat.value;
            return (
              <button
                type="button"
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value as ActionCategory)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 border-t md:border-t-0 md:border-r border-slate-200 pt-1 md:pt-0 md:pr-2 mr-auto md:mr-0">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="عرض زمني"
          >
            <LayoutGrid size={14} />
            <span className="hidden lg:inline text-[11px]">سجل تفاعلي</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              viewMode === 'table'
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
            title="عرض الجدول المدمج"
          >
            <List size={14} />
            <span className="hidden lg:inline text-[11px]">جدول تدقيق</span>
          </button>
        </div>
      </div>

      {/* 3. Log Records Presentation */}
      {filteredLogs.length === 0 ? (
        <div className="p-10 text-center flex flex-col items-center justify-center gap-2 bg-white border border-dashed border-slate-300 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Activity size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {searchQuery ? 'لا توجد سجلات تطابق شروط البحث' : 'لا توجد عمليات مسجلة في هذا التصنيف'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            جرّب تغيير فلاتر التاريخ أو القسم لاستعراض السجلات السابقة.
          </p>
        </div>
      ) : viewMode === 'timeline' ? (
        <div className="flex flex-col gap-2">
          {filteredLogs.map((log) => (
            <AuditItem key={log.id} log={log} viewMode="timeline" />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px]">
                  <th className="p-2.5 font-bold">التوقيت</th>
                  <th className="p-2.5 font-bold">الموظف والرتبة</th>
                  <th className="p-2.5 font-bold">القسم</th>
                  <th className="p-2.5 font-bold">الإجراء والتفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <AuditItem key={log.id} log={log} viewMode="table" />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
