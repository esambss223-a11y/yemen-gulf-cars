"use client";

import { useEffect, useRef } from "react";

const STEPS = [
  {
    number: "01",
    title: "اختر سيارتك",
    desc: "تصفح أسطولنا المتاح، حدد الطراز والمدة المطلوبة من معرض السيارات أعلاه.",
  },
  {
    number: "02",
    title: "تواصل عبر واتساب",
    desc: "اضغط زر الحجز وستصلنا رسالتك تلقائياً مع كل تفاصيل طلبك جاهزة.",
  },
  {
    number: "03",
    title: "استلم فوراً",
    desc: "نرتب التسليم في حدائق أكتوبر أو مطار القاهرة أو أي موقع تختاره داخل مصر.",
  },
];

export default function HowToBook() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const stepElements = el.querySelectorAll(".scroll-card-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            stepElements.forEach((step, idx) => {
              setTimeout(() => {
                step.classList.add("is-visible");
              }, idx * 130);
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
    <section id="how-to-book" className="relative w-full bg-[#060b17] py-16 sm:py-24 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ترويسة راقية */}
        <div className="text-right mb-12 pb-6 border-b border-white/10">
          <span className="text-[#c5a059] text-xs font-semibold tracking-widest uppercase block mb-1.5">
            آلية الحجز المباشر
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            ثلاث خطوات فقط لاستلام سيارتك
          </h2>
        </div>

        {/* الخطوات */}
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-3 gap-0 relative">
          {/* خط رابط على الكمبيوتر */}
          <div className="hidden md:block absolute top-6 right-[calc(16.67%+16px)] left-[calc(16.67%+16px)] h-px bg-white/10" />

          {STEPS.map((step, i) => (
            <div
              key={step.number}
              className="scroll-card-reveal relative flex flex-col items-center text-center px-8 py-6 gap-4"
            >
              {/* رقم الخطوة */}
              <div className="relative z-10 w-12 h-12 rounded-full bg-[#080f1e] border border-[#c5a059]/40 flex items-center justify-center shadow-sm">
                <span className="text-sm font-black text-[#f3e5ab] font-mono">{step.number}</span>
              </div>

              {/* فاصل رأسي في الجوال */}
              {i < STEPS.length - 1 && (
                <div className="md:hidden w-px h-8 bg-white/10" />
              )}

              <div>
                <h3 className="text-lg font-black text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
