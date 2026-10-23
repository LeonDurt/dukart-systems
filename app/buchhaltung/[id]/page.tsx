import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PrintButton from "@/components/PrintButton";

type PageProps = { params: Promise<{ id: string }> };
type Item = { description: string; quantity: number; unit: string; unitPrice: number };

const TYPE_LABELS: Record<string, string> = {
  INVOICE: "Rechnung",
  DELIVERY_NOTE: "Lieferschein",
  DUNNING: "Mahnung",
};

const TYPE_PREFIXES: Record<string, string> = {
  INVOICE: "RE",
  DELIVERY_NOTE: "LS",
  DUNNING: "MA",
};

export default async function BillingPrintPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") redirect("/admin/orders");

  const doc = await prisma.billingDocument.findUnique({
    where: { id },
    include: { relatedInvoice: true },
  });
  if (!doc) notFound();

  const items = doc.items as Item[];
  const total = Number(doc.total);
  const docLabel = TYPE_LABELS[doc.type] ?? doc.type;
  const isDeliveryNote = doc.type === "DELIVERY_NOTE";
  const isDunning = doc.type === "DUNNING";
  const issueDate = new Date(doc.issueDate).toLocaleDateString("de-DE");

  return (
    <>
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <a
          href="/admin/buchhaltung"
          className="rounded-xl border border-white/20 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:text-white transition"
        >
          ← Zurück
        </a>
        <PrintButton />
      </div>

      <div className="min-h-screen bg-white text-gray-900 p-0">
        <div className="max-w-3xl mx-auto px-10 py-12 print:px-8 print:py-8">

          {/* Header */}
          <div className="flex justify-between items-start mb-10">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dukart Systems</h1>
              <p className="text-sm text-gray-500 mt-1">
                Im Sonneneck 12 · 68642 Bürstadt<br />
                kontakt@dukartsystems.de · +49 162 7263133
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{docLabel}</div>
              <div className="text-sm text-gray-500 mt-1 font-mono">{doc.number}</div>
            </div>
          </div>

          <div className="border-t border-gray-200 mb-8" />

          {/* Empfänger + Metadaten */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Empfänger</p>
              <p className="text-sm leading-6">
                {doc.recipientCompany && <><strong>{doc.recipientCompany}</strong><br /></>}
                <strong>{doc.recipientName}</strong><br />
                {doc.recipientStreet && <>{doc.recipientStreet}<br /></>}
                {doc.recipientZip && doc.recipientCity && <>{doc.recipientZip} {doc.recipientCity}<br /></>}
                {doc.recipientEmail && <>{doc.recipientEmail}</>}
              </p>
            </div>
            <div className="text-right">
              <table className="ml-auto text-sm">
                <tbody>
                  <tr>
                    <td className="text-gray-400 pr-4">Datum:</td>
                    <td className="font-medium">{issueDate}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-400 pr-4">Nummer:</td>
                    <td className="font-mono font-medium">{doc.number}</td>
                  </tr>
                  {!isDeliveryNote && doc.dueDate && (
                    <tr>
                      <td className="text-gray-400 pr-4">{isDunning ? "Neue Fälligkeit:" : "Fällig am:"}</td>
                      <td className="font-medium text-red-600">
                        {new Date(doc.dueDate).toLocaleDateString("de-DE")}
                      </td>
                    </tr>
                  )}
                  {isDeliveryNote && doc.deliveryDate && (
                    <tr>
                      <td className="text-gray-400 pr-4">Lieferdatum:</td>
                      <td className="font-medium">
                        {new Date(doc.deliveryDate).toLocaleDateString("de-DE")}
                      </td>
                    </tr>
                  )}
                  {isDunning && doc.relatedInvoice && (
                    <tr>
                      <td className="text-gray-400 pr-4">Bezieht sich auf:</td>
                      <td className="font-mono font-medium">{doc.relatedInvoice.number}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mahnung-Hinweis */}
          {isDunning && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800 mb-1">Zahlungserinnerung</p>
              <p className="text-sm text-red-700">
                Trotz unserer Rechnung{doc.relatedInvoice ? ` ${doc.relatedInvoice.number}` : ""} ist der unten genannte Betrag bisher nicht bei uns eingegangen.
                Wir bitten Sie, die offene Zahlung bis zum oben genannten Datum zu begleichen.
              </p>
            </div>
          )}

          {/* Positionen */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 text-gray-500 font-medium">Position</th>
                <th className="text-right py-2 text-gray-500 font-medium w-16">Menge</th>
                <th className="text-right py-2 text-gray-500 font-medium w-16">Einheit</th>
                {!isDeliveryNote && (
                  <>
                    <th className="text-right py-2 text-gray-500 font-medium w-24">Einzelpreis</th>
                    <th className="text-right py-2 text-gray-500 font-medium w-24">Gesamt</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3">{item.description}</td>
                  <td className="py-3 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-500">{item.unit || "Stk."}</td>
                  {!isDeliveryNote && (
                    <>
                      <td className="py-3 text-right tabular-nums">{Number(item.unitPrice).toFixed(2)} €</td>
                      <td className="py-3 text-right tabular-nums font-medium">
                        {(item.quantity * item.unitPrice).toFixed(2)} €
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summe (nicht bei Lieferschein) */}
          {!isDeliveryNote && (
            <div className="flex justify-end mb-6">
              <div className="w-64">
                <div className="flex justify-between border-t-2 border-gray-900 pt-3">
                  <span className="font-bold text-base">Gesamtbetrag</span>
                  <span className="font-bold text-base tabular-nums">{total.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          )}

          {/* Notizen */}
          {doc.notes && (
            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{doc.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 text-xs text-gray-400 space-y-1">
            {!isDeliveryNote && (
              <p>Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).</p>
            )}
            <p>Dukart Systems · David Dukart · Im Sonneneck 12 · 68642 Bürstadt · kontakt@dukartsystems.de</p>
          </div>

        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 15mm; }
          body { background: white !important; }
        }
      `}</style>
    </>
  );
}
