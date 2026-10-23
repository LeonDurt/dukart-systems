import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import type { OrderPart, OrderUpdate } from "@prisma/client";
import CustomerChat from "@/components/CustomerChat";
import OrderActions from "@/components/OrderActions";
import OrderEditForm from "@/components/OrderEditForm";
import AutoRefresh from "@/components/AutoRefresh";
import InvoiceManager from "@/components/InvoiceManager";
import { sendEmail, orderStatusUpdateEmail } from "@/lib/email";
import { calendarOrderPartsArrived, calendarOrderHandover } from "@/lib/calendar";
import OrderAppointments from "@/components/OrderAppointments";

type PageProps = {
  params: Promise<{ id: string }>;
};

const statusLabels: Record<string, string> = {
  REQUEST_RECEIVED: "Anfrage eingegangen",
  CONSULTATION: "Beratung",
  PARTS_SELECTION: "Teile auswählen",
  AWAITING_CUSTOMER_CONFIRMATION: "Warten auf Bestätigung",
  PARTS_ORDERED: "Teile bestellt",
  PARTS_ARRIVED: "Teile angekommen",
  ASSEMBLY: "Zusammenbau",
  WINDOWS_DRIVERS_TESTS: "Windows / Treiber / Tests",
  COMPLETED: "Fertig",
  PICKED_UP: "Abgeholt",
  DELIVERED: "Geliefert",
  PAUSED: "Pausiert",
};

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user?.role;

  if (role !== "ADMIN" && role !== "STAFF" && role !== "SUPERVISOR") {
    redirect("/kundenportal");
  }

  const sessionUserId = session.user.id;
  const canEdit = role === "ADMIN" || role === "SUPERVISOR";

  const { id } = await params;

  async function updateOrderStatus(formData: FormData) {
    "use server";
    const status = formData.get("status") as string;
    const orderWithCustomer = await prisma.order.findUnique({
      where: { id },
      include: { customer: true },
    });
    await prisma.order.update({ where: { id }, data: { status: status as any } });
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/admin/orders");

    // Kalendereinträge je nach neuem Status
    if (orderWithCustomer) {
      const customerName = `${orderWithCustomer.customer.firstName} ${orderWithCustomer.customer.lastName}`;
      const orderInfo = { id, orderNumber: orderWithCustomer.orderNumber, title: orderWithCustomer.title, customerName };
      if (status === "PARTS_ARRIVED") calendarOrderPartsArrived(orderInfo);
      if (status === "PICKED_UP") calendarOrderHandover({ ...orderInfo, type: "Abholung" });
      if (status === "DELIVERED") calendarOrderHandover({ ...orderInfo, type: "Lieferung" });
    }

    // Status-E-Mail an Kunden senden (nur wenn Kunde eine E-Mail hat)
    if (orderWithCustomer?.customer.email) {
      const statusLabels: Record<string, string> = {
        REQUEST_RECEIVED: "Anfrage eingegangen",
        CONSULTATION: "In Beratung",
        PARTS_SELECTION: "Teile werden ausgewählt",
        AWAITING_CUSTOMER_CONFIRMATION: "Warten auf deine Bestätigung",
        PARTS_ORDERED: "Teile wurden bestellt",
        PARTS_ARRIVED: "Teile sind angekommen",
        ASSEMBLY: "Zusammenbau läuft",
        WINDOWS_DRIVERS_TESTS: "Windows / Treiber / Tests",
        COMPLETED: "Auftrag fertig – bereit zur Abholung",
        PICKED_UP: "Abgeholt",
        DELIVERED: "Geliefert",
        PAUSED: "Auftrag pausiert",
      };
      // Für bestimmte Status keine E-Mail senden (interne/unwichtige Status)
      const skipStatuses = ["REQUEST_RECEIVED"];
      if (!skipStatuses.includes(status)) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://dukartsystems.de";
        try {
          await sendEmail({
            to: orderWithCustomer.customer.email,
            subject: `Update zu deinem Auftrag – ${statusLabels[status] ?? status}`,
            html: orderStatusUpdateEmail({
              customerName: orderWithCustomer.customer.firstName,
              orderTitle: orderWithCustomer.title,
              orderNumber: orderWithCustomer.orderNumber,
              newStatus: status,
              statusLabel: statusLabels[status] ?? status,
              portalUrl: `${baseUrl}/kundenportal`,
            }),
          });
        } catch (err) {
          console.error("[STATUS EMAIL] Konnte nicht gesendet werden:", err);
        }
      }
    }
  }

  async function updateOrderPrice(formData: FormData) {
    "use server";
    const priceValue = formData.get("price") as string;
    await prisma.order.update({
      where: { id },
      data: { finalPrice: priceValue ? Number(priceValue) : null },
    });
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/admin/orders");
  }

  async function addOrderUpdate(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const isVisibleToCustomer = formData.get("isVisibleToCustomer") === "on";
    if (!title || !message) return;
    await prisma.orderUpdate.create({
      data: { orderId: id, authorUserId: sessionUserId, title, message, isVisibleToCustomer },
    });
    revalidatePath(`/admin/orders/${id}`);
  }

  async function addOrderPart(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const quantityValue = formData.get("quantity") as string;
    const unitPriceValue = formData.get("unitPrice") as string;
    const supplier = formData.get("supplier") as string;
    const isOrdered = formData.get("isOrdered") === "on";
    const isArrived = formData.get("isArrived") === "on";
    if (!name || !category) return;
    await prisma.orderPart.create({
      data: {
        orderId: id,
        name,
        category,
        quantity: quantityValue ? Number(quantityValue) : 1,
        unitPrice: unitPriceValue ? Number(unitPriceValue) : null,
        supplier: supplier || null,
        isOrdered,
        isArrived,
      },
    });
    revalidatePath(`/admin/orders/${id}`);
  }

  // Using .bind() to avoid the "last item gets updated" bug in server action loops
  async function togglePartOrdered(partId: string, currentValue: boolean, _formData: FormData) {
    "use server";
    const newValue = !currentValue;
    await prisma.orderPart.update({
      where: { id: partId },
      data: { isOrdered: newValue, orderedAt: newValue ? new Date() : null },
    });
    revalidatePath(`/admin/orders/${id}`);
  }

  async function togglePartArrived(partId: string, currentValue: boolean, _formData: FormData) {
    "use server";
    const newValue = !currentValue;
    await prisma.orderPart.update({
      where: { id: partId },
      data: { isArrived: newValue, arrivedAt: newValue ? new Date() : null },
    });
    revalidatePath(`/admin/orders/${id}`);
  }

  async function deletePart(partId: string, _formData: FormData) {
    "use server";
    await prisma.orderPart.delete({ where: { id: partId } });
    revalidatePath(`/admin/orders/${id}`);
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      parts: { orderBy: { createdAt: "asc" } },
      updates: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <AutoRefresh intervalMs={10000} />
      <div className="mx-auto max-w-7xl">
        {/* Header mit Back-Button */}
        <div className="mb-8 flex items-start gap-4">
          <Link
            href="/admin/orders"
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
          >
            ←
          </Link>
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">{order.title}</h1>
                <p className="mt-1 text-slate-400">
                  {order.orderNumber} ·{" "}
                  <span className="text-white">
                    {order.customer.firstName} {order.customer.lastName}
                  </span>
                  {" "}·{" "}
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${
                    order.status === "COMPLETED" || order.status === "PICKED_UP" || order.status === "DELIVERED"
                      ? "border-green-400/20 bg-green-400/10 text-green-300"
                      : order.status === "PAUSED"
                      ? "border-red-400/20 bg-red-400/10 text-red-300"
                      : "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                  }`}>
                    {statusLabels[order.status] ?? order.status}
                  </span>
                  {order.isArchived && (
                    <span className="ml-2 rounded-full border border-slate-400/20 bg-slate-400/10 px-2 py-0.5 text-xs text-slate-400">
                      Archiviert
                    </span>
                  )}
                </p>
              </div>
              <OrderActions
                orderId={order.id}
                isCompleted={order.isCompleted}
                isArchived={order.isArchived}
                canArchive={canEdit}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Linke Spalte: Kundendaten + Aktionen */}
          <div className="space-y-6">
            {/* Kundendaten */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-lg font-semibold">Kunde</h2>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Name</span>
                  <span className="text-white font-medium">{order.customer.firstName} {order.customer.lastName}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Nr.</span>
                  <span>{order.customer.customerNumber}</span>
                </div>
                <div className="flex justify-between gap-2 break-all">
                  <span className="text-slate-500 shrink-0">E-Mail</span>
                  <span className="text-right">{order.customer.email || "-"}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Telefon</span>
                  <span>{order.customer.phone || "-"}</span>
                </div>
                {order.finalPrice && (
                  <div className="flex justify-between gap-2 pt-2 border-t border-white/10">
                    <span className="text-slate-500">Preis</span>
                    <span className="font-semibold text-cyan-300">{order.finalPrice.toString()} €</span>
                  </div>
                )}
              </div>
            </div>

            {/* Auftragsdetails bearbeiten */}
            {canEdit && (
              <OrderEditForm
                orderId={order.id}
                initialTitle={order.title}
                initialDescription={order.description ?? null}
                initialEstimatedDate={order.estimatedCompletionDate?.toISOString() ?? null}
                initialFulfillmentType={order.fulfillmentType ?? null}
              />
            )}

            {/* Status ändern */}
            {canEdit && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="mb-4 text-lg font-semibold">Status ändern</h2>
                <form action={updateOrderStatus} className="space-y-3">
                  <select
                    name="status"
                    defaultValue={order.status}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300"
                  >
                    <option value="REQUEST_RECEIVED">Anfrage eingegangen</option>
                    <option value="CONSULTATION">Beratung</option>
                    <option value="PARTS_SELECTION">Teile auswählen</option>
                    <option value="AWAITING_CUSTOMER_CONFIRMATION">Warten auf Bestätigung</option>
                    <option value="PARTS_ORDERED">Teile bestellt</option>
                    <option value="PARTS_ARRIVED">Teile angekommen</option>
                    <option value="ASSEMBLY">Zusammenbau</option>
                    <option value="WINDOWS_DRIVERS_TESTS">Windows / Treiber / Tests</option>
                    <option value="COMPLETED">Fertig</option>
                    <option value="PICKED_UP">Abgeholt</option>
                    <option value="DELIVERED">Geliefert</option>
                    <option value="PAUSED">Pausiert</option>
                  </select>
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-cyan-300 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:scale-[1.02]"
                  >
                    Speichern
                  </button>
                </form>
              </div>
            )}

            {/* Preis */}
            {canEdit && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="mb-4 text-lg font-semibold">Preis</h2>
                <form action={updateOrderPrice} className="space-y-3">
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    defaultValue={order.finalPrice?.toString() ?? ""}
                    placeholder="0.00"
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-cyan-300 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:scale-[1.02]"
                  >
                    Speichern
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Rechte Spalte: Teile */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-5 text-xl font-semibold">Teile</h2>

              {/* Teile hinzufügen */}
              <form action={addOrderPart} className="mb-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">Name *</label>
                  <input type="text" name="name" required
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">Kategorie *</label>
                  <input type="text" name="category" placeholder="GPU, CPU, RAM…" required
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">Menge</label>
                  <input type="number" name="quantity" defaultValue="1" min="1"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">Einzelpreis (€)</label>
                  <input type="number" name="unitPrice" step="0.01" placeholder="0.00"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs text-slate-400">Lieferant</label>
                  <input type="text" name="supplier" placeholder="Mindfactory, Amazon…"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300" />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" name="isOrdered" className="rounded" />
                  Bereits bestellt
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" name="isArrived" className="rounded" />
                  Bereits angekommen
                </label>
                <div className="md:col-span-2">
                  <button type="submit"
                    className="w-full rounded-2xl bg-cyan-300 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:scale-[1.02]">
                    + Teil hinzufügen
                  </button>
                </div>
              </form>

              {/* Teile-Liste */}
              <div className="space-y-3">
                {order.parts.length > 0 ? (
                  order.parts.map((part: OrderPart) => {
                    const toggleOrdered = togglePartOrdered.bind(null, part.id, part.isOrdered);
                    const toggleArrived = togglePartArrived.bind(null, part.id, part.isArrived);
                    const deleteThisPart = deletePart.bind(null, part.id);

                    return (
                      <div key={part.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-medium text-white">{part.name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {part.category}{part.supplier ? ` · ${part.supplier}` : ""}{" "}
                              · {part.quantity}x{part.unitPrice ? ` · ${part.unitPrice.toString()} €` : ""}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <form action={toggleOrdered}>
                              <button type="submit"
                                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition hover:scale-105 ${
                                  part.isOrdered ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-slate-300 hover:bg-white/15"
                                }`}>
                                {part.isOrdered ? "✔ Bestellt" : "Bestellt?"}
                              </button>
                            </form>

                            <form action={toggleArrived}>
                              <button type="submit"
                                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition hover:scale-105 ${
                                  part.isArrived ? "bg-green-400 text-slate-950" : "bg-white/10 text-slate-300 hover:bg-white/15"
                                }`}>
                                {part.isArrived ? "✔ Angekommen" : "Angekommen?"}
                              </button>
                            </form>

                            {canEdit && (
                              <form action={deleteThisPart}>
                                <button type="submit"
                                  className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-400/20">
                                  Löschen
                                </button>
                              </form>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-sm text-slate-500 py-4">Noch keine Teile vorhanden.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Termine */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-1 text-xl font-semibold">Termine</h2>
          <p className="mb-4 text-xs text-slate-500">Termine zum Auftrag erstellen – werden automatisch in den Kalender eingetragen.</p>
          <OrderAppointments orderId={order.id} />
        </div>

        {/* Rechnungen & Angebote */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-1 text-xl font-semibold">Rechnungen & Angebote</h2>
          <p className="mb-4 text-xs text-slate-500">Dokumente erstellen und an den Kunden senden – dieser kann sie dann einsehen und herunterladen.</p>
          <InvoiceManager
            orderId={order.id}
            initialInvoices={order.invoices as any}
            parts={order.parts.map((p) => ({ name: p.name, quantity: p.quantity, unitPrice: p.unitPrice ? p.unitPrice.toString() : null }))}
            finalPrice={order.finalPrice ? order.finalPrice.toString() : null}
          />
        </div>

        {/* Live Chat */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-1 text-xl font-semibold">Live Chat mit Kunde</h2>
          <p className="mb-4 text-xs text-slate-500">Direktnachrichten zum Auftrag – sichtbar für den Kunden.</p>
          <CustomerChat orderId={order.id} currentUserId={sessionUserId} />
        </div>

        {/* Updates */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Neues Update */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 text-xl font-semibold">Update hinzufügen</h2>
            <form action={addOrderUpdate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Titel</label>
                <input type="text" name="title" required
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Nachricht</label>
                <textarea name="message" rows={4} required
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300" />
              </div>
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input type="checkbox" name="isVisibleToCustomer" defaultChecked />
                Für Kunden sichtbar
              </label>
              <button type="submit"
                className="w-full rounded-2xl bg-cyan-300 px-4 py-3 font-medium text-slate-950 transition hover:scale-[1.02]">
                Update speichern
              </button>
            </form>
          </div>

          {/* Update-Verlauf */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 text-xl font-semibold">Update-Verlauf</h2>
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {order.updates.length > 0 ? (
                order.updates.map((update: OrderUpdate) => (
                  <div key={update.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-white">{update.title}</p>
                      <span className="shrink-0 text-xs text-slate-500">
                        {new Date(update.createdAt).toLocaleString("de-DE")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{update.message}</p>
                    <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${
                      update.isVisibleToCustomer
                        ? "bg-cyan-400/10 text-cyan-300"
                        : "bg-white/5 text-slate-500"
                    }`}>
                      {update.isVisibleToCustomer ? "Sichtbar für Kunden" : "Intern"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Noch keine Updates.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
