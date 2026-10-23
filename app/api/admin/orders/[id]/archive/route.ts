import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Auftrag archivieren
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Auftrag nicht gefunden." }, { status: 404 });

  await prisma.order.update({
    where: { id },
    data: { isArchived: true, archivedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}

// DELETE: Auftrag endgültig löschen (nur ADMIN, nur archivierte)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  if (session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Nur Admins können Aufträge löschen." }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Auftrag nicht gefunden." }, { status: 404 });

  if (!order.isArchived) {
    return NextResponse.json({ error: "Nur archivierte Aufträge können gelöscht werden." }, { status: 400 });
  }

  await prisma.chatMessage.deleteMany({ where: { orderId: id } });
  await prisma.orderUpdate.deleteMany({ where: { orderId: id } });
  await prisma.orderPart.deleteMany({ where: { orderId: id } });
  await prisma.document.deleteMany({ where: { orderId: id } });
  await prisma.order.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
