'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { Car } from '@/types/fleet';
import { getCarImages } from '@/lib/car-images';
import './fleet-carousel.css';

interface CarGalleryModalProps {
  car: Car;
  initialIndex?: number;
  onClose: () => void;
  onBookNow: () => void;
}

export default function CarGalleryModal({ car, initialIndex = 0, onClose, onBookNow }: CarGalleryModalProps) {
  const images = getCarImages(car);
  const [activeIdx, setActiveIdx] = useState(() => Math.max(0, Math.min(initialIndex, images.length - 1)));
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');

  const prevImage = () => {
    setActiveIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setActiveIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') prevImage();
      if (e.key === 'ArrowLeft') nextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const currentImage = images[activeIdx] || '/car-mercedes.jpg';

  return (
    <div role="dialog" aria-modal="true" aria-label={`صور ${car.make} ${car.model}`} className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      {/* Backdrop click listener */}
      <div className="absolute inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div className="bg-[#070d1a] border border-[#c5a059]/40 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* شريط الإغلاق والعنوان */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#0a1224]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#c5a059] font-bold uppercase tracking-wider">{car.make}</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">{car.year}</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">{car.model}</h3>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Fit mode toggle */}
            <button
              type="button"
              onClick={() => setFitMode(m => m === 'contain' ? 'cover' : 'contain')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-semibold border border-white/10 cursor-pointer"
              title={fitMode === 'contain' ? 'التبديل إلى ملء الإطار' : 'التبديل إلى رؤية السيارة كاملة بدون أي قص'}
            >
              {fitMode === 'contain' ? <Maximize2 className="w-3.5 h-3.5 text-[#c5a059]" /> : <Minimize2 className="w-3.5 h-3.5 text-[#c5a059]" />}
              <span className="hidden sm:inline">{fitMode === 'contain' ? 'رؤية كاملة' : 'ملء الإطار'}</span>
            </button>

            <span className="text-xs text-slate-400 font-mono bg-slate-800/80 px-2 py-1 rounded-md">
              {activeIdx + 1} / {images.length}
            </span>

            <button
              onClick={onClose}
              aria-label="إغلاق معرض الصور"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* مساحة العرض الرئيسية للصورة النشطة (Smart Studio Stage) */}
        <div className="car-gallery-main relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Ambient blurred backdrop layer */}
          <Image
            src={currentImage}
            alt=""
            fill
            sizes="120px"
            aria-hidden="true"
            className="object-cover scale-125 blur-2xl opacity-40 brightness-75 pointer-events-none transition-all duration-500"
          />
          <div className="absolute inset-0 bg-slate-950/25 pointer-events-none" />

          {/* Foreground sharp car photo */}
          <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
            <Image
              src={currentImage}
              alt={`${car.make} ${car.model} - صورة ${activeIdx + 1}`}
              fill
              loading="eager"
              className={`${fitMode === 'contain' ? 'object-contain' : 'object-cover'} transition-all duration-300 drop-shadow-2xl`}
              sizes="(max-width: 1024px) 100vw, 900px"
            />
          </div>

          {/* أزرار التنقل بين الصور إذا كانت أكثر من صورة */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-[#c5a059] text-white hover:text-black transition-all cursor-pointer shadow-lg active:scale-95"
                title="الصورة السابقة"
                aria-label="الصورة السابقة"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={nextImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-[#c5a059] text-white hover:text-black transition-all cursor-pointer shadow-lg active:scale-95"
                title="الصورة التالية"
                aria-label="الصورة التالية"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* شريط الصور المصغرة بالأسفل */}
        <div className="p-3 bg-[#0a1224] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                aria-label={`عرض الصورة ${i + 1}`}
                aria-current={activeIdx === i ? "true" : undefined}
                className={`relative w-16 h-11 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer bg-slate-950 ${
                  activeIdx === i ? 'border-[#c5a059] scale-105 shadow-md shadow-[#c5a059]/20' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={img}
                  alt=""
                  fill
                  sizes="30px"
                  aria-hidden="true"
                  className="object-cover scale-125 blur-md opacity-40 pointer-events-none"
                />
                <Image
                  src={img}
                  alt={`مصغرة ${i + 1}`}
                  fill
                  className="object-contain"
                  sizes="64px"
                />
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              onClose();
              onBookNow();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#96793e] hover:from-[#d4af37] hover:to-[#a98845] text-black font-black text-xs shrink-0 shadow-lg cursor-pointer"
          >
            طلب حجز هذه السيارة ←
          </button>
        </div>

      </div>
    </div>
  );
}
