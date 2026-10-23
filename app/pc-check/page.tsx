import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle, Clock, ShieldCheck, Cpu, Thermometer, HardDrive, Wifi, AlertTriangle, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Kostenloser PC-Check | Dukart Systems",
  description:
    "Dein PC ist langsam, stürzt ab oder macht Probleme? Dukart Systems bietet einen kostenlosen PC-Check – schnell, ehrlich und ohne versteckte Kosten. Jetzt Termin anfragen.",
  keywords: [
    "kostenloser PC-Check",
    "PC Diagnose",
    "PC langsam",
    "PC reparieren",
    "IT Service",
    "PC abstürze",
    "Computer Check",
    "Dukart Systems",
    "PC Hilfe",
  ],
  openGraph: {
    title: "Kostenloser PC-Check – Dukart Systems",
    description:
      "Dein PC hat Probleme? Wir schauen kostenlos drauf. Schnelle Diagnose, ehrliche Einschätzung, faire Preise.",
    type: "website",
  },
};

const symptoms = [
  { icon: Clock, text: "PC startet langsam oder braucht ewig zum Hochfahren" },
  { icon: AlertTriangle, text: "Abstürze, Bluescreens oder Einfrieren" },
  { icon: Thermometer, text: "PC wird sehr heiß oder die Lüfter sind ständig laut" },
  { icon: HardDrive, text: "Festplatte macht komische Geräusche oder ist voll" },
  { icon: Wifi, text: "WLAN oder Internet macht Probleme" },
  { icon: Cpu, text: "PC ist generell langsam geworden" },
];

const checkItems = [
  "Systemzustand & Windows-Version",
  "Festplatte / SSD auf Fehler prüfen",
  "Arbeitsspeicher-Belastung analysieren",
  "Temperatur-Check (CPU, GPU, System)",
  "Startprogramme & unnötige Prozesse",
  "Viren & Malware-Schnellcheck",
  "Treiber & Windows-Updates",
  "Ehrliche Einschätzung: Lohnt sich eine Reparatur?",
];

const faqs = [
  {
    q: "Ist der PC-Check wirklich kostenlos?",
    a: "Ja. Wir schauen uns deinen PC kostenlos an und sagen dir ehrlich, was das Problem ist. Du entscheidest dann, ob du etwas reparieren lassen möchtest.",
  },
  {
    q: "Was passiert nach dem Check?",
    a: "Du bekommst eine klare Einschätzung: Was ist das Problem, was würde es kosten, es zu beheben – und ob es sich lohnt. Keine versteckten Kosten.",
  },
  {
    q: "Muss ich meinen PC vorbeibringen?",
    a: "Das kommt drauf an. Viele Diagnosen können wir auch per Fernzugriff durchführen. Bei Hardware-Problemen ist ein kurzer Vor-Ort-Termin sinnvoll.",
  },
  {
    q: "Wie schnell bekomme ich einen Termin?",
    a: "In der Regel innerhalb von 1–3 Tagen. Schreib uns einfach eine Anfrage und wir melden uns sehr schnell.",
  },
  {
    q: "Gilt das auch für ältere PCs?",
    a: "Ja, natürlich. Gerade bei alten Geräten kann oft schon ein einfaches Upgrade (z.B. SSD) enorm viel bringen.",
  },
];

