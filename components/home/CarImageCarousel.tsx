'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './fleet-carousel.css';

interface CarImageCarouselProps {
  images: string[];
  name: string;
  preload?: boolean;
  onOpen: (index: number) => void;
}

export default function CarImageCarousel({ images, name, preload = false, onOpen }: CarImageCarouselProps) {
  const track = useRef<HTMLDivElement>(null);
  const trackWidth = useRef(0);
  const currentIndex = useRef(0);
  const gesture = useRef({ x: 0, y: 0, dragged: false });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      trackWidth.current = element.clientWidth;
      element.scrollTo({ left: currentIndex.current * element.clientWidth, behavior: 'instant' });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const goTo = (index: number) => {
    const element = track.current;
    if (!element) return;
    const target = (index + images.length) % images.length;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollTo({ left: target * element.clientWidth, behavior: reduceMotion ? 'instant' : 'smooth' });
  };
  const firstDot = Math.max(0, Math.min(activeIndex - 3, images.length - 7));

  return (
    <div className="car-image-carousel" role="region" aria-roledescription="عارض صور" aria-label={`صور ${name}`}>
      <div ref={track} className="car-image-track" dir="ltr"
        onScroll={(event) => {
          const element = event.currentTarget;
          if (!element.clientWidth || element.clientWidth !== trackWidth.current) return;
          const index = Math.max(0, Math.min(images.length - 1, Math.round(element.scrollLeft / element.clientWidth)));
          currentIndex.current = index;
          setActiveIndex(index);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            goTo(currentIndex.current + (event.key === 'ArrowLeft' ? 1 : -1));
          }
        }}>
        {images.map((source, index) => (
          <button key={source} type="button" className="car-image-slide" dir="rtl" tabIndex={index === activeIndex ? 0 : -1}
            aria-label={`تكبير صورة ${index + 1} من ${images.length} لـ ${name}`}
            onPointerDown={(event) => { gesture.current = { x: event.clientX, y: event.clientY, dragged: false }; }}
            onPointerMove={(event) => {
              if (Math.abs(event.clientX - gesture.current.x) > 8 || Math.abs(event.clientY - gesture.current.y) > 8) gesture.current.dragged = true;
            }}
            onPointerCancel={() => { gesture.current.dragged = true; }}
            onClick={(event) => { if (event.detail === 0 || !gesture.current.dragged) onOpen(event.detail === 0 ? currentIndex.current : index); }}>
            <Image src={source} alt={`${name} - صورة ${index + 1}`} fill
              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
              preload={preload && index === 0} loading={preload && index === 0 ? undefined : 'lazy'}
              draggable={false} className="object-cover object-center" />
          </button>
        ))}
      </div>
      {images.length > 1 && <>
        <button type="button" className="car-image-arrow is-previous" onClick={() => goTo(currentIndex.current - 1)} aria-label={`الصورة السابقة لـ ${name}`}><ChevronRight size={18} /></button>
        <button type="button" className="car-image-arrow is-next" onClick={() => goTo(currentIndex.current + 1)} aria-label={`الصورة التالية لـ ${name}`}><ChevronLeft size={18} /></button>
        <div className="car-image-dots" aria-label="اختيار صورة السيارة">
          {images.slice(firstDot, firstDot + 7).map((source, offset) => {
            const index = firstDot + offset;
            return <button key={source} type="button" onClick={() => goTo(index)}
              aria-label={`عرض الصورة ${index + 1} لـ ${name}`} aria-current={index === activeIndex ? 'true' : undefined}>
              <span className={index === activeIndex ? 'is-active' : ''} />
            </button>;
          })}
        </div>
        <span className="sr-only" aria-live="polite" aria-atomic="true">الصورة {activeIndex + 1} من {images.length}</span>
      </>}
    </div>
  );
}
