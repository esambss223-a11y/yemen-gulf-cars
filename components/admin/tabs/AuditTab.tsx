'use client';

import React from 'react';
import { ShieldCheck, Clock } from 'lucide-react';
import { AuditLogItem } from '@/types/fleet';

interface AuditTabProps {
  auditLogs: AuditLogItem[];
}

export default function AuditTab({ auditLogs }: AuditTabProps) {
  return (
    <div className="admin-section admin-section-audit space-y-4 animate-fadeIn">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
        
        {/* الترويسة */}
        <div className="mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> سجل الرقابة والعمليات التشغيلية (Audit Trail)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">سجل تدقيق غير قابل للتعديل لكافة عمليات الموظفين وإجراءات النظام</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
            {auditLogs.length} سجل
          </span>
        </div>

        <div className="space-y-2">
          {auditLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              لا توجد سجلات تدقيق حالياً
            </div>
          ) : (
            auditLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-100/70 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900">{log.staffName}</span>
                    <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                      {log.staffRole}
                    </span>
                    <span className="text-amber-700 font-semibold">• {log.action}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{log.details}</p>
                </div>
                <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px] shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
