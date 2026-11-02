"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronUp } from "lucide-react";
import { COMPANY_CONTACT } from "@/lib/company-contact";

export default function FloatingActions() {
  const pathname = usePathname();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Do not render on admin or concept routes
  if (pathname?.startsWith("/admin") || pathname === "/concept") {
    return null;
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div 
      className="fixed bottom-6 left-6 z-40 flex flex-col items-center gap-3 select-none"
      dir="rtl"
      aria-label="الإجراءات السريعة العائمة"
    >
      {/* 1. Scroll-To-Top Button (زر الصعود إلى أعلى الصفحة) */}
      <button
        type="button"
        onClick={scrollToTop}
        className={`w-11 h-11 rounded-full bg-[#0a1b2e]/90 hover:bg-[#0f2742] text-[#DDBD80] border border-[#ddbd80]/30 shadow-lg shadow-black/40 backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group cursor-pointer ${
          showScrollTop 
            ? "opacity-100 translate-y-0 pointer-events-auto" 
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label="العودة إلى أعلى الصفحة"
        title="العودة إلى أعلى الصفحة"
      >
        <ChevronUp size={22} className="group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
      </button>

      {/* 2. Floating WhatsApp Concierge Button (زر الواتساب المباشر) */}
      <a
        href={COMPANY_CONTACT.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl shadow-[#25D366]/35 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
        aria-label="تواصل مباشر عبر واتساب"
        title="تواصل مباشر عبر واتساب"
      >
        {/* Soft Pulsing Ambient Ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-35 animate-ping pointer-events-none" aria-hidden="true" />

        {/* Official WhatsApp SVG Icon */}
        <svg 
          viewBox="0 0 24 24" 
          className="w-7 h-7 fill-white relative z-10" 
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2ZM12.05 20.16C10.57 20.16 9.12 19.76 7.85 19L7.55 18.82L4.43 19.64L5.26 16.6L5.06 16.29C4.24 14.98 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.05 20.16ZM16.57 14.39C16.32 14.27 15.11 13.67 14.88 13.59C14.66 13.51 14.49 13.47 14.33 13.71C14.16 13.96 13.68 14.52 13.53 14.69C13.38 14.85 13.24 14.87 12.99 14.75C12.74 14.63 11.93 14.36 10.98 13.51C10.23 12.85 9.73 12.03 9.58 11.78C9.44 11.54 9.56 11.4 9.68 11.28C9.79 11.17 9.93 10.99 10.05 10.85C10.17 10.71 10.22 10.61 10.3 10.45C10.38 10.28 10.34 10.14 10.28 10.02C10.22 9.9 9.73 8.7 9.53 8.2C9.33 7.72 9.13 7.78 8.98 7.78H8.51C8.35 7.78 8.08 7.84 7.85 8.09C7.63 8.33 7 8.92 7 10.13C7 11.34 7.88 12.51 8 12.67C8.13 12.84 9.73 15.31 12.18 16.37C12.76 16.62 13.22 16.77 13.57 16.88C14.16 17.07 14.7 17.04 15.12 16.98C15.59 16.91 16.57 16.39 16.77 15.82C16.98 15.25 16.98 14.76 16.92 14.66C16.86 14.56 16.81 14.51 16.57 14.39Z" />
        </svg>

        {/* Floating Tooltip Label on Hover (Desktop) */}
        <span 
          className="hidden sm:inline-flex absolute right-16 items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0a1b2e]/95 border border-[#ddbd80]/30 text-xs font-bold text-white shadow-xl backdrop-blur-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          aria-hidden="true"
        >
          <span>تواصل عبر واتساب</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </span>
      </a>
    </div>
  );
}
