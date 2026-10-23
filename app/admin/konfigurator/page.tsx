"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type BuildRow = {
  id: string;
  useCase: string;
  budget: string;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  cooling: string;
  pcCase: string;
  psu: string;
  priceRange: string;
  servicePrice: string;
  note: string;
};

const USE_CASES = [
  { id: "gaming", label: "Gaming" },
  { id: "office", label: "Office & Alltag" },
  { id: "video", label: "Video & Kreativ" },
  { id: "allround", label: "Allround" },
  { id: "repair", label: "Reparatur / Upgrade" },
];

const BUDGETS = [
  { id: "low", label: "Bis 500 €" },
  { id: "mid", label: "500 – 900 €" },
  { id: "high", label: "900 – 1.500 €" },
  { id: "ultra", label: "Über 1.500 €" },
];

const FIELDS: { key: keyof BuildRow; label: string; hint?: string }[] = [
  { key: "priceRange", label: "Preisspanne (Teile)", hint: "z.B. 450 – 550 €" },
  { key: "servicePrice", label: "Servicekosten", hint: "z.B. ab 99 €" },
  { key: "cpu", label: "Prozessor (CPU)" },
  { key: "gpu", label: "Grafikkarte (GPU)" },
  { key: "ram", label: "Arbeitsspeicher (RAM)" },
  { key: "storage", label: "Speicher" },
  { key: "cooling", label: "Kühlung" },
  { key: "pcCase", label: "Gehäuse" },
  { key: "psu", label: "Netzteil" },
  { key: "note", label: "Beschreibung / Hinweis" },
];

export default function AdminKonfiguratorPage() {
  const [builds, setBuilds] = useState<BuildRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeUseCase, setActiveUseCase] = useState("gaming");
  const [edited, setEdited] = useState<Record<string, Partial<BuildRow>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/konfigurator");
    if (res.ok) setBuilds(await res.json());
    setLoading(false);
  }

  async function seedDefaults() {
    if (!confirm("Alle Felder mit den Standardwerten überschreiben?")) return;
    setSeeding(true);
    await fetch("/api/admin/konfigurator", { method: "PUT" });
    await load();
    setEdited({});
    setSeedDone(true);
    setSeeding(false);
    setTimeout(() => setSeedDone(false), 3000);
  }

  function getKey(useCase: string, budget: string) {
    return `${useCase}_${budget}`;
  }

  function getBuild(useCase: string, budget: string): Partial<BuildRow> {
    const key = getKey(useCase, budget);
    const fromDb = builds.find((b) => b.useCase === useCase && b.budget === budget) ?? {};
    return { ...fromDb, ...edited[key] };
  }

  function handleChange(useCase: string, budget: string, field: keyof BuildRow, value: string) {
    const key = getKey(useCase, budget);
    setEdited((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  async function saveBuild(useCase: string, budget: string) {
    const key = getKey(useCase, budget);
    const current = getBuild(useCase, budget);
    setSaving(key);
    const res = await fetch("/api/admin/konfigurator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ useCase, budget, ...current }),
    });
    if (res.ok) {
      const updated = await res.json();
      setBuilds((prev) => {
        const without = prev.filter((b) => !(b.useCase === useCase && b.budget === budget));
        return [...without, updated];
      });
      setEdited((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    }
    setSaving(null);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/orders"
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
            >
              ←
            </Link>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">PC-Konfigurator Preise</h1>
              <p className="mt-1 text-sm text-slate-400">Komponenten & Preisangaben für den öffentlichen PC-Konfigurator anpassen</p>
            </div>
          </div>
          <button
            onClick={seedDefaults}
            disabled={seeding}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 transition hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            {seeding ? "Lädt..." : "Standardwerte laden"}
          </button>
        </div>

        {seedDone && (
          <div className="mb-5 rounded-2xl border border-green-400/20 bg-green-400/10 px-4 py-3 text-sm text-green-300">
            Standardwerte wurden geladen.
          </div>
        )}

        <div className="mb-2 rounded-2xl border border-cyan-400/10 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-200/70">
          Tipp: Beim ersten Besuch auf "Standardwerte laden" klicken — dann sind alle Felder vorausgefüllt und du kannst direkt anpassen.
        </div>

        {/* UseCase Tabs */}
        <div className="mt-5 mb-6 flex flex-wrap gap-2">
          {USE_CASES.map((uc) => (
            <button
              key={uc.id}
              onClick={() => setActiveUseCase(uc.id)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeUseCase === uc.id
                  ? "bg-cyan-300 text-slate-950"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:text-white"
              }`}
            >
              {uc.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Lädt...</p>
        ) : (
          <div className="space-y-5">
            {BUDGETS.map((b) => {
              const key = getKey(activeUseCase, b.id);
              const build = getBuild(activeUseCase, b.id);
              const isDirty = !!edited[key] && Object.keys(edited[key]).length > 0;

              return (
                <div
                  key={b.id}
                  className={`rounded-3xl border p-6 transition ${
                    isDirty ? "border-cyan-400/30 bg-cyan-400/5" : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold">{b.label}</h2>
                    <div className="flex items-center gap-2">
                      {saved === key && (
                        <span className="text-xs text-green-400">Gespeichert ✓</span>
                      )}
                      {isDirty && (
                        <span className="text-xs text-cyan-400">Nicht gespeichert</span>
                      )}
                      <button
                        onClick={() => saveBuild(activeUseCase, b.id)}
                        disabled={saving === key}
                        className="rounded-xl bg-cyan-300 px-4 py-1.5 text-sm font-medium text-slate-950 transition hover:scale-[1.02] disabled:opacity-50"
                      >
                        {saving === key ? "Speichert..." : "Speichern"}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {FIELDS.map((f) => (
                      <div key={f.key} className={f.key === "note" ? "sm:col-span-2" : ""}>
                        <label className="mb-1.5 block text-xs text-slate-400">{f.label}</label>
                        {f.key === "note" ? (
                          <textarea
                            rows={2}
                            value={(build[f.key] as string) ?? ""}
                            onChange={(e) => handleChange(activeUseCase, b.id, f.key, e.target.value)}
                            placeholder={f.hint}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-300"
                          />
                        ) : (
                          <input
                            type="text"
                            value={(build[f.key] as string) ?? ""}
                            onChange={(e) => handleChange(activeUseCase, b.id, f.key, e.target.value)}
                            placeholder={f.hint}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-300"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
