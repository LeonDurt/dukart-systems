"use client";

import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** 3:59:07 oder 12:05 */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "1 h 23 min" für die Auswertung */
export function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return rest === 0 ? `${Math.floor(minutes / 60)} h` : `${Math.floor(minutes / 60)} h ${rest} min`;
}

export function formatAgo(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 45) return "gerade eben";
  if (seconds < 90) return "vor 1 Min";
  if (seconds < 3600) return `vor ${Math.round(seconds / 60)} Min`;
  return `vor ${Math.floor(seconds / 3600)} Std`;
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

/** Tickende Uhr. offset gleicht die Handyuhr an die Serverzeit an. */
export function useNow(offset = 0, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now + offset;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "catcher" | "ghost" | "danger";
  size?: "md" | "lg";
};

export function Button({ tone = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        size === "lg" ? "min-h-14 px-6 text-lg" : "min-h-11 px-4 text-sm",
        tone === "primary" && "bg-lime-400 text-zinc-950 hover:bg-lime-300",
        tone === "catcher" && "bg-orange-500 text-zinc-950 hover:bg-orange-400",
        tone === "danger" && "bg-red-600 text-white hover:bg-red-500",
        tone === "ghost" && "border border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10",
        className
      )}
    />
  );
}

/** Blatt, das von unten hochfährt. Für Bestätigungen mit dem Daumen erreichbar. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center">
      <button
        type="button"
        aria-label="Schließen"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fg-rise safe-bottom relative w-full max-w-lg rounded-t-3xl border border-white/10 bg-zinc-900 px-5 pt-5"
      >
        <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

export function Tag({ tone, children }: { tone: "runner" | "catcher" | "muted" | "warn"; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        tone === "runner" && "bg-lime-400/15 text-lime-300",
        tone === "catcher" && "bg-orange-500/20 text-orange-300",
        tone === "muted" && "bg-white/10 text-zinc-300",
        tone === "warn" && "bg-red-500/20 text-red-300"
      )}
    >
      {children}
    </span>
  );
}
