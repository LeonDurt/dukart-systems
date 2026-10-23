import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import BillingEditor from "@/components/BillingEditor";

export default async function BuchhaltungPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") redirect("/admin/orders");

  const year = new Date().getFullYear();

  const [docs, invoiceOptions] = await Promise.all([
    prisma.billingDocument.findMany({
      where: {
        issueDate: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
      orderBy: { createdAt: "desc" },
      include: { createdByUser: { select: { email: true } } },
    }),
    prisma.billingDocument.findMany({
      where: { type: "INVOICE" },
      orderBy: { createdAt: "desc" },
      select: { id: true, number: true, recipientName: true, total: true },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Buchhaltung</h1>
            <p className="text-xs text-slate-500 mt-1">Rechnungen · Lieferscheine · Mahnungen</p>
          </div>
          <Link
            href="/admin/orders"
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
          >
            ← Aufträge
          </Link>
        </div>

        <BillingEditor
          initialDocs={docs.map(d => ({
            ...d,
            total: Number(d.total),
            items: d.items as any,
            issueDate: d.issueDate.toISOString(),
            dueDate: d.dueDate?.toISOString() ?? null,
            deliveryDate: d.deliveryDate?.toISOString() ?? null,
            createdAt: d.createdAt.toISOString(),
            updatedAt: d.updatedAt.toISOString(),
          }))}
          invoiceOptions={invoiceOptions.map(i => ({ ...i, total: Number(i.total) }))}
        />
      </div>
    </main>
  );
}
