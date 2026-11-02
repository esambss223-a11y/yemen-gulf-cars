'use client';

import { useState, useEffect } from 'react';
import { Home, Car, Plane, MessageCircle } from 'lucide-react';
import { COMPANY_CONTACT } from '@/lib/company-contact';

export default function MobileBottomBar() {
  const [activeTab, setActiveTab] = useState<'home' | 'fleet' | 'airport' | 'chat'>('home');

  useEffect(() => {
    const handleScroll = () => {
      const fleetEl = document.getElementById('featured-fleet');
      const airportEl = document.getElementById('chauffeur-service');

      const scrollPos = window.scrollY + 200;
      if (airportEl && scrollPos >= airportEl.offsetTop) {
        setActiveTab('airport');
      } else if (fleetEl && scrollPos >= fleetEl.offsetTop) {
        setActiveTab('fleet');
      } else {
        setActiveTab('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string, tab: 'home' | 'fleet' | 'airport') => {
    setActiveTab(tab);
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav 
      aria-label="شريط تطبيق الهاتف" 
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 py-2 px-3 shadow-[0_-4px_25px_rgba(0,0,0,0.08)]"
      dir="rtl"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. الرئيسية */}
        <button
          type="button"
          onClick={() => scrollTo('top', 'home')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'home' ? 'text-slate-900 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home size={19} className={activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
          <span className="text-[10px] font-bold">الرئيسية</span>
        </button>

        {/* 2. الأسطول */}
        <button
          type="button"
          onClick={() => scrollTo('featured-fleet', 'fleet')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'fleet' ? 'text-slate-900 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Car size={19} className={activeTab === 'fleet' ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
          <span className="text-[10px] font-bold">الأسطول</span>
        </button>

        {/* 3. استقبال المطار */}
        <button
          type="button"
          onClick={() => scrollTo('chauffeur-service', 'airport')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'airport' ? 'text-slate-900 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Plane size={19} className={activeTab === 'airport' ? 'stroke-[2.5]' : 'stroke-[1.75]'} />
          <span className="text-[10px] font-bold">المطار</span>
        </button>

        {/* 4. واتساب المباشر بنقرة واحدة */}
        <a
          href={COMPANY_CONTACT.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 text-emerald-600 hover:text-emerald-700 active:scale-95 transition-all"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
              <MessageCircle size={17} className="fill-white/20" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="text-[10px] font-bold text-emerald-700">حجز فوري</span>
        </a>
      </div>
    </nav>
  );
}
