import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminProfileWidget from "@/components/AdminProfileWidget";

type PageProps = {
  searchParams: Promise<{ detail?: string }>;
};

export default async function AdminStatsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "STAFF" && role !== "SUPERVISOR") {
    redirect("/kundenportal");
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());

  const in14Days = new Date(now);
  in14Days.setDate(now.getDate() + 14);

  const [
    totalViews, todayViews, weekViews, allViewsForUnique,
    staffProfile, newRequestsCount, pendingReviews,
    totalCustomers, totalRevenue,
    activeOrdersCount, completedOrdersCount,
    dueMaintenance,
  ] = await Promise.all([
    prisma.pageView.count(),
    prisma.pageView.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.pageView.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.pageView.findMany({ select: { ip: true } }),
    prisma.staffProfile.findUnique({ where: { userId: session.user!.id } }),
    prisma.contactRequest.count({ where: { status: "NEW" } }),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.customer.count(),
    prisma.order.aggregate({ _sum: { finalPrice: true }, where: { isCompleted: true } }),
    prisma.order.count({ where: { isCompleted: false, isArchived: false } }),
    prisma.order.count({ where: { isCompleted: true } }),
    prisma.maintenanceContract.count({ where: { isActive: true, nextServiceDate: { lte: in14Days } } }),
  ]);

  const uniqueVisitors = new Set(allViewsForUnique.map((v) => v.ip ?? "unknown")).size;

  const { detail } = await searchParams;

  // ---- Detail data ----
  type GroupedVisitorRow = { ip: string; visits: number; firstSeen: Date; lastSeen: Date; userAgent: string | null };
  type DetailContent =
    | { type: "unique-grouped"; rows: GroupedVisitorRow[] }
    | { type: "orders"; rows: { id: string; orderNumber: string; title: string; status: string; isCompleted: boolean; finalPrice: any; createdAt: Date; customer: { firstName: string; lastName: string } }[] }
    | { type: "customers"; rows: { id: string; customerNumber: string; firstName: string; lastName: string; email: string; createdAt: Date }[] }
    | { type: "revenue"; rows: { id: string; orderNumber: string; title: string; finalPrice: any; completedAt: Date | null; customer: { firstName: string; lastName: string } }[] }
    | null;

  let detailContent: DetailContent = null;

  if (detail === "all" || detail === "today" || detail === "week" || detail === "unique") {
    const where =
      detail === "today" ? { createdAt: { gte: startOfToday } }
      : detail === "week" ? { createdAt: { gte: startOfWeek } }
      : {};

    const grouped = await prisma.pageView.groupBy({
      by: ["ip"],
      where,
      _count: { id: true },
      _min: { createdAt: true },
      _max: { createdAt: true },
      orderBy: { _count: { id: "desc" } },
    });

    const agentMap = new Map<string, string | null>();
    await Promise.all(
      grouped.slice(0, 100).map(async (g) => {
        const latest = await prisma.pageView.findFirst({
          where: { ip: g.ip, ...where },
          orderBy: { createdAt: "desc" },
          select: { userAgent: true },
        });
        agentMap.set(g.ip ?? "unknown", latest?.userAgent ?? null);
      })
    );

    const rows: GroupedVisitorRow[] = grouped.map((g) => ({
      ip: g.ip ?? "unbekannt",
      visits: g._count.id,
      firstSeen: g._min.createdAt!,
      lastSeen: g._max.createdAt!,
      userAgent: agentMap.get(g.ip ?? "unknown") ?? null,
    }));
    detailContent = { type: "unique-grouped", rows };
  }

  if (detail === "active" || detail === "completed") {
    const rows = await prisma.order.findMany({
      where: detail === "active"
        ? { isCompleted: false, isArchived: false }
        : { isCompleted: true },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    detailContent = { type: "orders", rows };
  }

  if (detail === "customers") {
    const rows = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    detailContent = { type: "customers", rows };
  }

  if (detail === "revenue") {
    const rows = await prisma.order.findMany({
      where: { isCompleted: true, finalPrice: { not: null } },
      include: { customer: true },
      orderBy: { completedAt: "desc" },
      take: 100,
    });
    detailContent = { type: "revenue", rows };
  }

  const statusLabels: Record<string, string> = {
    REQUEST_RECEIVED: "Anfrage", CONSULTATION: "Beratung", PARTS_SELECTION: "Teile",
    AWAITING_CUSTOMER_CONFIRMATION: "Warte auf Kunde", PARTS_ORDERED: "Teile bestellt",
    PARTS_ARRIVED: "Teile da", ASSEMBLY: "Zusammenbau", WINDOWS_DRIVERS_TESTS: "Windows/Tests",
    COMPLETED: "Fertig", PICKED_UP: "Abgeholt", DELIVERED: "Geliefert", PAUSED: "Pausiert",
  };

  const detailTitles: Record<string, string> = {
    all: "Alle Webseitenbesuche",
    today: "Besuche heute",
    week: "Besuche diese Woche",
    unique: "Eindeutige Besucher",
    active: "Aktive Aufträge",
    completed: "Abgeschlossene Aufträge",
    customers: "Alle Kunden",
    revenue: "Umsatz — abgeschlossene Aufträge",
  };

  const stats = [
    { key: "active", label: "Aktive Aufträge", value: activeOrdersCount.toString(), color: "text-cyan-300", hoverBorder: "hover:border-cyan-400/30" },
    { key: "completed", label: "Abgeschlossen", value: completedOrdersCount.toString(), color: "text-green-300", hoverBorder: "hover:border-green-400/30" },
    { key: "customers", label: "Kunden", value: totalCustomers.toString(), color: "text-white", hoverBorder: "hover:border-white/20" },
    {
      key: "revenue", label: "Umsatz (abgeschl.)", color: "text-yellow-300", hoverBorder: "hover:border-yellow-400/30",
      value: totalRevenue._sum.finalPrice ? `${Number(totalRevenue._sum.finalPrice).toFixed(0)} €` : "—",
    },
    { key: "all", label: "Webseitenbesuche", value: totalViews.toLocaleString("de-DE"), color: "text-violet-300", hoverBorder: "hover:border-violet-400/30", sub: "Gesamt" },
    { key: "today", label: "Besuche heute", value: todayViews.toLocaleString("de-DE"), color: "text-violet-200", hoverBorder: "hover:border-violet-400/30" },
    { key: "week", label: "Diese Woche", value: weekViews.toLocaleString("de-DE"), color: "text-violet-200", hoverBorder: "hover:border-violet-400/30" },
    { key: "unique", label: "Eindeutige Besucher", value: uniqueVisitors.toLocaleString("de-DE"), color: "text-violet-200", hoverBorder: "hover:border-violet-400/30" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <AdminProfileWidget
              email={session.user!.email!}
              role={role!}
              displayName={staffProfile?.displayName}
              initialStatus={(staffProfile?.status as any) ?? "OFFLINE"}
            />
            <div>
              <h1 className="text-2xl font-bold leading-tight">Dukarts Panel</h1>
              <p className="text-xs text-slate-500">Statistiken</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/admin/orders" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white">
              Aufträge
            </Link>
            <Link href="/admin/customers" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white">
              Kunden
            </Link>
            {(role === "ADMIN" || role === "SUPERVISOR") && (
              <>
                <Link href="/admin/requests" className="relative rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white">
                  Anfragen
                  {newRequestsCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-xs font-bold text-slate-950">
                      {newRequestsCount}
                    </span>
                  )}
                </Link>
                <Link href="/admin/reviews" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white">
                  Bewertungen
                  {pendingReviews > 0 && (
                    <span className="ml-1.5 rounded-full bg-yellow-400 px-1.5 py-0.5 text-xs font-bold text-slate-950">{pendingReviews}</span>
                  )}
                </Link>
                <Link href="/admin/staff" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white">
                  Mitarbeiter
                </Link>
                <Link href="/admin/wartung" className="relative rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:border-yellow-400/40 hover:text-white">
                  Wartung
                  {dueMaintenance > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-slate-950">
                      {dueMaintenance}
                    </span>
                  )}
                </Link>
                <Link href="/admin/konfigurator" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white">
                  Konfigurator
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Alle Statistik-Kacheln */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <Link
              key={s.key}
              href={detail === s.key ? "/admin/stats" : `/admin/stats?detail=${s.key}`}
              className={`group rounded-3xl border p-5 transition ${
                detail === s.key
                  ? "border-white/20 bg-white/10"
                  : `border-white/10 bg-white/5 ${s.hoverBorder}`
              }`}
            >
              <p className="text-sm text-slate-400">{s.label}</p>
              <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
              {"sub" in s && s.sub && <p className="mt-1 text-xs text-slate-500">{s.sub}</p>}
              <p className="mt-2 text-xs text-slate-600 group-hover:text-slate-400 transition">
                {detail === s.key ? "▲ ausblenden" : "▼ Details"}
              </p>
            </Link>
          ))}
        </div>

        {/* Detailansicht */}
        {detail && detailTitles[detail] && detailContent && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{detailTitles[detail]}</h2>
              {detailContent.type === "unique-grouped" && (
                <span className="text-xs text-slate-500">{detailContent.rows.length} Besucher</span>
              )}
            </div>

            {detailContent.rows.length === 0 ? (
              <p className="text-sm text-slate-500">Noch keine Daten vorhanden.</p>
            ) : (
              <div className="overflow-x-auto">

                {/* Eindeutige Besucher gruppiert */}
                {detailContent.type === "unique-grouped" && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-xs text-slate-500">
                        <th className="pb-3 pr-6">IP-Adresse</th>
                        <th className="pb-3 pr-6">Besuche</th>
                        <th className="pb-3 pr-6">Zuletzt gesehen</th>
                        <th className="pb-3 pr-6">Erstes Mal</th>
                        <th className="pb-3">Browser</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {detailContent.rows.map((row) => {
                        const ua = row.userAgent ?? "";
                        const browser =
                          ua.includes("Chrome") && !ua.includes("Edg") ? "Chrome"
                          : ua.includes("Firefox") ? "Firefox"
                          : ua.includes("Safari") && !ua.includes("Chrome") ? "Safari"
                          : ua.includes("Edg") ? "Edge"
                          : ua ? "Sonstiger" : "—";
                        return (
                          <tr key={row.ip} className="text-slate-300 hover:bg-white/5 transition">
                            <td className="py-3 pr-6 font-mono text-xs">{row.ip}</td>
                            <td className="py-3 pr-6">
                              <span className="rounded-full bg-violet-400/10 px-2.5 py-1 text-xs font-bold text-violet-300">
                                {row.visits}×
                              </span>
                            </td>
                            <td className="py-3 pr-6 font-mono text-xs text-slate-400">
                              {new Date(row.lastSeen).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="py-3 pr-6 font-mono text-xs text-slate-500">
                              {new Date(row.firstSeen).toLocaleDateString("de-DE")}
                            </td>
                            <td className="py-3 text-xs text-slate-400">
                              {browser}{ua.includes("Mobile") ? " (Mobil)" : ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {/* Auftragsdetails */}
                {detailContent.type === "orders" && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-xs text-slate-500">
                        <th className="pb-3 pr-6">Nr.</th>
                        <th className="pb-3 pr-6">Kunde</th>
                        <th className="pb-3 pr-6">Titel</th>
                        <th className="pb-3 pr-6">Status</th>
                        <th className="pb-3 pr-6">Preis</th>
                        <th className="pb-3">Erstellt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {detailContent.rows.map((o) => (
                        <tr key={o.id} className="text-slate-300 hover:bg-white/5 transition">
                          <td className="py-3 pr-6 font-mono text-xs text-slate-400">{o.orderNumber}</td>
                          <td className="py-3 pr-6 text-xs">{o.customer.firstName} {o.customer.lastName}</td>
                          <td className="py-3 pr-6 text-xs">{o.title}</td>
                          <td className="py-3 pr-6 text-xs text-slate-400">{statusLabels[o.status] ?? o.status}</td>
                          <td className="py-3 pr-6 text-xs">{o.finalPrice ? `${Number(o.finalPrice).toFixed(2)} €` : <span className="text-slate-600">—</span>}</td>
                          <td className="py-3 text-xs text-slate-400 font-mono">
                            {new Date(o.createdAt).toLocaleDateString("de-DE")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Kundendetails */}
                {detailContent.type === "customers" && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-xs text-slate-500">
                        <th className="pb-3 pr-6">Kundennr.</th>
                        <th className="pb-3 pr-6">Name</th>
                        <th className="pb-3 pr-6">E-Mail</th>
                        <th className="pb-3">Erstellt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {detailContent.rows.map((c) => (
                        <tr key={c.id} className="text-slate-300 hover:bg-white/5 transition">
                          <td className="py-3 pr-6 font-mono text-xs text-slate-400">{c.customerNumber}</td>
                          <td className="py-3 pr-6 text-xs">{c.firstName} {c.lastName}</td>
                          <td className="py-3 pr-6 text-xs text-slate-400">{c.email}</td>
                          <td className="py-3 text-xs text-slate-400 font-mono">
                            {new Date(c.createdAt).toLocaleDateString("de-DE")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Umsatzdetails */}
                {detailContent.type === "revenue" && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-xs text-slate-500">
                        <th className="pb-3 pr-6">Nr.</th>
                        <th className="pb-3 pr-6">Kunde</th>
                        <th className="pb-3 pr-6">Titel</th>
                        <th className="pb-3 pr-6">Betrag</th>
                        <th className="pb-3">Abgeschlossen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {detailContent.rows.map((o) => (
                        <tr key={o.id} className="text-slate-300 hover:bg-white/5 transition">
                          <td className="py-3 pr-6 font-mono text-xs text-slate-400">{o.orderNumber}</td>
                          <td className="py-3 pr-6 text-xs">{o.customer.firstName} {o.customer.lastName}</td>
                          <td className="py-3 pr-6 text-xs">{o.title}</td>
                          <td className="py-3 pr-6 text-xs font-semibold text-yellow-300">{Number(o.finalPrice).toFixed(2)} €</td>
                          <td className="py-3 text-xs text-slate-400 font-mono">
                            {o.completedAt ? new Date(o.completedAt).toLocaleDateString("de-DE") : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
