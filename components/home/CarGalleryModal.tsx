'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Car } from '@/types/fleet';

interface CarGalleryModalProps {
  car: Car;
  onClose: () => void;
  onBookNow: () => void;
}

export default function CarGalleryModal({ car, onClose, onBookNow }: CarGalleryModalProps) {
  const images = car.images && car.images.length > 0 ? car.images : [car.coverImage || '/car-mercedes.jpg'];
  const [activeIdx, setActiveIdx] = useState(0);

  const prevImage = () => {
    setActiveIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setActiveIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
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

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">
              {activeIdx + 1} / {images.length}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* مساحة العرض الرئيسية للصورة النشطة */}
        <div className="relative aspect-video w-full bg-black/60 flex items-center justify-center overflow-hidden">
          <Image
            src={images[activeIdx]}
            alt={`${car.make} ${car.model} - صورة ${activeIdx + 1}`}
            fill
            priority
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 900px"
          />

          {/* أزرار التنقل بين الصور إذا كانت أكثر من صورة */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-[#c5a059] text-white hover:text-black transition-all cursor-pointer shadow-lg"
                title="الصورة السابقة"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={nextImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-[#c5a059] text-white hover:text-black transition-all cursor-pointer shadow-lg"
                title="الصورة التالية"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* شريط الصور المصغرة بالأسفل */}
        <div className="p-3 bg-[#0a1224] border-t border-white/10 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`relative w-16 h-11 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                  activeIdx === i ? 'border-[#c5a059] scale-105 shadow-md shadow-[#c5a059]/20' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={img}
                  alt={`مصغرة ${i + 1}`}
                  fill
                  className="object-cover"
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
