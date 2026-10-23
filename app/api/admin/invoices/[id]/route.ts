import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { order: { include: { customer: true } } },
  });
  if (!invoice) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR" && role !== "STAFF") {
    // Customer: only if sent and they own the order
    const customer = await prisma.customer.findFirst({ where: { userId: session.user!.id } });
    if (!customer || invoice.order.customerId !== customer.id || !invoice.isSentToCustomer) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }
  }

  return NextResponse.json(invoice);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR" && role !== "STAFF") {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const { id } = await params;
  const { items, notes, dueDate, expiresAt, quoteStatus } = await req.json();

  const total = (items as { quantity: number; unitPrice: number }[]).reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      items,
      total,
      notes: notes || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      ...(quoteStatus !== undefined && { quoteStatus }),
    },
  });

  return NextResponse.json(invoice);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
