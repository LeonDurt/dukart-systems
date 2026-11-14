"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Check,
  Crown,
  Dices,
  MapPinOff,
  Package,
  Pencil,
  Share2,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { polygonAreaSqm, type LatLng } from "@/lib/fangen/geo";
import { LIMITS } from "@/lib/fangen/types";
import type { SessionProps } from "./GameClient";
import type { MapBox } from "./GameMap";
import Intro from "./Intro";
import { Button, Tag, cx } from "./ui";

const GameMap = dynamic(() => import("./GameMap"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-zinc-800" />,
});

const DURATIONS = [
  { value: 10, label: "10 Minuten (Testrunde)" },
  { value: 30, label: "30 Minuten" },
  { value: 60, label: "1 Stunde" },
  { value: 120, label: "2 Stunden" },
  { value: 180, label: "3 Stunden" },
  { value: 240, label: "4 Stunden" },
];
const LAST_COUNTS = [0, 1, 2, 3, 4, 5];
const LAST_MINUTES = [0, 5, 10, 15, 30, 45, 60];
const INTERVALS = [60, 120, 180, 300, 600];

function formatArea(sqm: number): string {
  if (sqm < 10_000) return `${Math.round(sqm / 100) * 100} m²`;
  if (sqm < 1_000_000) return `${(sqm / 10_000).toFixed(1).replace(".", ",")} ha`;
  return `${(sqm / 1_000_000).toFixed(1).replace(".", ",")} km²`;
}

