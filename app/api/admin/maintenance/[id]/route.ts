import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calendarMaintenanceRescheduled } from "@/lib/calendar";

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
  const body = await req.json();
  const { title, description, intervalMonths, lastServiceDate, nextServiceDate, notes, isActive } = body;

  const updated = await prisma.maintenanceContract.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(intervalMonths !== undefined && { intervalMonths: Number(intervalMonths) }),
      ...(lastServiceDate !== undefined && { lastServiceDate: lastServiceDate ? new Date(lastServiceDate) : null }),
      ...(nextServiceDate !== undefined && { nextServiceDate: new Date(nextServiceDate) }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { customer: { select: { id: true, firstName: true, lastName: true, email: true, customerNumber: true } } },
  });

  // Kalender aktualisieren wenn nextServiceDate geändert wurde
  if (nextServiceDate !== undefined) {
    calendarMaintenanceRescheduled({
      id: updated.id,
      title: updated.title,
      customerName: `${updated.customer.firstName} ${updated.customer.lastName}`,
      nextServiceDate: updated.nextServiceDate,
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
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
  await prisma.maintenanceContract.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
