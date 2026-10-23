"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type StaffMember = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  staffProfile: { displayName: string; position: string | null; status: string } | null;
};

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  SUPERVISOR: "Supervisor",
  STAFF: "Mitarbeiter",
};

const statusDot: Record<string, string> = {
  AVAILABLE: "bg-green-400",
  BUSY: "bg-orange-400",
  BREAK: "bg-yellow-400",
  OFFLINE: "bg-slate-500",
};

const statusLabel: Record<string, string> = {
  AVAILABLE: "Verfügbar",
  BUSY: "Beschäftigt",
  BREAK: "Pause",
  OFFLINE: "Offline",
};

export default function AdminStaffPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Neuen Mitarbeiter anlegen
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [newRole, setNewRole] = useState("STAFF");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Passwort zurücksetzen
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      const r = session?.user?.role;
      if (r !== "ADMIN" && r !== "SUPERVISOR") { router.push("/admin/orders"); return; }
      load();
    }
  }, [status]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/staff");
    if (res.ok) setStaff(await res.json());
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail, password: newPassword, displayName: newDisplayName, position: newPosition, role: newRole }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setCreateError(data.error); return; }
    setCreateOpen(false);
    setNewEmail(""); setNewPassword(""); setNewDisplayName(""); setNewPosition(""); setNewRole("STAFF");
    load();
  }

  async function toggleActive(member: StaffMember) {
    const confirm = window.confirm(`${member.staffProfile?.displayName || member.email} ${member.isActive ? "deaktivieren" : "reaktivieren"}?`);
    if (!confirm) return;
    setActionError("");
    const res = await fetch(`/api/admin/staff/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !member.isActive }),
    });
    if (!res.ok) { const d = await res.json(); setActionError(d.error); }
    else load();
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetId) return;
    setResetting(true);
    setResetError("");
    const res = await fetch(`/api/admin/staff/${resetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: resetPw }),
    });
    const data = await res.json();
    setResetting(false);
    if (!res.ok) { setResetError(data.error); return; }
    setResetId(null);
    setResetPw("");
  }

  const isAdmin = session?.user?.role === "ADMIN";

  if (status === "loading" || loading) {
    return <main className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Wird geladen...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Mitarbeiter</h1>
            <p className="mt-2 text-slate-400">{staff.length} Accounts · {staff.filter(s => s.isActive).length} aktiv</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/orders"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white">
              ← Panel
            </Link>
            {isAdmin && (
              <button onClick={() => setCreateOpen(true)}
                className="rounded-2xl bg-cyan-300 px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:scale-105">
                + Mitarbeiter
              </button>
            )}
          </div>
        </div>

        {actionError && (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-3 text-sm text-red-300">{actionError}</div>
        )}

        {/* Tabelle */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-white/10 bg-white/5 text-xs text-slate-400">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">E-Mail</th>
                  <th className="px-6 py-4">Rolle</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Letzter Login</th>
                  {isAdmin && <th className="px-6 py-4">Aktionen</th>}
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id} className={`border-b border-white/5 text-sm transition hover:bg-white/5 ${!member.isActive ? "opacity-40" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-300">
                          {(member.staffProfile?.displayName || member.email).slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">{member.staffProfile?.displayName || member.email}</p>
                          {member.staffProfile?.position && (
                            <p className="text-xs text-slate-500">{member.staffProfile.position}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{member.email}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-300">
                        {roleLabel[member.role] ?? member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${statusDot[member.staffProfile?.status ?? "OFFLINE"]}`} />
                        <span className="text-xs text-slate-400">{statusLabel[member.staffProfile?.status ?? "OFFLINE"]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {member.lastLoginAt
                        ? new Date(member.lastLoginAt).toLocaleString("de-DE")
                        : "Noch nicht eingeloggt"}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        {member.id !== session?.user?.id && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setResetId(member.id); setResetPw(""); setResetError(""); }}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:text-white"
                            >
                              Passwort
                            </button>
                            <button
                              onClick={() => toggleActive(member)}
                              className={`rounded-xl px-3 py-1.5 text-xs transition ${
                                member.isActive
                                  ? "border border-red-400/20 bg-red-400/10 text-red-300 hover:bg-red-400/20"
                                  : "border border-green-400/20 bg-green-400/10 text-green-300 hover:bg-green-400/20"
                              }`}
                            >
                              {member.isActive ? "Deaktivieren" : "Aktivieren"}
                            </button>
                          </div>
                        )}
                        {member.id === session?.user?.id && (
                          <span className="text-xs text-slate-600">Du</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Neuen Mitarbeiter anlegen Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
            <h2 className="mb-6 text-2xl font-bold">Mitarbeiter anlegen</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Anzeigename *</label>
                <input value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} required
                  placeholder="Max Mustermann"
                  className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-300" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Position</label>
                <input value={newPosition} onChange={e => setNewPosition(e.target.value)}
                  placeholder="Techniker, Kundensupport…"
                  className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-300" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">E-Mail *</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required
                  className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-300" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Passwort * (min. 8 Zeichen)</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8}
                  className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-300" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Rolle *</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-300">
                  <option value="STAFF">Mitarbeiter</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {createError && <p className="text-sm text-red-400">{createError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setCreateOpen(false)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-slate-300 transition hover:text-white">
                  Abbrechen
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 rounded-2xl bg-cyan-300 py-3 font-medium text-slate-950 transition hover:scale-[1.02] disabled:opacity-60">
                  {creating ? "Wird angelegt…" : "Anlegen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Passwort zurücksetzen Modal */}
      {resetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
            <h2 className="mb-4 text-xl font-bold">Passwort zurücksetzen</h2>
            <p className="mb-5 text-sm text-slate-400">
              Für: <span className="text-white">{staff.find(s => s.id === resetId)?.staffProfile?.displayName}</span>
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Neues Passwort *</label>
                <input type="password" value={resetPw} onChange={e => setResetPw(e.target.value)} required minLength={8}
                  className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-300" />
              </div>
              {resetError && <p className="text-sm text-red-400">{resetError}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setResetId(null)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-slate-300 transition hover:text-white">
                  Abbrechen
                </button>
                <button type="submit" disabled={resetting}
                  className="flex-1 rounded-2xl bg-cyan-300 py-3 font-medium text-slate-950 transition hover:scale-[1.02] disabled:opacity-60">
                  {resetting ? "Speichere…" : "Setzen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
