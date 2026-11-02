"use client";

import { useRef, useState, useEffect } from "react";
import { ArrowLeft, Pause, Play } from "lucide-react";
import "./hero-section.css";

export default function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const openFleet = () => {
    document.getElementById("featured-fleet")?.scrollIntoView({ behavior: "smooth" });
  };

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    // Respect user's reduced-motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  return (
    <section className="public-hero" aria-label="شركة اليمن والخليج لتأجير السيارات">
      {/* 1. Header Copy Block */}
      <div className="public-hero-copy">
        <h1 className="public-hero-headline">
          <span className="public-hero-highlight">أسطولٌ</span> يتحدث عنك.
        </h1>
        <p className="public-hero-description">
          تأجير سيارات في القاهرة وحدائق أكتوبر، مع التسليم للمطار أو مقر إقامتك.
        </p>
        <button 
          type="button" 
          className="public-hero-cta" 
          onClick={openFleet}
          title="انتقل إلى أسطول السيارات"
        >
          <span>اكتشف السيارات</span>
          <ArrowLeft size={18} aria-hidden="true" className="public-hero-cta-icon" />
        </button>
      </div>

      {/* 2. Panoramic Fleet Showcase Video (1080p Crystal Clear) */}
      <div className="public-hero-video-stage">
        <video 
          ref={videoRef}
          id="hero-fleet-film"
          autoPlay 
          muted 
          loop 
          playsInline 
          preload="metadata" 
          poster="/hero-poster.webp"
          aria-label="أسطول سيارات فاخرة أمام أهرامات القاهرة"
        >
          <source src="/hero-fleet-pyramids.mp4" type="video/mp4" />
          <source src="/hero-fleet-pyramids.webm" type="video/webm" />
        </video>
        
        {/* Delicate Top & Bottom Edge Blends */}
        <div className="public-hero-shade-top" aria-hidden="true" />
        <div className="public-hero-shade-bottom" aria-hidden="true" />

        {/* Pause / Play Accessibility Button */}
        <button 
          type="button" 
          className="public-hero-pause-btn" 
          onClick={togglePlayback}
          aria-label={isPlaying ? "إيقاف الحركة مؤقتًا" : "تشغيل الفيديو"}
          title={isPlaying ? "إيقاف الحركة مؤقتًا" : "تشغيل الفيديو"}
        >
          {isPlaying ? (
            <>
              <Pause size={13} aria-hidden="true" />
              <span>إيقاف الحركة مؤقتًا</span>
            </>
          ) : (
            <>
              <Play size={13} aria-hidden="true" />
              <span>تشغيل الفيديو</span>
            </>
          )}
        </button>
      </div>

    </section>
  );
}
