"use client";

import { useState } from "react";
import { ArrowUpLeft } from "lucide-react";
import { COMPANY_CONTACT } from "@/lib/company-contact";
import "./chauffeur-service.css";

const AIRPORTS = [
  { id: "cai", name: "مطار القاهرة", code: "CAI" },
  { id: "spx", name: "مطار سفنكس", code: "SPX" },
  { id: "vip", name: "الطيران الخاص", code: "VIP" },
];

export default function ChauffeurAirportService() {
  const [airport, setAirport] = useState(AIRPORTS[0]);
  const message = encodeURIComponent(
    `مرحباً شركة اليمن والخليج، أود ترتيب استقبال من ${airport.name} (${airport.code}) مع سائق خاص. يرجى تأكيد التوفر والسعر وتنسيق موعد الوصول.`
  );

  return (
    <section id="chauffeur-service" className="arrival-service" aria-labelledby="arrival-title">
      <div className="arrival-inner">
        <div className="arrival-photo">
          {/* Native lazy loading with modern WebP picture element */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <picture>
            <source srcSet="/chauffeur-vip.webp" type="image/webp" />
            <img src="/Chauffeur_waiting_by_luxury_car_4d837816.jpg" alt="سائق خاص بجانب سيارة فاخرة في المطار" loading="lazy" width="1376" height="768" />
          </picture>
          <div className="arrival-route" aria-hidden="true"><span><small>وصولك</small><bdi>{airport.code}</bdi></span><i /><span><small>وجهتك</small><strong>باب إقامتك</strong></span></div>
        </div>
        <div className="arrival-copy">
          <div className="arrival-eyebrow"><span /> استقبال خاص <bdi>24/7</bdi></div>
          <h2 id="arrival-title">من لحظة وصولك،<br /><span>أنت ضيفنا.</span></h2>
          <p>استقبال باسمك، وسيارة بسائق خاص إلى وجهتك.</p>
          <fieldset className="arrival-airports">
            <legend>من أين نستقبلك؟</legend>
            <div>{AIRPORTS.map((item) => (
              <button key={item.id} type="button" aria-pressed={airport.id === item.id} onClick={() => setAirport(item)}>
                <bdi>{item.code}</bdi><span>{item.name}</span>
              </button>
            ))}</div>
          </fieldset>
          <a className="arrival-book" href={`${COMPANY_CONTACT.whatsappUrl}?text=${message}`} target="_blank" rel="noopener noreferrer">
            رتّب استقبالي <ArrowUpLeft size={20} aria-hidden="true" />
          </a>
          <span className="arrival-note">تأكيد التفاصيل والسعر مباشرة عبر واتساب</span>
        </div>
      </div>
    </section>
  );
}
