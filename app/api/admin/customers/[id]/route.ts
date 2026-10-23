import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  if (session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Nur Admins können Kunden löschen." }, { status: 403 });
  }

  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!customer) return NextResponse.json({ error: "Kunde nicht gefunden." }, { status: 404 });

  // Alles in richtiger Reihenfolge löschen
  const orders = await prisma.order.findMany({ where: { customerId: id }, select: { id: true } });
  const orderIds = orders.map(o => o.id);

  if (orderIds.length > 0) {
    await prisma.chatMessage.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.orderUpdate.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.orderPart.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.document.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.order.deleteMany({ where: { customerId: id } });
  }

  await prisma.invitation.deleteMany({ where: { customerId: id } });
  await prisma.customer.delete({ where: { id } });

  // User-Account löschen falls vorhanden
  if (customer.userId) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: customer.userId } });
    await prisma.user.delete({ where: { id: customer.userId } });
  }

  return NextResponse.json({ success: true });
}
