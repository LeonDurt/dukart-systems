"use client";

import { useState } from "react";
import { Crown, MapPinOff, Shirt } from "lucide-react";
import type { PlayerDto } from "@/lib/fangen/types";
import { Button, Sheet, Tag, formatTime } from "./ui";

/** Spielerliste im laufenden Spiel. Der Host kann über die Zeilen nachhelfen. */
export default function PlayerList({
  players,
  me,
  act,
}: {
  players: PlayerDto[];
  me: PlayerDto;
  act: (type: string, extra?: Record<string, unknown>) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selected = players.find((p) => p.id === selectedId) ?? null;
  const runners = players.filter((p) => p.role === "RUNNER");
  const catchers = players.filter((p) => p.role === "CATCHER");

  async function run(type: string, playerId: string) {
    setError(null);
    try {
      await act(type, { playerId });
      setSelectedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Das hat nicht geklappt.");
    }
  }

  const row = (p: PlayerDto) => {
    const content = (
      <>
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-extrabold ${
            p.role === "CATCHER" ? "bg-orange-500 text-zinc-950" : "bg-lime-400 text-zinc-950"
          }`}
          aria-hidden
        >
          {p.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="truncate">{p.name}</span>
            {p.id === me.id && <span className="text-xs font-medium text-zinc-500">du</span>}
            {p.isHost && <Crown className="size-3.5 shrink-0 text-yellow-400" aria-label="Host" />}
          </span>
          <span className="mt-0.5 flex flex-wrap gap-1">
            {p.role === "CATCHER" && !p.vestAt && (
              <Tag tone="muted">
                <Shirt className="size-3" /> holt Leibchen
              </Tag>
            )}
            {p.caughtAt && <Tag tone="catcher">gefangen {formatTime(p.caughtAt)}</Tag>}
            {p.firstCatcher && <Tag tone="catcher">erster Fänger</Tag>}
            {p.outsideZone && <Tag tone="warn">außerhalb der Zone</Tag>}
            {!p.gpsOk && (
              <Tag tone="warn">
                <MapPinOff className="size-3" /> kein GPS
              </Tag>
            )}
          </span>
        </span>
      </>
    );
    const className = "flex w-full items-center gap-3 px-4 py-3";
    return (
      <li key={p.id} className="border-b border-white/5 last:border-0">
        {me.isHost && p.id !== me.id ? (
          <button type="button" className={`${className} active:bg-white/5`} onClick={() => setSelectedId(p.id)}>
            {content}
          </button>
        ) : (
          <div className={className}>{content}</div>
        )}
      </li>
    );
  };

  return (
    <div className="pb-4">
      <h2 className="px-4 pb-1 pt-4 text-xs font-bold uppercase tracking-[0.2em] text-lime-400">
        Noch frei · {runners.length}
      </h2>
      <ul>{runners.map(row)}</ul>
      {runners.length === 0 && <p className="px-4 py-3 text-sm text-zinc-500">Niemand mehr.</p>}

      <h2 className="px-4 pb-1 pt-6 text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
        Fänger · {catchers.length}
      </h2>
      <ul>{catchers.map(row)}</ul>

      {me.isHost && (
        <p className="px-4 pt-4 text-xs text-zinc-500">
          Als Host kannst du einen Namen antippen, um nachzuhelfen.
        </p>
      )}

      <Sheet open={selected !== null} onClose={() => setSelectedId(null)} title={selected?.name ?? ""}>
        {selected && (
          <div className="flex flex-col gap-2 pb-2">
            {selected.role === "RUNNER" && (
              <Button tone="catcher" size="lg" onClick={() => run("markCaught", selected.id)}>
                Als gefangen eintragen
              </Button>
            )}
            {selected.role === "CATCHER" && !selected.vestAt && (
              <Button tone="catcher" size="lg" onClick={() => run("vest", selected.id)}>
                Leibchen bestätigen
              </Button>
            )}
            <Button tone="ghost" size="lg" onClick={() => run("kick", selected.id)}>
              Aus dem Spiel entfernen
            </Button>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        )}
      </Sheet>
    </div>
  );
}
