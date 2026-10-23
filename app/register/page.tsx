"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type CustomerInfo = {
  firstName: string;
  lastName: string;
  email: string;
};

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setTokenError("Kein Einladungslink gefunden.");
      setValidating(false);
      return;
    }

    fetch(`/api/invitations/validate?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setValid(true);
          setCustomer(data.customer);
        } else {
          setTokenError(data.error || "Ungültiger Link.");
        }
        setValidating(false);
      })
      .catch(() => {
        setTokenError("Fehler beim Überprüfen des Links.");
        setValidating(false);
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen haben.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }

    setSubmitting(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Registrierung fehlgeschlagen.");
      setSubmitting(false);
      return;
    }

    // Automatisch einloggen
    const result = await signIn("credentials", {
      email: customer?.email,
      password,
      redirect: false,
    });

    if (result?.error) {
      router.push("/login");
    } else {
      router.push("/kundenportal");
    }
  }

  if (validating) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-slate-400">Link wird überprüft...</div>
      </main>
    );
  }

  if (!valid) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-red-400/5 p-8 text-center shadow-2xl">
          <div className="mb-4 text-4xl">⚠️</div>
          <h1 className="text-2xl font-bold text-red-300">Link ungültig</h1>
          <p className="mt-3 text-slate-400">{tokenError}</p>
          <p className="mt-4 text-sm text-slate-500">
            Bitte kontaktiere uns, falls du einen neuen Link benötigst.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-xl font-semibold">Dukart Systems</div>
          <p className="mt-1 text-sm text-slate-400">Kundenportal</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <div className="mb-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
            <p className="text-sm text-slate-300">
              Willkommen,{" "}
              <span className="font-semibold text-white">
                {customer?.firstName} {customer?.lastName}
              </span>
              !
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Setze ein Passwort um deinen Account zu aktivieren.
            </p>
          </div>

          <h1 className="text-2xl font-bold">Account einrichten</h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">E-Mail</label>
              <input
                type="email"
                value={customer?.email || ""}
                disabled
                className="w-full rounded-2xl border border-white/10 bg-slate-900/30 px-4 py-3 text-slate-400 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Passwort *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 8 Zeichen"
                required
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none focus:border-cyan-300"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Passwort bestätigen *</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Passwort wiederholen"
                required
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none focus:border-cyan-300"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:scale-[1.02] disabled:opacity-60"
            >
              {submitting ? "Wird aktiviert..." : "Account aktivieren & anmelden"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Wird geladen...
      </main>
    }>
      <RegisterForm />
    </Suspense>
  );
}
