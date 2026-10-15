"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { id: "featured-fleet", label: "الأسطول" },
  { id: "chauffeur-service", label: "خدمة المطار" },
  { id: "how-to-book", label: "كيفية الحجز" },
  { id: "why-us", label: "المزايا" },
  { id: "contact-info", label: "تواصل معنا" },
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
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#060b17]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/80 py-3"
          : "bg-[#060b17]/75 backdrop-blur-md border-b border-white/5 py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* الشعار مع نقرة العودة للأعلى */}
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center focus:outline-none group cursor-pointer select-none"
            aria-label="شركة اليمن والخليج"
          >
            <Image
              src="/logo2.png"
              alt="شركة اليمن والخليج لتأجير السيارات"
              width={160}
              height={65}
              priority
              className="h-9 sm:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
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

          {/* الإجراءات: زر لوحة التحكم وزر الاتصال وزر قائمة الهاتف */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* زر لوحة التحكم الإدارية */}
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] sm:text-xs font-bold text-[#c5a059] border border-[#c5a059]/40 hover:bg-[#c5a059]/15 transition-all shadow-sm"
              title="لوحة تحكم الأسطول والحجوزات"
            >
              <span>لوحة الإدارة</span>
            </Link>

            {/* زر واتساب السريع (ظاهر دائماً وبحجم ذكي على الهاتف) */}
            <a
              href="https://wa.me/201034025211?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%B4%D8%B1%D9%83%D8%A9%20%D8%A7%D9%84%D9%8a%D9%85%D9%86%20%D9%88%D8%A7%D9%84%D8%AE%D9%84%D9%8a%D8%AC%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8a%20%D8%AD%D8%AC%D8%B2%20%D8%B3%D9%8a%D8%A7%D8%B1%D8%A9."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-[11px] sm:text-xs font-bold bg-[#c5a059] hover:bg-[#d4af37] text-[#060b17] transition-all duration-200 shadow-sm active:scale-95"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#060b17] animate-pulse" />
              <span>حجز فوري</span>
            </a>

            {/* زر القائمة للهواتف والشاشات الصغيرة */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-300 hover:text-white bg-white/5 border border-white/10 focus:outline-none cursor-pointer"
              aria-expanded={isMobileMenuOpen}
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
        <div className="lg:hidden border-t border-white/10 bg-[#060b17]/98 backdrop-blur-2xl transition-all">
          <div className="max-w-7xl mx-auto px-4 py-3 divide-y divide-white/5">
            <nav className="py-2 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
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

            <div className="pt-3 pb-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>خدمة العملاء 24/7</span>
              <a
                href="tel:+201034025211"
                className="font-mono text-[#c5a059] font-bold dir-ltr"
              >
                +20 10 34025211
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
