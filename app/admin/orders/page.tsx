import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminProfileWidget from "@/components/AdminProfileWidget";
import ArchiveDeleteButton from "@/components/ArchiveDeleteButton";
import AutoRefresh from "@/components/AutoRefresh";
import type { Order, Customer } from "@prisma/client";

const statusLabels: Record<string, string> = {
  REQUEST_RECEIVED: "Anfrage",
  CONSULTATION: "Beratung",
  PARTS_SELECTION: "Teile",
  AWAITING_CUSTOMER_CONFIRMATION: "Warte auf Kunde",
  PARTS_ORDERED: "Teile bestellt",
  PARTS_ARRIVED: "Teile da",
  ASSEMBLY: "Zusammenbau",
  WINDOWS_DRIVERS_TESTS: "Windows/Tests",
  COMPLETED: "Fertig",
  PICKED_UP: "Abgeholt",
  DELIVERED: "Geliefert",
  PAUSED: "Pausiert",
};

const statusColor: Record<string, string> = {
  REQUEST_RECEIVED: "bg-blue-400/10 text-blue-300 border-blue-400/20",
  CONSULTATION: "bg-purple-400/10 text-purple-300 border-purple-400/20",
  PARTS_SELECTION: "bg-yellow-400/10 text-yellow-300 border-yellow-400/20",
  AWAITING_CUSTOMER_CONFIRMATION: "bg-orange-400/10 text-orange-300 border-orange-400/20",
  PARTS_ORDERED: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
  PARTS_ARRIVED: "bg-teal-400/10 text-teal-300 border-teal-400/20",
  ASSEMBLY: "bg-indigo-400/10 text-indigo-300 border-indigo-400/20",
  WINDOWS_DRIVERS_TESTS: "bg-violet-400/10 text-violet-300 border-violet-400/20",
  COMPLETED: "bg-green-400/10 text-green-300 border-green-400/20",
  PICKED_UP: "bg-green-400/10 text-green-300 border-green-400/20",
  DELIVERED: "bg-green-400/10 text-green-300 border-green-400/20",
  PAUSED: "bg-red-400/10 text-red-300 border-red-400/20",
};

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user?.role;

  if (role !== "ADMIN" && role !== "STAFF" && role !== "SUPERVISOR") {
    redirect("/kundenportal");
  }

  const { tab } = await searchParams;
  const showArchive = tab === "archiv";

  const in14Days = new Date();
  in14Days.setDate(in14Days.getDate() + 14);

  const [orders, newRequestsCount, totalCustomers, pendingReviews, totalRevenue, staffProfile, totalVisitors, dueMaintenance] = await Promise.all([
    prisma.order.findMany({
      where: { isArchived: showArchive },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contactRequest.count({ where: { status: "NEW" } }),
    prisma.customer.count(),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.order.aggregate({ _sum: { finalPrice: true }, where: { isCompleted: true } }),
    prisma.staffProfile.findUnique({ where: { userId: session.user!.id } }),
    prisma.pageView.count(),
    prisma.maintenanceContract.count({ where: { isActive: true, nextServiceDate: { lte: in14Days } } }),
  ]);

  const activeOrders = orders.filter((o) => !o.isCompleted && o.status !== "PICKED_UP" && o.status !== "DELIVERED");
  const completedOrders = orders.filter((o) => o.isCompleted || o.status === "PICKED_UP" || o.status === "DELIVERED");

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <AutoRefresh intervalMs={20000} />
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Profil-Widget oben links */}
            <AdminProfileWidget
              email={session.user!.email!}
              role={role!}
              displayName={staffProfile?.displayName}
              initialStatus={(staffProfile?.status as any) ?? "OFFLINE"}
            />
            <div>
              <h1 className="text-2xl font-bold leading-tight">Dukarts Panel</h1>
              <p className="text-xs text-slate-500">
                {showArchive ? "Archivierte Aufträge" : "Aktive Auftragsübersicht"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/customers"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
            >
              Kunden
            </Link>
            {(role === "ADMIN" || role === "SUPERVISOR") && (
              <>
                <Link
                  href="/admin/requests"
                  className="relative rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
                >
                  Anfragen
                  {newRequestsCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-xs font-bold text-slate-950">
                      {newRequestsCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/admin/reviews"
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
                >
                  Bewertungen
                </Link>
                <Link
                  href="/admin/staff"
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
                >
                  Mitarbeiter
                </Link>
                <Link
                  href="/admin/wartung"
                  className="relative rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:border-yellow-400/40 hover:text-white"
                >
                  Wartung
                  {dueMaintenance > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-slate-950">
                      {dueMaintenance}
                    </span>
                  )}
                </Link>
                <Link
                  href="/admin/konfigurator"
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
                >
                  Konfigurator
                </Link>
                <Link
                  href="/admin/buchhaltung"
                  className="rounded-2xl border border-green-400/20 bg-green-400/5 px-5 py-2.5 text-sm text-green-300 transition hover:bg-green-400/10 hover:text-green-200"
                >
                  Buchhaltung
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Tab-Navigation */}
        <div className="mb-6 flex gap-2">
          <Link
            href="/admin/orders"
            className={`rounded-2xl border px-5 py-2 text-sm font-medium transition ${
              !showArchive
                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            Aufträge
          </Link>
          <Link
            href="/admin/orders?tab=archiv"
            className={`rounded-2xl border px-5 py-2 text-sm font-medium transition ${
              showArchive
                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            Archiv
          </Link>
        </div>

        {/* Statistik-Kacheln (nur im aktiven Tab) */}
        {!showArchive && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Link href="/admin/stats?detail=active" className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-cyan-400/30">
              <p className="text-sm text-slate-400">Aktive Aufträge</p>
              <p className="mt-2 text-4xl font-bold text-cyan-300">{activeOrders.length}</p>
              <p className="mt-1 text-xs text-slate-500">{orders.length} gesamt</p>
            </Link>
            <Link href="/admin/stats?detail=completed" className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-green-400/30">
              <p className="text-sm text-slate-400">Abgeschlossen</p>
              <p className="mt-2 text-4xl font-bold text-green-300">{completedOrders.length}</p>
              <p className="mt-1 text-xs text-slate-500">
                {completedOrders.length > 0
                  ? `${Math.round((completedOrders.length / orders.length) * 100)}% Abschlussrate`
                  : "—"}
              </p>
            </Link>
            <Link href="/admin/stats?detail=customers" className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20">
              <p className="text-sm text-slate-400">Kunden</p>
              <p className="mt-2 text-4xl font-bold">{totalCustomers}</p>
              {newRequestsCount > 0 && (
                <p className="mt-1 text-xs text-cyan-300">+{newRequestsCount} neue Anfragen</p>
              )}
            </Link>
            <Link href="/admin/stats?detail=revenue" className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-yellow-400/30">
              <p className="text-sm text-slate-400">Umsatz (abgeschl.)</p>
              <p className="mt-2 text-3xl font-bold text-yellow-300">
                {totalRevenue._sum.finalPrice
                  ? `${Number(totalRevenue._sum.finalPrice).toFixed(0)} €`
                  : "—"}
              </p>
              {pendingReviews > 0 && (
                <p className="mt-1 text-xs text-yellow-400">{pendingReviews} Bewertung{pendingReviews > 1 ? "en" : ""} warten</p>
              )}
            </Link>
            <Link href="/admin/stats?detail=all" className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-violet-400/30">
              <p className="text-sm text-slate-400">Webseitenbesucher</p>
              <p className="mt-2 text-4xl font-bold text-violet-300">{totalVisitors.toLocaleString("de-DE")}</p>
              <p className="mt-1 text-xs text-slate-500">Besuche gesamt</p>
            </Link>
          </div>
        )}

        {/* Aktive Aufträge */}
        {!showArchive && activeOrders.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-200">Aktive Aufträge</h2>
            <OrderTable orders={activeOrders} statusLabels={statusLabels} statusColor={statusColor} />
          </div>
        )}

        {/* Abgeschlossene Aufträge */}
        {!showArchive && completedOrders.length > 0 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-400">Abgeschlossen</h2>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 opacity-70">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="border-b border-white/10 bg-white/5 text-xs text-slate-500">
                    <tr>
                      <th className="px-6 py-3">Nr.</th>
                      <th className="px-6 py-3">Kunde</th>
                      <th className="px-6 py-3">Titel</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Preis</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedOrders.map((order: Order & { customer: Customer }) => (
                      <tr key={order.id} className="border-b border-white/5 text-sm transition hover:bg-white/5">
                        <td className="px-6 py-3 font-mono text-slate-500">{order.orderNumber}</td>
                        <td className="px-6 py-3 text-slate-400">{order.customer.firstName} {order.customer.lastName}</td>
                        <td className="px-6 py-3 text-slate-400">{order.title}</td>
                        <td className="px-6 py-3">
                          <span className="rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs text-green-300">
                            {statusLabels[order.status] ?? order.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-400">
                          {order.finalPrice ? `${order.finalPrice.toString()} €` : "—"}
                        </td>
                        <td className="px-6 py-3">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-slate-400 transition hover:text-white"
                          >
                            Öffnen
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Archiv-Ansicht */}
        {showArchive && (
          <div>
            {orders.length > 0 ? (
              <OrderTable orders={orders} statusLabels={statusLabels} statusColor={statusColor} isAdmin={role === "ADMIN"} />
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
                <p className="text-slate-400">Keine archivierten Aufträge.</p>
              </div>
            )}
          </div>
        )}

        {!showArchive && orders.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-slate-400">Noch keine Aufträge vorhanden.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function OrderTable({
  orders,
  statusLabels,
  statusColor,
  isAdmin = false,
}: {
  orders: (Order & { customer: Customer })[];
  statusLabels: Record<string, string>;
  statusColor: Record<string, string>;
  isAdmin?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="border-b border-white/10 bg-white/5 text-xs text-slate-400">
            <tr>
              <th className="px-3 py-3 sm:px-6 sm:py-4">Nr.</th>
              <th className="px-3 py-3 sm:px-6 sm:py-4">Kunde</th>
              <th className="hidden px-3 py-3 sm:table-cell sm:px-6 sm:py-4">Titel</th>
              <th className="px-3 py-3 sm:px-6 sm:py-4">Status</th>
              <th className="hidden px-3 py-3 sm:table-cell sm:px-6 sm:py-4">Preis</th>
              <th className="px-3 py-3 sm:px-6 sm:py-4"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-white/5 text-sm transition hover:bg-white/5">
                <td className="px-3 py-3 font-mono text-xs text-slate-400 sm:px-6 sm:py-4">{order.orderNumber}</td>
                <td className="px-3 py-3 font-medium text-white sm:px-6 sm:py-4">
                  {order.customer.firstName} {order.customer.lastName}
                </td>
                <td className="hidden px-3 py-3 text-slate-300 sm:table-cell sm:px-6 sm:py-4">{order.title}</td>
                <td className="px-3 py-3 sm:px-6 sm:py-4">
                  <span className={`rounded-full border px-2 py-0.5 text-xs sm:px-3 sm:py-1 ${statusColor[order.status] ?? "bg-white/10 text-slate-300"}`}>
                    {statusLabels[order.status] ?? order.status}
                  </span>
                </td>
                <td className="hidden px-3 py-3 text-slate-300 sm:table-cell sm:px-6 sm:py-4">
                  {order.finalPrice ? `${order.finalPrice.toString()} €` : <span className="text-slate-600">—</span>}
                </td>
                <td className="px-3 py-3 sm:px-6 sm:py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="rounded-xl bg-cyan-300 px-4 py-1.5 text-xs font-medium text-slate-950 transition hover:scale-105"
                    >
                      Öffnen →
                    </Link>
                    {isAdmin && order.isArchived && (
                      <ArchiveDeleteButton orderId={order.id} orderNumber={order.orderNumber} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
