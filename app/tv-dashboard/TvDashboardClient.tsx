"use client";

import { useEffect, useState, useCallback } from "react";

const STATUS_LABELS: Record<string, string> = {
  REQUEST_RECEIVED: "Anfrage",
  CONSULTATION: "Beratung",
  PARTS_SELECTION: "Teile wählen",
  AWAITING_CUSTOMER_CONFIRMATION: "Wartet auf Kunde",
  PARTS_ORDERED: "Teile bestellt",
  PARTS_ARRIVED: "Teile da",
  ASSEMBLY: "Zusammenbau",
  WINDOWS_DRIVERS_TESTS: "Windows / Tests",
  COMPLETED: "Fertig",
  PICKED_UP: "Abgeholt",
  DELIVERED: "Geliefert",
  PAUSED: "Pausiert",
};

const STATUS_COLOR: Record<string, string> = {
  REQUEST_RECEIVED: "#60a5fa",
  CONSULTATION: "#a78bfa",
  PARTS_SELECTION: "#fbbf24",
  AWAITING_CUSTOMER_CONFIRMATION: "#fb923c",
  PARTS_ORDERED: "#22d3ee",
  PARTS_ARRIVED: "#2dd4bf",
  ASSEMBLY: "#818cf8",
  WINDOWS_DRIVERS_TESTS: "#c084fc",
  COMPLETED: "#4ade80",
  PICKED_UP: "#4ade80",
  DELIVERED: "#4ade80",
  PAUSED: "#f87171",
};

type Stats = {
  activeOrders: number;
  completedOrders: number;
  totalOrders: number;
  completionRate: number;
  totalRevenue: number;
  totalCustomers: number;
  newContactRequests: number;
  pendingReviews: number;
  totalVisitors: number;
  todayVisitors: number;
  weekVisitors: number;
  monthVisitors: number;
  dueMaintenance: number;
  openBillingInvoices: number;
  openQuotes: number;
  recentOrders: { orderNumber: string; title: string; status: string; customer: { firstName: string; lastName: string } }[];
  fetchedAt: string;
};

