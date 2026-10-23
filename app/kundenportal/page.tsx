import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { OrderPart, OrderUpdate } from "@prisma/client";
import CustomerChat from "@/components/CustomerChat";
import AutoRefresh from "@/components/AutoRefresh";
import QuoteResponse from "@/components/QuoteResponse";

const statusSteps = [
  "REQUEST_RECEIVED","CONSULTATION","PARTS_SELECTION",
  "AWAITING_CUSTOMER_CONFIRMATION","PARTS_ORDERED","PARTS_ARRIVED",
  "ASSEMBLY","WINDOWS_DRIVERS_TESTS","COMPLETED",
];

const statusLabels: Record<string, string> = {
  REQUEST_RECEIVED: "Anfrage eingegangen",
  CONSULTATION: "Beratung",
  PARTS_SELECTION: "Teile auswählen",
  AWAITING_CUSTOMER_CONFIRMATION: "Warten auf Bestätigung",
  PARTS_ORDERED: "Teile bestellt",
  PARTS_ARRIVED: "Teile angekommen",
  ASSEMBLY: "Zusammenbau",
  WINDOWS_DRIVERS_TESTS: "Windows, Treiber & Tests",
  COMPLETED: "Fertig",
  PICKED_UP: "Abgeholt",
  DELIVERED: "Geliefert",
  PAUSED: "Pausiert",
};

