import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }
  const { id } = await params;
  const doc = await prisma.billingDocument.findUnique({
    where: { id },
    include: { relatedInvoice: true },
  });
  if (!doc) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const { recipientName, recipientCompany, recipientStreet, recipientZip, recipientCity, recipientEmail, items, notes, dueDate, deliveryDate, status } = body;

  const total = items
    ? (items as { quantity: number; unitPrice: number }[]).reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    : undefined;

  const doc = await prisma.billingDocument.update({
    where: { id },
    data: {
      ...(recipientName !== undefined && { recipientName }),
      ...(recipientCompany !== undefined && { recipientCompany: recipientCompany || null }),
      ...(recipientStreet !== undefined && { recipientStreet: recipientStreet || null }),
      ...(recipientZip !== undefined && { recipientZip: recipientZip || null }),
      ...(recipientCity !== undefined && { recipientCity: recipientCity || null }),
      ...(recipientEmail !== undefined && { recipientEmail: recipientEmail || null }),
      ...(items !== undefined && { items, total }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(deliveryDate !== undefined && { deliveryDate: deliveryDate ? new Date(deliveryDate) : null }),
      ...(status !== undefined && { status }),
    },
  });

  return NextResponse.json(doc);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.billingDocument.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
