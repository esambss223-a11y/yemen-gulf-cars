"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Camera, Clock } from "lucide-react";
import { sortCarsForDisplay } from '@/lib/car-display-order';
import { carPeriodOffer } from '@/lib/car-offers';
import { COMPANY_CONTACT } from '@/lib/company-contact';
import { useFleet } from "@/context/FleetContext";
import PublicBookingModal from "@/components/home/PublicBookingModal";
import CarGalleryModal from "@/components/home/CarGalleryModal";
import CarImageCarousel from "@/components/home/CarImageCarousel";
import MobileCarDrawer from "@/components/home/MobileCarDrawer";
import { getCarImages } from "@/lib/car-images";
import { carRentalPrices } from '@/lib/car-pricing';
import type { Car } from "@/types/fleet";

type FilterKey = "all" | "available" | "vip" | "suv";
type DurationRate = "daily" | "weekly" | "monthly";

export default function FeaturedFleet() {
  const { cars } = useFleet();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedDuration, setSelectedDuration] = useState<DurationRate>("daily");
  
  // Modals & Drawers state
  const [selectedCarForBooking, setSelectedCarForBooking] = useState<{ car: Car; label: string } | null>(null);
  const [selectedCarForGallery, setSelectedCarForGallery] = useState<{ car: Car; initialIndex: number } | null>(null);
  const [selectedCarForDrawer, setSelectedCarForDrawer] = useState<Car | null>(null);

  // Cars mapping for display
  const nonArchivedCars = useMemo(() => {
    return sortCarsForDisplay(cars.filter(car => car.status !== 'archived'));
  }, [cars]);

  // Filter items
  const filtered = useMemo(() => {
    return nonArchivedCars.filter((car) => {
      if (filter === "available" && car.status !== 'available') return false;
      if (filter === "vip" && car.category !== 'vip') return false;
      if (filter === "suv" && car.category !== 'suv') return false;
      return true;
    });
  }, [nonArchivedCars, filter]);

  const counts = useMemo(() => ({
    all: nonArchivedCars.length,
    available: nonArchivedCars.filter(c => c.status === 'available').length,
    vip: nonArchivedCars.filter(c => c.category === 'vip').length,
    suv: nonArchivedCars.filter(c => c.category === 'suv').length,
  }), [nonArchivedCars]);

  const FILTERS: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "كل السيارات", count: counts.all },
    { key: "vip", label: "سيدان VIP", count: counts.vip },
    { key: "suv", label: "دفع رباعي SUV", count: counts.suv },
    { key: "available", label: "متاحة فوراً", count: counts.available },
  ];

  // Open booking modal on both mobile and desktop
  const handleCarClick = (car: Car) => {
    setSelectedCarForBooking({ car, label: "يومي" });
  };

  return (
    <section
      id="featured-fleet"
      className="relative w-full bg-[#071726] text-white py-14 sm:py-20 scroll-mt-16 overflow-hidden"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================= */}
        {/* 1. Header (Editorial Luxury Architecture)                  */}
        {/* ========================================================= */}
        <div className="mb-8 text-right">
          <span className="text-[#DDBD80] text-xs font-bold tracking-wide mb-2 block">
            اختر وجهتك. اختر سيارتك.
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            سيارتك القادمة، هنا.
          </h2>
          <p className="text-[#C0CFDF] text-xs sm:text-sm mt-1.5 font-medium max-w-xl">
            أسطول معتمد ومفحوص بالكامل مع تسليم فوري في القاهرة، الجيزة والمطار.
          </p>
        </div>

        {/* ========================================================= */}
        {/* 2. Category Filter Tabs (Pill Capsules)                   */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 mb-10 no-scrollbar">
          {FILTERS.map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`flex items-center gap-2.5 px-4 sm:px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                filter === key
                  ? "bg-[#ddbd80] border-[#ddbd80] text-[#071726] font-black shadow-md shadow-amber-500/20"
                  : "bg-transparent border-white/20 text-slate-300 hover:border-white/40 hover:text-white"
              }`}
            >
              <span>{label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                filter === key ? "bg-[#071726]/20 text-[#071726]" : "bg-white/10 text-slate-400"
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* ========================================================= */}
        {/* 3. Main Fleet Grid (Editorial Dark Luxury Architecture)   */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {filtered.map((car, carIdx) => {
            const prices = carRentalPrices(car);
            const carImages = getCarImages(car);
            const isAvailable = car.status === 'available';

            // Price according to selected duration
            let displayPrice = prices.daily;
            let durationLabel = "يوم";
            let originalPrice: number | null | undefined = car.originalDailyPriceEGP;

            if (selectedDuration === "weekly") {
              displayPrice = prices.weekly;
              durationLabel = "أسبوع";
              const weekOffer = carPeriodOffer(car, 7);
              originalPrice = weekOffer.original && weekOffer.original > prices.weekly ? weekOffer.original : null;
            } else if (selectedDuration === "monthly") {
              displayPrice = prices.monthly;
              durationLabel = "شهر";
              const monthOffer = carPeriodOffer(car, 30);
              originalPrice = monthOffer.original && monthOffer.original > prices.monthly ? monthOffer.original : null;
            }

            const hasDiscount = typeof originalPrice === 'number' && originalPrice > displayPrice;
            const discountPercent = hasDiscount && originalPrice
              ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
              : null;
            const minDays = typeof car.minRentalDays === 'number' && car.minRentalDays > 0 ? Math.ceil(car.minRentalDays) : 1;
            const minDaysLabel = minDays <= 1 
              ? 'يوم واحد' 
              : minDays === 2 
                ? 'يومين' 
                : minDays <= 10 
                  ? `${minDays} أيام` 
                  : `${minDays} يوماً`;

            return (
              <article
                key={car.id}
                className="group flex flex-col min-w-0 pb-7 border-b border-white/15 transition-all duration-300"
              >
                {/* 1. Photo Stage (Aspect 4/3 with 3D Automotive Seamless Integration) */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-b from-[#0c1f33] to-[#071726] rounded-2xl border border-white/10 group-hover:border-[#ddbd80]/40 shadow-xl shadow-black/50 transition-all duration-300">
                  <CarImageCarousel
                    images={carImages}
                    name={`${car.make} ${car.model}`}
                    preload={carIdx === 0}
                    onOpen={(initialIndex) => {
                      setSelectedCarForGallery({ car, initialIndex });
                    }}
                  />

                  {/* Status Pill Badge */}
                  <div className="absolute top-3 right-3 z-20 pointer-events-none">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold shadow-md backdrop-blur-md ${
                      isAvailable
                        ? "bg-[#071726]/85 text-emerald-300 border border-emerald-500/30"
                        : "bg-[#071726]/85 text-slate-300 border border-white/10"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-slate-400"}`} />
                      <span>{isAvailable ? "متاحة فوراً" : "محجوزة"}</span>
                    </div>
                  </div>

                  {/* Photos Count Badge */}
                  <div className="absolute top-3 left-3 z-20 pointer-events-none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCarForGallery({ car, initialIndex: 0 });
                      }}
                      className="pointer-events-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-mono font-bold shadow-sm transition-colors cursor-pointer border border-white/10"
                      title="فتح ألبوم الصور"
                    >
                      <Camera size={12} className="text-[#DDBD80]" />
                      <span>{carImages.length} صور</span>
                    </button>
                  </div>

                  {/* Floating Min Duration Badge on Photo */}
                  <div className="absolute bottom-3 right-3 z-20 pointer-events-none">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-lg backdrop-blur-md bg-[#071726]/90 border border-[#ddbd80]/40 text-[#DDBD80]">
                      <Clock size={11} className="text-[#DDBD80]" />
                      <span>أقل مدة: {minDaysLabel}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Car Info (Editorial Minimalism: Zero Clutter) */}
                <div className="pt-4 flex flex-col flex-1 text-right">
                  {/* Car Title */}
                  <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-[#DDBD80] transition-colors mb-1 truncate">
                    {car.make} {car.model}
                  </h3>

                  {/* Short Clean Spec Line */}
                  <p className="text-xs sm:text-sm text-[#C0CFDF] font-medium mb-3 truncate">
                    {car.category === 'vip' ? 'سيدان فاخرة' : car.category === 'suv' ? 'دفع رباعي فاخر' : 'فخامة وتميز'}
                    {' · '}
                    <span>{car.transmission === 'manual' ? 'يدوي' : 'أوتوماتيك'}</span>
                    {' · '}
                    <span>{car.seats || 5} مقاعد</span>
                    {' · '}
                    <span className="font-mono">{car.year}</span>
                  </p>

                  {/* Price, Discount & Minimum Rental Duration */}
                  <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-2xl font-black text-[#DDBD80]">
                        {displayPrice?.toLocaleString()} ج.م
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        / {durationLabel}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-slate-500 line-through mr-1.5">
                          {originalPrice?.toLocaleString()} ج.م
                        </span>
                      )}
                      {hasDiscount && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          خصم {discountPercent}٪
                        </span>
                      )}
                    </div>

                    {/* Minimum Duration Pill Badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ddbd80]/15 border border-[#ddbd80]/40 text-[#DDBD80] text-[11px] font-bold whitespace-nowrap shadow-sm">
                      <span className="text-[10px] text-[#DDBD80]/80 font-normal">أقل مدة:</span>
                      <span className="text-white font-black">{minDaysLabel}</span>
                    </div>
                  </div>

                  {/* 3. Dual Actions */}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                    {/* Secondary Action: Explore Details */}
                    <button
                      type="button"
                      onClick={() => setSelectedCarForGallery({ car, initialIndex: 0 })}
                      className="text-[#DDBD80] hover:text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5 group/btn"
                    >
                      <span>استكشف السيارة</span>
                      <ArrowLeft size={13} className="group-hover/btn:-translate-x-1 transition-transform" />
                    </button>

                    {/* Primary Action: Book on Site */}
                    {isAvailable ? (
                      <button
                        type="button"
                        onClick={() => handleCarClick(car)}
                        className="px-5 py-2.5 rounded-full public-gold-button bg-[#ddbd80] hover:bg-[#ecd5a9] text-[#071726] text-xs sm:text-sm font-black transition-all shadow-md shadow-amber-500/10 hover:shadow-amber-500/25 active:scale-95 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <span>احجز الآن</span>
                        <ArrowLeft size={14} className="text-[#071726]" />
                      </button>
                    ) : (
                      <div className="px-4 py-2 rounded-full bg-white/10 text-slate-400 text-xs font-bold">
                        محجوزة حالياً
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Booking Dialog Modal (Desktop) */}
        {selectedCarForBooking && (
          <PublicBookingModal
            car={selectedCarForBooking.car}
            onClose={() => setSelectedCarForBooking(null)}
          />
        )}

        {/* Car Gallery Modal */}
        {selectedCarForGallery && (
          <CarGalleryModal
            car={selectedCarForGallery.car}
            initialIndex={selectedCarForGallery.initialIndex}
            onClose={() => setSelectedCarForGallery(null)}
            onBookNow={() => {
              setSelectedCarForBooking({ car: selectedCarForGallery.car, label: "يومي" });
              setSelectedCarForGallery(null);
            }}
          />
        )}

        {/* Mobile Car Bottom Sheet Drawer */}
        {selectedCarForDrawer && (
          <MobileCarDrawer
            car={selectedCarForDrawer}
            onClose={() => setSelectedCarForDrawer(null)}
            onBookWebsite={() => {
              const c = selectedCarForDrawer;
              setSelectedCarForDrawer(null);
              setSelectedCarForBooking({ car: c, label: "يومي" });
            }}
          />
        )}

      </div>
    </section>
  );
}
