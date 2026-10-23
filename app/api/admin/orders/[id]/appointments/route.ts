import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calendarAppointmentCreate, calendarAppointmentDelete } from "@/lib/calendar";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const { id } = await params;
  const appointments = await prisma.orderAppointment.findMany({
    where: { orderId: id },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(appointments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const { id } = await params;
  const { title, date, notes } = await req.json();

  if (!title?.trim() || !date) {
    return NextResponse.json({ error: "Titel und Datum sind erforderlich." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!order) return NextResponse.json({ error: "Auftrag nicht gefunden." }, { status: 404 });

  const appt = await prisma.orderAppointment.create({
    data: {
      orderId: id,
      title: title.trim(),
      date: new Date(date),
      notes: notes?.trim() || null,
      calendarUid: `appt-${id}-${Date.now()}`,
    },
  });

  calendarAppointmentCreate({
    uid: appt.calendarUid!,
    title: appt.title,
    date: appt.date,
    notes: appt.notes ?? undefined,
    orderNumber: order.orderNumber,
    customerName: `${order.customer.firstName} ${order.customer.lastName}`,
  });

  return NextResponse.json(appt);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const { id } = await params;
  const { appointmentId } = await req.json();

  const appt = await prisma.orderAppointment.findFirst({
    where: { id: appointmentId, orderId: id },
  });
  if (!appt) return NextResponse.json({ error: "Termin nicht gefunden." }, { status: 404 });

  await prisma.orderAppointment.delete({ where: { id: appointmentId } });

  if (appt.calendarUid) calendarAppointmentDelete(appt.calendarUid);

  return NextResponse.json({ success: true });
}