type PageProps = {
  searchParams: Promise<{ auftrag?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user?.role;
  if (role === "ADMIN" || role === "STAFF" || role === "SUPERVISOR") redirect("/admin/orders");

  const customer = await prisma.customer.findFirst({ where: { userId: session.user!.id } });

  if (!customer) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white flex items-center justify-center">
        <div className="max-w-md text-center rounded-3xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-2xl font-bold">Kein Kundenprofil</h1>
          <p className="mt-3 text-slate-400">Dein Account ist noch nicht verknüpft. Bitte kontaktiere uns.</p>
        </div>
      </main>
    );
  }

  const { auftrag: selectedOrderId } = await searchParams;

  // Alle gesendeten Rechnungen/Angebote des Kunden (auch aus archivierten Aufträgen)
  const allInvoices = await prisma.invoice.findMany({
    where: { isSentToCustomer: true, order: { customerId: customer.id } },
    include: { order: { select: { orderNumber: true, title: true, isArchived: true } } },
    orderBy: { createdAt: "desc" },
  });

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id, isArchived: false },
    include: {
      parts: true,
      updates: { where: { isVisibleToCustomer: true }, orderBy: { createdAt: "desc" } },
      invoices: { where: { isSentToCustomer: true }, orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Ausgewählter Auftrag: URL-Param → neuester aktiver → neuester gesamt
  const activeOrders = orders.filter(o => !o.isCompleted && o.status !== "PICKED_UP" && o.status !== "DELIVERED");
  const selectedOrder = orders.find(o => o.id === selectedOrderId)
    ?? activeOrders[0]
    ?? orders[0]
    ?? null;

  const currentStepIndex = selectedOrder ? statusSteps.indexOf(selectedOrder.status) : -1;
  const isFinished = selectedOrder
    ? selectedOrder.isCompleted || selectedOrder.status === "PICKED_UP" || selectedOrder.status === "DELIVERED"
    : false;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <AutoRefresh intervalMs={12000} />
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Meine Aufträge</h1>
            <p className="mt-1 text-slate-400">
              Willkommen, <span className="text-white font-medium">{customer.firstName} {customer.lastName}</span>
            </p>
          </div>
          <Link href="/kundenportal/profile"
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 font-bold text-sm">
              {customer.firstName[0]}
            </div>
            <span className="hidden sm:block">{customer.firstName}</span>
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-slate-300">Noch kein Auftrag vorhanden.</p>
            <p className="mt-2 text-sm text-slate-500">Sobald wir deinen Auftrag anlegen, erscheint er hier.</p>
          </div>
        ) : (
          <>
            {/* Auftrags-Tabs bei mehreren Aufträgen */}
            {orders.length > 1 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {orders.map(o => (
                  <Link
                    key={o.id}
                    href={`/kundenportal?auftrag=${o.id}`}
                    className={`rounded-2xl border px-4 py-2 text-sm transition ${
                      selectedOrder?.id === o.id
                        ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                        : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="font-mono text-xs">{o.orderNumber}</span>
                    <span className="ml-2">{o.title.length > 20 ? o.title.slice(0, 20) + "…" : o.title}</span>
                    {(o.isCompleted || o.status === "PICKED_UP" || o.status === "DELIVERED") && (
                      <span className="ml-2 text-green-400 text-xs">✓</span>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {selectedOrder && (
              <>
                {/* Status-Kacheln */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs text-slate-400">Auftragsnummer</p>
                    <p className="mt-1.5 text-lg font-semibold font-mono">{selectedOrder.orderNumber}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs text-slate-400">Status</p>
                    <p className="mt-1.5 text-sm font-semibold">{statusLabels[selectedOrder.status] ?? selectedOrder.status}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs text-slate-400">Preis</p>
                    <p className="mt-1.5 text-lg font-semibold">
                      {selectedOrder.finalPrice ? `${selectedOrder.finalPrice} €` : <span className="text-slate-500">Noch offen</span>}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs text-slate-400">Fertigstellung</p>
                    <p className="mt-1.5 text-sm font-semibold">
                      {selectedOrder.estimatedCompletionDate
                        ? new Date(selectedOrder.estimatedCompletionDate).toLocaleDateString("de-DE")
                        : <span className="text-slate-500">Noch offen</span>}
                    </p>
                  </div>
                </div>

                {/* Fortschritt (nur bei nicht abgeschlossenen) */}
                {!isFinished && (
                  <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6">
                    <h2 className="mb-4 text-lg font-semibold">Fortschritt</h2>
                    <div className="relative mb-4 h-2 w-full rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-cyan-400 transition-all"
                        style={{ width: `${currentStepIndex >= 0 ? (currentStepIndex / (statusSteps.length - 1)) * 100 : 0}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {statusSteps.map((step, index) => {
                        const isActive = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        return (
                          <div key={step}
                            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs ${
                              isActive ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-slate-400"
                            } ${isCurrent ? "ring-2 ring-cyan-200/40" : ""}`}>
                            <span className="font-bold">{isActive ? "✔" : index + 1}</span>
                            <span className="whitespace-nowrap">{statusLabels[step]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Abgeschlossen-Banner */}
                {isFinished && (
                  <div className="mb-6 rounded-3xl border border-green-400/20 bg-green-400/5 p-6 text-center">
                    <p className="text-2xl font-bold text-green-300">Auftrag abgeschlossen</p>
                    <p className="mt-2 text-sm text-slate-400">
                      {selectedOrder.status === "PICKED_UP" ? "Gerät wurde abgeholt." : selectedOrder.status === "DELIVERED" ? "Gerät wurde geliefert." : "Auftrag ist fertiggestellt."}
                    </p>
                  </div>
                )}

                {/* Pausiert-Banner */}
                {selectedOrder.status === "PAUSED" && (
                  <div className="mb-6 rounded-3xl border border-yellow-400/20 bg-yellow-400/5 p-4 text-center">
                    <p className="text-sm text-yellow-300">Dieser Auftrag ist aktuell pausiert. Wir melden uns sobald es weitergeht.</p>
                  </div>
                )}

                <div className="grid gap-6 lg:grid-cols-2 mb-6">
                  {/* Auftragsdetails */}
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <h2 className="mb-4 text-lg font-semibold">Auftragsdetails</h2>
                    <div className="space-y-2.5 text-sm text-slate-300">
                      <p><span className="text-white font-medium">Titel: </span>{selectedOrder.title}</p>
                      {selectedOrder.description && (
                        <p><span className="text-white font-medium">Beschreibung: </span>{selectedOrder.description}</p>
                      )}
                      <p>
                        <span className="text-white font-medium">Lieferung: </span>
                        {selectedOrder.fulfillmentType === "PICKUP" ? "Abholung" : selectedOrder.fulfillmentType === "SHIPPING" ? "Versand" : "—"}
                      </p>
                    </div>

                    {/* Updates */}
                    {selectedOrder.updates.length > 0 && (
                      <div className="mt-5 space-y-3">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Updates</p>
                        {selectedOrder.updates.slice(0, 3).map((update: OrderUpdate) => (
                          <div key={update.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-white text-sm">{update.title}</p>
                              <span className="shrink-0 text-xs text-slate-500">
                                {new Date(update.createdAt).toLocaleDateString("de-DE")}
                              </span>
                            </div>
                            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">{update.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Teile */}
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <h2 className="mb-4 text-lg font-semibold">Komponenten</h2>
                    {selectedOrder.parts.length > 0 ? (
                      <div className="space-y-2">
                        {selectedOrder.parts.map((part: OrderPart) => (
                          <div key={part.id} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-medium text-white">{part.name}</p>
                              <p className="text-xs text-slate-400">
                                {part.category}
                                {part.quantity > 1 && ` · ${part.quantity}x`}
                              </p>
                            </div>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs ${
                              part.isArrived ? "bg-green-400/10 text-green-300"
                              : part.isOrdered ? "bg-yellow-400/10 text-yellow-300"
                              : "bg-white/10 text-slate-400"
                            }`}>
                              {part.isArrived ? "Angekommen" : part.isOrdered ? "Bestellt" : "Ausstehend"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Noch keine Komponenten hinterlegt.</p>
                    )}
                  </div>
                </div>

                {/* Rechnungen & Angebote */}
                {selectedOrder.invoices.length > 0 && (
                  <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6">
                    <h2 className="mb-4 text-lg font-semibold">Dokumente</h2>
                    <div className="space-y-3">
                      {selectedOrder.invoices.map((inv: any) => (
                        <div key={inv.id} className={`rounded-2xl border px-4 py-3 ${
                          inv.type === "QUOTE" && inv.quoteStatus === "OPEN"
                            ? "border-cyan-400/20 bg-cyan-400/5"
                            : "border-white/10 bg-slate-900/60"
                        }`}>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                inv.type === "INVOICE"
                                  ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
                                  : "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                              }`}>
                                {inv.type === "INVOICE" ? "Rechnung" : "Angebot"}
                              </span>
                              {inv.type === "QUOTE" && inv.quoteStatus !== "OPEN" && (
                                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                  inv.quoteStatus === "ACCEPTED"
                                    ? "border-green-400/20 bg-green-400/10 text-green-300"
                                    : "border-red-400/20 bg-red-400/10 text-red-400"
                                }`}>
                                  {inv.quoteStatus === "ACCEPTED" ? "Angenommen" : "Abgelehnt"}
                                </span>
                              )}
                              <span className="font-mono text-sm font-semibold">{inv.number}</span>
                              <span className="text-sm text-slate-300">{Number(inv.total).toFixed(2)} €</span>
                            </div>
                            <a
                              href={`/invoice/${inv.id}`}
                              target="_blank"
                              className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
                            >
                              Anzeigen & Herunterladen
                            </a>
                          </div>
                          {inv.type === "QUOTE" && inv.quoteStatus === "OPEN" && (
                            <div className="mt-3 border-t border-white/10 pt-3">
                              <p className="text-xs text-slate-400 mb-2">Möchtest du dieses Angebot annehmen oder ablehnen?</p>
                              <QuoteResponse
                                invoiceId={inv.id}
                                number={inv.number}
                                total={Number(inv.total)}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Chat */}
                <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h2 className="mb-1 text-lg font-semibold">Chat</h2>
                  <p className="mb-4 text-xs text-slate-500">Schreibe direkt mit unserem Team zu deinem Auftrag.</p>
                  <CustomerChat orderId={selectedOrder.id} currentUserId={session.user!.id} />
                </div>
              </>
            )}
          </>
        )}

        {/* Alle Dokumente – auch aus archivierten Aufträgen */}
        {allInvoices.length > 0 && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-1 text-lg font-semibold">Meine Dokumente</h2>
            <p className="mb-4 text-xs text-slate-500">Alle Rechnungen und Angebote – auch von abgeschlossenen Aufträgen.</p>
            <div className="space-y-2">
              {allInvoices.map((inv: any) => (
                <div key={inv.id} className={`rounded-2xl border px-4 py-3 ${
                  inv.type === "QUOTE" && inv.quoteStatus === "OPEN"
                    ? "border-cyan-400/20 bg-cyan-400/5"
                    : "border-white/10 bg-slate-900/60"
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        inv.type === "INVOICE"
                          ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
                          : "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                      }`}>
                        {inv.type === "INVOICE" ? "Rechnung" : "Angebot"}
                      </span>
                      {inv.type === "QUOTE" && inv.quoteStatus !== "OPEN" && (
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          inv.quoteStatus === "ACCEPTED"
                            ? "border-green-400/20 bg-green-400/10 text-green-300"
                            : "border-red-400/20 bg-red-400/10 text-red-400"
                        }`}>
                          {inv.quoteStatus === "ACCEPTED" ? "Angenommen" : "Abgelehnt"}
                        </span>
                      )}
                      <span className="font-mono text-sm font-semibold">{inv.number}</span>
                      <span className="text-sm text-slate-300">{Number(inv.total).toFixed(2)} €</span>
                      <span className="text-xs text-slate-500">
                        Auftrag {inv.order.orderNumber}
                        {inv.order.isArchived && <span className="ml-1 text-slate-600">(archiviert)</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-600">
                        {new Date(inv.createdAt).toLocaleDateString("de-DE")}
                      </span>
                      <a
                        href={`/invoice/${inv.id}`}
                        target="_blank"
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
                      >
                        Anzeigen & Herunterladen
                      </a>
                    </div>
                  </div>
                  {inv.type === "QUOTE" && inv.quoteStatus === "OPEN" && (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <p className="text-xs text-slate-400 mb-2">Möchtest du dieses Angebot annehmen oder ablehnen?</p>
                      <QuoteResponse
                        invoiceId={inv.id}
                        number={inv.number}
                        total={Number(inv.total)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
