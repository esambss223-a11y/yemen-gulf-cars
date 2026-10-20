'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Loader2, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ChevronLeft
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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#060911] text-slate-100 flex flex-col justify-between font-arabic selection:bg-[#c5a059] selection:text-black">
      
      {/* ========================================================
          1. خلفية سينمائية هادئة وفخمة (Cinematic Ambient Showroom)
          ======================================================== */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/showroom-bg.jpg"
          alt="صالة العرض"
          fill
          priority
          className="object-cover object-center filter brightness-[0.4] contrast-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/hero-poster.jpg';
          }}
        />
        {/* تدرج معتم مركّز لحماية القراءة والراحة البصرية */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060911] via-[#060911]/80 to-[#060911]/70" />
        {/* إضاءات محيطية ذهبية ناعمة */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[38rem] h-[38rem] bg-[#c5a059]/10 rounded-full blur-[150px]" />
      </div>

      {/* شريط علوي خفيف */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between">
        <Link 
          href="/" 
          className="text-xs text-slate-400 hover:text-[#c5a059] transition-colors flex items-center gap-1.5"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>الموقع الرئيسي للعملاء</span>
        </Link>
      </header>

      {/* ========================================================
          2. بطاقة تسجيل الدخول المركزية الفاخرة (Minimalist Luxury Card)
          ======================================================== */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        
        <div className="w-full max-w-[430px] bg-[#0b1120]/85 backdrop-blur-2xl border border-[#c5a059]/25 rounded-3xl shadow-2xl shadow-black/90 p-7 sm:p-9 space-y-6">
          
          {/* الشعار والترويسة المركزية */}
          <div className="text-center space-y-3">
            <div className="inline-block p-2 rounded-2xl bg-black/40 border border-white/5 shadow-inner">
              <Image
                src="/logo2.png"
                alt="شركة اليمن والخليج"
                width={150}
                height={55}
                priority
                className="h-10 sm:h-12 w-auto object-contain mx-auto"
              />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                تسجيل الدخول
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                بوابة الموظفين وإدارة الأسطول
              </p>
            </div>
          </div>

          {/* نموذج تسجيل الدخول النظيف والآمن */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-right">
            
            {/* اسم المستخدم */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اسم الموظف بالإنجليزية:
              </label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="مثال: admin"
                  autoComplete="username"
                  className="w-full bg-[#060b16]/90 border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] transition-all text-right"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#c5a059] transition-colors pointer-events-none" />
              </div>
            </div>

            {/* كلمة المرور */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                كلمة المرور:
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-[#060b16]/90 border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] transition-all text-right pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {loginError && (
                <div className="p-2.5 mt-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-end gap-2">
                  <span className="font-bold">{loginError}</span>
                  <span>⚠</span>
                </div>
              )}
            </div>

            {/* تذكرني */}
            <div className="flex items-center justify-end pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-300">
                <span>تذكر بياناتي على هذا الجهاز</span>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-[#c5a059] focus:ring-0 cursor-pointer accent-[#c5a059]"
                />
              </label>
            </div>

            {/* زر تسجيل الدخول الذهبي */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#8a6d3b] hover:from-[#d4af37] hover:to-[#a07e44] text-black font-black text-sm shadow-xl shadow-[#c5a059]/20 hover:shadow-[#c5a059]/35 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group active:scale-[0.99] mt-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جارٍ التحقق...</span>
                </>
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span>تسجيل الدخول للنظام</span>
                </>
              )}
            </button>

          </form>

        </div>

      </main>

      {/* ========================================================
          3. تذييل نظيف وبسيط (Clean Minimal Footer)
          ======================================================== */}
      <footer className="relative z-10 w-full px-6 py-3.5 text-center text-xs text-slate-500 border-t border-white/5 bg-[#060911]/60 backdrop-blur-md">
        <span className="text-[11px] font-mono">
          © 2026 شركة اليمن والخليج لتأجير السيارات
        </span>
      </footer>

    </div>
  );
}
