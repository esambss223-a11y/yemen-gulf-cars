"use client";

import { COMPANY_CONTACT } from '@/lib/company-contact';
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface RouteOption {
  id: string;
  destination: string;
  timeEstimate: string;
  tag: string;
}

interface FleetVehicle {
  id: string;
  name: string;
  classType: string;
  image: string;
}

const DESTINATIONS: RouteOption[] = [
  { id: "hadayek-october", destination: "حدائق أكتوبر", timeEstimate: "40 دقيقة", tag: "مقر الشركة" },
  { id: "new-cairo",       destination: "التجمع الخامس",  timeEstimate: "25 دقيقة", tag: "الأكثر طلباً" },
  { id: "sheikh-zayed",    destination: "الشيخ زايد",     timeEstimate: "45 دقيقة", tag: "رجال أعمال" },
  { id: "downtown",        destination: "وسط البلد والزمالك", timeEstimate: "35 دقيقة", tag: "فنادق النيل" },
];

const CHAUFFEUR_CARS: FleetVehicle[] = [
  { id: "s-class",     name: "Mercedes S-Class",     classType: "سيدان النخبة",        image: "/car-mercedes.jpg" },
  { id: "range-rover", name: "Range Rover Vogue",    classType: "دفع رباعي رئاسي",     image: "/car-rangerover.jpg" },
  { id: "patrol",      name: "Nissan Patrol Platinum", classType: "عائلي فخم",         image: "/car-nissan.jpg" },
];

export default function ChauffeurAirportService() {
  const [selectedDest, setSelectedDest] = useState("hadayek-october");
  const [selectedCar, setSelectedCar]   = useState("s-class");

  const activeDest = DESTINATIONS.find((d) => d.id === selectedDest) ?? DESTINATIONS[0];
  const activeCar  = CHAUFFEUR_CARS.find((c) => c.id === selectedCar)  ?? CHAUFFEUR_CARS[0];

  const whatsappMsg = encodeURIComponent(
    `مرحباً شركة اليمن والخليج للسيارات، أود حجز:\n• الخدمة: استقبال من مطار القاهرة مع سائق خاص\n• السيارة: ${activeCar.name}\n• الوجهة: ${activeDest.destination} (${activeDest.timeEstimate})\nيرجى تأكيد التوافر والسعر.`
  );

  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const leftCol = el.querySelector(".chauffeur-left");
    const rightCol = el.querySelector(".chauffeur-right");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            leftCol?.classList.add("is-visible");
            setTimeout(() => {
              rightCol?.classList.add("is-visible");
            }, 140);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="chauffeur-service"
      ref={sectionRef}
      className="relative w-full bg-[#060b17] py-16 sm:py-24 overflow-hidden scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ترويسة راقية */}
        <div className="text-right mb-10 pb-6 border-b border-white/10">
          <span className="text-[#c5a059] text-xs font-semibold tracking-widest uppercase block mb-1.5">
            بروتوكول الاستقبال والنقل الخاص
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            خدمة كبار الشخصيات مع سائق خاص
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 max-w-lg">
            استقبال مباشر من صالة الوصول بمطار القاهرة وسفنكس حتى باب وجهتك بأقصى درجات الخصوصية.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

          {/* يسار: الاختيارات */}
          <div className="chauffeur-left scroll-item-reveal lg:col-span-7 flex flex-col gap-7">

            {/* شريط مسار الرحلة */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#080f1e] border border-white/10">
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="w-8 h-8 rounded-full bg-[#c5a059] text-[#060b17] flex items-center justify-center text-sm font-black">✈</span>
                <div>
                  <p className="text-[10px] text-slate-400 font-mono">ORIGIN</p>
                  <p className="text-xs font-bold text-white">مطار القاهرة (CAI)</p>
                </div>
              </div>

              <div className="flex-1 flex items-center gap-2 px-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[11px] font-mono text-[#f3e5ab] whitespace-nowrap">
                  {activeDest.timeEstimate}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059] animate-pulse" />
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <div className="text-left">
                  <p className="text-[10px] text-slate-400 font-mono">DESTINATION</p>
                  <p className="text-xs font-bold text-white">{activeDest.destination}</p>
                </div>
                <span className="w-8 h-8 rounded-full bg-[#0d1829] border border-white/20 text-[#c5a059] flex items-center justify-center text-sm">📍</span>
              </div>
            </div>

            {/* 1. اختر الوجهة */}
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-3">١. حدد وجهتك:</p>
              <div className="grid grid-cols-2 gap-2">
                {DESTINATIONS.map((dest) => (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => setSelectedDest(dest.id)}
                    className={`p-3 rounded-lg border text-right transition-all duration-200 cursor-pointer ${
                      selectedDest === dest.id
                        ? "border-[#c5a059]/80 bg-[#c5a059]/15 text-white"
                        : "border-white/10 bg-[#080f1e] text-slate-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <span className="text-xs font-bold block">{dest.destination}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{dest.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. اختر السيارة */}
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-3">٢. حدد طراز السيارة:</p>
              <div className="grid grid-cols-3 gap-2">
                {CHAUFFEUR_CARS.map((car) => (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => setSelectedCar(car.id)}
                    className={`p-3 rounded-lg border text-center transition-all duration-200 cursor-pointer ${
                      selectedCar === car.id
                        ? "border-[#c5a059]/80 bg-[#c5a059]/15 text-white"
                        : "border-white/10 bg-[#080f1e] text-slate-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <span className="text-[11px] font-bold block leading-tight">{car.name}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{car.classType}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* مميزات الخدمة */}
            <div className="flex flex-wrap gap-2 pt-2">
              {["لافتة باسمك في الصالة", "متابعة رحلتك تلقائياً", "سائق بزي رسمي", "تسليم لأي وجهة"].map((feat) => (
                <span key={feat} className="text-[11px] text-slate-300 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">
                  ✓ {feat}
                </span>
              ))}
            </div>

          </div>

          {/* يمين: صورة السيارة + زر الحجز */}
          <div className="chauffeur-right scroll-slide-reveal lg:col-span-5 flex flex-col gap-4">
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-white/10">
              <Image
                key={activeCar.id}
                src={activeCar.image}
                alt={activeCar.name}
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover object-center transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060b17]/85 via-transparent to-transparent pointer-events-none" />

              {/* بطاقة معلومات سفلية */}
              <div className="absolute bottom-3 right-3 left-3 p-3 rounded-lg bg-[#060b17]/85 backdrop-blur-md border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">{activeCar.name}</p>
                  <p className="text-[11px] text-[#f3e5ab]">{activeDest.destination}</p>
                </div>
                <span className="text-[10px] font-mono text-[#f3e5ab] bg-[#c5a059]/10 px-2 py-1 rounded border border-[#c5a059]/25">
                  VIP CHAUFFEUR
                </span>
              </div>
            </div>

            <a
              href={`${COMPANY_CONTACT.whatsappUrl}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#c5a059] hover:bg-[#d4af37] text-[#060b17] text-sm font-black transition-colors active:scale-95 cursor-pointer shadow-sm shadow-[#c5a059]/15"
            >
              تأكيد حجز الاستقبال مع السائق
              <span className="text-base">←</span>
            </a>

            <p className="text-[11px] text-slate-500 text-center">
              خدمة 24/7 · مطار القاهرة ومطار سفنكس
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
