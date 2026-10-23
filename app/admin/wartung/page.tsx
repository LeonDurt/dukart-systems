"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  customerNumber: string;
};

type Contract = {
  id: string;
  title: string;
  description: string | null;
  intervalMonths: number;
  lastServiceDate: string | null;
  nextServiceDate: string;
  notes: string | null;
  isActive: boolean;
  reminderSentAt: string | null;
  customer: Customer;
};

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function StatusBadge({ days }: { days: number }) {
  if (days < 0) return <span className="rounded-full bg-red-400/15 px-2.5 py-1 text-xs font-semibold text-red-300">Überfällig ({Math.abs(days)}d)</span>;
  if (days <= 7) return <span className="rounded-full bg-red-400/15 px-2.5 py-1 text-xs font-semibold text-red-300">Fällig in {days}d</span>;
  if (days <= 14) return <span className="rounded-full bg-yellow-400/15 px-2.5 py-1 text-xs font-semibold text-yellow-300">Bald fällig ({days}d)</span>;
  if (days <= 30) return <span className="rounded-full bg-cyan-400/15 px-2.5 py-1 text-xs font-semibold text-cyan-300">In {days}d</span>;
  return <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-400">In {days}d</span>;
}

export default function WartungPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderResult, setReminderResult] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("active");

  const emptyForm = {
    customerId: "",
    title: "",
    description: "",
    intervalMonths: "12",
    lastServiceDate: "",
    nextServiceDate: "",
    notes: "",
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/maintenance").then((r) => r.json()),
      fetch("/api/admin/customers").then((r) => r.json()),
    ]).then(([c, custs]) => {
      setContracts(Array.isArray(c) ? c : []);
      setCustomers(Array.isArray(custs) ? custs : []);
      setLoading(false);
    });
  }, []);

  async function saveContract() {
    if (!form.customerId || !form.title || !form.nextServiceDate) return;
    setSaving(true);
    try {
      const url = editId ? `/api/admin/maintenance/${editId}` : "/api/admin/maintenance";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const saved: Contract = await res.json();
      if (editId) {
        setContracts((prev) => prev.map((c) => (c.id === editId ? saved : c)));
      } else {
        setContracts((prev) => [...prev, saved]);
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  }

  async function deleteContract(id: string) {
    if (!confirm("Wartungsvertrag wirklich löschen?")) return;
    await fetch(`/api/admin/maintenance/${id}`, { method: "DELETE" });
    setContracts((prev) => prev.filter((c) => c.id !== id));
  }

  async function toggleActive(contract: Contract) {
    const res = await fetch(`/api/admin/maintenance/${contract.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !contract.isActive }),
    });
    if (res.ok) {
      const updated: Contract = await res.json();
      setContracts((prev) => prev.map((c) => (c.id === contract.id ? updated : c)));
    }
  }

  async function sendReminders() {
    setReminderLoading(true);
    setReminderResult(null);
    try {
      const res = await fetch("/api/admin/maintenance/send-reminders", { method: "POST" });
      const data = await res.json();
      setReminderResult(`${data.sent} von ${data.total} Erinnerungen gesendet.`);
      // Daten neu laden
      const fresh = await fetch("/api/admin/maintenance").then((r) => r.json());
      setContracts(Array.isArray(fresh) ? fresh : []);
    } finally {
      setReminderLoading(false);
    }
  }

  function startEdit(contract: Contract) {
    setForm({
      customerId: contract.customer.id,
      title: contract.title,
      description: contract.description ?? "",
      intervalMonths: contract.intervalMonths.toString(),
      lastServiceDate: contract.lastServiceDate ? contract.lastServiceDate.split("T")[0] : "",
      nextServiceDate: contract.nextServiceDate.split("T")[0],
      notes: contract.notes ?? "",
    });
    setEditId(contract.id);
    setShowForm(true);
  }

  const filtered = contracts.filter((c) => {
    if (filterActive === "active") return c.isActive;
    if (filterActive === "inactive") return !c.isActive;
    return true;
  });

  const dueCount = contracts.filter((c) => c.isActive && getDaysUntil(c.nextServiceDate) <= 14).length;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/stats"
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
            >
              ←
            </Link>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Wartungsverträge</h1>
              <p className="mt-1 text-sm text-slate-400">Verwaltung & Erinnerungen für wiederkehrende Wartungen</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={sendReminders}
              disabled={reminderLoading}
              className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-medium text-yellow-300 transition hover:bg-yellow-400/20 disabled:opacity-50"
            >
              {reminderLoading ? "Sende..." : "E-Mail-Erinnerungen senden"}
            </button>
            <button
              onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
              className="rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-medium text-slate-950 transition hover:scale-105"
            >
              + Neuer Vertrag
            </button>
          </div>
        </div>

        {/* Reminder Result */}
        {reminderResult && (
          <div className="mb-6 rounded-2xl border border-green-400/20 bg-green-400/10 px-4 py-3 text-sm text-green-300">
            {reminderResult}
          </div>
        )}

        {/* Warnung fällige Verträge */}
        {dueCount > 0 && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-4">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-yellow-300">
                {dueCount} {dueCount === 1 ? "Wartungsvertrag" : "Wartungsverträge"} bald fällig
              </p>
              <p className="text-sm text-yellow-200/70">Innerhalb der nächsten 14 Tage. Erinnerungen per E-Mail senden?</p>
            </div>
          </div>
        )}

        {/* Formular */}
        {showForm && (
          <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 text-lg font-semibold">{editId ? "Vertrag bearbeiten" : "Neuer Wartungsvertrag"}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">Kunde *</label>
                <select
                  value={form.customerId}
                  onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300"
                >
                  <option value="">Kunde auswählen…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.customerNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">Titel *</label>
                <input
                  type="text"
                  placeholder="z.B. Jährliche PC-Wartung"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">Intervall (Monate)</label>
                <select
                  value={form.intervalMonths}
                  onChange={(e) => setForm((f) => ({ ...f, intervalMonths: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300"
                >
                  <option value="1">Monatlich</option>
                  <option value="3">Vierteljährlich</option>
                  <option value="6">Halbjährlich</option>
                  <option value="12">Jährlich</option>
                  <option value="24">Alle 2 Jahre</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">Nächster Termin *</label>
                <input
                  type="date"
                  value={form.nextServiceDate}
                  onChange={(e) => setForm((f) => ({ ...f, nextServiceDate: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">Letzter Service</label>
                <input
                  type="date"
                  value={form.lastServiceDate}
                  onChange={(e) => setForm((f) => ({ ...f, lastServiceDate: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">Beschreibung</label>
                <input
                  type="text"
                  placeholder="Kurze Beschreibung"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs text-slate-400">Interne Notizen</label>
                <textarea
                  rows={2}
                  placeholder="Interne Notizen…"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={saveContract}
                disabled={saving || !form.customerId || !form.title || !form.nextServiceDate}
                className="rounded-2xl bg-cyan-300 px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:scale-[1.02] disabled:opacity-50"
              >
                {saving ? "Speichern..." : editId ? "Änderungen speichern" : "Vertrag erstellen"}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:text-white"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="mb-5 flex gap-2">
          {(["active", "inactive", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterActive(f)}
              className={`rounded-xl px-4 py-1.5 text-sm transition ${
                filterActive === f
                  ? "bg-cyan-300 text-slate-950 font-medium"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:text-white"
              }`}
            >
              {f === "active" ? "Aktiv" : f === "inactive" ? "Inaktiv" : "Alle"}
            </button>
          ))}
        </div>

        {/* Vertrags-Liste */}
        {loading ? (
          <p className="text-sm text-slate-500">Lade Verträge…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
            <p className="text-slate-500">Keine Wartungsverträge vorhanden.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 rounded-2xl bg-cyan-300 px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:scale-105"
            >
              Ersten Vertrag anlegen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((contract) => {
              const days = getDaysUntil(contract.nextServiceDate);
              return (
                <div
                  key={contract.id}
                  className={`rounded-3xl border p-5 transition ${
                    !contract.isActive
                      ? "border-white/5 bg-white/[0.02] opacity-60"
                      : days <= 7
                      ? "border-red-400/20 bg-red-400/5"
                      : days <= 14
                      ? "border-yellow-400/20 bg-yellow-400/5"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-white">{contract.title}</h3>
                        <StatusBadge days={days} />
                        {!contract.isActive && (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-500">Inaktiv</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        {contract.customer.firstName} {contract.customer.lastName} · {contract.customer.customerNumber}
                      </p>
                      {contract.description && (
                        <p className="mt-1 text-xs text-slate-500">{contract.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span>Nächster Termin: <strong className="text-slate-300">{new Date(contract.nextServiceDate).toLocaleDateString("de-DE")}</strong></span>
                        <span>Intervall: <strong className="text-slate-300">{contract.intervalMonths} Monate</strong></span>
                        {contract.lastServiceDate && (
                          <span>Letzter Service: <strong className="text-slate-300">{new Date(contract.lastServiceDate).toLocaleDateString("de-DE")}</strong></span>
                        )}
                        {contract.reminderSentAt && (
                          <span>Erinnerung gesendet: <strong className="text-slate-300">{new Date(contract.reminderSentAt).toLocaleDateString("de-DE")}</strong></span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        onClick={() => startEdit(contract)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:text-white"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => toggleActive(contract)}
                        className={`rounded-xl border px-3 py-1.5 text-xs transition ${
                          contract.isActive
                            ? "border-slate-400/20 bg-slate-400/10 text-slate-400 hover:text-white"
                            : "border-green-400/20 bg-green-400/10 text-green-300 hover:bg-green-400/20"
                        }`}
                      >
                        {contract.isActive ? "Deaktivieren" : "Aktivieren"}
                      </button>
                      <button
                        onClick={() => deleteContract(contract.id)}
                        className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-400/20"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
