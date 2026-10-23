import "./globals.css";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionWrapper from "@/components/SessionWrapper";

export const metadata: Metadata = {
  title: "Dukart Systems – PC-Service, individuelle Builds & IT-Support",
  description: "Individuelle PC-Builds, Reparaturen & Upgrades, IT-Support und Webseiten für Privatkunden und Kleinunternehmen. Ehrlich, schnell, ohne versteckte Kosten.",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon.png",
  },
  openGraph: {
    title: "Dukart Systems – PC-Service, individuelle Builds & IT-Support",
    description: "Individuelle PC-Builds, Reparaturen, IT-Support und Webseiten. Persönlich, fair und professionell.",
    url: "https://dukartsystems.de",
    siteName: "Dukart Systems",
    locale: "de_DE",
    type: "website",
  },
  metadataBase: new URL("https://dukartsystems.de"),
  alternates: {
    canonical: "https://dukartsystems.de",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Dukart Systems",
    "url": "https://dukartsystems.de",
    "email": "kontakt@dukartsystems.de",
    "description": "Individuelle PC-Builds, PC-Reparatur, IT-Support und Webseiten für Privatkunden und kleine Unternehmen.",
    "serviceType": ["PC-Reparatur", "PC-Build", "IT-Support", "Webdesign"],
    "areaServed": "DE",
    "priceRange": "€€",
    "sameAs": ["https://www.instagram.com/dukartsystems/"],
  };

  return (
    <html lang="de" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-slate-950 text-white antialiased">
        <SessionWrapper session={session}>
          {children}
        </SessionWrapper>
      </body>
    </html>
  );
}