function Tile({
  label, value, sub, alert, accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  alert?: boolean;
  accent?: string;
}) {
  return (
    <div
      className="flex flex-col justify-between rounded-3xl p-6"
      style={{
        background: alert ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${alert ? "rgba(239,68,68,0.35)" : accent ? `${accent}33` : "rgba(255,255,255,0.1)"}`,
      }}
    >
      <p className="text-xl font-medium" style={{ color: "#94a3b8" }}>{label}</p>
      <p
        className="mt-2 font-black leading-none tabular-nums"
        style={{
          fontSize: "clamp(2.5rem, 4vw, 4rem)",
          color: alert ? "#f87171" : accent ?? "#ffffff",
        }}
      >
        {value}
      </p>
      {sub && <p className="mt-2 text-lg" style={{ color: "#64748b" }}>{sub}</p>}
    </div>
  );
}

export default function TvDashboardClient({ token }: { token: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);
  const [lastOk, setLastOk] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/tv-dashboard?token=${encodeURIComponent(token)}`, {
        cache: "no-store",
      });
      if (!res.ok) { setError(true); return; }
      const data: Stats = await res.json();
      setStats(data);
      setLastOk(new Date());
      setError(false);
    } catch {
      setError(true);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 30_000);
    return () => clearInterval(id);
  }, [fetchStats]);

  const now = lastOk
    ? lastOk.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "–";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#020617", color: "#f1f5f9", fontFamily: "system-ui, sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-10 pt-8 pb-4">
        <div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
            Dukart Systems
          </h1>
          <p style={{ color: "#475569", fontSize: "1.1rem", marginTop: "2px" }}>Live Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          {error && (
            <span
              style={{
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.4)",
                color: "#f87171",
                borderRadius: "999px",
                padding: "6px 18px",
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              Verbindungsfehler – warte auf Reconnect…
            </span>
          )}
          <div style={{ textAlign: "right" }}>
            <p style={{ color: "#334155", fontSize: "1rem" }}>Zuletzt aktualisiert</p>
            <p style={{ color: "#67e8f9", fontSize: "1.3rem", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {now}
            </p>
          </div>
        </div>
      </div>

      {/* Main grid */}
      {stats ? (
        <div className="flex-1 flex flex-col gap-5 px-10 pb-8">

          {/* Row 1 — Hauptzahlen */}
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <Tile
              label="Aktive Aufträge"
              value={stats.activeOrders}
              sub={`von ${stats.totalOrders} gesamt`}
              accent="#67e8f9"
            />
            <Tile
              label="Umsatz (abgeschlossen)"
              value={`${stats.totalRevenue.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
              sub={`${stats.completionRate} % Abschlussrate`}
              accent="#4ade80"
            />
            <Tile
              label="Kunden gesamt"
              value={stats.totalCustomers}
              accent="#a78bfa"
            />
            <Tile
              label="Neue Anfragen"
              value={stats.newContactRequests}
              alert={stats.newContactRequests > 0}
              accent="#fbbf24"
            />
          </div>

          {/* Row 2 — Sekundäre Stats */}
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <Tile
              label="Besucher heute"
              value={stats.todayVisitors}
              sub={`Diese Woche: ${stats.weekVisitors}`}
              accent="#67e8f9"
            />
            <Tile
              label="Wartungen fällig (14d)"
              value={stats.dueMaintenance}
              alert={stats.dueMaintenance > 0}
              accent="#f59e0b"
            />
            <Tile
              label="Offene Rechnungen"
              value={stats.openBillingInvoices}
              alert={stats.openBillingInvoices > 0}
              accent="#fb923c"
            />
            <Tile
              label="Bewertungen ausstehend"
              value={stats.pendingReviews}
              sub={`Besucher gesamt: ${stats.totalVisitors.toLocaleString("de-DE")}`}
              accent={stats.pendingReviews > 0 ? "#fbbf24" : undefined}
            />
          </div>

          {/* Row 3 — Aktive Aufträge Liste */}
          <div
            className="flex-1 rounded-3xl p-6"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p style={{ color: "#475569", fontSize: "1.1rem", fontWeight: 600, marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Laufende Aufträge
            </p>
            {stats.recentOrders.length === 0 ? (
              <p style={{ color: "#334155", fontSize: "1.5rem" }}>Keine aktiven Aufträge.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "12px",
                }}
              >
                {stats.recentOrders.map((o) => (
                  <div
                    key={o.orderNumber}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderLeft: `4px solid ${STATUS_COLOR[o.status] ?? "#475569"}`,
                      borderRadius: "16px",
                      padding: "14px 16px",
                    }}
                  >
                    <p style={{ color: "#67e8f9", fontSize: "0.9rem", fontFamily: "monospace", fontWeight: 700 }}>
                      {o.orderNumber}
                    </p>
                    <p style={{ color: "#f1f5f9", fontSize: "1rem", fontWeight: 600, marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {o.title}
                    </p>
                    <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "2px" }}>
                      {o.customer.firstName} {o.customer.lastName}
                    </p>
                    <p
                      style={{
                        marginTop: "8px",
                        display: "inline-block",
                        background: `${STATUS_COLOR[o.status] ?? "#475569"}22`,
                        border: `1px solid ${STATUS_COLOR[o.status] ?? "#475569"}55`,
                        color: STATUS_COLOR[o.status] ?? "#94a3b8",
                        borderRadius: "999px",
                        padding: "2px 10px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                    >
                      {STATUS_LABELS[o.status] ?? o.status}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : !error ? (
        <div className="flex-1 flex items-center justify-center">
          <p style={{ color: "#334155", fontSize: "2rem" }}>Lade Daten…</p>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p style={{ color: "#475569", fontSize: "1.5rem" }}>Verbindung unterbrochen – versuche erneut in 30s…</p>
        </div>
      )}
    </div>
  );
}
