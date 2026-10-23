"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Customer = {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
  user: { id: string; email: string; isActive: boolean; lastLoginAt: string | null } | null;
  orders: { id: string; isCompleted: boolean; isArchived: boolean }[];
  invitations: { id: string; usedAt: string | null; expiresAt: string }[];
};

export default function AdminCustomersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendResult, setResendResult] = useState<{ id: string; link: string } | null>(null);
  const [actionError, setActionError] = useState("");

  // Neuer Auftrag
  const [newOrderCustomerId, setNewOrderCustomerId] = useState<string | null>(null);
  const [newOrderTitle, setNewOrderTitle] = useState("");
  const [newOrderDesc, setNewOrderDesc] = useState("");
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [newOrderError, setNewOrderError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      const r = session?.user?.role;
      if (r !== "ADMIN" && r !== "SUPERVISOR" && r !== "STAFF") { router.push("/kundenportal"); return; }
      load();
    }
  }, [status]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/customers");
    if (res.ok) setCustomers(await res.json());
    setLoading(false);
  }

  async function resendInvite(customer: Customer) {
    setResendingId(customer.id);
    setActionError("");
    setResendResult(null);
    const res = await fetch(`/api/admin/customers/${customer.id}/resend-invite`, { method: "POST" });
    const data = await res.json();
    setResendingId(null);
    if (!res.ok) { setActionError(data.error); return; }
    setResendResult({ id: customer.id, link: data.inviteLink });
  }

  async function deleteCustomer(customer: Customer) {
    const name = `${customer.firstName} ${customer.lastName}`;
    const orderCount = customer.orders.length;
    const msg = orderCount > 0
      ? `Kunden "${name}" und alle ${orderCount} Aufträge wirklich löschen? Das kann nicht rückgängig gemacht werden.`
      : `Kunden "${name}" wirklich löschen? Das kann nicht rückgängig gemacht werden.`;
    if (!confirm(msg)) return;
    setDeletingId(customer.id);
    setActionError("");
    const res = await fetch(`/api/admin/customers/${customer.id}`, { method: "DELETE" });
    const data = await res.json();
    setDeletingId(null);
    if (!res.ok) { setActionError(data.error); return; }
    load();
  }

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!newOrderCustomerId) return;
    setCreatingOrder(true);
    setNewOrderError("");
    const res = await fetch("/api/admin/orders/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: newOrderCustomerId, title: newOrderTitle, description: newOrderDesc }),
    });
    const data = await res.json();
    setCreatingOrder(false);
    if (!res.ok) { setNewOrderError(data.error); return; }
    setNewOrderCustomerId(null);
    setNewOrderTitle("");
    setNewOrderDesc("");
    router.push(`/admin/orders/${data.id}`);
  }

  const canEdit = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERVISOR";

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.customerNumber.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  if (status === "loading" || loading) {
    return <main className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Wird geladen...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Kunden</h1>
            <p className="mt-2 text-slate-400">{customers.length} Kunden gesamt</p>
          </div>
          <Link href="/admin/orders"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white">
            ← Panel
          </Link>
        </div>

        {/* Suche */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Suchen nach Name, E-Mail, Kundennummer…"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white outline-none focus:border-cyan-300 placeholder:text-slate-500"
          />
        </div>

        {actionError && (
          <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-3 text-sm text-red-300">{actionError}</div>
        )}

        {/* Kunden-Kacheln */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(customer => {
            const activeOrders = customer.orders.filter(o => !o.isCompleted && !o.isArchived).length;
            const hasAccount = !!customer.user;
            const latestInvite = customer.invitations[0];
            const inviteExpired = latestInvite && !latestInvite.usedAt && new Date(latestInvite.expiresAt) < new Date();
            const invitePending = latestInvite && !latestInvite.usedAt && !inviteExpired;
            const resendThis = resendResult?.id === customer.id;

            return (
              <div key={customer.id} className="rounded-3xl border border-white/10 bg-white/5 p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-sm font-bold text-cyan-300">
                      {customer.firstName[0]}{customer.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{customer.firstName} {customer.lastName}</p>
                      <p className="text-xs text-slate-500">{customer.customerNumber}</p>
                    </div>
                  </div>
                  {/* Account-Status */}
                  {hasAccount ? (
                    <span className="rounded-full border border-green-400/20 bg-green-400/10 px-2 py-0.5 text-xs text-green-300 shrink-0">
                      Registriert
                    </span>
                  ) : invitePending ? (
                    <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2 py-0.5 text-xs text-yellow-300 shrink-0">
                      Einladung offen
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-400/20 bg-slate-400/10 px-2 py-0.5 text-xs text-slate-400 shrink-0">
                      Kein Account
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  {customer.email && <p>{customer.email}</p>}
                  {customer.phone && <p>{customer.phone}</p>}
                  {customer.user?.lastLoginAt && (
                    <p>Letzter Login: {new Date(customer.user.lastLoginAt).toLocaleDateString("de-DE")}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                  <span className="text-xs text-slate-500">{customer.orders.length} Aufträge</span>
                  {activeOrders > 0 && (
                    <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-300">{activeOrders} aktiv</span>
                  )}
                </div>

                {/* Aktionen */}
                <div className="flex flex-wrap gap-2">
                  {canEdit && (
                    <button
                      onClick={() => { setNewOrderCustomerId(customer.id); setNewOrderTitle(""); setNewOrderDesc(""); setNewOrderError(""); }}
                      className="rounded-xl bg-cyan-300 px-3 py-1.5 text-xs font-medium text-slate-950 transition hover:scale-105"
                    >
                      + Auftrag
                    </button>
                  )}
                  {canEdit && !hasAccount && (
                    <button
                      onClick={() => resendInvite(customer)}
                      disabled={resendingId === customer.id}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:text-white disabled:opacity-50"
                    >
                      {resendingId === customer.id ? "Sende…" : "Einladung senden"}
                    </button>
                  )}
                  {session?.user?.role === "ADMIN" && (
                    <button
                      onClick={() => deleteCustomer(customer)}
                      disabled={deletingId === customer.id}
                      className="ml-auto rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-400/20 disabled:opacity-50"
                    >
                      {deletingId === customer.id ? "…" : "Löschen"}
                    </button>
                  )}
                </div>

                {resendThis && (
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-3">
                    <p className="text-xs text-cyan-300 mb-1">Link versendet + kopierbar:</p>
                    <p className="break-all text-xs text-slate-300">{resendResult.link}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-slate-400">
            {search ? "Keine Kunden gefunden." : "Noch keine Kunden vorhanden."}
          </div>
        )}
      </div>

      {/* Neuer Auftrag Modal */}
      {newOrderCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
            <h2 className="mb-2 text-2xl font-bold">Neuer Auftrag</h2>
            <p className="mb-5 text-sm text-slate-400">
              Für: <span className="text-white">{customers.find(c => c.id === newOrderCustomerId)?.firstName} {customers.find(c => c.id === newOrderCustomerId)?.lastName}</span>
            </p>
            <form onSubmit={createOrder} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Titel *</label>
                <input value={newOrderTitle} onChange={e => setNewOrderTitle(e.target.value)} required
                  placeholder="Gaming PC Zusammenbau…"
                  className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-300" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Beschreibung</label>
                <textarea value={newOrderDesc} onChange={e => setNewOrderDesc(e.target.value)} rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-300" />
              </div>
              {newOrderError && <p className="text-sm text-red-400">{newOrderError}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setNewOrderCustomerId(null)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-slate-300 transition hover:text-white">
                  Abbrechen
                </button>
                <button type="submit" disabled={creatingOrder}
                  className="flex-1 rounded-2xl bg-cyan-300 py-3 font-medium text-slate-950 transition hover:scale-[1.02] disabled:opacity-60">
                  {creatingOrder ? "Wird angelegt…" : "Anlegen & Öffnen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
