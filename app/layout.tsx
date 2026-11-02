import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingActions from "@/components/layout/FloatingActions";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#060b17",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://ygcarss.com"),
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "شركة اليمن والخليج للسيارات",
  },
  title: "تأجير سيارات فاخرة في مصر | شركة اليمن والخليج (مطار القاهرة وحدائق أكتوبر)",
  description: "أرقى أسطول سيارات 2026 للإيجار اليومي والشهري في القاهرة والجيزة. خدمة استقبال مطار القاهرة وسفنكس مع سائق خاص VIP، عقود موثقة وتسليم فوري بباب إقامتك.",
  keywords: [
    "تأجير سيارات مصر",
    "إيجار سيارات فارهة القاهرة",
    "تأجير سيارات مرسيدس مصر",
    "إيجار سيارة مع سائق مطار القاهرة",
    "ليموزين مطار القاهرة الدولي",
    "استقبال مطار سفنكس VIP",
    "تأجير سيارات حدائق أكتوبر",
    "إيجار سيارات الشيخ زايد",
    "تأجير سيارات لرجال الأعمال في مصر",
    "تأجير سيارات للخليجيين في مصر",
    "شركة اليمن والخليج لتأجير السيارات"
  ],
  alternates: {
    canonical: "https://ygcarss.com",
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=3" },
      { url: "/icon.png?v=3", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png?v=3", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "شركة اليمن والخليج لتأجير وتوريد السيارات | أسطول النخبة 2026",
    description: "أرقى أسطول سيارات فاخرة وحديثة للإيجار اليومي والأسبوعي والشهري مع خدمات التوصيل والمطار في مصر والخليج.",
    url: "https://ygcarss.com",
    siteName: "شركة اليمن والخليج لتأجير وتوريد السيارات",
    images: [
      {
        url: "/og-image.png?v=3",
        width: 1200,
        height: 630,
        alt: "شعار شركة اليمن والخليج لتأجير وتوريد السيارات",
      },
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "شركة اليمن والخليج لتأجير وتوريد السيارات",
      },
    ],
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "شركة اليمن والخليج لتأجير وتوريد السيارات",
    description: "أرقى أسطول سيارات فاخرة وحديثة للإيجار في مصر والخليج",
    images: ["/og-image.png?v=3"],
  },
};

import { FleetProvider } from "@/context/FleetContext";

const jsonLdSchemas = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AutoRental",
      "@id": "https://ygcarss.com/#autorental",
      "name": "شركة اليمن والخليج لتأجير وتوريد السيارات",
      "alternateName": ["اليمن والخليج لتأجير السيارات", "Yemen & Gulf Cars", "YGCars"],
      "url": "https://ygcarss.com",
      "logo": "https://ygcarss.com/logo-512.webp",
      "image": "https://ygcarss.com/og-image.png",
      "telephone": "+201117461373",
      "priceRange": "$$$$",
      "currenciesAccepted": "EGP, USD, SAR, AED",
      "paymentAccepted": "Cash, Credit Card, Bank Transfer",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "حدائق أكتوبر",
        "addressLocality": "الجيزة",
        "addressRegion": "محافظة الجيزة",
        "postalCode": "12573",
        "addressCountry": "EG"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 29.9327,
        "longitude": 31.0564
      },
      "hasMap": "https://www.google.com/maps?cid=45157466133356522",
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          "opens": "00:00",
          "closes": "23:59"
        }
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "bestRating": "5",
        "worstRating": "1",
        "ratingCount": "194"
      },
      "areaServed": [
        { "@type": "City", "name": "القاهرة" },
        { "@type": "City", "name": "الجيزة" },
        { "@type": "City", "name": "حدائق أكتوبر" },
        { "@type": "City", "name": "الشيخ زايد" },
        { "@type": "City", "name": "التجمع الخامس" },
        { "@type": "AdministrativeArea", "name": "مطار القاهرة الدولي CAI" },
        { "@type": "AdministrativeArea", "name": "مطار سفنكس الدولي SPX" }
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://ygcarss.com/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "ما هي الأوراق المطلوبة لتأجير سيارة في مصر للزوار والخليجيين؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "جواز سفر ساري، رخصة قيادة دولية أو خليجية سارية، وتأشيرة الدخول. يتم إبرام عقد رسمي موثق وتسليم فوري للمركبة بدون تعقيدات."
          }
        },
        {
          "@type": "Question",
          "name": "هل توفر شركة اليمن والخليج خدمة استقبال وتوصيل مطار القاهرة ومطار سفنكس؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "نعم، نوفر خدمة استقبال VIP بسائق خاص على مدار 24 ساعة في صالات كبار الزوار بمطار القاهرة الدولي (CAI) ومطار سفنكس (SPX) مع لوحة اسم شخصية ومساعدة كاملة في الأمتعة."
          }
        },
        {
          "@type": "Question",
          "name": "هل تشمل سيارات الأسطول عقوداً يومية وشهرية مع الصيانة والتأمين؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "نعم، تتوفر خيارات تأجير يومي وأسبوعي وشهري مع تأمين شامل وفحص دوري وضمان سيارة بديلة فورية 24/7 لأي ظرف طارئ."
          }
        },
        {
          "@type": "Question",
          "name": "أين يقع المقر الرئيسي لشركة اليمن والخليج في مصر؟",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "يقع المقر الرئيسي في حدائق أكتوبر بمحافظة الجيزة، مع تغطية شاملة لتسليم السيارات في القاهرة الكبرى والشيخ زايد والتجمع الخامس ومطارات الجمهورية."
          }
        }
      ]
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchemas) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-arabic bg-[#060b17] text-slate-100">
        <FleetProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <FloatingActions />
          <Footer />
        </FleetProvider>
      </body>
    </html>
  );
}


