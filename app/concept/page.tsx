"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowUpLeft, Check, Menu, Plane, ShieldCheck, Sparkles } from "lucide-react";
import { useFleet } from "@/context/FleetContext";
import { sortCarsForDisplay } from "@/lib/car-display-order";
import { carRentalPrices } from "@/lib/car-pricing";
import { getCarImages } from "@/lib/car-images";
import "./concept.css";

const navItems = [
  ["featured-fleet", "الأسطول"],
  ["chauffeur-service", "استقبال المطار"],
  ["how-to-book", "طريقة الحجز"],
  ["our-location", "تواصل معنا"],
];

export default function ConceptPage() {
  const { cars } = useFleet();
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "available">("all");
  const fleet = useMemo(() => sortCarsForDisplay(cars.filter((car) => car.status !== "archived")), [cars]);
  const shownCars = filter === "available" ? fleet.filter((car) => car.status === "available") : fleet;
  const featured = shownCars[0];

  return (
    <main className="concept-page" dir="rtl">
      <div className="concept-topline"><span>اليمن والخليج <i> / </i> لتأجير وتوريد السيارات</span><span>القاهرة <b>·</b> سفنكس <b>·</b> خدمة على مدار الساعة</span></div>
      <header className="concept-nav">
        <a className="concept-brand" href="#top" aria-label="العودة إلى الأعلى"><Image src="/logonew.png" alt="شركة اليمن والخليج" width={150} height={63} priority /><span>شركة اليمن والخليج<small>لتأجير وتوريد السيارات</small></span></a>
        <nav aria-label="التصفح">{navItems.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>
        <a className="concept-nav-cta" href="#featured-fleet">احجز سيارتك <ArrowLeft size={15} /></a>
        <button className="concept-menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="فتح القائمة"><Menu /></button>
        {menuOpen && <div className="concept-mobile-nav">{navItems.map(([id, label]) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{label}<ArrowUpLeft size={14} /></a>)}</div>}
      </header>

      <section className="concept-hero" id="top">
        <video autoPlay loop muted playsInline poster="/hero-poster.jpg" aria-label="مشهد أسطول السيارات">
          <source src="/hero-video.webm" type="video/webm" /><source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="concept-hero-shade" />
        <div className="concept-hero-copy">
          <span className="concept-kicker"><i /> رحلة مختلفة تبدأ من هنا <b>—</b> مصر</span>
          <h1>أسطولٌ يتحدث<br /><em>عن حضورك.</em></h1>
          <p>سيارتك المختارة بعناية، جاهزة لتأخذك أبعد.<br />تأجير خاص واستقبال مطار بتجربة تليق بك.</p>
          <a className="concept-hero-cta" href="#featured-fleet">اكتشف الأسطول <span><ArrowLeft size={17} /></span></a>
        </div>
        <div className="concept-hero-note"><span>01</span><i /><span>05</span><small>اكتشف التجربة</small></div>
        <div className="concept-hero-bottom"><span>YEMEN &amp; GULF CARS</span><span>الراحة تبدأ من أول اختيار</span></div>
      </section>

      <section className="concept-proof" aria-label="مميزات الخدمة"><div><Sparkles /><span><b>أسطول مختار</b><small>سيارات جاهزة بعناية</small></span></div><div><Plane /><span><b>استقبال مطار</b><small>القاهرة وسفنكس</small></span></div><div><ShieldCheck /><span><b>حجز مباشر</b><small>تواصل واضح وسريع</small></span></div><div className="proof-number"><b>{fleet.length.toLocaleString("ar-EG")}</b><span>سيارة في الأسطول</span></div></section>

      <section className="concept-fleet" id="featured-fleet">
        <div className="concept-section-heading"><div><span className="concept-kicker dark">01 <i /> مجموعة السيارات</span><h2>مساحة أكبر<br />للاختيار الصحيح.</h2></div><p>اكتشف السيارة التي تناسب رحلتك.<br />صور الأسطول وأسعاره الحقيقية، كما هي.</p></div>
        <div className="concept-filterbar"><span>الأسطول <b>{shownCars.length.toLocaleString("ar-EG")}</b></span><div><button className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")}>كل السيارات</button><button className={filter === "available" ? "selected" : ""} onClick={() => setFilter("available")}>المتاحة الآن</button></div><small>اسحب لاستكشاف المزيد　←</small></div>
        {featured ? <div className="concept-feature-car">
          <div className="concept-car-image"><Image src={featured.coverImage || getCarImages(featured)[0] || "/car-mercedes.jpg"} alt={`${featured.make} ${featured.model}`} fill priority sizes="(max-width: 800px) 100vw, 58vw" /><span className="concept-image-count">مختارة لك <i> / </i> {featured.category === "suv" ? "دفع رباعي" : featured.category === "vip" ? "VIP" : "سيارة مميزة"}</span><span className="concept-car-serial">YG　—　01</span></div>
          <div className="concept-car-details"><span className="concept-kicker dark">اختيار الأسطول <i /> {featured.status === "available" ? "متاحة للحجز" : "محجوزة حاليًا"}</span><h3>{featured.make}<br /><em>{featured.model}</em></h3><p>سيارة مختارة لتمنحك مساحة أوسع وراحة في كل طريق. استعرض صورها وتفاصيلها واختر المدة المناسبة.</p><div className="concept-car-specs"><span><small>الموديل</small><b>{featured.year}</b></span><span><small>ناقل الحركة</small><b>{featured.transmission || "أوتوماتيك"}</b></span><span><small>المقاعد</small><b>{featured.seats || "—"}</b></span></div><div className="concept-car-price"><div><small>الإيجار اليومي يبدأ من</small><b>{carRentalPrices(featured).daily.toLocaleString("ar-EG")} <i>ج.م</i></b></div><a href="#how-to-book">عرض التفاصيل <ArrowLeft size={16} /></a></div></div>
        </div> : <div className="concept-empty"><b>أسطولك قيد التحميل</b><span>سيظهر هنا عند اكتمال تحميل بيانات الموقع.</span></div>}
        <div className="concept-car-rail"><div className="concept-rail-title"><b>سيارات أخرى في الأسطول</b><span>استعرض واسحب　←</span></div><div className="concept-rail-track">{shownCars.slice(1).map((car, index) => { const photo = car.coverImage || getCarImages(car)[0]; return <article className="concept-mini-car" key={car.id}><div className="concept-mini-photo">{photo && <Image src={photo} alt={`${car.make} ${car.model}`} fill sizes="260px" />}<span>{String(index + 2).padStart(2, "0")}</span></div><div className="concept-mini-copy"><span>{car.category === "suv" ? "دفع رباعي" : car.category === "vip" ? "سيدان VIP" : "من الأسطول"} <b>{car.status === "available" ? "متاحة" : "محجوزة"}</b></span><h3>{car.make} {car.model}</h3><small>{carRentalPrices(car).daily.toLocaleString("ar-EG")} ج.م <i>/ اليوم</i></small></div></article>; })}</div></div>
      </section>

      <section className="concept-airport" id="chauffeur-service"><div className="concept-airport-visual"><Image src="/showroom-bg.jpg" alt="تجربة استقبال المطار" fill sizes="(max-width: 800px) 100vw, 55vw" /><span>PRIVATE ARRIVAL <i> / </i> CAIRO</span></div><div className="concept-airport-copy"><span className="concept-kicker">02 <i /> استقبال خاص</span><h2>من صالة الوصول،<br /><em>إلى وجهتك.</em></h2><p>نرتب الاستقبال والسيارة والوجهة قبل وصولك، لتبدأ رحلتك براحة ومن دون انتظار.</p><div className="concept-route"><span>مطار القاهرة</span><i>ــــــــــــــــ ✈ ــــــــــــــــ</i><span>وجهتك</span></div><div className="concept-airport-points"><span><Check /> اختيار السيارة مسبقًا</span><span><Check /> توصيل حسب وجهتك</span><span><Check /> خدمة على مدار الساعة</span></div><a href="#our-location">رتّب استقبال المطار <ArrowLeft size={16} /></a></div></section>

      <section className="concept-steps" id="how-to-book"><div className="concept-section-heading"><div><span className="concept-kicker dark">03 <i /> ببساطة تليق بك</span><h2>اختر. أكّد.<br />وانطلق.</h2></div><p>من لحظة اختيار السيارة<br />حتى استلام المفتاح، خطوات سلسة.</p></div><div className="concept-step-grid"><article><span>01</span><i>01 / 03</i><h3>اعثر على سيارتك</h3><p>تصفح الصور الحقيقية وقارن الخيارات والأسعار.</p><ArrowLeft /></article><article><span>02</span><i>02 / 03</i><h3>أكّد حجزك مباشرة</h3><p>تواصل معنا لتأكيد التوفر والمدة المناسبة.</p><ArrowLeft /></article><article><span>03</span><i>03 / 03</i><h3>استلم وانطلق</h3><p>نجهز السيارة ونسلمها في المكان المتفق عليه.</p><ArrowLeft /></article></div></section>

      <section className="concept-values" id="why-us"><div className="concept-values-intro"><span className="concept-kicker">04 <i /> وعدنا لك</span><h2>التفاصيل الصغيرة،<br /><em>تصنع الرحلة.</em></h2><p>اختيار واضح، سيارة جاهزة، وفريق قريب حين تحتاجه.</p><a href="#featured-fleet">اكتشف سياراتنا <ArrowLeft size={16} /></a></div><div className="concept-values-list"><article><span>01</span><div><b>سيارة تليق بخطتك</b><small>سيدان، دفع رباعي، وخيارات بخدمة سائق.</small></div><ArrowUpLeft /></article><article><span>02</span><div><b>جاهزة عند استلامك</b><small>عناية وتجهيز قبل كل رحلة.</small></div><ArrowUpLeft /></article><article><span>03</span><div><b>تفاصيل واضحة</b><small>أسعار ومدد الإيجار متاحة قبل الحجز.</small></div><ArrowUpLeft /></article><article><span>04</span><div><b>نصل إلى وجهتك</b><small>المقر، المطار، أو المكان المتفق عليه.</small></div><ArrowUpLeft /></article></div></section>

      <section className="concept-location" id="our-location"><div className="concept-location-copy"><span className="concept-kicker dark">05 <i /> نقطة انطلاقك</span><h2>نحن أقرب<br />مما تتوقع.</h2><p>مقرنا في حدائق أكتوبر، وخدمتنا تمتد إلى المطار والوجهة التي تناسبك.</p><div><a href="https://maps.google.com/?cid=45157466133356522" target="_blank" rel="noreferrer">الاتجاهات إلى المقر <ArrowUpLeft size={16} /></a><a href="tel:+201117461373">+20 11 1746 1373</a></div></div><div className="concept-location-image"><Image src="/showroom-bg.jpg" alt="مقر وخدمة اليمن والخليج" fill sizes="50vw" /><span>حدائق أكتوبر　 ·　 محافظة الجيزة</span></div></section>

      <footer className="concept-footer"><div className="concept-footer-main"><a className="concept-brand" href="#top"><Image src="/logonew.png" alt="شركة اليمن والخليج" width={140} height={60} /><span>شركة اليمن والخليج<small>لتأجير وتوريد السيارات</small></span></a><p>رحلتك تبدأ من اختيارٍ واثق.<br />نحن هنا لنرتب الباقي.</p><a className="concept-footer-contact" href="tel:+201117461373">+20 11 1746 1373 <ArrowUpLeft size={17} /></a></div><div className="concept-footer-base"><span>© 2026 اليمن والخليج لتأجير وتوريد السيارات</span><a href="#top">العودة إلى الأعلى ↑</a></div></footer>
      <a className="concept-whatsapp" href="https://wa.me/201117461373" target="_blank" rel="noreferrer">تحدث مع فريقنا <ArrowUpLeft size={15} /></a>
    </main>
  );
}
