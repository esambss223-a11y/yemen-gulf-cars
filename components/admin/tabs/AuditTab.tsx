'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { AuditLogItem } from '@/types/fleet';

interface AuditTabProps {
  auditLogs: AuditLogItem[];
}

export default function AuditTab({ auditLogs }: AuditTabProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-[#0b1324] border border-slate-800 rounded-2xl p-5">
        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" /> سجل حركات الموظفين والعمليات
        </h4>
        <div className="space-y-2">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3 bg-[#0e172a] rounded-xl border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-[#c5a059]">{log.staffName}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">({log.staffRole})</span>
                  <span className="text-white font-semibold">- {log.action}</span>
                </div>
                <p className="text-slate-400 text-[11px]">{log.details}</p>
              </div>
              <span className="text-slate-500 font-mono text-[10px] shrink-0">{log.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
