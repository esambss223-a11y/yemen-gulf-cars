"use client";

import { COMPANY_CONTACT } from '@/lib/company-contact';
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

const NAV_ITEMS = [
  { id: "featured-fleet", label: "الأسطول" },
  { id: "chauffeur-service", label: "خدمة المطار" },
  { id: "how-to-book", label: "كيفية الحجز" },
  { id: "why-us", label: "المزايا" },
  { id: "our-location", label: "تواصل معنا" },
];

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sections = NAV_ITEMS.map((item) => document.getElementById(item.id));
      const scrollPos = window.scrollY + 160;

      for (let i = sections.length - 1; i >= 0; i--) {
        const sec = sections[i];
        if (sec && sec.offsetTop <= scrollPos) {
          setActiveSection(NAV_ITEMS[i].id);
          return;
        }
      }
      if (window.scrollY < 180) {
        setActiveSection("");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isMobileMenuOpen]);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header
      className={`public-site-header sticky top-0 z-50 transition-all duration-300 motion-reduce:transition-none ${
        isScrolled
          ? "bg-[#060b17]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/80 py-2.5 lg:py-3"
          : "bg-[#060b17]/75 backdrop-blur-md border-b border-white/5 py-2.5 lg:py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center justify-between gap-3">
          
          {/* الشعار مع نقرة العودة للأعلى */}
          <button
            type="button"
            onClick={scrollToTop}
            className="flex shrink-0 items-center group cursor-pointer select-none rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c5a059]"
            aria-label="شركة اليمن والخليج"
          >
            <Image
              src="/logo2.png"
              alt="شركة اليمن والخليج لتأجير السيارات"
              width={1945}
              height={808}
              priority
              className="h-auto w-28 min-[360px]:w-32 sm:w-36 lg:h-11 lg:w-auto object-contain transition-transform duration-300 motion-reduce:transition-none group-hover:scale-105"
            />
          </button>

          {/* روابط التصفح المينيمال النظيفة للشاشات الكبيرة */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="قائمة التصفح الرئيسية">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className={`relative text-xs font-bold tracking-wide transition-colors duration-200 py-1.5 cursor-pointer ${
                    isActive ? "text-[#f3e5ab]" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-[#c5a059] rounded-full animate-fadeIn" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* الإجراءات الرئيسية للزائر */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* زر واتساب السريع (ظاهر دائماً وبحجم ذكي على الهاتف) */}
            <a
              href={`${COMPANY_CONTACT.whatsappUrl}?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%B4%D8%B1%D9%83%D8%A9%20%D8%A7%D9%84%D9%8a%D9%85%D9%86%20%D9%88%D8%A7%D9%84%D8%AE%D9%84%D9%8a%D8%AC%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8a%20%D8%AD%D8%AC%D8%B2%20%D8%B3%D9%8a%D8%A7%D8%B1%D8%A9.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold bg-[#c5a059] hover:bg-[#d4af37] text-[#060b17] transition-all duration-200 shadow-sm active:scale-95"
            >
              <MessageCircle className="hidden h-4 w-4 min-[360px]:block" aria-hidden="true" />
              <span>حجز فوري</span>
            </a>

            {/* زر القائمة للهواتف والشاشات الصغيرة */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-300 hover:text-white bg-white/5 border border-white/10 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c5a059]"
              aria-expanded={isMobileMenuOpen}
              aria-controls="public-mobile-navigation"
              aria-label="القائمة"
            >
              <svg className="h-5 w-5" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>
      </div>

      {/* قائمة الجوال الحديثة والمصممة بأسلوب أنيق وسلس */}
      {isMobileMenuOpen && (
        <div id="public-mobile-navigation" className="lg:hidden max-h-[calc(100dvh-90px)] overflow-y-auto overscroll-contain border-t border-white/10 bg-[#060b17]/98 backdrop-blur-2xl motion-safe:animate-[publicMenuReveal_180ms_ease-out]">
          <div className="max-w-7xl mx-auto px-4 py-3 divide-y divide-white/5">
            <nav className="py-2 space-y-1" aria-label="أقسام الموقع للجوال">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full min-h-11 flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#c5a059]/15 text-[#f3e5ab]"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-slate-500 font-mono">←</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 pb-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <span>خدمة العملاء 24/7</span>
              <a
                href={COMPANY_CONTACT.phoneHref}
                dir="ltr"
                className="min-h-11 inline-flex items-center font-mono text-[#c5a059] font-bold dir-ltr"
              >
                {COMPANY_CONTACT.displayPhone}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