export default function Lobby({ code, state, me, fix, geoError, offline, videoUrl, act, patch }: SessionProps) {
  const { game, players } = state;
  const isHost = me.isHost;

  // Der Host zeichnet auf einem lokalen Entwurf, damit ein Sync mitten im Zeichnen nichts zurücksetzt.
  const [draftZone, setDraftZone] = useState<LatLng[]>(game.zone);
  const [draftBoxes, setDraftBoxes] = useState<MapBox[]>(game.boxes);
  const [edit, setEdit] = useState<"zone" | "boxes" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const pending = useRef<Record<string, unknown>>({});

  const zone = isHost ? draftZone : game.zone;
  const boxes = isHost ? draftBoxes : game.boxes;
  const catchers = players.filter((p) => p.role === "CATCHER");

  function queueSave(body: Record<string, unknown>) {
    pending.current = { ...pending.current, ...body };
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(flushSave, 500);
  }

  async function flushSave() {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = null;
    const body = pending.current;
    pending.current = {};
    if (Object.keys(body).length === 0) return;
    try {
      await patch(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern hat nicht geklappt.");
    }
  }

  useEffect(
    () => () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    },
    []
  );

  const changeZone = (next: LatLng[]) => {
    setDraftZone(next);
    queueSave({ zone: next });
  };
  const changeBoxes = (next: MapBox[]) => {
    setDraftBoxes(next);
    queueSave({ boxes: next });
  };

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Das hat nicht geklappt.");
    }
  }

  const toggleCatcher = (playerId: string) =>
    run(() => {
      const ids = new Set(catchers.map((p) => p.id));
      if (ids.has(playerId)) ids.delete(playerId);
      else ids.add(playerId);
      return act("setCatchers", { playerIds: [...ids] });
    });

  const randomCatcher = () =>
    run(() => {
      const pick = players[Math.floor(Math.random() * players.length)];
      return act("setCatchers", { playerIds: [pick.id] });
    });

  async function invite() {
    const url = `${window.location.origin}/fangen/${code}`;
    const text = `Fangen in der ganzen Stadt: ${game.name}. Bist du dabei?`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "FANGEN", text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Teilen abgebrochen: nichts zu tun.
    }
  }

  async function start() {
    setStarting(true);
    await flushSave();
    await run(() => act("start"));
    setStarting(false);
  }

  const checks = [
    { ok: zone.length >= 3, label: zone.length >= 3 ? `Zone steht (${formatArea(polygonAreaSqm(zone))})` : "Zone einzeichnen" },
    {
      ok: boxes.length > 0,
      label: boxes.length > 0 ? `${boxes.length} ${boxes.length === 1 ? "Kiste" : "Kisten"} mit Leibchen` : "Kisten mit Leibchen setzen",
    },
    { ok: players.length >= 2, label: players.length >= 2 ? `${players.length} Leute sind da` : "Leute einladen" },
    {
      ok: catchers.length > 0 && catchers.length < players.length,
      label: catchers.length > 0 ? `${catchers.map((p) => p.name).join(", ")} fängt` : "Fänger einteilen",
    },
  ];
  const ready = checks.every((c) => c.ok);

  if (showRules) {
    return <Intro videoUrl={videoUrl} doneLabel="Zurück zur Lobby" onDone={() => setShowRules(false)} />;
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <div className="vest-stripes h-1.5" aria-hidden />
      <header className="safe-top px-5 pb-2">
        <p className="pt-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-400">Lobby</p>
        <h1 className="display mt-2 break-words text-4xl">{game.name}</h1>
      </header>

      {offline && (
        <p className="mx-5 mt-2 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
          Keine Verbindung. Die App versucht es weiter.
        </p>
      )}
      {(geoError === "denied" || geoError === "unsupported") && (
        <p className="mx-5 mt-2 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
          <MapPinOff className="mr-1 inline size-4" />
          {geoError === "denied"
            ? "Ohne Standort geht es nicht. Erlaube den Standort für diese Seite in den Einstellungen deines Browsers."
            : "Dein Browser kann keinen Standort liefern."}
        </p>
      )}

      {/* Einladen */}
      <section className="mx-5 mt-4 flex items-center gap-4 rounded-3xl border border-white/10 bg-zinc-900 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Spielcode</p>
          <p className="font-mono text-4xl font-black tracking-[0.15em] text-lime-400">{code}</p>
        </div>
        <Button onClick={invite} tone="ghost">
          {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
          {copied ? "Link kopiert" : "Einladen"}
        </Button>
      </section>

      {/* Karte */}
      <section
        className={cx(
          edit
            ? "fixed inset-0 z-40 flex flex-col bg-zinc-950"
            : "relative mx-5 mt-4 flex h-80 flex-col overflow-hidden rounded-3xl border border-white/10"
        )}
      >
        <div className="relative min-h-0 flex-1">
          <GameMap
            className="absolute inset-0"
            zone={zone}
            boxes={boxes}
            me={fix}
            meKind="neutral"
            edit={edit}
            onZoneChange={changeZone}
            onBoxesChange={changeBoxes}
            maxBoxes={LIMITS.maxBoxes}
            maxZonePoints={LIMITS.maxZonePoints}
          />
          {!edit && zone.length < 3 && (
            <p className="pointer-events-none absolute inset-x-4 bottom-4 z-[500] rounded-xl bg-zinc-950/85 px-3 py-2 text-center text-sm text-zinc-200">
              {isHost ? "Hier legst du gleich die Spielzone fest." : "Der Host zeichnet gerade die Zone ein."}
            </p>
          )}
        </div>

        {edit && (
          <div className="safe-bottom border-t border-white/10 bg-zinc-950 px-4 pt-3">
            <p className="text-sm text-zinc-300">
              {edit === "zone"
                ? "Tippe die Ecken der Zone nacheinander auf die Karte. Punkte lassen sich verschieben."
                : `Tippe auf die Karte, um eine Kiste abzustellen (höchstens ${LIMITS.maxBoxes}). Antippen entfernt sie wieder.`}
            </p>
            <div className="mt-3 flex gap-2">
              {edit === "zone" ? (
                <>
                  <Button tone="ghost" disabled={zone.length === 0} onClick={() => changeZone(zone.slice(0, -1))}>
                    <Undo2 className="size-4" /> Zurück
                  </Button>
                  <Button tone="ghost" disabled={zone.length === 0} onClick={() => changeZone([])}>
                    <Trash2 className="size-4" /> Neu
                  </Button>
                </>
              ) : (
                <Button tone="ghost" disabled={boxes.length === 0} onClick={() => changeBoxes([])}>
                  <Trash2 className="size-4" /> Alle weg
                </Button>
              )}
              <Button
                className="ml-auto"
                onClick={() => {
                  setEdit(null);
                  flushSave();
                }}
              >
                <Check className="size-4" /> Fertig
              </Button>
            </div>
          </div>
        )}
      </section>

      {isHost && (
        <div className="mx-5 mt-3 grid grid-cols-2 gap-2">
          <Button tone="ghost" onClick={() => setEdit("zone")}>
            <Pencil className="size-4" /> Zone zeichnen
          </Button>
          <Button tone="ghost" onClick={() => setEdit("boxes")}>
            <Package className="size-4" /> Kisten setzen
          </Button>
        </div>
      )}

      {/* Mitspieler */}
      <section className="mx-5 mt-6">
        <div className="flex items-end justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
            Dabei · {players.length}
          </h2>
          {isHost && players.length > 1 && (
            <button
              type="button"
              onClick={randomCatcher}
              className="inline-flex min-h-9 items-center gap-1.5 text-sm font-bold text-orange-400"
            >
              <Dices className="size-4" /> Fänger auslosen
            </button>
          )}
        </div>
        <ul className="mt-2 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900">
          {players.map((p) => (
            <li key={p.id} className="flex items-center gap-3 border-b border-white/5 px-4 py-2.5 last:border-0">
              <span
                className={cx(
                  "grid size-9 shrink-0 place-items-center rounded-full text-sm font-extrabold text-zinc-950",
                  p.role === "CATCHER" ? "bg-orange-500" : "bg-lime-400"
                )}
                aria-hidden
              >
                {p.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-1.5 font-bold">
                <span className="truncate">{p.name}</span>
                {p.id === me.id && <span className="text-xs font-medium text-zinc-500">du</span>}
                {p.isHost && <Crown className="size-3.5 shrink-0 text-yellow-400" aria-label="Host" />}
                {!p.gpsOk && <MapPinOff className="size-3.5 shrink-0 text-red-400" aria-label="Kein GPS" />}
              </span>
              {isHost ? (
                <>
                  <button
                    type="button"
                    aria-pressed={p.role === "CATCHER"}
                    onClick={() => toggleCatcher(p.id)}
                    className={cx(
                      "min-h-9 rounded-full px-3 text-xs font-bold uppercase tracking-wide transition",
                      p.role === "CATCHER" ? "bg-orange-500 text-zinc-950" : "border border-white/15 text-zinc-300"
                    )}
                  >
                    {p.role === "CATCHER" ? "Fängt" : "Läuft"}
                  </button>
                  {p.id !== me.id && (
                    <button
                      type="button"
                      aria-label={`${p.name} entfernen`}
                      onClick={() => run(() => act("kick", { playerId: p.id }))}
                      className="grid size-9 place-items-center rounded-full text-zinc-500 hover:bg-white/5 hover:text-white"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </>
              ) : (
                <Tag tone={p.role === "CATCHER" ? "catcher" : "runner"}>
                  {p.role === "CATCHER" ? "Fängt" : "Läuft"}
                </Tag>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Einstellungen */}
      <section className="mx-5 mt-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Spielregeln dieser Runde</h2>
        <div className="mt-2 divide-y divide-white/5 rounded-3xl border border-white/10 bg-zinc-900">
          <Setting
            label="Spieldauer"
            value={game.durationMinutes}
            options={DURATIONS}
            disabled={!isHost}
            onChange={(v) => run(() => patch({ durationMinutes: v }))}
          />
          <Setting
            label="Signal, sobald nur noch so viele frei sind"
            value={game.revealLastCount}
            options={LAST_COUNTS.map((v) => ({ value: v, label: v === 0 ? "Aus" : `${v} Läufer` }))}
            disabled={!isHost}
            onChange={(v) => run(() => patch({ revealLastCount: v }))}
          />
          <Setting
            label="Signal in den letzten Minuten"
            value={game.revealLastMinutes}
            options={LAST_MINUTES.map((v) => ({ value: v, label: v === 0 ? "Aus" : `${v} Minuten` }))}
            disabled={!isHost}
            onChange={(v) => run(() => patch({ revealLastMinutes: v }))}
          />
          <Setting
            label="Abstand zwischen zwei Signalen"
            value={game.revealIntervalSec}
            options={INTERVALS.map((v) => ({ value: v, label: `${v / 60} ${v === 60 ? "Minute" : "Minuten"}` }))}
            disabled={!isHost}
            onChange={(v) => run(() => patch({ revealIntervalSec: v }))}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowRules(true)}
          className="mt-3 text-sm font-bold text-zinc-400 underline underline-offset-4"
        >
          Regeln nochmal ansehen
        </button>
      </section>

      <div className="flex-1" />

      {/* Start */}
      <footer className="safe-bottom sticky bottom-0 mt-6 border-t border-white/10 bg-zinc-950/95 px-5 pt-3 backdrop-blur">
        {isHost ? (
          <>
            <ul className="mb-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {checks.map((c) => (
                <li key={c.label} className={cx("flex items-center gap-1.5", c.ok ? "text-zinc-300" : "text-zinc-500")}>
                  <span
                    className={cx(
                      "grid size-4 shrink-0 place-items-center rounded-full",
                      c.ok ? "bg-lime-400 text-zinc-950" : "border border-zinc-600"
                    )}
                  >
                    {c.ok && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className="truncate">{c.label}</span>
                </li>
              ))}
            </ul>
            {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
            <Button size="lg" className="w-full" disabled={!ready || starting} onClick={start}>
              {starting ? "Startet …" : "Spiel starten"}
            </Button>
          </>
        ) : (
          <p className="py-3 text-center text-zinc-400">
            {me.role === "CATCHER" ? (
              <>
                Du bist als <strong className="text-orange-400">Fänger</strong> eingeteilt. Zieh dein Leibchen an.
              </>
            ) : (
              "Gleich geht es los. Der Host startet das Spiel."
            )}
          </p>
        )}
      </footer>
    </main>
  );
}

function Setting({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  options: { value: number; label: string }[];
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <label className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
      <span className="text-sm text-zinc-300">{label}</span>
      {disabled ? (
        <span className="shrink-0 text-sm font-bold">{current?.label ?? value}</span>
      ) : (
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="min-h-10 shrink-0 rounded-xl border border-white/15 bg-zinc-800 px-2 text-sm font-bold text-white outline-none focus:border-lime-400"
        >
          {!current && <option value={value}>{value}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </label>
  );
}
