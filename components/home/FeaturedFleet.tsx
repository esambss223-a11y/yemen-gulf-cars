"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

type DurationKey = "day" | "week" | "month";

interface FleetCar {
  id: string;
  name: string;
  category: string;
  modelYear: string;
  image: string;
  odometer: string;
  isAvailable: boolean;
  prices: Record<DurationKey, { amount: string; label: string }>;
}

const FLEET_CARS: FleetCar[] = [
  {
    id: "range-rover-vogue",
    name: "Range Rover Vogue",
    category: "دفع رباعي فاخر — SUV VIP",
    modelYear: "2024",
    image: "/car-rangerover.jpg",
    odometer: "12,400 كم",
    isAvailable: true,
    prices: {
      day:   { amount: "6,500 ج.م",   label: "يومي" },
      week:  { amount: "45,000 ج.م",  label: "أسبوعي" },
      month: { amount: "160,000 ج.م", label: "شهري" },
    },
  },
  {
    id: "mercedes-s-class",
    name: "Mercedes-Benz S-Class",
    category: "سيدان رجال أعمال — S500",
    modelYear: "2024",
    image: "/car-mercedes.jpg",
    odometer: "9,800 كم",
    isAvailable: true,
    prices: {
      day:   { amount: "8,000 ج.م",   label: "يومي" },
      week:  { amount: "55,000 ج.م",  label: "أسبوعي" },
      month: { amount: "190,000 ج.م", label: "شهري" },
    },
  },
  {
    id: "nissan-patrol",
    name: "Nissan Patrol Platinum",
    category: "دفع رباعي عائلي — V8",
    modelYear: "2024",
    image: "/car-nissan.jpg",
    odometer: "18,200 كم",
    isAvailable: true,
    prices: {
      day:   { amount: "5,000 ج.م",   label: "يومي" },
      week:  { amount: "35,000 ج.م",  label: "أسبوعي" },
      month: { amount: "125,000 ج.م", label: "شهري" },
    },
  },
  {
    id: "cadillac-escalade",
    name: "Cadillac Escalade V",
    category: "دفع رباعي رئاسي",
    modelYear: "2024",
    image: "/car-rangerover.jpg",
    odometer: "14,100 كم",
    isAvailable: false,
    prices: {
      day:   { amount: "9,000 ج.م",   label: "يومي" },
      week:  { amount: "60,000 ج.م",  label: "أسبوعي" },
      month: { amount: "210,000 ج.م", label: "شهري" },
    },
  },
  {
    id: "bmw-7-series",
    name: "BMW 735i M-Sport",
    category: "سيدان فارهة — VIP",
    modelYear: "2024",
    image: "/car-mercedes.jpg",
    odometer: "11,300 كم",
    isAvailable: true,
    prices: {
      day:   { amount: "7,500 ج.م",   label: "يومي" },
      week:  { amount: "50,000 ج.م",  label: "أسبوعي" },
      month: { amount: "180,000 ج.م", label: "شهري" },
    },
  },
  {
    id: "toyota-land-cruiser",
    name: "Toyota Land Cruiser LC300",
    category: "دفع رباعي — اعتمادي",
    modelYear: "2024",
    image: "/car-nissan.jpg",
    odometer: "21,500 كم",
    isAvailable: false,
    prices: {
      day:   { amount: "5,500 ج.م",   label: "يومي" },
      week:  { amount: "38,000 ج.م",  label: "أسبوعي" },
      month: { amount: "135,000 ج.م", label: "شهري" },
    },
  },
];

import { useFleet } from "@/context/FleetContext";
import PublicBookingModal from "@/components/home/PublicBookingModal";
import CarGalleryModal from "@/components/home/CarGalleryModal";
import { Car } from "@/types/fleet";

type FilterKey = "all" | "available" | "unavailable";

