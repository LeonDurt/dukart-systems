"use client";

import { useState } from "react";

type Step = "form" | "confirm" | "done";

export default function WiderrufForm() {
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [contractDescription, setContractDescription] = useState("");

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !contractDescription.trim()) {
      setError("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
      return;
    }
    setStep("confirm");
  }

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/widerruf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, orderNumber, contractDescription }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Ein Fehler ist aufgetreten.");
        setStep("form");
        return;
      }
      setStep("done");
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
      setStep("form");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "#f1f5f9",
    fontSize: "1rem",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "6px",
    color: "#94a3b8",
    fontSize: "0.9rem",
  };

  if (step === "done") {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✓</div>
        <h3 style={{ color: "#4ade80", fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
          Widerruf erfolgreich übermittelt
        </h3>
        <p style={{ color: "#94a3b8", marginTop: "12px" }}>
          Wir haben Ihnen eine Bestätigung an <strong style={{ color: "#f1f5f9" }}>{email}</strong> gesendet.
          Ihr Widerruf ist gemäß § 355 BGB wirksam zugegangen.
        </p>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div>
        <h3 style={{ color: "#f1f5f9", fontSize: "1.25rem", fontWeight: 700, marginTop: 0, marginBottom: "20px" }}>
          Widerruf bestätigen
        </h3>
        <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
          Bitte prüfen Sie Ihre Angaben und bestätigen Sie den Widerruf.
        </p>

        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            {[
              ["Name", `${firstName} ${lastName}`],
              ["E-Mail", email],
              ...(orderNumber ? [["Auftragsnummer", orderNumber]] : []),
              ["Vertragsgegenstand", contractDescription],
            ].map(([k, v]) => (
              <tr key={k}>
                <td style={{ padding: "8px 0", color: "#64748b", width: "180px", verticalAlign: "top" }}>{k}</td>
                <td style={{ padding: "8px 0", color: "#f1f5f9" }}>{v}</td>
              </tr>
            ))}
          </table>
        </div>

        {error && (
          <p style={{ color: "#f87171", marginBottom: "16px", fontSize: "0.9rem" }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setStep("form")}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "#94a3b8",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Zurück
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              flex: 2,
              padding: "14px",
              borderRadius: "10px",
              border: "none",
              background: loading ? "#374151" : "#ef4444",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Wird übermittelt…" : "Widerruf bestätigen"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleNext} noValidate>
      <h3 style={{ color: "#f1f5f9", fontSize: "1.25rem", fontWeight: 700, marginTop: 0, marginBottom: "20px" }}>
        Widerrufsformular
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={labelStyle}>Vorname *</label>
          <input
            style={inputStyle}
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="Max"
            autoComplete="given-name"
          />
        </div>
        <div>
          <label style={labelStyle}>Nachname *</label>
          <input
            style={inputStyle}
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="Mustermann"
            autoComplete="family-name"
          />
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>E-Mail-Adresse *</label>
        <input
          type="email"
          style={inputStyle}
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="max@beispiel.de"
          autoComplete="email"
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Auftragsnummer (falls vorhanden)</label>
        <input
          style={inputStyle}
          value={orderNumber}
          onChange={e => setOrderNumber(e.target.value)}
          placeholder="z.B. ORD-2026-001"
        />
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label style={labelStyle}>Vertragsgegenstand / Beschreibung der Leistung *</label>
        <textarea
          style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
          value={contractDescription}
          onChange={e => setContractDescription(e.target.value)}
          placeholder="z.B. PC-Zusammenbau, Wartungsvertrag, Webseite …"
        />
      </div>

      {error && (
        <p style={{ color: "#f87171", marginBottom: "16px", fontSize: "0.9rem" }}>{error}</p>
      )}

      <button
        type="submit"
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "10px",
          border: "none",
          background: "#ef4444",
          color: "#fff",
          fontSize: "1rem",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Weiter zur Bestätigung →
      </button>

      <p style={{ color: "#475569", fontSize: "0.8rem", marginTop: "12px", textAlign: "center" }}>
        Es werden nur für den Widerruf notwendige Daten erhoben. Die Angabe eines Grundes ist nicht erforderlich.
      </p>
    </form>
  );
}
