"use client";

import { useState } from "react";
import Link from "next/link";

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

type Invoice = {
  id: string;
  number: string;
  type: "INVOICE" | "QUOTE";
  total: number | string;
  items: InvoiceItem[];
  notes: string | null;
  dueDate: string | null;
  expiresAt: string | null;
  quoteStatus: "OPEN" | "ACCEPTED" | "REJECTED" | null;
  isSentToCustomer: boolean;
  sentAt: string | null;
  createdAt: string;
};

type OrderPart = {
  name: string;
  quantity: number;
  unitPrice: string | number | null;
};

type Props = {
  orderId: string;
  initialInvoices: Invoice[];
  parts: OrderPart[];
  finalPrice: string | number | null;
};

function newItem(): InvoiceItem {
  return { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 };
}

function calcTotal(items: InvoiceItem[]) {
  return items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
}

export default function InvoiceManager({ orderId, initialInvoices, parts, finalPrice }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [invoiceType, setInvoiceType] = useState<"INVOICE" | "QUOTE">("INVOICE");
  const [items, setItems] = useState<InvoiceItem[]>([newItem()]);
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [error, setError] = useState("");

  function openCreate(type: "INVOICE" | "QUOTE") {
    setInvoiceType(type);
    // Pre-fill from order parts
    const prefilled: InvoiceItem[] = parts
      .filter((p) => p.unitPrice !== null)
      .map((p) => ({
        id: crypto.randomUUID(),
        description: p.name,
        quantity: p.quantity,
        unitPrice: Number(p.unitPrice),
      }));
    // If final price is set and no parts → add one item with final price
    if (prefilled.length === 0 && finalPrice) {
      setItems([{ id: crypto.randomUUID(), description: "Dienstleistung", quantity: 1, unitPrice: Number(finalPrice) }]);
    } else {
      setItems(prefilled.length > 0 ? prefilled : [newItem()]);
    }
    setNotes("");
    setDueDate("");
    setExpiresAt("");
    setEditingId(null);
    setError("");
    setView("create");
  }

  function openEdit(inv: Invoice) {
    setInvoiceType(inv.type);
    setItems((inv.items as InvoiceItem[]).map((i) => ({ ...i, id: i.id ?? crypto.randomUUID() })));
    setNotes(inv.notes ?? "");
    setDueDate(inv.dueDate ? inv.dueDate.slice(0, 10) : "");
    setExpiresAt(inv.expiresAt ? inv.expiresAt.slice(0, 10) : "");
    setEditingId(inv.id);
    setError("");
    setView("edit");
  }

  function updateItem(id: string, field: keyof InvoiceItem, value: string | number) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, [field]: field === "description" ? value : Number(value) }
          : i
      )
    );
  }

  async function handleSave() {
    const validItems = items.filter((i) => i.description.trim());
    if (validItems.length === 0) { setError("Mindestens eine Position mit Beschreibung eingeben."); return; }
    setSaving(true);
    setError("");
    try {
      if (view === "create") {
        const res = await fetch("/api/admin/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            type: invoiceType,
            items: validItems,
            notes: notes || null,
            dueDate: invoiceType === "INVOICE" ? (dueDate || null) : null,
            expiresAt: invoiceType === "QUOTE" ? (expiresAt || null) : null,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const inv = await res.json();
        setInvoices((prev) => [inv, ...prev]);
      } else if (view === "edit" && editingId) {
        const res = await fetch(`/api/admin/invoices/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: validItems,
            notes: notes || null,
            dueDate: invoiceType === "INVOICE" ? (dueDate || null) : null,
            expiresAt: invoiceType === "QUOTE" ? (expiresAt || null) : null,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const inv = await res.json();
        setInvoices((prev) => prev.map((i) => (i.id === editingId ? { ...i, ...inv } : i)));
      }
      setView("list");
    } catch {
      setError("Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSend(id: string) {
    setSending(id);
    try {
      const res = await fetch(`/api/admin/invoices/${id}/send`, { method: "POST" });
      if (res.ok) setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, isSentToCustomer: true } : i));
    } finally {
      setSending(null);
    }
  }

  async function handleUpdateQuoteStatus(id: string, quoteStatus: "ACCEPTED" | "REJECTED") {
    setUpdatingStatus(id);
    try {
      const res = await fetch(`/api/admin/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteStatus }),
      });
      if (res.ok) {
        const inv = await res.json();
        setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...inv } : i)));
      }
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Dokument wirklich löschen?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/invoices/${id}`, { method: "DELETE" });
      setInvoices((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const typeLabel = (t: string) => t === "INVOICE" ? "Rechnung" : "Angebot";
  const typeColor = (t: string) => t === "INVOICE" ? "text-yellow-300 bg-yellow-400/10 border-yellow-400/20" : "text-cyan-300 bg-cyan-400/10 border-cyan-400/20";
  const quoteStatusLabel = (s: string | null) => s === "ACCEPTED" ? "Angenommen" : s === "REJECTED" ? "Abgelehnt" : "Offen";
  const quoteStatusColor = (s: string | null) => s === "ACCEPTED" ? "text-green-300 bg-green-400/10 border-green-400/20" : s === "REJECTED" ? "text-red-400 bg-red-400/10 border-red-400/20" : "text-slate-300 bg-white/5 border-white/10";

  if (view === "create" || view === "edit") {
    const total = calcTotal(items.filter((i) => i.description.trim()));
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">
            {view === "create" ? `Neue ${typeLabel(invoiceType)} erstellen` : `${typeLabel(invoiceType)} bearbeiten`}
          </h3>
          <button onClick={() => setView("list")} className="text-xs text-slate-400 hover:text-white transition">✕ Abbrechen</button>
        </div>

        {/* Positionen */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Positionen</p>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex gap-2 items-center">
                <input
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  placeholder="Beschreibung"
                  className="flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300 placeholder:text-slate-600"
                />
                <input
                  type="number"
                  value={item.quantity}
                  min={1}
                  onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                  className="w-16 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300 text-center"
                  title="Menge"
                />
                <div className="relative">
                  <input
                    type="number"
                    value={item.unitPrice}
                    min={0}
                    step={0.01}
                    onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                    className="w-24 rounded-xl border border-white/10 bg-slate-900 pl-3 pr-7 py-2 text-sm text-white outline-none focus:border-cyan-300"
                    title="Einzelpreis"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-slate-500">€</span>
                </div>
                <span className="w-20 text-right text-sm text-slate-300 tabular-nums">
                  {(item.quantity * item.unitPrice).toFixed(2)} €
                </span>
                <button
                  onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                  className="text-slate-600 hover:text-red-400 transition text-lg leading-none"
                  title="Entfernen"
                >×</button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setItems((prev) => [...prev, newItem()])}
            className="text-xs text-cyan-300 hover:text-cyan-200 transition"
          >
            + Position hinzufügen
          </button>
        </div>

        {/* Gesamt */}
        <div className="flex justify-end">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
            <span className="text-slate-400">Gesamt: </span>
            <span className="font-bold text-white">{total.toFixed(2)} €</span>
            <span className="ml-2 text-xs text-slate-500">(netto, §19 UStG)</span>
          </div>
        </div>

        {/* Notizen + Fälligkeit */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-slate-500">Notizen / Zahlungsbedingungen</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="z.B. Zahlbar innerhalb 14 Tagen…"
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300 placeholder:text-slate-600 resize-none"
            />
          </div>
          {invoiceType === "INVOICE" ? (
            <div>
              <label className="text-xs text-slate-500">Fälligkeitsdatum</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
              />
            </div>
          ) : (
            <div>
              <label className="text-xs text-slate-500">Angebot gültig bis</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
              />
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-2xl bg-cyan-300 px-5 py-2 text-sm font-medium text-slate-950 transition hover:scale-105 disabled:opacity-50"
          >
            {saving ? "Speichern…" : "Speichern"}
          </button>
          <button onClick={() => setView("list")} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2 text-sm text-slate-300 transition hover:text-white">
            Abbrechen
          </button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => openCreate("INVOICE")}
          className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-medium text-yellow-300 transition hover:bg-yellow-400/20"
        >
          + Rechnung erstellen
        </button>
        <button
          onClick={() => openCreate("QUOTE")}
          className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/20"
        >
          + Angebot erstellen
        </button>
      </div>

      {invoices.length === 0 ? (
        <p className="text-sm text-slate-500">Noch keine Dokumente erstellt.</p>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <div key={inv.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColor(inv.type)}`}>
                    {typeLabel(inv.type)}
                  </span>
                  {inv.type === "QUOTE" && (
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${quoteStatusColor(inv.quoteStatus)}`}>
                      {quoteStatusLabel(inv.quoteStatus)}
                    </span>
                  )}
                  <span className="font-mono text-sm font-semibold text-white">{inv.number}</span>
                  <span className="text-sm text-slate-300">{Number(inv.total).toFixed(2)} €</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {inv.type === "QUOTE" && inv.quoteStatus === "OPEN" && (
                    <>
                      <button
                        onClick={() => handleUpdateQuoteStatus(inv.id, "ACCEPTED")}
                        disabled={updatingStatus === inv.id}
                        className="rounded-xl border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs text-green-300 transition hover:bg-green-400/20 disabled:opacity-50"
                      >
                        Angenommen
                      </button>
                      <button
                        onClick={() => handleUpdateQuoteStatus(inv.id, "REJECTED")}
                        disabled={updatingStatus === inv.id}
                        className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs text-red-400 transition hover:bg-red-400/20 disabled:opacity-50"
                      >
                        Abgelehnt
                      </button>
                    </>
                  )}
                  {inv.isSentToCustomer ? (
                    <span className="rounded-full bg-green-400/10 px-2.5 py-0.5 text-xs text-green-300 border border-green-400/20">
                      Gesendet
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSend(inv.id)}
                      disabled={sending === inv.id}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:border-green-400/30 hover:text-green-300 disabled:opacity-50"
                    >
                      {sending === inv.id ? "…" : "An Kunde senden"}
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(inv)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:text-white"
                  >
                    Bearbeiten
                  </button>
                  <Link
                    href={`/invoice/${inv.id}`}
                    target="_blank"
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:text-white"
                  >
                    Vorschau / Drucken
                  </Link>
                  <button
                    onClick={() => handleDelete(inv.id)}
                    disabled={deleting === inv.id}
                    className="rounded-xl border border-red-400/10 bg-red-400/5 px-3 py-1 text-xs text-red-400 transition hover:bg-red-400/10 disabled:opacity-50"
                  >
                    {deleting === inv.id ? "…" : "Löschen"}
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Erstellt: {new Date(inv.createdAt).toLocaleDateString("de-DE")}
                {inv.type === "INVOICE" && inv.dueDate && ` · Fällig: ${new Date(inv.dueDate).toLocaleDateString("de-DE")}`}
                {inv.type === "QUOTE" && inv.expiresAt && ` · Gültig bis: ${new Date(inv.expiresAt).toLocaleDateString("de-DE")}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