export default function PcCheckPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.09),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.09),transparent_30%)]" />

      {/* JSON-LD strukturierte Daten für Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Kostenloser PC-Check",
            provider: {
              "@type": "LocalBusiness",
              name: "Dukart Systems",
              email: "kontakt@dukartsystems.de",
              url: "https://dukartsystems.de",
            },
            description:
              "Kostenlose PC-Diagnose: Wir prüfen Festplatte, RAM, Temperatur, Viren und mehr – ehrlich und ohne versteckte Kosten.",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "EUR",
              description: "Kostenloser Erst-Check",
            },
          }),
        }}
      />

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
            ← Zurück zur Webseite
          </Link>
          <Link href="/" className="text-sm font-semibold tracking-wide text-white">
            Dukart Systems
          </Link>
          <Link
            href="/#kontakt"
            className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:scale-105"
          >
            Anfrage
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <div className="mb-4 inline-block rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-300">
          Kostenlos · Schnell · Ehrlich
        </div>
        <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
          Kostenloser{" "}
          <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
            PC-Check
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
          Dein PC ist langsam, stürzt ab oder macht Probleme? Wir schauen kostenlos drauf –
          ehrliche Diagnose, klare Einschätzung, faire Preise. Nur wenn du möchtest, wird repariert.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/#kontakt"
            className="group flex items-center gap-2 rounded-2xl bg-cyan-300 px-8 py-3.5 font-semibold text-slate-950 shadow-xl transition hover:scale-105"
          >
            Jetzt kostenlos anfragen
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
          <Link
            href="/konfigurator"
            className="rounded-2xl border border-white/20 bg-white/5 px-8 py-3.5 font-medium text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
          >
            PC-Konfigurator
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Keine Anfahrtskosten für Ferndiagnose · Antwort in der Regel sehr schnell
        </p>
      </section>

      {/* Erkennst du dich wieder? */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Erkennst du eines dieser Probleme?</h2>
          <p className="mt-3 text-slate-400">Wenn ja, dann ist ein kostenloser PC-Check genau das Richtige.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {symptoms.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.text}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-300/20"
              >
                <div className="mt-0.5 shrink-0 rounded-xl border border-red-400/20 bg-red-400/10 p-2 text-red-300">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm text-slate-300">{s.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Was wir prüfen */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/5 p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Was wir beim PC-Check prüfen</h2>
            <p className="mt-2 text-slate-400">Alles was wichtig ist – strukturiert und ohne Fachchinesisch.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {checkItems.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-cyan-300" />
                <span className="text-sm text-slate-200">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wie es abläuft */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">So läuft der Check ab</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { step: "1", title: "Anfrage stellen", desc: "Kurz beschreiben was das Problem ist – per Formular, E-Mail oder einfach kurz melden." },
            { step: "2", title: "Diagnose", desc: "Wir prüfen deinen PC – per Fernzugriff oder kurzen Vor-Ort-Termin. Komplett kostenlos." },
            { step: "3", title: "Klare Einschätzung", desc: "Du bekommst eine ehrliche Aussage: Was ist das Problem, was kostet es – und ob es sich lohnt." },
          ].map((item) => (
            <div key={item.step} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-cyan-300 text-xl font-bold text-cyan-300">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Warum Dukart */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Kein Verkaufsdruck", desc: "Wir verkaufen dir nichts was du nicht brauchst. Der Check ist wirklich kostenlos." },
            { icon: Clock, title: "Schnelle Hilfe", desc: "Keine langen Wartezeiten. Wir melden uns schnell und helfen direkt." },
            { icon: CheckCircle, title: "Direkt & persönlich", desc: "Du sprichst direkt mit uns – kein Callcenter, keine Weiterleitungen." },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="mb-3 inline-flex rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Häufige Fragen zum PC-Check</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-semibold text-white">{faq.q}</h3>
              <p className="mt-2 text-sm text-slate-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 to-blue-400/5 p-10 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Bereit für den kostenlosen Check?</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            Kein Risiko, keine Kosten. Einfach kurz anfragen – wir melden uns schnell bei dir.
          </p>
          <Link
            href="/#kontakt"
            className="group mt-8 inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-8 py-4 font-semibold text-slate-950 shadow-xl transition hover:scale-105"
          >
            Kostenlos anfragen
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
          <p className="mt-4 text-sm text-slate-500">
            oder per E-Mail:{" "}
            <a href="mailto:kontakt@dukartsystems.de" className="text-cyan-400 hover:underline">
              kontakt@dukartsystems.de
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-5xl px-6 py-6 text-center text-sm text-slate-500">
          © 2026 Dukart Systems ·{" "}
          <Link href="/impressum" className="hover:text-cyan-300">Impressum</Link> ·{" "}
          <Link href="/datenschutz" className="hover:text-cyan-300">Datenschutz</Link> ·{" "}
          <Link href="/agb" className="hover:text-cyan-300">AGB</Link> ·{" "}
          <Link href="/widerruf" className="hover:text-cyan-300">Widerruf</Link>
        </div>
      </footer>
    </div>
  );
}
