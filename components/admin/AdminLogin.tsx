'use client';

import React from 'react';
import Link from 'next/link';
import { Car as CarIcon, KeyRound, ChevronLeft } from 'lucide-react';

interface AdminLoginProps {
  loginUsername: string;
  setLoginUsername: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  loginError: string;
  handleLoginSubmit: (e: React.FormEvent) => void;
}

export default function AdminLogin({
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  loginError,
  handleLoginSubmit,
}: AdminLoginProps) {
  return (
    <div className="min-h-screen bg-[#060b17] flex items-center justify-center p-4 font-arabic">
      <div className="w-full max-w-md bg-[#0a1122] border border-[#c5a059]/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c5a059] to-[#8a6d3b] flex items-center justify-center p-0.5 mx-auto shadow-lg shadow-[#c5a059]/20">
            <div className="w-full h-full bg-[#060b17] rounded-[14px] flex items-center justify-center">
              <CarIcon className="w-8 h-8 text-[#c5a059]" />
            </div>
          </div>
          <h2 className="text-lg font-black text-white">بوابة الموظفين والإدارة</h2>
          <p className="text-xs text-[#c5a059] font-semibold">شركة اليمن والخليج لتأجير السيارات</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">اسم المستخدم:</label>
            <input
              type="text"
              required
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="admin أو agent أو accountant"
              className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#c5a059] font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">كلمة المرور:</label>
            <div className="relative">
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الخاصة بحسابك"
                className="w-full bg-[#0e172a] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#c5a059] font-mono"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            {loginError && (
              <p className="text-[11px] text-rose-400 font-bold mt-1.5 flex items-center gap-1">
                <span>⚠</span> {loginError}
              </p>
            )}
          </div>

          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="text-slate-300 font-bold">الحسابات الافتراضية الجاهزة:</p>
            <div className="flex justify-between font-mono text-[10px]">
              <span>المدير: admin (كلمة السر: admin)</span>
              <span>الموظف: agent (كلمة السر: agent)</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#96793e] hover:from-[#d4af37] hover:to-[#a98845] text-black font-black text-xs shadow-lg shadow-[#c5a059]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>تسجيل الدخول للنظام</span>
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-center pt-1">
            <Link href="/" className="text-[11px] text-slate-400 hover:text-[#c5a059] transition-colors">
              ← العودة إلى الموقع الرئيسي للعملاء
            </Link>
          </div>
        </form>

      </div>
    </div>
  );
}
