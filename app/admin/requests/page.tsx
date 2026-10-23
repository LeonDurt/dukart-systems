"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ContactRequest = {
  id: string;
  name: string;
  contact: string;
  phone: string | null;
  subject: string;
  message: string;
  status: "NEW" | "IN_REVIEW" | "REJECTED" | "CONVERTED";
  createdAt: string;
};

const statusLabel: Record<string, { text: string; className: string }> = {
  NEW: { text: "Neu", className: "bg-blue-400/10 text-blue-300 border-blue-400/20" },
  IN_REVIEW: { text: "In Prüfung", className: "bg-yellow-400/10 text-yellow-300 border-yellow-400/20" },
  REJECTED: { text: "Abgelehnt", className: "bg-red-400/10 text-red-300 border-red-400/20" },
  CONVERTED: { text: "Freigegeben", className: "bg-green-400/10 text-green-300 border-green-400/20" },
};

export default function AdminRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactRequest | null>(null);

  // Freigabe-Modal State
  const [approveModal, setApproveModal] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [approving, setApproving] = useState(false);
  const [approveResult, setApproveResult] = useState<{ inviteLink?: string; customerNumber?: string } | null>(null);

  const [rejecting, setRejecting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      const role = session?.user?.role;
      if (role !== "ADMIN" && role !== "SUPERVISOR") {
        router.push("/kundenportal");
        return;
      }
      loadRequests();
      const id = setInterval(loadRequests, 15000);
      return () => clearInterval(id);
    }
  }, [status, session]);

  async function loadRequests() {
    setLoading(true);
    const res = await fetch("/api/admin/requests");
    if (res.ok) {
      setRequests(await res.json());
    }
    setLoading(false);
  }

  function openApprove(req: ContactRequest) {
    setSelected(req);
    // Namen aus dem Anfrage-Namen vorausfüllen
    const parts = req.name.trim().split(" ");
    setFirstName(parts[0] || "");
    setLastName(parts.slice(1).join(" ") || "");
    setPhone(req.phone || (req.contact.includes("@") ? "" : req.contact));
    setApproveResult(null);
    setActionError("");
    setApproveModal(true);
  }

  async function handleApprove() {
    if (!selected) return;
    setApproving(true);
    setActionError("");
    const res = await fetch(`/api/admin/requests/${selected.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, phone }),
    });
    const data = await res.json();
    setApproving(false);
    if (!res.ok) {
      setActionError(data.error || "Fehler beim Freischalten.");
      return;
    }
    setApproveResult({ inviteLink: data.inviteLink, customerNumber: data.customerNumber });
    loadRequests();
  }

  async function handleReject(req: ContactRequest) {
    if (!confirm(`Anfrage von ${req.name} wirklich ablehnen?`)) return;
    setRejecting(true);
    setActionError("");
    const res = await fetch(`/api/admin/requests/${req.id}/reject`, { method: "POST" });
    setRejecting(false);
    if (!res.ok) {
      const data = await res.json();
      setActionError(data.error || "Fehler beim Ablehnen.");
    } else {
      loadRequests();
    }
  }

  async function handleDelete(req: ContactRequest) {
    if (!confirm(`Anfrage von ${req.name} wirklich löschen? Dies kann nicht rückgängig gemacht werden.`)) return;
    setDeleting(true);
    setActionError("");
    const res = await fetch(`/api/admin/requests/${req.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const data = await res.json();
      setActionError(data.error || "Fehler beim Löschen.");
    } else {
      if (selected?.id === req.id) setSelected(null);
      loadRequests();
    }
  }

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-slate-400">Wird geladen...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Nav */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Kundenanfragen</h1>

            <p className="mt-2 text-slate-300">
              Hier erscheinen alle Anfragen über die Webseite. Du kannst Kunden freischalten oder ablehnen.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/orders"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
            >
              ← Dukarts Panel
            </Link>
          </div>
        </div>

        {actionError && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-red-300">
            {actionError}
          </div>
        )}

        {/* Statistik-Kacheln */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          {(["NEW", "IN_REVIEW", "CONVERTED", "REJECTED"] as const).map((s) => {
            const count = requests.filter((r) => r.status === s).length;
            const info = statusLabel[s];
            return (
              <div key={s} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">{info.text}</p>
                <p className="mt-2 text-3xl font-bold">{count}</p>
              </div>
            );
          })}
        </div>

        {/* Anfragen-Tabelle */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-white/10 bg-white/5 text-sm text-slate-300">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Kontakt</th>
                  <th className="px-6 py-4">Betreff</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Datum</th>
                  <th className="px-6 py-4">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {requests.length > 0 ? (
                  requests.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b border-white/5 text-sm text-slate-200 transition hover:bg-white/5"
                    >
                      <td className="px-6 py-4 font-medium">{req.name}</td>
                      <td className="px-6 py-4 text-slate-300">{req.contact}</td>
                      <td className="px-6 py-4">{req.subject}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full border px-3 py-1 text-xs ${statusLabel[req.status]?.className}`}>
                          {statusLabel[req.status]?.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(req.createdAt).toLocaleDateString("de-DE")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelected(selected?.id === req.id ? null : req)}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
                          >
                            Details
                          </button>
                          {(req.status === "NEW" || req.status === "IN_REVIEW") && (
                            <>
                              <button
                                onClick={() => openApprove(req)}
                                className="rounded-xl bg-cyan-300 px-3 py-1 text-xs font-medium text-slate-950 transition hover:scale-105"
                              >
                                Freischalten
                              </button>
                              <button
                                onClick={() => handleReject(req)}
                                disabled={rejecting}
                                className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs text-red-300 transition hover:bg-red-400/20 disabled:opacity-50"
                              >
                                Ablehnen
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(req)}
                            disabled={deleting}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-500 transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50"
                            title="Anfrage löschen"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      Noch keine Anfragen vorhanden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail-Panel */}
        {selected && !approveModal && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-semibold">{selected.name}</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-slate-300">
              <div><span className="text-slate-500">E-Mail/Kontakt:</span> {selected.contact}</div>
              {selected.phone && <div><span className="text-slate-500">Telefon:</span> {selected.phone}</div>}
              <div><span className="text-slate-500">Betreff:</span> {selected.subject}</div>
              <div><span className="text-slate-500">Datum:</span> {new Date(selected.createdAt).toLocaleString("de-DE")}</div>
              <div><span className="text-slate-500">Status:</span> {statusLabel[selected.status]?.text}</div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-500">Nachricht:</p>
              <p className="mt-2 whitespace-pre-wrap text-slate-200">{selected.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Freischalten-Modal */}
      {approveModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
            {approveResult ? (
              <>
                <h2 className="text-2xl font-bold text-green-400">Erfolgreich freigeschalten!</h2>
                <p className="mt-3 text-slate-300">
                  Kundennummer: <span className="font-semibold text-white">{approveResult.customerNumber}</span>
                </p>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Einladungslink (auch per E-Mail versendet):</p>
                  <p className="mt-2 break-all text-sm text-cyan-300">{approveResult.inviteLink}</p>
                </div>
                <button
                  onClick={() => {
                    setApproveModal(false);
                    setSelected(null);
                    setApproveResult(null);
                  }}
                  className="mt-6 w-full rounded-2xl bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:scale-[1.02]"
                >
                  Schließen
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold">Kunden freischalten</h2>
                <p className="mt-2 text-slate-400 text-sm">
                  Anfrage von: <span className="text-white">{selected.name}</span>
                </p>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Vorname *</label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Nachname *</label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">Telefon</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-300"
                    />
                  </div>
                </div>
                {actionError && (
                  <p className="mt-3 text-sm text-red-400">{actionError}</p>
                )}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => { setApproveModal(false); setSelected(null); }}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-slate-300 transition hover:text-white"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={approving || !firstName || !lastName}
                    className="flex-1 rounded-2xl bg-cyan-300 px-6 py-3 font-medium text-slate-950 transition hover:scale-[1.02] disabled:opacity-60"
                  >
                    {approving ? "Wird freigeschalten..." : "Freischalten & Einladen"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