export default function FeaturedFleet() {
  const { cars } = useFleet();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedCarForBooking, setSelectedCarForBooking] = useState<{ car: Car; label: string } | null>(null);
  const [selectedCarForGallery, setSelectedCarForGallery] = useState<Car | null>(null);

  // تحويل سيارات النظام إلى بنية العرض في الكتالوج
  const displayCars: FleetCar[] = cars.map(car => ({
    id: car.id,
    name: `${car.make} ${car.model}`,
    category: car.category === 'vip' ? 'سيدان فاخر — VIP' : car.category === 'suv' ? 'دفع رباعي فاخر — SUV' : 'سيارة فارهة',
    modelYear: String(car.year),
    image: car.coverImage || car.images[0] || '/car-mercedes.jpg',
    odometer: `${car.currentKm.toLocaleString()} كم`,
    isAvailable: car.status === 'available',
    prices: {
      day: { amount: `${car.dailyPriceEGP.toLocaleString()} ج.م`, label: "يومي" },
      week: { amount: `${(car.weeklyPriceEGP || car.dailyPriceEGP * 6).toLocaleString()} ج.م`, label: "أسبوعي" },
      month: { amount: `${(car.monthlyPriceEGP || car.dailyPriceEGP * 24).toLocaleString()} ج.م`, label: "شهري" },
    }
  }));

  const [durations, setDurations] = useState<Record<string, DurationKey>>({});

  const setCarDuration = (id: string, d: DurationKey) =>
    setDurations((prev) => ({ ...prev, [id]: d }));

  const filtered = displayCars.filter((c) => {
    if (filter === "available") return c.isAvailable;
    if (filter === "unavailable") return !c.isAvailable;
    return true;
  });

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all",         label: `الكل (${displayCars.length})` },
    { key: "available",   label: `متاحة (${displayCars.filter((c) => c.isAvailable).length})` },
    { key: "unavailable", label: `محجوزة (${displayCars.filter((c) => !c.isAvailable).length})` },
  ];

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = gridRef.current;
    if (!container) return;

    const cards = container.querySelectorAll(".scroll-card-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // انطلاق الحركات بانزلاق متسلسل فاخر (Staggered animation)
            cards.forEach((card, index) => {
              setTimeout(() => {
                card.classList.add("is-visible");
              }, index * 90);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [filter]);

  return (
    <section
      id="featured-fleet"
      className="relative w-full bg-[#060b17] py-16 sm:py-24 scroll-mt-0"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ترويسة أنيقة بهدوء فاخر */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 pb-6 border-b border-white/10">
          <div className="text-right">
            <span className="text-[#c5a059] text-xs font-semibold tracking-widest uppercase block mb-1.5">
              أسطول النخبة المعتمد
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              سيارات جاهزة للتسليم الفوري
            </h2>
          </div>

          {/* فلاتر كـ text tabs ناعمة */}
          <div className="flex items-center gap-6 self-start sm:self-auto pb-1">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`text-xs sm:text-sm font-bold pb-1.5 border-b-2 transition-all cursor-pointer ${
                  filter === key
                    ? "border-[#c5a059] text-[#f3e5ab]"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* الشبكة بتأثيرات التمرير المتزامنة */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filtered.map((car, index) => {
            const dur = durations[car.id] || "day";
            const price = car.prices[dur];
            const TABS: DurationKey[] = ["day", "week", "month"];
            const TAB_AR: Record<DurationKey, string> = { day: "يومي", week: "أسبوعي", month: "شهري" };

            const msg = encodeURIComponent(
              `مرحباً شركة اليمن والخليج، أود حجز:\n• السيارة: ${car.name} (${car.modelYear})\n• العداد: ${car.odometer}\n• المدة: عقد ${price.label} — ${price.amount}\nيرجى تأكيد التوافر والإجراءات.`
            );

            return (
              <div
                key={car.id}
                className="scroll-card-reveal bg-[#080f1e] border border-white/10 rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-[#c5a059]/40 hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
              >
                {/* صورة السيارة */}
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={car.image}
                    alt={car.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={car.id === "range-rover-vogue"}
                    className="object-cover object-center transition-transform duration-700 hover:scale-105"
                  />

                  {/* تدرج سفلي للنص */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080f1e] via-transparent to-transparent pointer-events-none" />

                  {/* مؤشر التوفر وزر استعراض الصور */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${car.isAvailable ? "bg-emerald-400" : "bg-slate-500"}`} />
                    <span className="text-[10px] font-semibold text-white bg-[#080f1e]/80 backdrop-blur-sm px-2 py-0.5 rounded">
                      {car.isAvailable ? "متاحة" : "محجوزة"}
                    </span>
                  </div>

                  {/* زر استعراض الألبوم المتعدد */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const originalCar = cars.find(c => c.id === car.id) || cars[0];
                      if (originalCar) {
                        setSelectedCarForGallery(originalCar);
                      }
                    }}
                    className="absolute top-3 left-3 bg-black/75 hover:bg-[#c5a059] text-white hover:text-black backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 border border-white/10"
                    title="استعراض ألبوم الصور"
                  >
                    <span>📷 صور إضافية</span>
                  </button>

                  {/* اسم السيارة والموديل فوق التدرج */}
                  <div className="absolute bottom-3 right-3 left-3">
                    <h3 className="text-base font-black text-white">{car.name}</h3>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[11px] text-slate-300">{car.category}</span>
                      <span className="text-[10px] font-mono text-slate-400">{car.modelYear}</span>
                    </div>
                  </div>
                </div>

                {/* تفاصيل البطاقة */}
                <div className="p-4 flex flex-col gap-4 flex-1">

                  {/* العداد الفعلي */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">عداد الكيلومترات الفعلي:</span>
                    <span className="text-xs font-bold text-slate-200 font-mono">{car.odometer}</span>
                  </div>

                  {/* خيار المدة — tabs بسيطة بلمسة هادئة */}
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-2">حدد مدة الإيجار:</span>
                    <div className="flex items-center gap-0 border border-white/10 rounded-lg overflow-hidden bg-black/20">
                      {TABS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setCarDuration(car.id, t)}
                          className={`flex-1 py-2 text-xs font-bold transition-all cursor-pointer ${
                            dur === t
                              ? "bg-[#c5a059] text-[#060b17]"
                              : "text-slate-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {TAB_AR[t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* السعر + زر الحجز */}
                  <div className="pt-3 border-t border-white/10 mt-auto">
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="text-[11px] text-slate-400">السعر ({price.label}):</span>
                      <span className="text-xl font-black text-[#d4af37]">{price.amount}</span>
                    </div>

                    {car.isAvailable ? (
                      <button
                        type="button"
                        onClick={() => {
                          const originalCar = cars.find(c => c.id === car.id) || cars[0];
                          if (originalCar) {
                            setSelectedCarForBooking({ car: originalCar, label: price.label });
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#c5a059] hover:bg-[#d4af37] text-[#060b17] text-xs font-black transition-colors active:scale-95 cursor-pointer shadow-sm shadow-[#c5a059]/15"
                      >
                        احجز الآن
                        <span>←</span>
                      </button>
                    ) : (
                      <div className="w-full py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-500 text-xs font-bold text-center">
                        غير متاحة حالياً
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* خاتمة */}
        <p className="mt-10 text-center text-xs text-slate-500">
          تسليم واستلام فوري في حدائق أكتوبر ومطار القاهرة وكافة المحافظات ·{" "}
          <a
            href="https://wa.me/201034025211"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#c5a059] hover:underline"
          >
            تواصل معنا لعقود سنوية أو أسطول مخصص
          </a>
        </p>

        {/* نافذة الحجز التفاعلية للزائر */}
        {selectedCarForBooking && (
          <PublicBookingModal
            car={selectedCarForBooking.car}
            durationLabel={selectedCarForBooking.label}
            onClose={() => setSelectedCarForBooking(null)}
          />
        )}

        {/* نافذة ألبوم صور السيارة للعميل */}
        {selectedCarForGallery && (
          <CarGalleryModal
            car={selectedCarForGallery}
            onClose={() => setSelectedCarForGallery(null)}
            onBookNow={() => {
              setSelectedCarForBooking({ car: selectedCarForGallery, label: "يومي" });
              setSelectedCarForGallery(null);
            }}
          />
        )}

      </div>
    </section>
  );
}
