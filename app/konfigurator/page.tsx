"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Cpu, Gamepad2, Briefcase, Video, Wrench, CheckCircle } from "lucide-react";
import { DEFAULT_BUILDS, type BuildConfig } from "@/lib/configurator-defaults";

type UseCase = "gaming" | "office" | "video" | "allround" | "repair";
type Budget = "low" | "mid" | "high" | "ultra";

const useCases = [
  {
    id: "gaming" as UseCase,
    icon: Gamepad2,
    label: "Gaming",
    desc: "Für flüssiges Gaming, hohe FPS und maximale Performance in aktuellen Spielen.",
  },
  {
    id: "office" as UseCase,
    icon: Briefcase,
    label: "Office & Alltag",
    desc: "Surfen, Office-Programme, E-Mails – zuverlässig und sparsam.",
  },
  {
    id: "video" as UseCase,
    icon: Video,
    label: "Video & Kreativ",
    desc: "Videobearbeitung, Streaming, Grafik – leistungsstark und schnell.",
  },
  {
    id: "allround" as UseCase,
    icon: Cpu,
    label: "Allround",
    desc: "Für alles geeignet – Gaming, Office und mehr in einem ausgewogenen System.",
  },
  {
    id: "repair" as UseCase,
    icon: Wrench,
    label: "PC reparieren / upgraden",
    desc: "Dein aktueller PC ist langsam oder kaputt? Wir helfen dir weiter.",
  },
];

const budgets = [
  { id: "low" as Budget, label: "Bis 500 €", desc: "Solide Office & Alltagsleistung" },
  { id: "mid" as Budget, label: "500 – 900 €", desc: "Gutes Preis-Leistungs-Verhältnis" },
  { id: "high" as Budget, label: "900 – 1.500 €", desc: "High-Performance für anspruchsvolle Nutzer" },
  { id: "ultra" as Budget, label: "Über 1.500 €", desc: "Top-Ausstattung ohne Kompromisse" },
];


