"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpLeft } from "lucide-react";
import { COMPANY_CONTACT } from "@/lib/company-contact";
import "./public-footer.css";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return (
    <footer id="contact-info" className="compact-footer" dir="rtl" aria-label="تذييل الموقع">
      <div className="compact-footer-inner">
        <div className="compact-footer-row">
          <Link href="/" className="compact-footer-brand">
            <Image src="/logonew.png" alt="" width={44} height={44} className="h-11 w-11 object-contain" />
            <span>اليمن والخليج<small>لتأجير وتوريد السيارات</small></span>
          </Link>
          <nav aria-label="روابط التذييل">
            <Link href="/#featured-fleet">السيارات</Link>
            <Link href="/#chauffeur-service">استقبال المطار</Link>
            <Link href="/#our-location">موقعنا</Link>
          </nav>
          <a className="public-gold-button compact-footer-contact" href={COMPANY_CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer">تواصل معنا <ArrowUpLeft size={16} aria-hidden="true" /></a>
        </div>
        <div className="compact-footer-base">
          <p>© {new Date().getFullYear()} اليمن والخليج. جميع الحقوق محفوظة.</p>
          <a href={COMPANY_CONTACT.phoneHref}><bdi>{COMPANY_CONTACT.displayPhone}</bdi></a>
          <Link href="/admin" prefetch={false}>دخول الموظفين</Link>
        </div>
      </div>
    </footer>
  );
}
