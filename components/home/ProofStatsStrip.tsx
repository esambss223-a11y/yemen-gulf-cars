'use client';

import { ShieldCheck, Car, Plane, Sparkles, Clock, Award } from 'lucide-react';

const stats = [
  {
    icon: Car,
    value: '50+',
    title: 'سيارة فاخرة وحديثة',
    desc: 'موديلات 2024 - 2026 معقمة ومفحوصة',
  },
  {
    icon: Plane,
    value: '24/7',
    title: 'خدمة استقبال المطارات',
    desc: 'مطار القاهرة الدولي وسفنكس مع سائق خاص',
  },
  {
    icon: Award,
    value: '+10K',
    title: 'رحلة وعقد معتمد',
    desc: 'ثقة كبار الشخصيات ورجال الأعمال والزوار',
  },
  {
    icon: ShieldCheck,
    value: '100%',
    title: 'عقود موثقة وتأمين',
    desc: 'تسليم واستلام فوري بدون تعقيدات',
  },
];

export default function ProofStatsStrip() {
  return (
    <section 
      aria-label="إحصائيات وثقة الأسطول"
      className="relative w-full bg-slate-900 text-white border-y border-white/10 py-8 sm:py-10"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-amber-500/30 transition-all group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon size={20} className="sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono block leading-none">
                    {item.value}
                  </span>
                  <span className="text-xs font-bold text-slate-200 block truncate mt-1">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate font-medium hidden sm:block mt-0.5">
                    {item.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
