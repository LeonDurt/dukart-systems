import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const { customerId, title, description } = await req.json();

  if (!customerId || !title?.trim()) {
    return NextResponse.json({ error: "Kunde und Titel sind erforderlich." }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return NextResponse.json({ error: "Kunde nicht gefunden." }, { status: 404 });

  const order = await prisma.$transaction(async (tx) => {
    const last = await tx.order.findFirst({ orderBy: { orderNumber: "desc" } });
    const next = last ? parseInt(last.orderNumber.split("-")[1] || "0") + 1 : 1;
    const orderNumber = `AU-${String(next).padStart(5, "0")}`;

    return tx.order.create({
      data: {
        orderNumber,
        customerId,
        title: title.trim(),
        description: description?.trim() || null,
        status: "REQUEST_RECEIVED",
        createdByUserId: session.user!.id,
      },
    });
  });

  return NextResponse.json({ id: order.id, orderNumber: order.orderNumber });
}
