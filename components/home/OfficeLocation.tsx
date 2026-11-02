'use client';

import { useState } from 'react';
import { ArrowUpLeft, Navigation, Phone, Hand, MapPin } from 'lucide-react';
import { COMPANY_CONTACT } from '@/lib/company-contact';
import { OFFICE_LOCATION } from '@/lib/office-location';
import './office-location.css';

export default function OfficeLocation() {
  const [interactive, setInteractive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return (
    <section id="our-location" className="office-destination" aria-labelledby="office-location-title">
      <div className="office-destination-inner">
        <div className="office-heading">
          <div><span className="office-kicker">نلتقي في حدائق أكتوبر</span><h2 id="office-location-title">وجهتك القادمة، <span>عندنا.</span></h2></div>
          <p>تفضّل بزيارتنا، ودعنا نساعدك تختار سيارتك.</p>
        </div>
        <div className="office-stage">
          <div className="office-map" aria-label="خريطة موقع الشركة">
            {!loaded && <div className="office-map-loading" role="status"><MapPin size={28} aria-hidden="true" /><span>جارٍ تحميل موقعنا…</span></div>}
            <iframe id="office-location-map" title="موقع شركة اليمن والخليج على خرائط Google" src={OFFICE_LOCATION.embedUrl} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" tabIndex={interactive ? 0 : -1} onLoad={() => setLoaded(true)} style={{ pointerEvents: interactive ? 'auto' : 'none' }} />
            <button className="office-map-toggle" type="button" onClick={() => setInteractive(value => !value)} aria-pressed={interactive} aria-controls="office-location-map"><Hand size={15} aria-hidden="true" />{interactive ? 'إنهاء التفاعل' : 'استكشف الخريطة'}</button>
          </div>
          <div className="office-pass">
            <div className="office-pass-top"><span>المقر الرئيسي</span><MapPin size={20} aria-hidden="true" /></div>
            <span className="office-city">حدائق<br />أكتوبر.</span>
            <div className="office-pass-details"><h3>{OFFICE_LOCATION.name}</h3><address>{OFFICE_LOCATION.address}</address></div>
            <a className="office-directions" href={OFFICE_LOCATION.directionsUrl} target="_blank" rel="noopener noreferrer"><Navigation size={17} aria-hidden="true" /> خذني إلى المقر <ArrowUpLeft size={19} aria-hidden="true" /></a>
            <a className="office-call" href={COMPANY_CONTACT.phoneHref}><Phone size={15} aria-hidden="true" /><bdi>{COMPANY_CONTACT.displayPhone}</bdi></a>
          </div>
        </div>
        <div className="office-bottom"><p role="status">{interactive ? 'حرّك الخريطة لاستكشاف المنطقة، أو أنهِ التفاعل لمتابعة التمرير.' : 'افتح الاتجاهات لبدء رحلتك، أو تواصل معنا لترتيب زيارتك.'}</p><a href={COMPANY_CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer">رتّب زيارتك عبر واتساب <ArrowUpLeft size={15} aria-hidden="true" /></a></div>
      </div>
    </section>
  );
}
