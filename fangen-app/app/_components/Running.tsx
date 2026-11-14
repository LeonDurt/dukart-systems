"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  BookOpen,
  Map as MapIcon,
  MapPinOff,
  MessagesSquare,
  Radio,
  Shirt,
  TriangleAlert,
  Users,
  WifiOff,
} from "lucide-react";
import { formatDistance, isOutsideZone, nearestBox } from "@/lib/geo";
import { LIMITS, type Channel } from "@/lib/types";
import Chat from "./Chat";
import type { SessionProps } from "./GameClient";
import type { MapPin } from "./GameMap";
import PlayerList from "./PlayerList";
import { RULES } from "./rules";
import { Button, Sheet, cx, formatClock } from "./ui";

const GameMap = dynamic(() => import("./GameMap"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-zinc-800" />,
});

type Tab = "map" | "players" | "chat" | "rules";
const TOAST_MS = 7000;

/** Hält den Bildschirm wach. Ein Browser darf den Standort nur melden, solange die Seite sichtbar ist. */
function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        if ("wakeLock" in navigator && document.visibilityState === "visible") {
          lock = await navigator.wakeLock.request("screen");
          if (cancelled) lock.release().catch(() => {});
        }
      } catch {
        // Akku fast leer oder nicht erlaubt: dann eben ohne.
      }
    };
    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      lock?.release().catch(() => {});
    };
  }, []);
}

