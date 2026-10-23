"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Login fehlgeschlagen. Bitte E-Mail und Passwort prüfen.");
      return;
    }

    // Rolle aus der Session lesen für Weiterleitung
    const sessionRes = await fetch("/api/auth/session");
    const sessionData = await sessionRes.json();
    const role = sessionData?.user?.role;

    if (role === "CUSTOMER") {
      router.push("/kundenportal");
    } else {
      router.push("/admin/orders");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Dukart Systems</div>
          <a href="/" className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition hover:border-cyan-300/40 hover:text-white">
            ← Zurück zur Webseite
          </a>
        </div>
        <h1 className="text-3xl font-bold">Dukarts Panel</h1>
        <p className="mt-2 text-slate-400">
          Melde dich an, um auf das Panel zuzugreifen.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none focus:border-cyan-300"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none focus:border-cyan-300"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:scale-[1.02] disabled:opacity-60"
          >
            {loading ? "Wird angemeldet..." : "Anmelden"}
          </button>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="text-center">
            <a href="/forgot-password" className="text-xs text-slate-500 hover:text-cyan-300 transition">
              Passwort vergessen?
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
