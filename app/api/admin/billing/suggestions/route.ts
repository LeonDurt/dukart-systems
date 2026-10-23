import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") return NextResponse.json([]);

  const q = req.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";

  // Pull all items from all billing documents + existing order invoices
  const [billingDocs, invoices] = await Promise.all([
    prisma.billingDocument.findMany({ select: { items: true } }),
    prisma.invoice.findMany({ select: { items: true } }),
  ]);

  const seen = new Set<string>();
  const suggestions: string[] = [];

  const allItems = [
    ...billingDocs.flatMap((d) => d.items as any[]),
    ...invoices.flatMap((i) => i.items as any[]),
  ];

  for (const item of allItems) {
    const desc: string = item?.description ?? "";
    if (!desc) continue;
    const key = desc.toLowerCase();
    if (!seen.has(key) && key.includes(q)) {
      seen.add(key);
      suggestions.push(desc);
    }
  }

  return NextResponse.json(suggestions.slice(0, 10));
}
