"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

const FOOTER_SECTIONS = [
  { id: "featured-fleet", label: "أسطول السيارات 2026" },
  { id: "chauffeur-service", label: "خدمة المطار مع سائق خاص" },
  { id: "how-to-book", label: "إجراءات وخطوات الحجز" },
  { id: "why-us", label: "معايير الجودة والضمان" },
];

export default function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer id="contact-info" className="bg-[#040812] border-t border-white/10 scroll-mt-20">
      
      {/* بطاقة الاتصال والعمليات الرئيسية */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* عمود 1: الهوية والمقدمة */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-block self-start focus:outline-none group cursor-pointer"
            >
              <Image
                src="/logo2.png"
                alt="شركة اليمن والخليج"
                width={170}
                height={70}
                className="h-10 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </button>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              الوجهة الأولى لتأجير وتوريد سيارات النخبة ورجال الأعمال في جمهورية مصر العربية. أسطول 2026 بأعلى معايير النظافة والجاهزية الفورية.
            </p>
            
            {/* بطاقة واتساب السريعة */}
            <div className="pt-2">
              <a
                href="https://wa.me/201034025211"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#c5a059]/50 transition-all duration-200"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">الخط الساخن والواتساب المباشر</span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-[#d4af37] dir-ltr inline-block">
                    +20 10 34025211
                  </span>
                </div>
              </a>
            </div>
          </div>

          {/* عمود 2: روابط التصفح السريع للأقسام الحقيقية */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-white tracking-widest uppercase pb-2 border-b border-white/10">
              أقسام الموقع
            </h4>
            <ul className="space-y-2 text-xs">
              {FOOTER_SECTIONS.map((sec) => (
                <li key={sec.id}>
                  <button
                    type="button"
                    onClick={() => scrollTo(sec.id)}
                    className="text-slate-400 hover:text-[#f3e5ab] transition-colors py-1 text-right w-full cursor-pointer flex items-center justify-between group"
                  >
                    <span>{sec.label}</span>
                    <span className="text-[10px] text-slate-600 group-hover:text-[#c5a059] transition-colors font-mono">
                      ←
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* عمود 3: العناوين ونطاق العمليات في مصر */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-white tracking-widest uppercase pb-2 border-b border-white/10">
              المقر ومناطق الخدمة
            </h4>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <span className="text-[#c5a059] text-sm shrink-0 mt-0.5">📍</span>
                <div>
                  <p className="font-bold text-white">المقر الرئيسي للعمليات:</p>
                  <p className="text-slate-400 mt-0.5">حدائق أكتوبر • محافظة الجيزة • جمهورية مصر العربية</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-[#c5a059] text-sm shrink-0 mt-0.5">✈️</span>
                <div>
                  <p className="font-bold text-white">خدمات المطار والاستقبال 24/7:</p>
                  <p className="text-slate-400 mt-0.5">مطار القاهرة الدولي • مطار سفنكس • التجمع • الشيخ زايد</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* الشريط السفلي المتجاوب مع الهواتف */}
      <div className="border-t border-white/5 bg-[#03060e] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right text-[11px] text-slate-500">
          <p>© 2026 شركة اليمن والخليج لتأجير وتوريد السيارات. جميع الحقوق محفوظة.</p>
          <button
            type="button"
            onClick={scrollToTop}
            className="text-slate-400 hover:text-[#f3e5ab] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>العودة للأعلى</span>
            <span className="text-xs">↑</span>
          </button>
        </div>
      </div>

    </footer>
  );
}
