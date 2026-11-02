'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, 
  User, 
  Lock,
  Eye, 
  EyeOff, 
  ArrowRight,
  ChevronLeft,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface AdminLoginProps {
  loginUsername: string;
  setLoginUsername: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  loginError: string;
  isLoggingIn: boolean;
  handleLoginSubmit: (e: React.FormEvent) => void | Promise<void>;
}

export default function AdminLogin({
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  loginError,
  isLoggingIn,
  handleLoginSubmit,
}: AdminLoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  return (
    <div className="admin-ui admin-login relative min-h-screen w-full overflow-hidden bg-[#060911] text-slate-100 flex flex-col justify-between font-arabic selection:bg-[#c5a059] selection:text-black">
      
      {/* ========================================================
          1. خلفية سينمائية هادئة وفخمة (Cinematic Ambient Showroom)
          ======================================================== */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/showroom-bg.jpg"
          alt="صالة العرض"
          fill
          priority
          className="object-cover object-center filter brightness-[0.35] contrast-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/hero-poster.jpg';
          }}
        />
        {/* تدرج معتم مركّز لحماية القراءة والراحة البصرية */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060911] via-[#060911]/85 to-[#060911]/70" />
        {/* إضاءات محيطية ذهبية ناعمة */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38rem] h-[38rem] bg-[#c5a059]/10 rounded-full blur-[150px]" />
      </div>

      {/* شريط علوي خفيف وأنيق */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono text-slate-400">بوابة الإدارة المركزية · ERP Secure Portal</span>
        </div>
        <Link 
          href="/" 
          className="text-xs text-slate-300 hover:text-amber-300 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md shadow-xs"
        >
          <span>الموقع الرئيسي للعملاء</span>
          <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
        </Link>
      </header>

      {/* ========================================================
          2. بطاقة تسجيل الدخول المركزية الفاخرة (Minimalist Luxury Card)
          ======================================================== */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        
        <div className="w-full max-w-[440px] bg-[#0b1120]/90 backdrop-blur-2xl border border-[#c5a059]/30 rounded-3xl shadow-2xl shadow-black/90 p-7 sm:p-9 space-y-6">
          
          {/* الشعار والترويسة المركزية */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-2 rounded-2xl bg-slate-900/70 border border-amber-500/30 shadow-lg shadow-black/50">
                <Image
                  src="/logonew.png"
                  alt="شركة اليمن والخليج لتأجير وتوريد السيارات"
                  width={96}
                  height={96}
                  priority
                  className="w-20 h-20 sm:w-22 sm:h-22 object-contain drop-shadow-md"
                />
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                لوحة التحكم الإدارية
              </h2>
              <p className="text-xs text-amber-200/80 mt-1 font-medium">
                شركة اليمن والخليج لتأجير وتوريد السيارات
              </p>
            </div>
          </div>

          {/* نموذج تسجيل الدخول النظيف والآمن */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-right">
            
            {/* اسم المستخدم */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-username" className="text-xs font-bold text-slate-200">
                  اسم الموظف / المعرف:
                </label>
                <span className="text-[10px] font-mono text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  English Username
                </span>
              </div>
              <div className="relative group">
                <input
                  id="login-username"
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  dir="ltr"
                  className="w-full bg-[#060b16]/95 border border-slate-700/90 rounded-xl px-4 py-3 pr-10 pl-4 text-white placeholder-slate-500 text-xs font-mono font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all text-left"
                />
                <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-amber-400 transition-colors pointer-events-none" />
              </div>
            </div>

            {/* كلمة المرور */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-bold text-slate-200">
                  كلمة المرور:
                </label>
              </div>
              <div className="relative group">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  dir="ltr"
                  className="w-full bg-[#060b16]/95 border border-slate-700/90 rounded-xl px-4 py-3 pr-10 pl-11 text-white placeholder-slate-500 text-xs font-mono font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all text-left"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-amber-400 transition-colors pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {loginError && (
                <div className="p-3 mt-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center justify-start gap-2" role="alert">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}
            </div>

            {/* تذكرني */}
            <div className="flex items-center justify-start pt-1">
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-300 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer accent-[#c5a059]"
                />
                <span className="font-medium text-xs text-slate-300">تذكر بيانات تسجيل الدخول على هذا الجهاز</span>
              </label>
            </div>

            {/* زر تسجيل الدخول الذهبي الملكي عالي التباين */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#c5a059] to-[#b38b30] hover:from-[#e0bc45] hover:via-[#d4af37] hover:to-[#c5a059] text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group active:scale-[0.99] mt-3 border border-amber-300/40"
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #c5a059 50%, #b38b30 100%)',
                color: '#090d16',
              }}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                  <span className="text-slate-950 font-bold">جارٍ التحقق والولوج…</span>
                </>
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 text-slate-950 group-hover:-translate-x-1 transition-transform stroke-[2.5]" />
                  <span className="text-slate-950 text-sm font-extrabold tracking-wide">تسجيل الدخول للنظام</span>
                </>
              )}
            </button>

          </form>

          {/* شارة الأمان والخصوصية */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>نظام إداري مشفر ومحمي · Yemen &amp; Gulf ERP</span>
          </div>

        </div>

      </main>

      {/* ========================================================
          3. تذييل نظيف وبسيط (Clean Minimal Footer)
          ======================================================== */}
      <footer className="relative z-10 w-full px-6 py-3.5 text-center text-xs text-slate-500 border-t border-white/5 bg-[#060911]/60 backdrop-blur-md">
        <span className="text-[11px] font-mono">
          © 2026 شركة اليمن والخليج لتأجير السيارات · جميع الحقوق محفوظة
        </span>
      </footer>

    </div>
  );
}
