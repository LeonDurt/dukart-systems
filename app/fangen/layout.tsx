import type { Metadata, Viewport } from "next";
import "./fangen.css";

export const metadata: Metadata = {
  title: { default: "FANGEN. Das Stadtspiel", template: "%s · FANGEN" },
  description:
    "Vier Stunden, eine Zone, ein Fänger. Triff dich mit Leuten aus deiner Umgebung und spielt Fangen in der ganzen Stadt.",
  manifest: "/fangen/manifest.webmanifest",
  icons: { icon: "/fangen/icon.svg", apple: "/fangen/icon.svg" },
  appleWebApp: { capable: true, title: "FANGEN", statusBarStyle: "black-translucent" },
  alternates: { canonical: "/fangen" },
  openGraph: {
    title: "FANGEN. Das Stadtspiel",
    description: "Vier Stunden, eine Zone, ein Fänger. Bist du dabei?",
    url: "/fangen",
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

export default function FangenLayout({ children }: { children: React.ReactNode }) {
  return <div className="fangen min-h-dvh bg-zinc-950 text-zinc-100">{children}</div>;
}
