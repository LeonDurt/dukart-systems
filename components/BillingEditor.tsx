"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

type Item = { id: string; description: string; quantity: number; unit: string; unitPrice: number };
type Doc = {
  id: string; number: string; type: string; status: string;
  recipientName: string; recipientCompany: string | null;
  recipientStreet: string | null; recipientZip: string | null; recipientCity: string | null; recipientEmail: string | null;
  items: Item[]; total: number | string; notes: string | null;
  issueDate: string; dueDate: string | null; deliveryDate: string | null;
  relatedInvoiceId: string | null; createdAt: string;
};
type InvoiceOption = { id: string; number: string; recipientName: string; total: number | string };
type RecipientSuggestion = {
  name: string; company: string; street: string; zip: string; city: string; email: string; source: "customer" | "document";
};

const UNITS = ["Stk.", "Std.", "pauschal", "m", "m²", "kg", "l", "Set", "Monat"];
const TYPE_LABELS: Record<string, string> = { INVOICE: "Rechnung", DELIVERY_NOTE: "Lieferschein", DUNNING: "Mahnung" };
const STATUS_LABELS: Record<string, string> = { DRAFT: "Entwurf", SENT: "Gesendet", PAID: "Bezahlt", OVERDUE: "Überfällig", CANCELLED: "Storniert" };
const STATUS_COLORS: Record<string, string> = {
  DRAFT: "text-slate-400 bg-white/5 border-white/10",
  SENT: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20",
  PAID: "text-green-300 bg-green-400/10 border-green-400/20",
  OVERDUE: "text-red-400 bg-red-400/10 border-red-400/20",
  CANCELLED: "text-slate-500 bg-white/5 border-white/10",
};

function newItem(): Item {
  return { id: crypto.randomUUID(), description: "", quantity: 1, unit: "Stk.", unitPrice: 0 };
}

