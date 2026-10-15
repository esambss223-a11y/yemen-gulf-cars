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
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
        
        {/* الترويسة */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" /> إدارة ملاك السيارات وتوزيع الأرباح (Revenue Share)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">حسابات الشركاء والمستثمرين، توزيع النسب، وتصفية المستحقات المالية</p>
          </div>
          
          {currentStaff.role === 'super_admin' && (
            <button
              onClick={onOpenAddOwner}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> إضافة مالك / شريك جديد
            </button>
          )}
        </div>

        {/* بطاقات الملاك */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {owners.map((owner) => {
            const ownerCarsCount = cars.filter(c => c.ownerId === owner.id).length;
            return (
              <div 
                key={owner.id} 
                className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 hover:border-amber-400/40 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-slate-900 text-sm">{owner.name}</h5>
                    <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold font-mono">
                      حصة المالك: {owner.ownerSharePercent}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mb-1">
                    الهاتف: <strong className="font-mono text-slate-700">{owner.phone}</strong>
                  </p>
                  <p className="text-xs text-slate-500 mb-2">
                    السيارات التابعة له بالأسطول: <strong className="text-amber-700 font-bold font-mono">{ownerCarsCount} سيارات</strong>
                  </p>
                  {owner.notes && (
                    <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/60">
                      {owner.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenSettlement(owner)}
                    className="flex-1 py-2 bg-[#081225] hover:bg-[#0c1a35] text-amber-400 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> كشف حساب وتصفية الأرباح
                  </button>

                  {currentStaff.role === 'super_admin' && (
                    <button
                      onClick={() => onOpenEditOwner(owner)}
                      className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg cursor-pointer border border-slate-200"
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
