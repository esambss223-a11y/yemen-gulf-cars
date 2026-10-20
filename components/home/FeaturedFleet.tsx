"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

type DurationKey = "day" | "week" | "month";

interface FleetCar {
  id: string;
  name: string;
  category: string;
  modelYear: string;
  image: string;
  images?: string[];
  odometer: string;
  isAvailable: boolean;
  prices: Record<DurationKey, { amount: string; label: string }>;
}

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
  const [carImageIndexes, setCarImageIndexes] = useState<Record<string, number>>({});

  // تحويل سيارات النظام إلى بنية العرض في الكتالوج مع دعم تعدد الصور
  const displayCars: FleetCar[] = cars.map(car => {
    const carImages = car.images && car.images.length > 0 ? car.images : [car.coverImage || '/car-mercedes.jpg'];
    return {
      id: car.id,
      name: `${car.make} ${car.model}`,
      category: car.category === 'vip' ? 'سيدان فاخر — VIP' : car.category === 'suv' ? 'دفع رباعي فاخر — SUV' : 'سيارة فارهة',
      modelYear: String(car.year),
      image: car.coverImage || carImages[0] || '/car-mercedes.jpg',
      images: carImages,
      odometer: `${car.currentKm.toLocaleString()} كم`,
      isAvailable: car.status === 'available',
      prices: {
        day: { amount: `${car.dailyPriceEGP.toLocaleString()} ج.م`, label: "يومي" },
        week: { amount: `${(car.weeklyPriceEGP || car.dailyPriceEGP * 6).toLocaleString()} ج.م`, label: "أسبوعي" },
        month: { amount: `${(car.monthlyPriceEGP || car.dailyPriceEGP * 24).toLocaleString()} ج.م`, label: "شهري" },
      }
    };
  });

  const nextCarImage = (e: React.MouseEvent, carId: string, max: number) => {
    e.stopPropagation();
    setCarImageIndexes((prev) => ({
      ...prev,
      [carId]: ((prev[carId] || 0) + 1) % max
    }));
  };

  const prevCarImage = (e: React.MouseEvent, carId: string, max: number) => {
    e.stopPropagation();
    setCarImageIndexes((prev) => ({
      ...prev,
      [carId]: ((prev[carId] || 0) - 1 + max) % max
    }));
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filtered.map((car) => {
            const dur = durations[car.id] || "day";
            const price = car.prices[dur];
            const TABS: DurationKey[] = ["day", "week", "month"];
            const TAB_AR: Record<DurationKey, string> = { day: "يومي", week: "أسبوعي", month: "شهري" };

            return (
              <div
                key={car.id}
                className="scroll-card-reveal bg-[#080f1e] border border-white/10 rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-[#c5a059]/40 hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
              >
                {/* صورة السيارة مع سلايدر تقليب مباشر ونقر للتكبير */}
                {(() => {
                  const carImages = car.images && car.images.length > 0 ? car.images : [car.image];
                  const currentImgIdx = carImageIndexes[car.id] || 0;
                  const currentImgSrc = carImages[currentImgIdx] || car.image;

                  return (
                    <div 
                      onClick={() => {
                        const originalCar = cars.find(c => c.id === car.id) || cars[0];
                        if (originalCar) {
                          setSelectedCarForGallery(originalCar);
                        }
                      }}
                      className="relative aspect-video w-full overflow-hidden cursor-pointer group/img"
                    >
                      <Image
                        src={currentImgSrc}
                        alt={`${car.name} - صورة ${currentImgIdx + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={filtered[0]?.id === car.id}
                        className="object-cover object-center transition-transform duration-500 group-hover/img:scale-105"
                      />

                      {/* تدرج سفلي للنص */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#080f1e] via-transparent to-transparent pointer-events-none" />

                      {/* مؤشر التوفر */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                        <span className={`w-1.5 h-1.5 rounded-full ${car.isAvailable ? "bg-emerald-400" : "bg-slate-500"}`} />
                        <span className="text-[10px] font-semibold text-white bg-[#080f1e]/80 backdrop-blur-sm px-2 py-0.5 rounded shadow">
                          {car.isAvailable ? "متاحة" : "محجوزة"}
                        </span>
                      </div>

                      {/* أيقونة تكبير الحجم الكامل */}
                      <div className="absolute top-3 left-3 bg-black/60 hover:bg-[#c5a059] text-white hover:text-black backdrop-blur-sm p-1.5 rounded-lg text-[10px] font-bold transition-all z-10 opacity-70 group-hover/img:opacity-100" title="انقر لعرض الحجم الكامل">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>

                      {/* أزرار التقليب في نفس المكان إذا كان للسيارة أكثر من صورة */}
                      {carImages.length > 1 && (
                        <>
                          {/* زر الصورة السابقة (اليمين) */}
                          <button
                            type="button"
                            onClick={(e) => prevCarImage(e, car.id, carImages.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-[#c5a059] text-white hover:text-black flex items-center justify-center transition-all opacity-0 group-hover/img:opacity-100 z-10 cursor-pointer shadow-lg"
                            title="الصورة السابقة"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          {/* زر الصورة التالية (اليسار) */}
                          <button
                            type="button"
                            onClick={(e) => nextCarImage(e, car.id, carImages.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-[#c5a059] text-white hover:text-black flex items-center justify-center transition-all opacity-0 group-hover/img:opacity-100 z-10 cursor-pointer shadow-lg"
                            title="الصورة التالية"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          {/* مؤشرات التقليب (Dots) في المنتصف */}
                          <div className="absolute bottom-11 inset-x-0 flex items-center justify-center gap-1 z-10 pointer-events-none">
                            {carImages.map((_, dotIdx) => (
                              <span 
                                key={dotIdx} 
                                className={`w-1.5 h-1.5 rounded-full transition-all ${dotIdx === currentImgIdx ? "bg-[#c5a059] w-3" : "bg-white/40"}`}
                              />
                            ))}
                          </div>
                        </>
                      )}

                      {/* اسم السيارة والموديل فوق التدرج */}
                      <div className="absolute bottom-2.5 right-3 left-3 z-10">
                        <h3 className="text-base font-black text-white drop-shadow-md">{car.name}</h3>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[11px] text-slate-300">{car.category}</span>
                          <span className="text-[10px] font-mono text-slate-400">{car.modelYear}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* تفاصيل البطاقة */}
                <div className="p-4 flex flex-col gap-4 flex-1">

                  {/* العداد الفعلي */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">عداد الكيلومترات الفعلي:</span>
                    <span className="text-xs font-bold text-slate-200 font-mono" suppressHydrationWarning>{car.odometer}</span>
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
