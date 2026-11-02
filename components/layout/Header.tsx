"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowUpLeft, Menu, X, Phone, MessageCircle } from "lucide-react";
import { COMPANY_CONTACT } from "@/lib/company-contact";
import "./public-header.css";

const navigation = [
  { id: "featured-fleet", label: "الأسطول" },
  { id: "chauffeur-service", label: "خدمة المطار" },
  { id: "how-to-book", label: "طريقة الحجز" },
  { id: "our-location", label: "تواصل معنا" },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 40);
      const current = [...navigation].reverse().find(({ id }) => {
        const section = document.getElementById(id);
        return section && section.getBoundingClientRect().top <= 160;
      });
      setActive(current?.id ?? "");
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [menuOpen]);

  if (pathname?.startsWith("/admin") || pathname === "/concept") return null;

  const jump = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className={`public-site-header ${scrolled ? "is-solid" : "is-over-hero"} ${menuOpen ? "is-menu-open" : ""}`}>
      <div className="public-header-inner">
        {/* Brand Logo & Name (Overhanging Crest Emblem) */}
        <button 
          type="button" 
          className="public-header-brand" 
          onClick={() => { setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
          aria-label="العودة إلى بداية الصفحة"
        >
          <div className="public-header-crest">
            <Image 
              src="/logo-512.webp" 
              alt="شعار شركة اليمن والخليج" 
              width={84} 
              height={84} 
              priority 
              className="public-header-crest-img"
            />
          </div>
          <span className="public-brand-name">
            <strong>اليمن والخليج</strong>
            <small>لتأجير وتوريد السيارات</small>
          </span>
        </button>

        {/* Desktop Navigation Links (Pure Editorial Floating Links - No Capsule) */}
        <nav className="public-header-links" aria-label="التصفح الرئيسي">
          {navigation.map(({ id, label }) => (
            <button 
              key={id} 
              type="button" 
              className={`public-nav-link ${active === id ? "is-active" : ""}`} 
              onClick={() => jump(id)}
            >
              <span>{label}</span>
              <span className="public-nav-indicator" aria-hidden="true" />
            </button>
          ))}
        </nav>

        {/* Action Button & Mobile Menu Toggle */}
        <div className="public-header-actions">
          <a 
            className="public-header-book" 
            href={COMPANY_CONTACT.whatsappUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            title="حجز مباشر عبر واتساب"
          >
            <span>احجز سيارتك</span>
            <ArrowUpLeft size={16} aria-hidden="true" className="public-header-book-arrow" />
          </a>

          <button 
            type="button" 
            className="public-header-menu-button" 
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"} 
            aria-expanded={menuOpen} 
            aria-controls="public-mobile-navigation" 
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Sliding Glass Menu */}
      {menuOpen && (
        <div className="public-mobile-navigation" id="public-mobile-navigation">
          <div className="public-mobile-navigation-title">
            <span>استكشف أسطولنا والخدمات</span>
            <span className="public-mobile-badge">متاحون 24/7</span>
          </div>

          <nav aria-label="التصفح على الجوال">
            {navigation.map(({ id, label }, index) => (
              <button 
                key={id} 
                type="button" 
                className={active === id ? "is-active" : ""} 
                onClick={() => jump(id)}
              >
                <span className="public-mobile-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="public-mobile-label">{label}</span>
                <ArrowLeft size={16} aria-hidden="true" className="public-mobile-arrow" />
              </button>
            ))}
          </nav>

          {/* Quick Contact Actions in Mobile Drawer */}
          <div className="public-mobile-quick-actions">
            <a 
              href={COMPANY_CONTACT.whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="public-mobile-action-btn is-whatsapp"
            >
              <MessageCircle size={16} />
              <span>واتساب مباشر</span>
            </a>
            <a 
              href={COMPANY_CONTACT.phoneHref} 
              className="public-mobile-action-btn is-phone"
            >
              <Phone size={15} />
              <span>اتصال بالمكتب</span>
            </a>
          </div>

          <div className="public-mobile-navigation-bottom">
            <span>خدمة النخبة في القاهرة ومطار أكتوبر</span>
            <a href={COMPANY_CONTACT.phoneHref} dir="ltr">{COMPANY_CONTACT.displayPhone}</a>
          </div>
        </div>
      )}
    </header>
  );
}
