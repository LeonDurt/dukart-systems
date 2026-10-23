"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) { const d = await res.json(); setError(d.error || "Fehler."); return; }
    setDone(true);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <h1 className="text-2xl font-bold">Passwort vergessen</h1>
          <p className="mt-2 text-sm text-slate-400">
            Gib deine E-Mail-Adresse ein. Falls ein Konto existiert, erhältst du einen Link zum Zurücksetzen.
          </p>

          {done ? (
            <div className="mt-6 rounded-2xl border border-green-400/20 bg-green-400/5 p-5 text-center">
              <p className="text-green-300 font-medium">E-Mail versendet!</p>
              <p className="mt-2 text-sm text-slate-400">Falls ein Konto vorhanden ist, erhältst du einen Link. Bitte prüfe auch den Spam-Ordner.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">E-Mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300" />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full rounded-2xl bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:scale-[1.02] disabled:opacity-60">
                {loading ? "Wird gesendet..." : "Reset-Link senden"}
              </button>
            </form>
          )}

          <div className="mt-5 text-center">
            <Link href="/login" className="text-sm text-slate-500 hover:text-cyan-300 transition">← Zurück zum Login</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
