"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwörter stimmen nicht überein."); return; }
    if (password.length < 8) { setError("Passwort muss mindestens 8 Zeichen haben."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Fehler."); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  if (!token) {
    return (
      <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-8 text-center">
        <p className="text-red-300">Ungültiger Link. Bitte fordere einen neuen an.</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-sm text-cyan-300 hover:underline">
          Neuen Link anfordern
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
      <h1 className="text-2xl font-bold">Neues Passwort setzen</h1>
      <p className="mt-2 text-sm text-slate-400">Wähle ein sicheres Passwort mit mindestens 8 Zeichen.</p>

      {done ? (
        <div className="mt-6 rounded-2xl border border-green-400/20 bg-green-400/5 p-5 text-center">
          <p className="text-green-300 font-medium">Passwort geändert!</p>
          <p className="mt-2 text-sm text-slate-400">Du wirst automatisch weitergeleitet…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Neues Passwort</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Passwort bestätigen</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300" />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-2xl bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:scale-[1.02] disabled:opacity-60">
            {loading ? "Wird gespeichert..." : "Passwort speichern"}
          </button>
        </form>
      )}

      <div className="mt-5 text-center">
        <Link href="/login" className="text-sm text-slate-500 hover:text-cyan-300 transition">← Zurück zum Login</Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-slate-400 text-center">Wird geladen...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
