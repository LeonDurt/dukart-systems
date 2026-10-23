"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Profile = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  customer?: { firstName: string; lastName: string; customerNumber: string; phone: string; email: string } | null;
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      fetch("/api/profile").then(r => r.json()).then(setProfile);
    }
  }, [status]);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(""); setPwSuccess(false);
    if (newPw !== newPwConfirm) { setPwError("Neue Passwörter stimmen nicht überein."); return; }
    if (newPw.length < 8) { setPwError("Passwort muss mindestens 8 Zeichen haben."); return; }
    setPwLoading(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const data = await res.json();
    setPwLoading(false);
    if (!res.ok) { setPwError(data.error || "Fehler."); return; }
    setPwSuccess(true);
    setCurrentPw(""); setNewPw(""); setNewPwConfirm("");
  }

  if (status === "loading" || !profile) {
    return <main className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Wird geladen...</main>;
  }

  const displayName = profile.customer
    ? `${profile.customer.firstName} ${profile.customer.lastName}`
    : profile.email;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/kundenportal"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-300/40 hover:text-white">
            ←
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Mein Profil</h1>
            <p className="text-sm text-slate-400 mt-1">Deine Kontoinformationen</p>
          </div>
        </div>

        {/* Profil-Info */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 text-xl font-bold">
              {displayName[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-lg">{displayName}</p>
              <p className="text-sm text-slate-400">{profile.email}</p>
            </div>
          </div>

          <div className="grid gap-3 text-sm">
            {profile.customer && (
              <>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-400">Kundennummer</span>
                  <span className="font-medium">{profile.customer.customerNumber}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-400">Vorname</span>
                  <span>{profile.customer.firstName}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-400">Nachname</span>
                  <span>{profile.customer.lastName}</span>
                </div>
                {profile.customer.phone && (
                  <div className="flex justify-between border-b border-white/5 pb-3">
                    <span className="text-slate-400">Telefon</span>
                    <span>{profile.customer.phone}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between border-b border-white/5 pb-3">
              <span className="text-slate-400">E-Mail</span>
              <span>{profile.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Konto erstellt</span>
              <span>{new Date(profile.createdAt).toLocaleDateString("de-DE")}</span>
            </div>
          </div>
        </div>

        {/* Passwort ändern */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 mb-6">
          <h2 className="mb-5 text-xl font-semibold">Passwort ändern</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">Aktuelles Passwort</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">Neues Passwort</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required placeholder="Mindestens 8 Zeichen"
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">Neues Passwort bestätigen</label>
              <input type="password" value={newPwConfirm} onChange={e => setNewPwConfirm(e.target.value)} required
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300" />
            </div>
            {pwError && <p className="text-sm text-red-400">{pwError}</p>}
            {pwSuccess && <p className="text-sm text-green-400">Passwort erfolgreich geändert.</p>}
            <button type="submit" disabled={pwLoading}
              className="w-full rounded-2xl bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:scale-[1.02] disabled:opacity-60">
              {pwLoading ? "Wird gespeichert..." : "Passwort ändern"}
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-sm text-slate-500 hover:text-cyan-300 transition">
              Passwort vergessen?
            </Link>
          </div>
        </div>

        {/* Abmelden */}
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full rounded-2xl border border-red-400/20 bg-red-400/5 px-6 py-3 text-red-300 transition hover:bg-red-400/10">
          Abmelden
        </button>
      </div>
    </main>
  );
}
