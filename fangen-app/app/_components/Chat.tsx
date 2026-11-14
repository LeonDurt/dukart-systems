"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import type { Channel, EventDto, MessageDto } from "@/lib/types";
import { cx, formatTime } from "./ui";

type Line =
  | { kind: "message"; key: string; at: number; message: MessageDto }
  | { kind: "event"; key: string; at: number; event: EventDto };

export default function Chat({
  messages,
  events,
  meId,
  isCatcher,
  channel,
  onChannel,
  onSend,
}: {
  messages: MessageDto[];
  events: EventDto[];
  meId: string;
  isCatcher: boolean;
  channel: Channel;
  onChannel: (channel: Channel) => void;
  onSend: (channel: Channel, text: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const active: Channel = isCatcher ? channel : "ALL";

  // Im Kanal für alle laufen die Spielereignisse mit, damit es eine einzige Zeitleiste gibt.
  const lines = useMemo<Line[]>(() => {
    const list: Line[] = messages
      .filter((m) => m.channel === active)
      .map((m) => ({ kind: "message", key: `m${m.id}`, at: m.at, message: m }));
    if (active === "ALL") {
      for (const e of events) list.push({ kind: "event", key: `e${e.id}`, at: e.at, event: e });
    }
    return list.sort((a, b) => a.at - b.at);
  }, [messages, events, active]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines.length, active]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSend(active, value);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Senden hat nicht geklappt.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {isCatcher && (
        <div className="grid grid-cols-2 gap-1 border-b border-white/10 p-2" role="tablist">
          {(["CATCHERS", "ALL"] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={active === c}
              onClick={() => onChannel(c)}
              className={cx(
                "min-h-10 rounded-xl text-sm font-bold transition",
                active === c
                  ? c === "CATCHERS"
                    ? "bg-orange-500 text-zinc-950"
                    : "bg-white text-zinc-950"
                  : "text-zinc-400 hover:bg-white/5"
              )}
            >
              {c === "CATCHERS" ? "Fänger Chat" : "Alle"}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {lines.length === 0 && (
          <p className="px-4 pt-10 text-center text-sm text-zinc-500">
            {active === "CATCHERS"
              ? "Hier sprechen sich die Fänger ab. Läufer können nicht mitlesen."
              : "Noch nichts los. Schreib die erste Nachricht."}
          </p>
        )}
        {lines.map((line) =>
          line.kind === "event" ? (
            <p key={line.key} className="mx-auto max-w-[85%] rounded-xl bg-white/5 px-3 py-1.5 text-center text-xs text-zinc-300">
              {line.event.text} <span className="text-zinc-500">{formatTime(line.at)}</span>
            </p>
          ) : (
            <div
              key={line.key}
              className={cx("flex", line.message.playerId === meId ? "justify-end" : "justify-start")}
            >
              <div
                className={cx(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-[15px] leading-snug",
                  line.message.playerId === meId
                    ? active === "CATCHERS"
                      ? "rounded-br-md bg-orange-500 text-zinc-950"
                      : "rounded-br-md bg-lime-400 text-zinc-950"
                    : "rounded-bl-md bg-zinc-800 text-zinc-100"
                )}
              >
                {line.message.playerId !== meId && (
                  <p className="text-xs font-bold text-zinc-400">{line.message.name}</p>
                )}
                <p className="whitespace-pre-wrap break-words">{line.message.text}</p>
                <p className="mt-0.5 text-right text-[10px] opacity-60">{formatTime(line.at)}</p>
              </div>
            </div>
          )
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="px-4 pb-1 text-xs text-red-400">{error}</p>}
      <form onSubmit={submit} className="flex gap-2 border-t border-white/10 p-2">
        <label className="sr-only" htmlFor="fangen-chat-input">
          Nachricht
        </label>
        <input
          id="fangen-chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={400}
          autoComplete="off"
          enterKeyHint="send"
          placeholder={active === "CATCHERS" ? "Nachricht an die Fänger" : "Nachricht an alle"}
          className="min-h-11 flex-1 rounded-xl border border-white/10 bg-zinc-900 px-3 text-base text-white outline-none placeholder:text-zinc-500 focus:border-white/40"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          aria-label="Senden"
          className="grid size-11 place-items-center rounded-xl bg-white text-zinc-950 transition active:scale-95 disabled:opacity-30"
        >
          <Send className="size-5" />
        </button>
      </form>
    </div>
  );
}
