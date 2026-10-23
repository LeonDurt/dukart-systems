import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calendarMaintenanceCreated } from "@/lib/calendar";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const contracts = await prisma.maintenanceContract.findMany({
    include: { customer: { select: { id: true, firstName: true, lastName: true, email: true, customerNumber: true } } },
    orderBy: { nextServiceDate: "asc" },
  });

  return NextResponse.json(contracts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const body = await req.json();
  const { customerId, title, description, intervalMonths, lastServiceDate, nextServiceDate, notes } = body;

  if (!customerId || !title || !nextServiceDate) {
    return NextResponse.json({ error: "Pflichtfelder fehlen." }, { status: 400 });
  }

  const contract = await prisma.maintenanceContract.create({
    data: {
      customerId,
      title: title.trim(),
      description: description?.trim() || null,
      intervalMonths: intervalMonths ? Number(intervalMonths) : 12,
      lastServiceDate: lastServiceDate ? new Date(lastServiceDate) : null,
      nextServiceDate: new Date(nextServiceDate),
      notes: notes?.trim() || null,
    },
    include: { customer: { select: { id: true, firstName: true, lastName: true, email: true, customerNumber: true } } },
  });

  calendarMaintenanceCreated({
    id: contract.id,
    title: contract.title,
    customerName: `${contract.customer.firstName} ${contract.customer.lastName}`,
    nextServiceDate: contract.nextServiceDate,
  });

  return NextResponse.json(contract);
}
