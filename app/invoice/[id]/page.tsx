import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PrintButton from "@/components/PrintButton";

type PageProps = { params: Promise<{ id: string }> };

type InvoiceItem = { id: string; description: string; quantity: number; unitPrice: number };

export default async function InvoicePrintPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { order: { include: { customer: true } } },
  });
  if (!invoice) notFound();

  const role = session.user?.role;
  const isStaff = role === "ADMIN" || role === "SUPERVISOR" || role === "STAFF";

  if (!isStaff) {
    const customer = await prisma.customer.findFirst({ where: { userId: session.user!.id } });
    if (!customer || invoice.order.customerId !== customer.id || !invoice.isSentToCustomer) {
      redirect("/kundenportal");
    }
  }

  const customer = invoice.order.customer;
  const items = invoice.items as InvoiceItem[];
  const isInvoice = invoice.type === "INVOICE";
  const docLabel = isInvoice ? "Rechnung" : "Angebot";
  const total = Number(invoice.total);
  const createdAt = new Date(invoice.createdAt).toLocaleDateString("de-DE");
  const quoteStatusLabel = invoice.quoteStatus === "ACCEPTED" ? "Angenommen" : invoice.quoteStatus === "REJECTED" ? "Abgelehnt" : "Offen";
  const quoteStatusColor = invoice.quoteStatus === "ACCEPTED" ? "#22c55e" : invoice.quoteStatus === "REJECTED" ? "#ef4444" : "#94a3b8";

  return (
    <>
      {/* Print-Button (nur auf Bildschirm) */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <a href={isStaff ? `/admin/orders/${invoice.orderId}` : "/kundenportal"}
          className="rounded-xl border border-white/20 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:text-white transition">
          ← Zurück
        </a>
        <PrintButton />
      </div>

      {/* Rechnungsinhalt */}
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
              <div className="text-sm text-gray-500 mt-1 font-mono">{invoice.number}</div>
            </div>
          </div>

          {/* Trennlinie */}
          <div className="border-t border-gray-200 mb-8" />

          {/* Rechnungsinfos + Empfänger */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{isInvoice ? "Rechnungsempfänger" : "Empfänger"}</p>
              <p className="text-sm leading-6">
                <strong>{customer.firstName} {customer.lastName}</strong><br />
                {customer.street && <>{customer.street}<br /></>}
                {customer.zipCode && customer.city && <>{customer.zipCode} {customer.city}<br /></>}
                {customer.email}<br />
                {customer.phone}
              </p>
            </div>
            <div className="text-right">
              <table className="ml-auto text-sm">
                <tbody>
                  <tr>
                    <td className="text-gray-400 pr-4">Datum:</td>
                    <td className="font-medium">{createdAt}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-400 pr-4">Dokument-Nr.:</td>
                    <td className="font-mono font-medium">{invoice.number}</td>
                  </tr>
                  <tr>
                    <td className="text-gray-400 pr-4">Auftrag:</td>
                    <td className="font-medium">{invoice.order.orderNumber}</td>
                  </tr>
                  {isInvoice && invoice.dueDate && (
                    <tr>
                      <td className="text-gray-400 pr-4">Fällig am:</td>
                      <td className="font-medium text-red-600">
                        {new Date(invoice.dueDate).toLocaleDateString("de-DE")}
                      </td>
                    </tr>
                  )}
                  {!isInvoice && invoice.expiresAt && (
                    <tr>
                      <td className="text-gray-400 pr-4">Gültig bis:</td>
                      <td className="font-medium">
                        {new Date(invoice.expiresAt).toLocaleDateString("de-DE")}
                      </td>
                    </tr>
                  )}
                  {!isInvoice && (
                    <tr>
                      <td className="text-gray-400 pr-4">Status:</td>
                      <td className="font-medium" style={{ color: quoteStatusColor }}>{quoteStatusLabel}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Betreff */}
          <p className="text-sm font-semibold mb-6">
            {docLabel} für: {invoice.order.title}
          </p>

          {/* Positionen */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 text-gray-500 font-medium">Position</th>
                <th className="text-right py-2 text-gray-500 font-medium w-16">Menge</th>
                <th className="text-right py-2 text-gray-500 font-medium w-24">Einzelpreis</th>
                <th className="text-right py-2 text-gray-500 font-medium w-24">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id ?? i} className="border-b border-gray-100">
                  <td className="py-3">{item.description}</td>
                  <td className="py-3 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-3 text-right tabular-nums">{Number(item.unitPrice).toFixed(2)} €</td>
                  <td className="py-3 text-right tabular-nums font-medium">
                    {(item.quantity * item.unitPrice).toFixed(2)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summe */}
          <div className="flex justify-end mb-6">
            <div className="w-64">
              <div className="flex justify-between border-t-2 border-gray-900 pt-3">
                <span className="font-bold text-base">Gesamtbetrag</span>
                <span className="font-bold text-base tabular-nums">{total.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Notizen */}
          {invoice.notes && (
            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 text-xs text-gray-400 space-y-1">
            <p>Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).</p>
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
