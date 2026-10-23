import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PREFIXES: Record<string, string> = {
  INVOICE: "RE",
  DELIVERY_NOTE: "LS",
  DUNNING: "MA",
};

async function generateNumber(type: string) {
  const prefix = PREFIXES[type];
  const year = new Date().getFullYear();
  const count = await prisma.billingDocument.count({
    where: { number: { startsWith: `${prefix}-${year}-` } },
  });
  return `${prefix}-${year}-${String(count + 1).padStart(3, "0")}`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const year = searchParams.get("year");
  const type = searchParams.get("type");
  const status = searchParams.get("status");

  const docs = await prisma.billingDocument.findMany({
    where: {
      ...(type ? { type: type as any } : {}),
      ...(status ? { status: status as any } : {}),
      ...(year ? {
        issueDate: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${Number(year) + 1}-01-01`),
        },
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { createdByUser: { select: { email: true } } },
  });

  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const body = await req.json();
  const { type, recipientName, recipientCompany, recipientStreet, recipientZip, recipientCity, recipientEmail, items, notes, dueDate, deliveryDate, relatedInvoiceId } = body;

  if (!type || !recipientName || !items?.length) {
    return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
  }

  const total = (items as { quantity: number; unitPrice: number }[]).reduce(
    (sum, i) => sum + i.quantity * i.unitPrice,
    0
  );

  const number = await generateNumber(type);

  const doc = await prisma.billingDocument.create({
    data: {
      type,
      number,
      recipientName,
      recipientCompany: recipientCompany || null,
      recipientStreet: recipientStreet || null,
      recipientZip: recipientZip || null,
      recipientCity: recipientCity || null,
      recipientEmail: recipientEmail || null,
      items,
      total,
      notes: notes || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      relatedInvoiceId: relatedInvoiceId || null,
      createdByUserId: session.user!.id,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
