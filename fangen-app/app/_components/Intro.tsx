"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Pause, Play } from "lucide-react";
import { RULES } from "./rules";
import { Button, cx } from "./ui";

const SLIDE_MS = 7000;

/**
 * Das Erklärstück vor dem ersten Spiel. Läuft wie eine Story von selbst durch:
 * links tippen geht zurück, rechts tippen geht weiter, gedrückt halten pausiert.
 * Ist ein echtes Video hinterlegt (FANGEN_VIDEO_URL), läuft das zuerst.
 */
export default function Intro({
  videoUrl,
  doneLabel,
  onDone,
}: {
  videoUrl?: string | null;
  doneLabel: string;
  onDone: () => void;
}) {
  const [showVideo, setShowVideo] = useState(Boolean(videoUrl));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const last = index === RULES.length - 1;

  useEffect(() => {
    if (showVideo || paused || last) return;
    const id = window.setTimeout(() => setIndex((i) => Math.min(i + 1, RULES.length - 1)), SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [index, paused, last, showVideo]);

  if (showVideo && videoUrl) {
    return (
      <div className="safe-top safe-bottom flex min-h-dvh flex-col bg-black px-4">
        <p className="py-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
          Erst schauen, dann laufen
        </p>
        <div className="flex flex-1 items-center">
          <video
            src={videoUrl}
            controls
            playsInline
            autoPlay
            className="max-h-[70dvh] w-full rounded-2xl bg-zinc-900"
            onEnded={() => setShowVideo(false)}
          />
        </div>
        <Button tone="ghost" size="lg" className="my-3 w-full" onClick={() => setShowVideo(false)}>
          Weiter zu den Regeln <ChevronRight className="size-5" />
        </Button>
      </div>
    );
  }

  const rule = RULES[index];
  const Icon = rule.icon;

  return (
    <div className="safe-top safe-bottom relative flex min-h-dvh flex-col overflow-hidden bg-zinc-950 px-5">
      <div className="vest-stripes absolute inset-x-0 top-0 h-1.5" aria-hidden />

      {/* Fortschritt */}
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {RULES.map((_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
            <div
              key={i === index ? `run-${index}` : "idle"}
              className="h-full origin-left bg-white"
              style={
                i < index || (i === index && last)
                  ? undefined
                  : i === index
                    ? {
                        animation: `fg-story ${SLIDE_MS}ms linear forwards`,
                        animationPlayState: paused ? "paused" : "running",
                      }
                    : { transform: "scaleX(0)" }
              }
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
        <span>
          Regel {index + 1} von {RULES.length}
        </span>
        <button
          type="button"
          className="relative z-20 flex items-center gap-1 rounded-full px-2 py-1 text-zinc-300"
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
          {paused ? "Weiter" : "Pause"}
        </button>
      </div>

      {/* Tippflächen: links zurück, rechts weiter */}
      <button
        type="button"
        aria-label="Vorherige Regel"
        className="absolute inset-y-0 left-0 z-10 w-1/3"
        onClick={() => setIndex((i) => Math.max(0, i - 1))}
      />
      <button
        type="button"
        aria-label="Nächste Regel"
        className={cx("absolute inset-y-0 right-0 z-10 w-2/3", last && "hidden")}
        onClick={() => setIndex((i) => Math.min(RULES.length - 1, i + 1))}
      />

      <div key={index} className="fg-rise flex flex-1 flex-col justify-center pb-10" aria-live="polite">
        <div className="grid size-20 place-items-center rounded-3xl bg-orange-500 text-zinc-950">
          <Icon className="size-10" strokeWidth={2.25} />
        </div>
        <h1 className="display mt-8 text-[2.75rem] text-white">{rule.title}</h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-zinc-300">{rule.text}</p>
      </div>

      <div className="relative z-20 pb-2">
        {last ? (
          <Button size="lg" className="w-full" onClick={onDone}>
            {doneLabel} <ChevronRight className="size-5" />
          </Button>
        ) : (
          <p className="pb-3 text-center text-sm text-zinc-500">Tippe rechts für die nächste Regel</p>
        )}
      </div>
    </div>
  );
}