function AutocompleteInput({
  value, onChange, placeholder, className,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return; }
    const res = await fetch(`/api/admin/billing/suggestions?q=${encodeURIComponent(q)}`);
    if (res.ok) setSuggestions(await res.json());
  }, []);

  function handleChange(v: string) {
    onChange(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fetchSuggestions(v), 200);
    setOpen(true);
  }

  function pick(s: string) {
    onChange(s);
    setSuggestions([]);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Tab" && suggestions.length > 0) {
      e.preventDefault();
      pick(suggestions[0]);
    }
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <div className="relative flex-1">
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => value && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className={className}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-white/10 bg-slate-800 shadow-xl overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => pick(s)}
              className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10 transition"
            >
              {i === 0 && <span className="mr-2 text-xs text-slate-500">Tab ↹</span>}
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RecipientAutocomplete({
  value, onChange, onSelect, className,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (r: RecipientSuggestion) => void;
  className?: string;
}) {
  const [suggestions, setSuggestions] = useState<RecipientSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchSuggestions(q: string) {
    if (!q.trim()) { setSuggestions([]); return; }
    const res = await fetch(`/api/admin/billing/recipients?q=${encodeURIComponent(q)}`);
    if (res.ok) setSuggestions(await res.json());
  }

  function handleChange(v: string) {
    onChange(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fetchSuggestions(v), 200);
    setOpen(true);
  }

  function pick(r: RecipientSuggestion) {
    onSelect(r);
    setSuggestions([]);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Tab" && suggestions.length > 0) {
      e.preventDefault();
      pick(suggestions[0]);
    }
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => value && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Name eingeben…"
        className={className}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-72 rounded-xl border border-white/10 bg-slate-800 shadow-xl overflow-hidden">
          {suggestions.map((r, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => pick(r)}
              className="w-full px-4 py-2.5 text-left hover:bg-white/10 transition flex items-start justify-between gap-3"
            >
              <div>
                {i === 0 && <span className="text-xs text-slate-500 mr-2">Tab ↹</span>}
                <span className="text-sm font-medium text-white">{r.name}</span>
                {r.company && <span className="text-xs text-slate-400 ml-2">{r.company}</span>}
                {(r.street || r.city) && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {[r.street, r.zip && r.city ? `${r.zip} ${r.city}` : r.city].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                r.source === "customer"
                  ? "bg-cyan-400/10 text-cyan-300 border border-cyan-400/20"
                  : "bg-white/5 text-slate-500 border border-white/10"
              }`}>
                {r.source === "customer" ? "Kunde" : "Dokument"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BillingEditor({
  initialDocs,
  invoiceOptions,
}: {
  initialDocs: Doc[];
  invoiceOptions: InvoiceOption[];
}) {
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));

  // Form state
  const [docType, setDocType] = useState("INVOICE");
  const [recipientName, setRecipientName] = useState("");
  const [recipientCompany, setRecipientCompany] = useState("");
  const [recipientStreet, setRecipientStreet] = useState("");
  const [recipientZip, setRecipientZip] = useState("");
  const [recipientCity, setRecipientCity] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [items, setItems] = useState<Item[]>([newItem()]);
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [relatedInvoiceId, setRelatedInvoiceId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const total = items.filter(i => i.description.trim()).reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  async function loadDocs() {
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    if (filterStatus) params.set("status", filterStatus);
    if (filterYear) params.set("year", filterYear);
    const res = await fetch(`/api/admin/billing?${params}`);
    if (res.ok) setDocs(await res.json());
  }

  useEffect(() => { loadDocs(); }, [filterType, filterStatus, filterYear]);

  function resetForm() {
    setDocType("INVOICE"); setRecipientName(""); setRecipientCompany("");
    setRecipientStreet(""); setRecipientZip(""); setRecipientCity("");
    setRecipientEmail(""); setItems([newItem()]); setNotes("");
    setDueDate(""); setDeliveryDate(""); setRelatedInvoiceId("");
    setEditingId(null); setError("");
  }

  function openCreate(type = "INVOICE") {
    resetForm();
    setDocType(type);
    setView("create");
  }

  function openEdit(doc: Doc) {
    setDocType(doc.type);
    setRecipientName(doc.recipientName);
    setRecipientCompany(doc.recipientCompany ?? "");
    setRecipientStreet(doc.recipientStreet ?? "");
    setRecipientZip(doc.recipientZip ?? "");
    setRecipientCity(doc.recipientCity ?? "");
    setRecipientEmail(doc.recipientEmail ?? "");
    setItems((doc.items as Item[]).map(i => ({ ...i, id: i.id ?? crypto.randomUUID() })));
    setNotes(doc.notes ?? "");
    setDueDate(doc.dueDate ? doc.dueDate.slice(0, 10) : "");
    setDeliveryDate(doc.deliveryDate ? doc.deliveryDate.slice(0, 10) : "");
    setRelatedInvoiceId(doc.relatedInvoiceId ?? "");
    setEditingId(doc.id);
    setError("");
    setView("edit");
  }

  function updateItem(id: string, field: keyof Item, value: string | number) {
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, [field]: field === "description" || field === "unit" ? value : Number(value) } : i
    ));
  }

  async function handleSave() {
    const validItems = items.filter(i => i.description.trim());
    if (!recipientName.trim()) { setError("Empfängername eingeben."); return; }
    if (validItems.length === 0) { setError("Mindestens eine Position eingeben."); return; }
    setSaving(true); setError("");
    try {
      const body = {
        type: docType, recipientName, recipientCompany, recipientStreet, recipientZip,
        recipientCity, recipientEmail, items: validItems, notes: notes || null,
        dueDate: dueDate || null, deliveryDate: deliveryDate || null,
        relatedInvoiceId: relatedInvoiceId || null,
      };
      if (view === "create") {
        const res = await fetch("/api/admin/billing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error();
      } else if (editingId) {
        const res = await fetch(`/api/admin/billing/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error();
      }
      await loadDocs();
      setView("list");
    } catch {
      setError("Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/billing/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadDocs();
  }

  async function handleDelete(id: string) {
    if (!confirm("Dokument wirklich löschen?")) return;
    await fetch(`/api/admin/billing/${id}`, { method: "DELETE" });
    setDocs(prev => prev.filter(d => d.id !== id));
  }

  const yearRevenue = docs
    .filter(d => d.type === "INVOICE" && d.status === "PAID")
    .reduce((s, d) => s + Number(d.total), 0);

  // ─── Form view ─────────────────────────────────────────────────────────────
  if (view === "create" || view === "edit") {
    const isDelivery = docType === "DELIVERY_NOTE";
    const isDunning = docType === "DUNNING";
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {view === "create" ? `Neue ${TYPE_LABELS[docType]}` : `${TYPE_LABELS[docType]} bearbeiten`}
            </h2>
          </div>
          <button onClick={() => setView("list")} className="text-sm text-slate-400 hover:text-white transition">✕ Abbrechen</button>
        </div>

        {view === "create" && (
          <div className="flex gap-2">
            {["INVOICE", "DELIVERY_NOTE", "DUNNING"].map(t => (
              <button key={t} onClick={() => setDocType(t)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition border ${docType === t ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"}`}>
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        )}

        {/* Mahnung: Bezug auf Rechnung */}
        {isDunning && (
          <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4">
            <label className="text-xs text-slate-400 mb-1 block">Bezieht sich auf Rechnung (optional)</label>
            <select value={relatedInvoiceId} onChange={e => setRelatedInvoiceId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300">
              <option value="">— keine Verknüpfung —</option>
              {invoiceOptions.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {inv.number} · {inv.recipientName} · {Number(inv.total).toFixed(2)} €
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Empfänger */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Empfänger</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-500">Name *</label>
              <RecipientAutocomplete
                value={recipientName}
                onChange={setRecipientName}
                onSelect={(r) => {
                  setRecipientName(r.name);
                  setRecipientCompany(r.company);
                  setRecipientStreet(r.street);
                  setRecipientZip(r.zip);
                  setRecipientCity(r.city);
                  setRecipientEmail(r.email);
                }}
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300 placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Firma (optional)</label>
              <input value={recipientCompany} onChange={e => setRecipientCompany(e.target.value)} placeholder="Musterfirma GmbH"
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300 placeholder:text-slate-600" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Straße</label>
              <input value={recipientStreet} onChange={e => setRecipientStreet(e.target.value)} placeholder="Musterstraße 1"
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300 placeholder:text-slate-600" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500">PLZ</label>
                <input value={recipientZip} onChange={e => setRecipientZip(e.target.value)} placeholder="68642"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300 placeholder:text-slate-600" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Stadt</label>
                <input value={recipientCity} onChange={e => setRecipientCity(e.target.value)} placeholder="Bürstadt"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300 placeholder:text-slate-600" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500">E-Mail</label>
              <input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} placeholder="kunde@beispiel.de"
                className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300 placeholder:text-slate-600" />
            </div>
            <div>
              {!isDelivery && (
                <>
                  <label className="text-xs text-slate-500">{isDunning ? "Neue Fälligkeit" : "Fällig am"}</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" />
                </>
              )}
              {isDelivery && (
                <>
                  <label className="text-xs text-slate-500">Lieferdatum</label>
                  <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Positionen */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Positionen</p>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex gap-2 items-center">
                <AutocompleteInput
                  value={item.description}
                  onChange={v => updateItem(item.id, "description", v)}
                  placeholder="Beschreibung (Tab zum Ausfüllen)"
                  className="flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300 placeholder:text-slate-600"
                />
                <input type="number" value={item.quantity} min={1} onChange={e => updateItem(item.id, "quantity", e.target.value)}
                  className="w-16 rounded-xl border border-white/10 bg-slate-900 px-2 py-2 text-sm text-white outline-none focus:border-cyan-300 text-center" title="Menge" />
                <select value={item.unit} onChange={e => updateItem(item.id, "unit", e.target.value)}
                  className="w-24 rounded-xl border border-white/10 bg-slate-900 px-2 py-2 text-sm text-white outline-none focus:border-cyan-300">
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
                {!isDelivery && (
                  <>
                    <div className="relative">
                      <input type="number" value={item.unitPrice} min={0} step={0.01} onChange={e => updateItem(item.id, "unitPrice", e.target.value)}
                        className="w-24 rounded-xl border border-white/10 bg-slate-900 pl-3 pr-7 py-2 text-sm text-white outline-none focus:border-cyan-300" title="Einzelpreis" />
                      <span className="absolute right-2.5 top-2 text-xs text-slate-500">€</span>
                    </div>
                    <span className="w-20 text-right text-sm text-slate-300 tabular-nums">
                      {(item.quantity * item.unitPrice).toFixed(2)} €
                    </span>
                  </>
                )}
                <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
                  className="text-slate-600 hover:text-red-400 transition text-lg leading-none" title="Entfernen">×</button>
              </div>
            ))}
          </div>
          <button onClick={() => setItems(prev => [...prev, newItem()])} className="text-xs text-cyan-300 hover:text-cyan-200 transition">
            + Position hinzufügen
          </button>
          {!isDelivery && (
            <div className="flex justify-end pt-2">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
                <span className="text-slate-400">Gesamt: </span>
                <span className="font-bold text-white">{total.toFixed(2)} €</span>
                <span className="ml-2 text-xs text-slate-500">(netto, §19 UStG)</span>
              </div>
            </div>
          )}
        </div>

        {/* Notizen */}
        <div>
          <label className="text-xs text-slate-500">Notizen / Zahlungsbedingungen</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="z.B. Bitte überweisen Sie den Betrag auf folgendes Konto…"
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300 placeholder:text-slate-600 resize-none" />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="rounded-2xl bg-cyan-300 px-6 py-2 text-sm font-medium text-slate-950 hover:scale-105 transition disabled:opacity-50">
            {saving ? "Speichern…" : "Speichern"}
          </button>
          <button onClick={() => setView("list")}
            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-2 text-sm text-slate-300 hover:text-white transition">
            Abbrechen
          </button>
        </div>
      </div>
    );
  }

  // ─── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Jahresübersicht */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-slate-400">Einnahmen {filterYear} (bezahlt)</p>
          <p className="mt-1.5 text-2xl font-bold text-green-300">{yearRevenue.toFixed(2)} €</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-slate-400">Rechnungen {filterYear}</p>
          <p className="mt-1.5 text-2xl font-bold text-white">{docs.filter(d => d.type === "INVOICE").length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-slate-400">Offen / Überfällig</p>
          <p className="mt-1.5 text-2xl font-bold text-yellow-300">
            {docs.filter(d => d.type === "INVOICE" && (d.status === "SENT" || d.status === "OVERDUE")).length}
          </p>
        </div>
      </div>

      {/* Aktionen + Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {["INVOICE", "DELIVERY_NOTE", "DUNNING"].map(t => (
            <button key={t} onClick={() => openCreate(t)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300">
              + {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-white outline-none">
            {[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-white outline-none">
            <option value="">Alle Typen</option>
            <option value="INVOICE">Rechnungen</option>
            <option value="DELIVERY_NOTE">Lieferscheine</option>
            <option value="DUNNING">Mahnungen</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-white outline-none">
            <option value="">Alle Status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Dokumentenliste */}
      {docs.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">Keine Dokumente gefunden.</p>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => (
            <div key={doc.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    doc.type === "INVOICE" ? "text-yellow-300 bg-yellow-400/10 border-yellow-400/20"
                    : doc.type === "DELIVERY_NOTE" ? "text-blue-300 bg-blue-400/10 border-blue-400/20"
                    : "text-red-300 bg-red-400/10 border-red-400/20"
                  }`}>
                    {TYPE_LABELS[doc.type]}
                  </span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[doc.status]}`}>
                    {STATUS_LABELS[doc.status]}
                  </span>
                  <span className="font-mono text-sm font-semibold text-white">{doc.number}</span>
                  <span className="text-sm text-slate-300">{doc.recipientName}</span>
                  {doc.type !== "DELIVERY_NOTE" && (
                    <span className="text-sm font-medium text-white">{Number(doc.total).toFixed(2)} €</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status-Aktionen */}
                  {doc.type === "INVOICE" && doc.status === "DRAFT" && (
                    <button onClick={() => updateStatus(doc.id, "SENT")}
                      className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300 hover:bg-cyan-400/20 transition">
                      Als Gesendet markieren
                    </button>
                  )}
                  {doc.type === "INVOICE" && doc.status === "SENT" && (
                    <>
                      <button onClick={() => updateStatus(doc.id, "PAID")}
                        className="rounded-xl border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs text-green-300 hover:bg-green-400/20 transition">
                        Bezahlt
                      </button>
                      <button onClick={() => updateStatus(doc.id, "OVERDUE")}
                        className="rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-1 text-xs text-red-400 hover:bg-red-400/10 transition">
                        Überfällig
                      </button>
                    </>
                  )}
                  <button onClick={() => openEdit(doc)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:text-white transition">
                    Bearbeiten
                  </button>
                  <Link href={`/buchhaltung/${doc.id}`} target="_blank"
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:text-white transition">
                    Drucken
                  </Link>
                  <button onClick={() => handleDelete(doc.id)}
                    className="rounded-xl border border-red-400/10 bg-red-400/5 px-3 py-1 text-xs text-red-400 hover:bg-red-400/10 transition">
                    Löschen
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {new Date(doc.createdAt).toLocaleDateString("de-DE")}
                {doc.dueDate && ` · Fällig: ${new Date(doc.dueDate).toLocaleDateString("de-DE")}`}
                {doc.deliveryDate && ` · Lieferung: ${new Date(doc.deliveryDate).toLocaleDateString("de-DE")}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
