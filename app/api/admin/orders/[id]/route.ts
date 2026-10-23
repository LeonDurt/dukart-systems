import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calendarOrderDeadline } from "@/lib/calendar";

export async function PATCH(
  req: NextRequest,
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

  const body = await req.json();
  const { title, description, estimatedCompletionDate, fulfillmentType } = body;

  if (title !== undefined && !title.trim()) {
    return NextResponse.json({ error: "Titel darf nicht leer sein." }, { status: 400 });
  }

  await prisma.order.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description.trim() || null }),
      ...(estimatedCompletionDate !== undefined && {
        estimatedCompletionDate: estimatedCompletionDate ? new Date(estimatedCompletionDate) : null,
      }),
      ...(fulfillmentType !== undefined && {
        fulfillmentType: fulfillmentType || null,
      }),
    },
  });

  // Kalendereintrag wenn Fertigstellungsdatum gesetzt wird
  if (estimatedCompletionDate) {
    const updated = await prisma.order.findUnique({ where: { id }, include: { customer: true } });
    if (updated?.estimatedCompletionDate) {
      calendarOrderDeadline({
        id, orderNumber: updated.orderNumber, title: updated.title,
        customerName: `${updated.customer.firstName} ${updated.customer.lastName}`,
        estimatedCompletionDate: updated.estimatedCompletionDate,
      });
    }
  }

  return NextResponse.json({ success: true });
}
