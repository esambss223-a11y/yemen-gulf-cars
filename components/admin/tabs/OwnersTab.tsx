'use client';

import React from 'react';
import { Users, Plus, FileText, Edit3 } from 'lucide-react';
import { VehicleOwner, Car, StaffUser } from '@/types/fleet';

interface OwnersTabProps {
  owners: VehicleOwner[];
  cars: Car[];
  currentStaff: StaffUser;
  onOpenAddOwner: () => void;
  onOpenEditOwner: (owner: VehicleOwner) => void;
  onOpenSettlement: (owner: VehicleOwner) => void;
}

export default function OwnersTab({
  owners,
  cars,
  currentStaff,
  onOpenAddOwner,
  onOpenEditOwner,
  onOpenSettlement,
}: OwnersTabProps) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-[#0b1324] border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#c5a059]" /> إدارة ملاك السيارات وتوزيع الأرباح (Revenue Share)
            </h4>
            <p className="text-xs text-slate-400">حسابات الشركاء والمستثمرين، توزيع النسب، وتصفية المستحقات</p>
          </div>
          
          {currentStaff.role === 'super_admin' && (
            <button
              onClick={onOpenAddOwner}
              className="px-4 py-2 bg-[#c5a059] hover:bg-[#d4af37] text-black font-black text-xs rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" /> إضافة مالك/مستثمر جديد
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {owners.map((owner) => {
            const ownerCarsCount = cars.filter(c => c.ownerId === owner.id).length;
            return (
              <div key={owner.id} className="p-4 bg-[#0e172a] rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-white text-sm">{owner.name}</h5>
                    <span className="text-xs bg-[#c5a059]/20 text-[#c5a059] px-2.5 py-0.5 rounded-full font-bold font-mono">
                      نسبة المالك: {owner.ownerSharePercent}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-1">الهاتف: <strong className="font-mono text-slate-200">{owner.phone}</strong></p>
                  <p className="text-xs text-slate-400 mb-2">عدد السيارات التابعة له: <strong className="text-[#c5a059] font-mono">{ownerCarsCount} سيارات</strong></p>
                  {owner.notes && <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg">{owner.notes}</p>}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenSettlement(owner)}
                    className="flex-1 py-2 bg-[#c5a059] hover:bg-[#d4af37] text-black font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> كشف حساب وتصفية الأرباح
                  </button>

                  {currentStaff.role === 'super_admin' && (
                    <button
                      onClick={() => onOpenEditOwner(owner)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                      title="تعديل بيانات المالك والنسبة"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
