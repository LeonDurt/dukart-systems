import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type RecipientSuggestion = {
  name: string;
  company: string;
  street: string;
  zip: string;
  city: string;
  email: string;
  source: "customer" | "document";
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") return NextResponse.json([]);

  const q = req.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";

  const [customers, billingDocs] = await Promise.all([
    prisma.customer.findMany({
      select: {
        firstName: true, lastName: true,
        email: true, phone: true,
        street: true, zipCode: true, city: true,
      },
    }),
    prisma.billingDocument.findMany({
      select: {
        recipientName: true, recipientCompany: true,
        recipientStreet: true, recipientZip: true,
        recipientCity: true, recipientEmail: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const seen = new Set<string>();
  const results: RecipientSuggestion[] = [];

  // From customers first (authoritative data)
  for (const c of customers) {
    const name = `${c.firstName} ${c.lastName}`;
    if (!name.toLowerCase().includes(q)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      name,
      company: "",
      street: c.street ?? "",
      zip: c.zipCode ?? "",
      city: c.city ?? "",
      email: c.email ?? "",
      source: "customer",
    });
  }

  // From past billing documents
  for (const d of billingDocs) {
    if (!d.recipientName) continue;
    if (!d.recipientName.toLowerCase().includes(q)) continue;
    const key = (d.recipientName + (d.recipientCompany ?? "")).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      name: d.recipientName,
      company: d.recipientCompany ?? "",
      street: d.recipientStreet ?? "",
      zip: d.recipientZip ?? "",
      city: d.recipientCity ?? "",
      email: d.recipientEmail ?? "",
      source: "document",
    });
  }

  return NextResponse.json(results.slice(0, 8));
}
