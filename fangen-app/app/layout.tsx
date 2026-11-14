import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "FANGEN. Das Stadtspiel", template: "%s · FANGEN" },
  description:
    "Vier Stunden, eine Zone, ein Fänger. Triff dich mit Leuten aus deiner Umgebung und spielt Fangen in der ganzen Stadt.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "FANGEN", statusBarStyle: "black-translucent" },
  openGraph: {
    title: "FANGEN. Das Stadtspiel",
    description: "Vier Stunden, eine Zone, ein Fänger. Bist du dabei?",
    siteName: "FANGEN",
    locale: "de_DE",
    type: "website",
  },
  // Prototyp: noch nicht in Suchmaschinen.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="fangen min-h-dvh bg-zinc-950 text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
