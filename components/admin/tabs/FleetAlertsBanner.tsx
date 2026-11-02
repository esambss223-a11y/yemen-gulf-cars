'use client';

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Wrench, 
  CalendarClock, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Car as CarIcon,
  ExternalLink 
} from 'lucide-react';
import type { Car } from '@/types/fleet';
import type { AdminTab } from '@/components/admin/AdminSidebar';

export interface FleetAlertItem {
  id: string;
  carId: string;
  carName: string;
  carPlate: string;
  type: 'license' | 'maintenance' | 'insurance';
  severity: 'critical' | 'warning';
  title: string;
  description: string;
}

interface FleetAlertsBannerProps {
  cars: Car[];
  setActiveTab: (tab: AdminTab) => void;
  onOpenCarDetails?: (carId: string) => void;
}

export default function FleetAlertsBanner({
  cars,
  setActiveTab,
  onOpenCarDetails,
}: FleetAlertsBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const alerts = useMemo<FleetAlertItem[]>(() => {
    const list: FleetAlertItem[] = [];
    const now = Date.now();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    cars.forEach((car) => {
      const carName = `${car.make} ${car.model} (${car.year})`;
      const carPlate = car.plateNumber;

      // 1. فحص رخصة السير
      if (car.licenseExpiryDate) {
        const expiryTime = new Date(car.licenseExpiryDate).getTime();
        if (!isNaN(expiryTime)) {
          const daysLeft = Math.ceil((expiryTime - now) / MS_PER_DAY);
          if (daysLeft < 0) {
            list.push({
              id: `${car.id}-lic-exp`,
              carId: car.id,
              carName,
              carPlate,
              type: 'license',
              severity: 'critical',
              title: 'رخصة السير منتهية',
              description: `انتهت الرخصة منذ ${Math.abs(daysLeft)} يوماً (${car.licenseExpiryDate})`,
            });
          } else if (daysLeft <= 30) {
            list.push({
              id: `${car.id}-lic-warn`,
              carId: car.id,
              carName,
              carPlate,
              type: 'license',
              severity: 'warning',
              title: 'تجديد رخصة السير قريباً',
              description: `متبقي ${daysLeft} يوماً على موعد انتهاء الرخصة (${car.licenseExpiryDate})`,
            });
          }
        }
      }

      // 2. فحص الصيانة الدورية وتغيير الزيت
      if (car.status === 'maintenance') {
        list.push({
          id: `${car.id}-maint-active`,
          carId: car.id,
          carName,
          carPlate,
          type: 'maintenance',
          severity: 'warning',
          title: 'السيارة قيد الصيانة',
          description: 'المركبة في الورشة حالياً وغير متاحة للإيجار حتى إتمام الفحص',
        });
      } else if (car.nextServiceKm && car.currentKm) {
        const kmDifference = car.nextServiceKm - car.currentKm;
        if (kmDifference <= 0) {
          list.push({
            id: `${car.id}-maint-due`,
            carId: car.id,
            carName,
            carPlate,
            type: 'maintenance',
            severity: 'critical',
            title: 'استحقاق صيانة دورية',
            description: `تجاوز العداد موعد الصيانة المجدول بـ ${Math.abs(kmDifference).toLocaleString('ar-EG')} كم (العداد الحالي: ${car.currentKm.toLocaleString('ar-EG')} كم)`,
          });
        } else if (kmDifference <= 1200) {
          list.push({
            id: `${car.id}-maint-soon`,
            carId: car.id,
            carName,
            carPlate,
            type: 'maintenance',
            severity: 'warning',
            title: 'اقتراب موعد الصيانة',
            description: `متبقي ${kmDifference.toLocaleString('ar-EG')} كم على موعد الصيانة القادمة (${car.nextServiceKm.toLocaleString('ar-EG')} كم)`,
          });
        }
      }

      // 3. فحص موعد انتهاء التأمين
      if (car.insuranceExpiryDate) {
        const insExpiryTime = new Date(car.insuranceExpiryDate).getTime();
        if (!isNaN(insExpiryTime)) {
          const daysLeft = Math.ceil((insExpiryTime - now) / MS_PER_DAY);
          if (daysLeft < 0) {
            list.push({
              id: `${car.id}-ins-exp`,
              carId: car.id,
              carName,
              carPlate,
              type: 'insurance',
              severity: 'critical',
              title: 'وثيقة التأمين منتهية',
              description: `انتهى التأمين منذ ${Math.abs(daysLeft)} يوماً (${car.insuranceExpiryDate})`,
            });
          } else if (daysLeft <= 25) {
            list.push({
              id: `${car.id}-ins-warn`,
              carId: car.id,
              carName,
              carPlate,
              type: 'insurance',
              severity: 'warning',
              title: 'اقتراب تجديد التأمين',
              description: `متبقي ${daysLeft} يوماً على انتهاء وثيقة التأمين`,
            });
          }
        }
      }
    });

    // ترتيب التنبيهات: الحرجة أولاً
    return list.sort((a, b) => (a.severity === 'critical' ? -1 : 1));
  }, [cars]);

  // حالة الأمان التام: لا توجد أي تنبيهات
  if (alerts.length === 0) {
    return (
      <div className="flex items-center justify-between p-3.5 px-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-xs transition-all">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-slate-800">جاهزية الأسطول والصيانة: </span>
            <span className="text-slate-500">جميع سيارات الأسطول تراخيصها وصياناتها وتأميناتها سارية ومجدولة بحالة ممتازة.</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('cars')}
          className="text-xs font-bold text-slate-700 hover:text-slate-950 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>إدارة الأسطول</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    );
  }

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.length - criticalCount;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        
        {/* تفاصيل التنبيه والأيقونة */}
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
            criticalCount > 0 
              ? 'bg-rose-50 text-rose-600 border-rose-200/80' 
              : 'bg-amber-50 text-amber-600 border-amber-200/80'
          }`}>
            <AlertTriangle className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                تنبيهات جاهزية الأسطول والصيانة
              </h4>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                criticalCount > 0 
                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {alerts.length} تنبيه
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mt-0.5">
              {criticalCount > 0 && (
                <span className="text-rose-600 font-bold">
                  {criticalCount} {criticalCount === 1 ? 'تنبيه حرج يستوجب الإجراء' : 'تنبيهات حرجة تستوجب الإجراء'} · 
                </span>
              )}
              <span className="text-slate-500 mr-1">
                {warningCount} {warningCount === 1 ? 'إشعار صيانة ومتابعة مجدول' : 'إشعارات صيانة ومتابعة مجدولة'}
              </span>
            </p>
          </div>
        </div>

        {/* زر التوسيع والإخفاء */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-700 hover:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <span>{isExpanded ? 'إخفاء التفاصيل' : 'استعراض التنبيهات'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* قائمة كروت التنبيهات المنبثقة عند الاستعراض */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {alerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            return (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between gap-2.5 transition-all ${
                  isCritical
                    ? 'bg-rose-50/40 border-rose-200/80 hover:bg-rose-50/70 text-slate-900'
                    : 'bg-slate-50/60 border-slate-200/80 hover:bg-white text-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {alert.type === 'license' ? (
                      <CalendarClock className={`w-4 h-4 shrink-0 ${isCritical ? 'text-rose-600' : 'text-amber-600'}`} />
                    ) : alert.type === 'maintenance' ? (
                      <Wrench className={`w-4 h-4 shrink-0 ${isCritical ? 'text-rose-600' : 'text-amber-600'}`} />
                    ) : (
                      <ShieldAlert className={`w-4 h-4 shrink-0 ${isCritical ? 'text-rose-600' : 'text-amber-600'}`} />
                    )}
                    <strong className={`font-bold text-[11px] ${isCritical ? 'text-rose-900' : 'text-slate-900'}`}>
                      {alert.title}
                    </strong>
                  </div>

                  <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-bold shrink-0">
                    {alert.carPlate}
                  </span>
                </div>

                <div>
                  <p className="font-bold text-[11px] text-slate-800">{alert.carName}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{alert.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('cars');
                      if (onOpenCarDetails) onOpenCarDetails(alert.carId);
                    }}
                    className={`text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      isCritical
                        ? 'text-rose-700 hover:text-rose-950'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CarIcon className="w-3 h-3" />
                    <span>معاينة في تبويب السيارات</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
