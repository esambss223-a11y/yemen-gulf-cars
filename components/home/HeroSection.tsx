"use client";

import Image from "next/image";

export default function HeroSection() {
  const scrollToFleet = () => {
    const fleetSection = document.getElementById("featured-fleet");
    if (fleetSection) {
      fleetSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full h-[90vh] sm:h-[94vh] flex flex-col justify-between overflow-hidden bg-[#060b17]">
      {/* 1. مشغل الفيديو السينمائي الجديد مع طبقة حماية تباين تضمن وضوح النصوص 100% */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/hero-poster.jpg"
          className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.10]"
        >
          <source src="/hero-video.webm" type="video/webm" />
          <source src="/hero-video.mp4" type="video/mp4" />
          <img
            src="/hero-poster.jpg"
            alt="شركة اليمن والخليج"
            className="w-full h-full object-cover object-center"
          />
        </video>

        {/* تدرج سينمائي مخصص: يمنح الجزء العلوي تظليلاً ملكياً ناعماً ليبرز النص والشعار بوضوح تام، ويترك سيارات الأسطول بالأسفل مكشوفة */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060b17]/90 via-[#060b17]/65 via-40% to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#060b17] via-[#060b17]/80 to-transparent pointer-events-none" />
      </div>

      {/* 2. قلب الهيرو: فخامة سينمائية مينيمال مع الشعار الرسمي الأنيق */}
      <div className="relative z-10 my-auto px-4 sm:px-6 max-w-4xl mx-auto w-full text-center flex flex-col items-center">
        {/* الشعار الرسمي النقي مع ظل سينمائي ثلاثي الأبعاد */}
        <div className="mb-4 sm:mb-5">
          <Image
            src="/logo2.png"
            alt="شركة اليمن والخليج"
            width={260}
            height={110}
            priority
            className="h-14 sm:h-20 w-auto object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.9)] filter brightness-105"
          />
        </div>

        {/* سطر هوية مقتضب ورفيع */}
        <p className="text-[#c5a059] text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase mb-2 drop-shadow-md">
          مصر • تأجير وتوريد النخبة
        </p>

        {/* العنوان الرئيسي: سطر واحد مقتضب جداً وهيبة حقيقية */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.1] drop-shadow-[0_8px_30px_rgba(0,0,0,0.9)]">
          أسطول يتحدث عنك.
        </h1>

        {/* سطر فرعي واحد فقط من 5 كلمات */}
        <p className="text-slate-300 text-sm sm:text-lg font-normal mt-3 max-w-md drop-shadow-md">
          أحدث سيارات الدفع الرباعي والفارهة بجاهزية فورية.
        </p>

        {/* زر واحد فقط أنيق جداً ونحيف (Editorial pill) */}
        <div className="mt-7 sm:mt-9">
          <button
            type="button"
            onClick={scrollToFleet}
            className="group inline-flex items-center gap-3 px-7 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 hover:border-[#c5a059]/80 backdrop-blur-md transition-all duration-300 active:scale-95 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          >
            <span>استعراض الأسطول المتاح</span>
            <span className="w-6 h-6 rounded-full bg-[#c5a059] text-[#060b17] flex items-center justify-center font-black transition-transform duration-300 group-hover:translate-y-0.5">
              ↓
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
