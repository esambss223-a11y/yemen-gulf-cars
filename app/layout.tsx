import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ygcarss.com"),
  title: "شركة اليمن والخليج لتأجير السيارات | أسطول السيارات الفاخرة",
  description: "شركة اليمن والخليج لتأجير السيارات الفارهة والاقتصادية في مصر - أسطول حديث، خدمات توصيل واستقبال مطار، تعاقدات يومية وشهرية بأفضل الأسعار.",
  alternates: {
    canonical: "https://ygcarss.com",
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=2" },
      { url: "/icon.png?v=2", sizes: "64x64", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png?v=2", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    title: "شركة اليمن والخليج لتأجير السيارات",
    description: "أرقى أسطول سيارات فاخرة وحديثة للإيجار اليومي والأسبوعي والشهري مع خدمات التوصيل للمطار.",
    url: "https://ygcarss.com",
    siteName: "شركة اليمن والخليج لتأجير السيارات",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "شعار شركة اليمن والخليج لتأجير السيارات",
      },
      {
        url: "/logo2.png",
        width: 1945,
        height: 808,
        alt: "شعار شركة اليمن والخليج",
      },
    ],
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "شركة اليمن والخليج لتأجير السيارات",
    description: "أرقى أسطول سيارات فاخرة وحديثة للإيجار في مصر",
    images: ["/og-image.png"],
  },
};

import { FleetProvider } from "@/context/FleetContext";

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
      <body className="min-h-full flex flex-col font-arabic bg-[#060b17] text-slate-100">
        <FleetProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </FleetProvider>
      </body>
    </html>
  );
}


