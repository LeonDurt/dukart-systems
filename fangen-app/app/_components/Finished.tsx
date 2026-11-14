"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Trophy } from "lucide-react";
import type { SessionProps } from "./GameClient";
import { Button, cx, formatDuration } from "./ui";

export default function Finished({ state, me, act }: SessionProps) {
  const { game, players } = state;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const startedAt = game.startedAt ?? 0;
  const finishedAt = game.finishedAt ?? startedAt;
  const catches = new Map<string, number>();
  for (const p of players) {
    if (p.caughtById) catches.set(p.caughtById, (catches.get(p.caughtById) ?? 0) + 1);
  }

  // Wer am längsten frei war, steht oben. Die ersten Fänger zählen über ihre Fänge.
  const ranking = players
    .map((p) => ({
      player: p,
      free: p.firstCatcher ? 0 : (p.caughtAt ?? finishedAt) - startedAt,
      survived: p.role === "RUNNER",
      catches: catches.get(p.id) ?? 0,
    }))
    .sort((a, b) => Number(b.survived) - Number(a.survived) || b.free - a.free || b.catches - a.catches);

  const iWon = game.winner !== null && (game.winner === "RUNNER" ? me.role === "RUNNER" : me.role === "CATCHER");
  const headline =
    game.winner === "CATCHER" ? "Alle gefangen" : game.winner === "RUNNER" ? "Zeit ist um" : "Abgebrochen";
  const subline =
    game.winner === "CATCHER"
      ? `Die Fänger gewinnen nach ${formatDuration(finishedAt - startedAt)}.`
      : game.winner === "RUNNER"
        ? `${ranking.filter((r) => r.survived).length} haben es bis zum Schluss geschafft.`
        : "Der Host hat das Spiel vorzeitig beendet.";

  async function rematch() {
    setBusy(true);
    setError(null);
    try {
      await act("rematch");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Das hat nicht geklappt.");
      setBusy(false);
    }
  }

  return (
    <main className="safe-bottom mx-auto flex min-h-dvh max-w-lg flex-col">
      <header
        className={cx(
          "safe-top px-5 pb-8",
          game.winner === "CATCHER" ? "bg-orange-500 text-zinc-950" : game.winner === "RUNNER" ? "bg-lime-400 text-zinc-950" : "bg-zinc-800"
        )}
      >
        <p className="pt-4 text-xs font-bold uppercase tracking-[0.2em] opacity-70">{game.name}</p>
        <h1 className="display mt-3 text-6xl">{headline}</h1>
        <p className="mt-3 text-lg font-bold">{subline}</p>
        {game.winner && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-bold text-white">
            <Trophy className="size-4" /> {iWon ? "Du hast gewonnen" : "Diesmal nicht. Revanche?"}
          </p>
        )}
      </header>

      <section className="px-5 pt-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Auswertung</h2>
        <ol className="mt-2 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900">
          {ranking.map(({ player, free, survived, catches: count }, index) => (
            <li key={player.id} className="flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-0">
              <span className="w-6 text-center font-mono text-sm font-bold text-zinc-500">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="truncate">{player.name}</span>
                  {player.id === me.id && <span className="text-xs font-medium text-zinc-500">du</span>}
                  {player.isHost && <Crown className="size-3.5 shrink-0 text-yellow-400" aria-label="Host" />}
                </span>
                <span className="text-sm text-zinc-400">
                  {player.firstCatcher
                    ? "Erster Fänger"
                    : survived
                      ? "Bis zum Schluss frei"
                      : `${formatDuration(free)} frei`}
                </span>
              </span>
              {count > 0 && (
                <span className="shrink-0 rounded-full bg-orange-500/20 px-2.5 py-1 text-xs font-bold text-orange-300">
                  {count} {count === 1 ? "Fang" : "Fänge"}
                </span>
              )}
              {survived && game.winner === "RUNNER" && <Trophy className="size-5 shrink-0 text-lime-400" />}
            </li>
          ))}
        </ol>
      </section>

      <div className="flex-1" />

      <footer className="px-5 pb-3 pt-6">
        {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
        {me.isHost ? (
          <Button size="lg" className="w-full" disabled={busy} onClick={rematch}>
            Neue Runde mit allen
          </Button>
        ) : (
          <p className="text-center text-sm text-zinc-400">Bleib hier. Startet der Host eine neue Runde, bist du direkt drin.</p>
        )}
        <Link href="/" className="mt-4 block text-center text-sm font-bold text-zinc-400 underline underline-offset-4">
          Zur Startseite
        </Link>
      </footer>
    </main>
  );
}
