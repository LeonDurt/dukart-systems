"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LIMITS } from "@/lib/fangen/types";
import { api, store } from "./api";
import { Button, cx } from "./ui";

const inputClass =
  "min-h-14 w-full rounded-2xl border border-white/15 bg-zinc-950 px-4 text-lg text-white outline-none placeholder:text-zinc-600 focus:border-lime-400";

export default function StartForms() {
  const router = useRouter();
  const [mode, setMode] = useState<"join" | "create">("join");
  const [code, setCode] = useState("");
  const [gameName, setGameName] = useState("");
  const [hostName, setHostName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ code: string; token: string }>("/games", {
        body: { gameName, hostName },
      });
      store.setToken(res.code, res.token);
      store.setName(hostName.trim());
      router.push(`/fangen/${res.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Das hat nicht geklappt.");
      setBusy(false);
    }
  }

  function join(e: React.FormEvent) {
    e.preventDefault();
    const value = code.trim().toUpperCase();
    if (value) router.push(`/fangen/${value}`);
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-900 p-2">
      <div className="grid grid-cols-2 gap-1" role="tablist">
        {(["join", "create"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={cx(
              "min-h-11 rounded-2xl text-sm font-bold transition",
              mode === m ? "bg-white text-zinc-950" : "text-zinc-400 hover:bg-white/5"
            )}
          >
            {m === "join" ? "Ich habe einen Code" : "Spiel aufmachen"}
          </button>
        ))}
      </div>

      {mode === "join" ? (
        <form onSubmit={join} className="p-3">
          <label htmlFor="fangen-code" className="text-sm font-bold text-zinc-300">
            Spielcode
          </label>
          <input
            id="fangen-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            maxLength={8}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="K7XQ2"
            className={cx(inputClass, "mt-2 font-mono text-2xl font-black tracking-[0.2em]")}
          />
          <Button type="submit" size="lg" className="mt-3 w-full" disabled={code.trim().length < 4}>
            Beitreten
          </Button>
        </form>
      ) : (
        <form onSubmit={create} className="p-3">
          <label htmlFor="fangen-game-name" className="text-sm font-bold text-zinc-300">
            Wie heißt die Runde?
          </label>
          <input
            id="fangen-game-name"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            maxLength={LIMITS.gameNameLength}
            placeholder="Samstag in der Altstadt"
            className={cx(inputClass, "mt-2")}
          />
          <label htmlFor="fangen-host-name" className="mt-3 block text-sm font-bold text-zinc-300">
            Dein Name
          </label>
          <input
            id="fangen-host-name"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            maxLength={LIMITS.nameLength}
            autoComplete="nickname"
            placeholder="z. B. Leon"
            className={cx(inputClass, "mt-2")}
          />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <Button
            type="submit"
            size="lg"
            className="mt-3 w-full"
            disabled={busy || !gameName.trim() || !hostName.trim()}
          >
            {busy ? "Moment …" : "Spiel aufmachen"}
          </Button>
          <p className="mt-2 text-xs text-zinc-500">
            Du wirst Host: Du legst Zone, Kisten und Fänger fest und startest das Spiel.
          </p>
        </form>
      )}
    </div>
  );
}
