'use client';

import React, { useState } from 'react';
import { 
  User, 
  Crown, 
  Briefcase, 
  Calculator, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  FileText, 
  Car as CarIcon, 
  CheckCircle2, 
  TrendingUp, 
  KeyRound, 
  Edit3, 
  Save, 
  LogOut,
  Activity,
  Award,
  Sparkles
} from 'lucide-react';
import { StaffUser, Booking, AuditLogItem } from '@/types/fleet';

interface ProfileTabProps {
  currentStaff: StaffUser;
  bookings: Booking[];
  auditLogs: AuditLogItem[];
  onUpdateStaff: (id: string, partial: Partial<StaffUser>) => void;
  onLogout: () => void;
}

export default function ProfileTab({
  currentStaff,
  bookings,
  auditLogs,
  onUpdateStaff,
  onLogout,
}: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(currentStaff.name);
  const [phoneInput, setPhoneInput] = useState(currentStaff.phone);
  const [passwordInput, setPasswordInput] = useState(currentStaff.password || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // استخراج سجل النشاطات الخاص بالموظف الحالي فقط
  const myAuditLogs = auditLogs.filter(
    log => log.staffName.toLowerCase().includes(currentStaff.username.toLowerCase()) || 
           log.staffName.includes(currentStaff.name) ||
           (currentStaff.role === 'super_admin' && log.staffRole === 'super_admin')
  );

  // إحصائيات الحجوزات الخاصة بهذا الموظف
  const myHandledBookings = bookings.filter(
    b => b.staffId === currentStaff.id || b.staffName.includes(currentStaff.name)
  );

  const totalHandledRevenue = myHandledBookings.reduce((sum, b) => sum + b.finalTotalEGP, 0);

  // حفظ التعديلات
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStaff(currentStaff.id, {
      name: nameInput,
      phone: phoneInput,
      password: passwordInput || currentStaff.password,
    });
    setIsEditing(false);
    setSaveSuccessMsg('تم حفظ وتحديث بيانات حسابك بنجاح ✓');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // رمز وألوان الرتبة الوظيفية
  const roleConfig = {
    super_admin: {
      title: 'المدير العام للمنظومة (Super Admin)',
      badge: '👑 مدير عام',
      bgGradient: 'from-amber-500 to-amber-700',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-400/40',
      icon: Crown,
      description: 'كامل الصلاحيات لإدارة الأسطول، الحسابات، الأرباح، وتعيين الموظفين.',
    },
    rental_agent: {
      title: 'مسؤول التأجير والاستقبال (Rental Agent)',
      badge: '👤 مسؤول تأجير',
      bgGradient: 'from-blue-600 to-indigo-700',
      textColor: 'text-blue-300',
      borderColor: 'border-blue-500/40',
      icon: Briefcase,
      description: 'إدارة وتسليم واستلام المركبات، توقيع العقود، وفحص عدادات الكيلومتر.',
    },
    accountant: {
      title: 'المحاسب المالي للشركة (Accountant)',
      badge: '💼 محاسب مالي',
      bgGradient: 'from-emerald-600 to-teal-700',
      textColor: 'text-emerald-300',
      borderColor: 'border-emerald-500/40',
      icon: Calculator,
      description: 'إصدار الفواتير الرسمية، متابعة الودائع المستردة، وتصفية مستحقات الملاك.',
    },
  }[currentStaff.role];

  const RoleIcon = roleConfig.icon;

  return (
    <div className="space-y-6 animate-fadeIn font-arabic pb-10">
      
      {/* 1. الغلاف والترويسة الملكية للحساب الشخصي */}
      <div className="relative rounded-3xl bg-[#081225] border border-slate-800 overflow-hidden shadow-md">
        
        {/* خلفية بانورامية أنيقة */}
        <div className="h-32 sm:h-40 bg-gradient-to-r from-[#081225] via-[#10203e] to-[#081225] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.18),transparent_50%)]" />
          
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              حساب نشط ومصرح
            </span>
          </div>
        </div>

        {/* محتوى بيانات الهوية والصورة */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-14 sm:-mt-16">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-right w-full sm:w-auto">
            {/* الصورة الرمزية للموظف */}
            <div className="relative">
              <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-1 bg-gradient-to-br ${roleConfig.bgGradient} shadow-xl`}>
                <div className="w-full h-full bg-[#081225] rounded-[14px] flex items-center justify-center relative overflow-hidden">
                  <RoleIcon className={`w-12 h-12 ${roleConfig.textColor}`} />
                  <div className="absolute bottom-1 right-1 bg-amber-500 p-1 rounded-lg text-slate-950">
                    <Sparkles className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* نصوص الاسم والرتبة */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">{currentStaff.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleConfig.borderColor} bg-slate-900/80 ${roleConfig.textColor}`}>
                  {roleConfig.badge}
                </span>
              </div>
              <p className="text-xs text-amber-400 font-semibold">{roleConfig.title}</p>
              <p className="text-xs text-slate-400 font-mono">@{currentStaff.username} • {currentStaff.phone}</p>
            </div>
          </div>

          {/* أزرار الإجراءات على الحساب */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-amber-400" />
              <span>{isEditing ? 'إلغاء التعديل' : 'تعديل بياناتي'}</span>
            </button>

            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>تسجيل الخروج</span>
            </button>
          </div>

        </div>

        {/* إشعار النجاح عند الحفظ */}
        {saveSuccessMsg && (
          <div className="mx-6 mb-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* نموذج تعديل البيانات إذا كان مفعلاً */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="m-6 p-5 rounded-2xl bg-[#0d1627] border border-amber-500/40 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>تحديث البيانات الشخصية وكلمة المرور</span>
              </h4>
              <span className="text-[11px] text-slate-400">تحديث فوري ينعكس على حسابك</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">الاسم الكامل:</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-[#141f36] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  required
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full bg-[#141f36] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">كلمة المرور الجديدة:</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="اتركها فارغة للاحتفاظ بالقديمة"
                  className="w-full bg-[#141f36] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </form>
        )}

      </div>

      {/* 2. بطاقات مؤشرات الأداء والإنجازات الخاصة بالموظف */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-amber-400/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-bold">العمليات المسجلة باسمي</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{myAuditLogs.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">عملية موثقة في سجل الرقابة</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-blue-400/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-bold">الحجوزات المشرف عليها</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{myHandledBookings.length}</div>
          <p className="text-[11px] text-blue-600 mt-1">عقود تم تسليمها أو إدارتها</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-emerald-400/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-bold">إجمالي مبالغ العقود</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {totalHandledRevenue > 0 ? totalHandledRevenue.toLocaleString() : '—'} <span className="text-xs text-slate-500 font-normal">ج.م</span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">إيرادات بإشرافك المباشر</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-purple-400/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-bold">مستوى الأمان والتحقق</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">موثق ومحمي</div>
          <p className="text-[11px] text-purple-600 mt-1">جلسة عمل إدارية مصرحة</p>
        </div>

      </div>

      {/* 3. سجل العمليات والنشاطات الشخصي (Personal Activity History) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" />
              <span>سجل نشاطاتي وعملياتي في المنظومة (Personal Activity Log)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              سجل كامل للعمليات والتعديلات التي قمت بتنفيذها على الأسطول والعقود في النظام
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold font-mono">
            إجمالي نشاطاتك: {myAuditLogs.length}
          </span>
        </div>

        {myAuditLogs.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Activity className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500 font-medium">لا توجد عمليات مسجلة باسمك حتى الآن في هذا الجهاز.</p>
            <p className="text-[11px] text-slate-400">أي عملية تقوم بها (إضافة سيارة، حجز، تعديل) ستوثق هنا فوراً.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
            {myAuditLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>{log.action}</span>
                    </div>
                    <p className="text-xs text-slate-600">{log.details}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono shrink-0 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
