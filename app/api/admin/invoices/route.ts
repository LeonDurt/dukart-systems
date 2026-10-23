import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function generateNumber(type: "INVOICE" | "QUOTE") {
  const prefix = type === "INVOICE" ? "RE" : "AN";
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { number: { startsWith: `${prefix}-${year}-` } },
  });
  return `${prefix}-${year}-${String(count + 1).padStart(3, "0")}`;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR" && role !== "STAFF") {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const { orderId, type, items, notes, dueDate, expiresAt } = await req.json();
  if (!orderId || !type || !items?.length) {
    return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Auftrag nicht gefunden" }, { status: 404 });

  const total = (items as { quantity: number; unitPrice: number }[]).reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const number = await generateNumber(type);

  const invoice = await prisma.invoice.create({
    data: {
      orderId,
      type,
      number,
      createdByUserId: session.user!.id,
      items,
      total,
      notes: notes || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      quoteStatus: type === "QUOTE" ? "OPEN" : null,
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