export default function Running(props: SessionProps) {
  const { state, me, now, fix, geoError, messages, offline, act, sendChat } = props;
  const { game, players, endgame, events } = state;

  const [tab, setTab] = useState<Tab>("map");
  const [channel, setChannel] = useState<Channel>("CATCHERS");
  const [seenMessages, setSeenMessages] = useState(messages.length);
  const [confirmCaught, setConfirmCaught] = useState(false);
  const [caughtBy, setCaughtBy] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useWakeLock();

  const isCatcher = me.role === "CATCHER";
  const needsVest = isCatcher && !me.vestAt;
  const runners = players.filter((p) => p.role === "RUNNER");
  const catchers = players.filter((p) => p.role === "CATCHER");
  const remaining = (game.endsAt ?? now) - now;

  const outside = fix ? isOutsideZone([fix.lat, fix.lng], game.zone, fix.accuracy) : me.outsideZone;

  // Nächste Kiste für alle, die gerade gefangen wurden
  const target = useMemo(() => {
    if (!needsVest || !fix) return null;
    const near = nearestBox([fix.lat, fix.lng], game.boxes);
    if (!near) return null;
    return { index: game.boxes.indexOf(near.box), label: near.box.label, distance: near.distance };
  }, [needsVest, fix, game.boxes]);
  const atBox = !fix || (target !== null && target.distance <= LIMITS.vestRadiusMeters + Math.min(fix.accuracy, 100));

  const pins = useMemo<MapPin[]>(() => {
    const list: MapPin[] = [];
    for (const p of players) {
      if (p.pos) {
        list.push({ id: p.id, name: p.name, kind: p.vestAt ? "catcher" : "catcher-novest", ...p.pos });
      }
      if (p.reveal) list.push({ id: `${p.id}-signal`, name: p.name, kind: "signal", ...p.reveal });
    }
    return list;
  }, [players]);

  // Neuestes Ereignis kurz einblenden und das Handy vibrieren lassen
  const latestEvent = events[0] ?? null;
  const toast = latestEvent && now - latestEvent.at < TOAST_MS ? latestEvent : null;
  const lastEventId = useRef(latestEvent?.id ?? 0);
  useEffect(() => {
    if (!latestEvent || latestEvent.id === lastEventId.current) return;
    lastEventId.current = latestEvent.id;
    navigator.vibrate?.(latestEvent.type === "signal" || latestEvent.type === "endgame" ? [200, 100, 200] : 150);
  }, [latestEvent]);

  const unread = tab === "chat" ? 0 : Math.max(0, messages.length - seenMessages);

  function switchTab(next: Tab) {
    setSeenMessages(messages.length);
    setTab(next);
  }

  async function run(action: () => Promise<void>, after?: () => void) {
    setBusy(true);
    setError(null);
    try {
      await action();
      after?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Das hat nicht geklappt.");
    } finally {
      setBusy(false);
    }
  }

  const signalIn = endgame.nextSignalAt ? Math.max(0, endgame.nextSignalAt - now) : null;
  const tabs: { id: Tab; label: string; icon: typeof MapIcon }[] = [
    { id: "map", label: "Karte", icon: MapIcon },
    { id: "players", label: "Spieler", icon: Users },
    { id: "chat", label: "Chat", icon: MessagesSquare },
    { id: "rules", label: "Regeln", icon: BookOpen },
  ];

  return (
    <main className="mx-auto flex h-dvh max-w-lg flex-col overflow-hidden">
      {/* Kopf: Rolle, Uhr, wie viele noch frei sind */}
      <header
        className={cx(
          "safe-top flex items-center justify-between gap-3 px-4 pb-2",
          isCatcher ? "bg-orange-500 text-zinc-950" : "bg-lime-400 text-zinc-950"
        )}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-70">Du bist</p>
          <p className="display mt-1.5 text-2xl">{isCatcher ? "Fänger" : "Läufer"}</p>
        </div>
        <div className="text-center" aria-live="off">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-70">Restzeit</p>
          <p className="mt-1 text-3xl font-black tabular-nums leading-none tracking-tight">{formatClock(remaining)}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-70">Noch frei</p>
          <p className="display mt-1.5 text-2xl tabular-nums">
            {runners.length}
            <span className="text-base opacity-60"> / {players.length}</span>
          </p>
        </div>
      </header>

      {/* Hinweise, das Dringendste zuerst */}
      <div className="flex flex-col" aria-live="assertive">
        {outside && (
          <p className="fg-alarm flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white">
            <TriangleAlert className="size-5 shrink-0" /> Du bist außerhalb der Zone. Sofort zurück!
          </p>
        )}
        {offline && (
          <p className="flex items-center gap-2 bg-red-900 px-4 py-2 text-sm text-red-100">
            <WifiOff className="size-4 shrink-0" /> Keine Verbindung. Die App versucht es weiter.
          </p>
        )}
        {geoError && (
          <p className="flex items-center gap-2 bg-red-900 px-4 py-2 text-sm text-red-100">
            <MapPinOff className="size-4 shrink-0" />
            {geoError === "denied"
              ? "Standort ist nicht erlaubt. Ohne Standort spielst du nicht fair."
              : "Kein GPS Signal. Geh ins Freie."}
          </p>
        )}
        {endgame.active && signalIn !== null && (
          <p className="flex items-center gap-2 bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-950">
            <Radio className="size-4 shrink-0" />
            {isCatcher
              ? `Endphase. Nächstes Signal in ${formatClock(signalIn)}`
              : `Endphase. In ${formatClock(signalIn)} sehen die Fänger deinen Standort.`}
          </p>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        {/* Die Karte bleibt immer eingehängt, damit sie beim Tabwechsel nicht neu lädt. */}
        <div className={cx("absolute inset-0", tab !== "map" && "invisible")}>
          <GameMap
            className="absolute inset-0"
            zone={game.zone}
            boxes={game.boxes}
            me={fix}
            meKind={isCatcher ? "catcher" : "runner"}
            pins={pins}
            targetBox={target?.index ?? null}
            now={now}
          />

          {toast && (
            <p
              key={toast.id}
              className="fg-rise absolute inset-x-3 top-3 z-[600] mr-14 rounded-2xl bg-zinc-950/90 px-4 py-3 text-sm font-bold text-white shadow-xl"
            >
              {toast.text}
            </p>
          )}

          <div className="safe-bottom absolute inset-x-0 bottom-0 z-[600] bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-transparent px-4 pt-10">
            {error && <p className="mb-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white">{error}</p>}
            {!isCatcher && (
              <Button
                tone="catcher"
                size="lg"
                className="w-full text-xl uppercase tracking-tight"
                onClick={() => {
                  setCaughtBy(null);
                  setConfirmCaught(true);
                }}
              >
                Ich wurde gefangen
              </Button>
            )}
            {needsVest && (
              <div className="rounded-3xl bg-zinc-900 p-4 shadow-xl ring-1 ring-white/10">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
                  Auf direktem Weg zur Kiste
                </p>
                <p className="mt-1 text-lg font-extrabold">
                  {target
                    ? `${target.label} · noch ${formatDistance(target.distance)}`
                    : "Geh zur nächsten Kiste auf der Karte"}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  Du fängst erst mit, wenn du ein Leibchen trägst.
                </p>
                <Button
                  tone="catcher"
                  size="lg"
                  className="mt-3 w-full"
                  disabled={busy || !atBox}
                  onClick={() =>
                    run(() => act("vest", fix ? { lat: fix.lat, lng: fix.lng, accuracy: fix.accuracy } : {}))
                  }
                >
                  <Shirt className="size-5" /> {atBox ? "Leibchen angezogen" : "Noch nicht an der Kiste"}
                </Button>
              </div>
            )}
            {isCatcher && !needsVest && (
              <p className="rounded-2xl bg-zinc-900/90 px-4 py-3 text-center text-sm text-zinc-300 ring-1 ring-white/10">
                {pins.some((p) => p.kind === "signal")
                  ? "Rote Punkte zeigen, wo die letzten Läufer beim Signal waren."
                  : "Orange Punkte sind die anderen Fänger. Läufer siehst du erst beim Signal."}
              </p>
            )}
          </div>
        </div>

        {tab === "players" && (
          <div className="absolute inset-0 overflow-y-auto bg-zinc-950">
            <PlayerList players={players} me={me} act={act} />
            {me.isHost && (
              <div className="px-4 pb-6">
                <Button tone="ghost" className="w-full" onClick={() => setConfirmEnd(true)}>
                  Spiel vorzeitig beenden
                </Button>
              </div>
            )}
          </div>
        )}

        {tab === "chat" && (
          <div className="absolute inset-0 bg-zinc-950">
            <Chat
              messages={messages}
              events={events}
              meId={me.id}
              isCatcher={isCatcher}
              channel={channel}
              onChannel={setChannel}
              onSend={sendChat}
            />
          </div>
        )}

        {tab === "rules" && (
          <div className="absolute inset-0 overflow-y-auto bg-zinc-950 px-5 py-4">
            <ol className="space-y-5">
              {RULES.map((rule) => (
                <li key={rule.title} className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-orange-500 text-zinc-950">
                    <rule.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-extrabold">{rule.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-400">{rule.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <nav className="safe-bottom grid grid-cols-4 border-t border-white/10 bg-zinc-950 pt-1" aria-label="Ansicht">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-current={tab === id ? "page" : undefined}
            onClick={() => switchTab(id)}
            className={cx(
              "relative flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-bold",
              tab === id ? "text-white" : "text-zinc-500"
            )}
          >
            <Icon className="size-5" />
            {label}
            {id === "chat" && unread > 0 && (
              <span className="absolute right-[calc(50%-1.4rem)] top-0.5 grid min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[11px] font-black text-zinc-950">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        ))}
      </nav>

      <Sheet open={confirmCaught} onClose={() => setConfirmCaught(false)} title="Wurdest du wirklich gefangen?">
        <p className="text-sm text-zinc-400">
          Das lässt sich nicht zurücknehmen. Du wirst zum Fänger, holst dir an der nächsten Kiste ein Leibchen
          und kommst in den Fänger Chat.
        </p>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">Wer hat dich erwischt?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {catchers.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={caughtBy === p.id}
              onClick={() => setCaughtBy(caughtBy === p.id ? null : p.id)}
              className={cx(
                "min-h-10 rounded-full px-4 text-sm font-bold transition",
                caughtBy === p.id ? "bg-orange-500 text-zinc-950" : "border border-white/15 text-zinc-200"
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2 pb-2">
          <Button tone="ghost" size="lg" onClick={() => setConfirmCaught(false)}>
            Doch nicht
          </Button>
          <Button
            tone="catcher"
            size="lg"
            disabled={busy}
            onClick={() =>
              run(
                () => act("caught", caughtBy ? { playerId: caughtBy } : {}),
                () => {
                  setConfirmCaught(false);
                  setChannel("CATCHERS");
                }
              )
            }
          >
            Ja, gefangen
          </Button>
        </div>
      </Sheet>

      <Sheet open={confirmEnd} onClose={() => setConfirmEnd(false)} title="Spiel für alle beenden?">
        <p className="text-sm text-zinc-400">Das Spiel endet sofort ohne Sieger.</p>
        <div className="mt-5 grid grid-cols-2 gap-2 pb-2">
          <Button tone="ghost" size="lg" onClick={() => setConfirmEnd(false)}>
            Weiterspielen
          </Button>
          <Button tone="danger" size="lg" disabled={busy} onClick={() => run(() => act("end"))}>
            Beenden
          </Button>
        </div>
      </Sheet>
    </main>
  );
}
