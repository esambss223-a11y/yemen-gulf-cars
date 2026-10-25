"use client";

import { COMPANY_CONTACT } from '@/lib/company-contact';
import { useEffect, useRef } from "react";

const WHY_ITEMS = [
  {
    title: "سيارات شبه أصفار",
    desc: "جميع سياراتنا موديل 2024 بأقل من 25,000 كم — نظيفة ومُعقَّمة قبل كل تسليم.",
  },
  {
    title: "تسليم لبابك",
    desc: "نوصل السيارة إليك في حدائق أكتوبر، مطار القاهرة، أي فندق، أو أي عنوان في مصر.",
  },
  {
    title: "عقود مرنة بلا تعقيد",
    desc: "يومي، أسبوعي، أو شهري — بدون إجراءات معقدة أو رسوم خفية. الحجز عبر واتساب في دقيقتين.",
  },
  {
    title: "أسطول نخبوي متنوع",
    desc: "دفع رباعي، سيدان VIP، رئاسي عائلي — طراز مناسب لكل مناسبة ورحلة.",
  },
];

export default function WhyChooseUs() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const cards = el.querySelectorAll(".scroll-card-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            cards.forEach((card, idx) => {
              setTimeout(() => {
                card.classList.add("is-visible");
              }, idx * 110);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="why-us" className="relative w-full bg-[#060b17] py-16 sm:py-24 scroll-mt-20">
      {/* خط ضوئي علوي */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ترويسة راقية */}
        <div className="text-right mb-12 pb-6 border-b border-white/10">
          <span className="text-[#c5a059] text-xs font-semibold tracking-widest uppercase block mb-1.5">
            القيمة المضافة
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            لماذا يثق بنا عملاء النخبة؟
          </h2>
        </div>

        {/* الشبكة */}
        <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {WHY_ITEMS.map((item) => (
            <div
              key={item.title}
              className="scroll-card-reveal bg-[#080f1e] border border-white/10 rounded-xl hover:border-[#c5a059]/40 transition-all duration-300 p-8 sm:p-10 text-right group"
            >
              {/* نقطة ذهبية ملكية */}
              <span className="block w-2 h-2 rounded-full bg-[#c5a059] mb-5 mr-auto shadow-sm" />
              <h3 className="text-lg sm:text-xl font-black text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA نهائي */}
        <div className="mt-12 text-center">
          <a
            href={COMPANY_CONTACT.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-[#c5a059] hover:bg-[#d4af37] text-[#060b17] text-sm font-black transition-colors active:scale-95 cursor-pointer shadow-sm shadow-[#c5a059]/15"
          >
            ابدأ حجزك الآن عبر واتساب
            <span>←</span>
          </a>
        </div>

      </div>
    </section>
  );
}
