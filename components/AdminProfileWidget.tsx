"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

type StaffStatus = "AVAILABLE" | "BUSY" | "BREAK" | "OFFLINE";

const statusConfig: Record<StaffStatus, { label: string; dot: string; text: string }> = {
  AVAILABLE: { label: "Verfügbar", dot: "bg-green-400", text: "text-green-300" },
  BUSY:      { label: "Beschäftigt", dot: "bg-orange-400", text: "text-orange-300" },
  BREAK:     { label: "Pause", dot: "bg-yellow-400", text: "text-yellow-300" },
  OFFLINE:   { label: "Offline", dot: "bg-slate-500", text: "text-slate-400" },
};

interface Props {
  email: string;
  role: string;
  displayName?: string;
  initialStatus?: StaffStatus;
}

export default function AdminProfileWidget({ email, role, displayName, initialStatus = "OFFLINE" }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<StaffStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Schließen bei Klick außerhalb
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase();

  async function changeStatus(newStatus: StaffStatus) {
    if (newStatus === status || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) setStatus(newStatus);
    } finally {
      setLoading(false);
    }
  }

  const cfg = statusConfig[status];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 transition hover:border-white/20 hover:bg-white/10"
      >
        {/* Avatar */}
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/20 text-sm font-bold text-cyan-300">
          {initials}
          {/* Status-Dot */}
          <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 ${cfg.dot}`} />
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium leading-none text-white">{displayName || email}</p>
          <p className={`mt-0.5 text-xs leading-none ${cfg.text}`}>{cfg.label}</p>
        </div>
        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-2xl">
          {/* Info */}
          <div className="mb-2 border-b border-white/10 px-3 pb-2 pt-1">
            <p className="text-xs font-medium text-white">{displayName || email}</p>
            <p className="text-xs text-slate-500">{email}</p>
            <span className="mt-1 inline-block rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-300">
              {role}
            </span>
          </div>

          {/* Status wählen */}
          <p className="px-3 pb-1 pt-1 text-xs font-medium uppercase tracking-wider text-slate-500">Status</p>
          {(Object.entries(statusConfig) as [StaffStatus, typeof statusConfig[StaffStatus]][]).map(([key, val]) => (
            <button
              key={key}
              onClick={() => changeStatus(key)}
              disabled={loading}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-white/5 ${
                status === key ? "text-white" : "text-slate-400"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${val.dot}`} />
              {val.label}
              {status === key && (
                <svg className="ml-auto h-3.5 w-3.5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}

          {/* Trennlinie + Logout */}
          <div className="mt-2 border-t border-white/10 pt-2">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-400 transition hover:bg-red-400/10"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Abmelden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
