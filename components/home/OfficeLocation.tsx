'use client';

import { COMPANY_CONTACT } from '@/lib/company-contact';
import Image from 'next/image';
import { useState } from 'react';
import { ArrowUpRight, ExternalLink, Hand, MapPin, MessageCircle, Navigation, Phone } from 'lucide-react';
import { OFFICE_LOCATION } from '@/lib/office-location';

export default function OfficeLocation() {
  const [interactive, setInteractive] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <section id="our-location" aria-labelledby="office-location-title" className="w-full scroll-mt-20 border-t border-white/5 bg-[#060b17] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
          <div>
            <span className="mb-2 block text-xs font-semibold tracking-widest text-[#c5a059]">قريبون منك</span>
            <h2 id="office-location-title" className="text-3xl font-black tracking-tight text-white sm:text-4xl">تفضّل بزيارتنا</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">تعرّف على موقع مقرنا، وخطّط لزيارتك بكل سهولة.</p>
          </div>
          <a href={OFFICE_LOCATION.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-[#e4c785] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c5a059]">
            عرض الموقع على خرائط Google <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>

        <div className="grid overflow-hidden rounded-2xl border border-[#c5a059]/20 bg-[#0a1222] lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex min-w-0 flex-col justify-center p-6 sm:p-9 lg:p-10">
            <Image src="/logo2.png" alt="شركة اليمن والخليج لتأجير السيارات" width={1945} height={808} sizes="180px" className="mb-7 h-auto w-44 max-w-full object-contain" />
            <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-[#c5a059]/20 bg-[#c5a059]/10 px-3 py-1.5 text-[11px] font-bold text-[#e4c785]"><MapPin size={14} aria-hidden="true" /> المقر الرئيسي</span>
            <h3 className="text-xl font-extrabold text-white sm:text-2xl">{OFFICE_LOCATION.name}</h3>
            <address className="mt-3 text-sm not-italic leading-8 text-slate-300">{OFFICE_LOCATION.address}</address>
            <a href={COMPANY_CONTACT.phoneHref} className="mt-5 inline-flex min-h-11 w-fit items-center gap-3 text-sm text-slate-300 transition-colors hover:text-white"><Phone size={16} className="text-[#c5a059]" aria-hidden="true" /><bdi>{COMPANY_CONTACT.displayPhone}</bdi></a>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <a href={OFFICE_LOCATION.directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#c5a059] px-4 py-3 text-xs font-black text-[#060b17] transition-colors hover:bg-[#d4af37] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><Navigation size={17} aria-hidden="true" /> الاتجاهات إلى مقرنا</a>
              <a href={COMPANY_CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-xs font-bold text-white transition-colors hover:border-[#c5a059]/50 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c5a059]"><MessageCircle size={17} aria-hidden="true" /> تواصل معنا واتساب</a>
            </div>
          </div>

          <div className="flex min-w-0 flex-col border-t border-white/10 lg:border-t-0 lg:border-r">
            <div className="relative isolate min-h-[300px] flex-1 overflow-hidden bg-[#e6e9df] sm:min-h-[380px]" aria-label="خريطة موقع الشركة">
              {!loaded && <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#576247]">
                <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true"><path d="M0 90H600M0 290H600M140 0V400M450 0V400M0 400L600 0" stroke="white" strokeWidth="28" fill="none" /><path d="M0 190H600M300 0V400" stroke="#acb99c" strokeWidth="3" fill="none" /></svg>
                <MapPin size={40} className="relative" aria-hidden="true" /><span className="relative text-xs font-bold">جارٍ تحميل خريطة المقر…</span>
              </div>}
              <iframe id="office-location-map" title="موقع شركة اليمن والخليج على خرائط Google" src={OFFICE_LOCATION.embedUrl} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"
                tabIndex={interactive ? 0 : -1} onLoad={() => setLoaded(true)}
                className={`absolute inset-0 h-full w-full border-0 ${interactive ? 'pointer-events-auto' : 'pointer-events-none'}`} />
              <div className="pointer-events-none absolute inset-x-3 bottom-7 flex justify-center">
                <button type="button" onClick={() => setInteractive((value) => !value)} aria-pressed={interactive} aria-controls="office-location-map"
                  className="pointer-events-auto inline-flex min-h-11 touch-pan-y items-center justify-center gap-2 rounded-full border border-white/20 bg-[#081225]/95 px-5 py-3 text-xs font-bold text-white shadow-lg transition-colors hover:bg-[#15213a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c5a059]">
                  <Hand size={16} className="shrink-0 text-[#e4c785]" aria-hidden="true" />{interactive ? 'إنهاء التفاعل مع الخريطة' : 'تفاعل مع الخريطة'}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a1222] px-5 py-4 text-[11px] leading-6 text-slate-400">
              <p role="status">{interactive ? 'يمكنك تحريك الخريطة وتكبيرها. أنهِ التفاعل لمتابعة تمرير الصفحة.' : 'اضغط للتفاعل مع الخريطة، أو افتح الاتجاهات مباشرة.'}</p>
              <a href={OFFICE_LOCATION.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 shrink-0 items-center gap-1.5 font-bold text-[#e4c785] hover:text-white">فتح الخريطة <ExternalLink size={13} aria-hidden="true" /></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