export default function KonfiguratorPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [builds, setBuilds] = useState<Record<string, Record<string, BuildConfig>>>(DEFAULT_BUILDS);

  useEffect(() => {
    fetch("/api/konfigurator")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object") setBuilds(data);
      })
      .catch(() => {}); // Bei Fehler: Standardwerte bleiben
  }, []);

  const build =
    selectedUseCase && selectedBudget ? builds[selectedUseCase]?.[selectedBudget] ?? null : null;

  const isRepair = selectedUseCase === "repair";

  function getContactSubject(): string {
    if (!selectedUseCase) return "PC-Service & Reparatur";
    const map: Record<UseCase, string> = {
      gaming: "Individueller PC-Build",
      office: "Individueller PC-Build",
      video: "Individueller PC-Build",
      allround: "Individueller PC-Build",
      repair: "PC-Service & Reparatur",
    };
    return map[selectedUseCase];
  }

  function getContactMessage(): string {
    if (!build || !selectedUseCase || !selectedBudget) return "";
    const ucLabel = useCases.find((u) => u.id === selectedUseCase)?.label ?? "";
    const budgetLabel = budgets.find((b) => b.id === selectedBudget)?.label ?? "";
    if (isRepair) {
      return `Ich interessiere mich für eine PC-Reparatur / ein Upgrade.\n\nBudget: ${budgetLabel}\n\nGeschätzter Aufwand laut Konfigurator: ${build.priceRange}\n\nBitte meldet euch bei mir für weitere Details.`;
    }
    return `Ich interessiere mich für einen ${ucLabel}-PC.\n\nBudget: ${budgetLabel}\nGeschätzte Konfiguration:\n- CPU: ${build.cpu}\n- GPU: ${build.gpu}\n- RAM: ${build.ram}\n- Speicher: ${build.storage}\n\nGeschätzter Preis: ${build.priceRange}\n\nBitte meldet euch bei mir für weitere Details.`;
  }

  const contactUrl = build
    ? `/?subject=${encodeURIComponent(getContactSubject())}&message=${encodeURIComponent(getContactMessage())}#kontakt`
    : "/#kontakt";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_30%)]" />

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Webseite
          </Link>
          <div className="text-sm font-semibold tracking-wide text-white">PC-Konfigurator</div>
          <Link
            href="/#kontakt"
            className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:scale-105"
          >
            Anfrage
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Fortschrittsanzeige */}
        <div className="mb-10 flex items-center justify-center gap-3">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${
                  step > s
                    ? "bg-cyan-300 text-slate-950"
                    : step === s
                    ? "border-2 border-cyan-300 text-cyan-300"
                    : "border border-white/20 text-slate-500"
                }`}
              >
                {step > s ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`h-px w-12 sm:w-20 ${step > s ? "bg-cyan-300" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Schritt 1: Verwendungszweck */}
        {step === 1 && (
          <div>
            <div className="mb-8 text-center">
              <div className="mb-2 inline-block rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-300">
                Schritt 1 von 3
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">Wofür brauchst du den PC?</h1>
              <p className="mt-3 text-slate-300">Wähle den Verwendungszweck — wir zeigen dir dann die passende Konfiguration.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {useCases.map((uc) => {
                const Icon = uc.icon;
                return (
                  <button
                    key={uc.id}
                    onClick={() => { setSelectedUseCase(uc.id); setStep(2); }}
                    className={`group rounded-3xl border p-6 text-left transition hover:scale-[1.02] ${
                      selectedUseCase === uc.id
                        ? "border-cyan-300/50 bg-cyan-300/10"
                        : "border-white/10 bg-white/5 hover:border-cyan-300/30 hover:bg-white/10"
                    }`}
                  >
                    <div className="mb-4 inline-flex rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold">{uc.label}</h3>
                    <p className="mt-2 text-sm text-slate-400">{uc.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Schritt 2: Budget */}
        {step === 2 && (
          <div>
            <div className="mb-8 text-center">
              <div className="mb-2 inline-block rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-300">
                Schritt 2 von 3
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">
                {isRepair ? "Wie hoch ist dein Budget?" : "Was ist dein Budget?"}
              </h1>
              <p className="mt-3 text-slate-300">
                {isRepair
                  ? "Je nach Budget können wir unterschiedlich viel reparieren oder upgraden."
                  : "Wir finden für jedes Budget die beste Lösung."}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {budgets.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { setSelectedBudget(b.id); setStep(3); }}
                  className={`group rounded-3xl border p-6 text-left transition hover:scale-[1.02] ${
                    selectedBudget === b.id
                      ? "border-cyan-300/50 bg-cyan-300/10"
                      : "border-white/10 bg-white/5 hover:border-cyan-300/30 hover:bg-white/10"
                  }`}
                >
                  <div className="text-2xl font-bold text-cyan-300">{b.label}</div>
                  <p className="mt-2 text-sm text-slate-400">{b.desc}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="mt-6 flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Zurück
            </button>
          </div>
        )}

        {/* Schritt 3: Ergebnis */}
        {step === 3 && build && (
          <div>
            <div className="mb-8 text-center">
              <div className="mb-2 inline-block rounded-full border border-green-400/30 bg-green-400/10 px-4 py-1 text-sm text-green-300">
                Deine Konfiguration
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">
                {isRepair ? "Empfehlung für deine Reparatur" : `Dein ${useCases.find((u) => u.id === selectedUseCase)?.label}-PC`}
              </h1>
              <p className="mt-3 text-slate-300">{build.note}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Komponenten */}
              {!isRepair && (
                <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h2 className="mb-5 text-lg font-semibold">Komponenten</h2>
                  <div className="space-y-3">
                    {[
                      { label: "Prozessor (CPU)", value: build.cpu },
                      { label: "Grafikkarte (GPU)", value: build.gpu },
                      { label: "Arbeitsspeicher (RAM)", value: build.ram },
                      { label: "Speicher", value: build.storage },
                      { label: "Kühlung", value: build.cooling },
                      { label: "Gehäuse", value: build.pcCase },
                      { label: "Netzteil", value: build.psu },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-4 rounded-2xl border border-white/5 bg-slate-900/60 px-4 py-3">
                        <span className="text-sm text-slate-400">{item.label}</span>
                        <span className="text-right text-sm font-medium text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-slate-500">
                    * Die genauen Teile werden gemeinsam mit dir festgelegt. Das ist eine Richtkonfiguration basierend auf deinen Angaben.
                  </p>
                </div>
              )}

              {isRepair && (
                <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h2 className="mb-5 text-lg font-semibold">Was wir machen würden</h2>
                  <div className="space-y-3">
                    {[
                      { label: "Diagnose & Maßnahme", value: build.cpu },
                      { label: "Grafik", value: build.gpu },
                      { label: "Arbeitsspeicher", value: build.ram },
                      { label: "Speicher", value: build.storage },
                      { label: "Kühlung", value: build.cooling },
                      { label: "Netzteil", value: build.psu },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-4 rounded-2xl border border-white/5 bg-slate-900/60 px-4 py-3">
                        <span className="text-sm text-slate-400">{item.label}</span>
                        <span className="text-right text-sm font-medium text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preisbox + CTA */}
              <div className="space-y-4">
                <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-6">
                  <p className="text-xs uppercase tracking-widest text-cyan-400">Geschätzter Preis</p>
                  <p className="mt-2 text-3xl font-bold text-cyan-300">{build.priceRange}</p>
                  <p className="mt-1 text-xs text-slate-500">Richtwert · finale Preise können variieren</p>
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <p className="text-xs uppercase tracking-widest text-slate-500">Servicekosten</p>
                    <p className="mt-1 text-lg font-semibold text-white">{build.servicePrice}</p>
                    <p className="text-xs text-slate-500">Einmalig für Beratung, Zusammenbau & Einrichtung</p>
                  </div>
                </div>

                <a
                  href={contactUrl}
                  className="flex w-full items-center justify-center gap-2 rounded-3xl bg-cyan-300 px-6 py-4 font-semibold text-slate-950 shadow-xl transition hover:scale-[1.02]"
                >
                  Jetzt unverbindlich anfragen
                  <ArrowRight className="h-4 w-4" />
                </a>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-xs text-slate-400">
                  Kostenlose Erstberatung · Kein Risiko · Du entscheidest
                </div>

                <div className="rounded-2xl border border-yellow-400/15 bg-yellow-400/5 p-4 text-xs text-yellow-200/70">
                  <strong className="text-yellow-300">Hinweis:</strong> Alle Preisangaben sind Richtwerte basierend auf aktuellen Marktpreisen. Die tatsächlichen Kosten können je nach Verfügbarkeit und Marktlage variieren. Den genauen Preis besprechen wir gemeinsam in der kostenlosen Beratung.
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setStep(2); setSelectedBudget(null); }}
                className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> Budget ändern
              </button>
              <button
                onClick={() => { setStep(1); setSelectedUseCase(null); setSelectedBudget(null); }}
                className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> Von vorne beginnen
              </button>
            </div>
          </div>
        )}
      </div>

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
