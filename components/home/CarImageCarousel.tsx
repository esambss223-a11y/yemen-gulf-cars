'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarImageCarouselProps {
  images: string[];
  name: string;
  preload?: boolean;
  onOpen: (index: number) => void;
}

export default function CarImageCarousel({
  images,
  name,
  preload = false,
  onOpen,
}: CarImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);

  const total = images.length || 1;
  const currentIdx = Math.max(0, Math.min(activeIndex, total - 1));

  const goTo = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveIndex((index + total) % total);
  };

  // Ultra-fluid mobile touch swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = e.touches[0].clientY - touchStartY.current;

    // Distinguish horizontal swipe from vertical page scrolling
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const diffX = endX - touchStartX.current;

    if (Math.abs(diffX) > 25) {
      // Swiped right or left
      if (diffX > 0) {
        // In RTL, swiping right goes to previous photo
        setActiveIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
      } else {
        // Swiping left goes to next photo
        setActiveIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const currentImage = images[currentIdx] || '/car-mercedes.jpg';

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none bg-[#071726] group cursor-pointer"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        if (!isSwiping.current) {
          onOpen(currentIdx);
        }
      }}
      role="region"
      aria-roledescription="عارض صور"
      aria-label={`صور ${name}`}
    >
      {/* 1. Ambient blurred background for off-ratio / portrait photos */}
      <Image
        src={currentImage}
        alt=""
        fill
        sizes="80px"
        aria-hidden="true"
        className="object-cover scale-125 blur-xl opacity-25 brightness-75 pointer-events-none transition-all duration-300"
      />
      <div className="absolute inset-0 bg-[#071726]/30 pointer-events-none" />

      {/* 2. Sharp foreground vehicle image with smooth fade */}
      <div className="relative w-full h-full flex items-center justify-center p-1">
        <Image
          src={currentImage}
          alt={`${name} - صورة ${currentIdx + 1}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          preload={preload && currentIdx === 0}
          loading={preload && currentIdx === 0 ? undefined : 'lazy'}
          className="object-contain object-center transition-all duration-200 drop-shadow-sm"
          draggable={false}
        />
      </div>

      {/* 3. Delicate Small Navigation Arrows (Hidden on mobile touch, subtle and small on desktop hover) */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => goTo(currentIdx - 1, e)}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-sm hover:scale-105 active:scale-95 items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 z-20 cursor-pointer"
            aria-label="الصورة السابقة"
          >
            <ChevronRight size={13} />
          </button>

          <button
            type="button"
            onClick={(e) => goTo(currentIdx + 1, e)}
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-sm hover:scale-105 active:scale-95 items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 z-20 cursor-pointer"
            aria-label="الصورة التالية"
          >
            <ChevronLeft size={13} />
          </button>

          {/* 4. Delicate Micro-dots (Apple/Airbnb style - tiny and unobtrusive) */}
          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1 z-20 pointer-events-none">
            {images.slice(0, 5).map((_, i) => (
              <span
                key={i}
                className={`rounded-full transition-all duration-150 ${
                  i === (currentIdx % 5)
                    ? 'w-2 h-0.5 bg-white shadow-xs'
                    : 'w-1 h-0.5 bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Micro index counter for mobile view */}
          <div className="sm:hidden absolute bottom-2 left-2 px-1.5 py-0.5 rounded-full bg-black/40 text-[9px] font-mono text-white/90 backdrop-blur-xs pointer-events-none">
            {currentIdx + 1}/{total}
          </div>
        </>
      )}
    </div>
  );
}
