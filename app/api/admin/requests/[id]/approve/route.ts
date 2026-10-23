import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, customerApprovedEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { firstName, lastName, phone } = body;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Vor- und Nachname erforderlich." }, { status: 400 });
  }

  const contactRequest = await prisma.contactRequest.findUnique({ where: { id } });
  if (!contactRequest) {
    return NextResponse.json({ error: "Anfrage nicht gefunden." }, { status: 404 });
  }

  if (contactRequest.status === "CONVERTED") {
    return NextResponse.json({ error: "Anfrage bereits freigeschalten." }, { status: 400 });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const isEmail = contactRequest.contact.includes("@");
  const customerEmail = isEmail ? contactRequest.contact : "";
  const customerPhone = phone || contactRequest.phone || (!isEmail ? contactRequest.contact : "");

  // Alles in einer Transaktion: Kundennummer, Kunde, Einladung, Auftrag
  const { customer, orderNumber } = await prisma.$transaction(async (tx) => {
    const lastCustomer = await tx.customer.findFirst({ orderBy: { customerNumber: "desc" } });
    const nextNum = lastCustomer ? parseInt(lastCustomer.customerNumber.split("-")[1] || "0") + 1 : 1;
    const customerNumber = `KD-${String(nextNum).padStart(4, "0")}`;

    const newCustomer = await tx.customer.create({
      data: {
        customerNumber,
        firstName,
        lastName,
        email: customerEmail,
        phone: customerPhone,
      },
    });

    await tx.invitation.create({
      data: {
        customerId: newCustomer.id,
        email: customerEmail || contactRequest.contact,
        tokenHash,
        expiresAt,
        createdByUserId: session.user!.id,
      },
    });

    const lastOrder = await tx.order.findFirst({ orderBy: { orderNumber: "desc" } });
    const nextOrderNum = lastOrder ? parseInt(lastOrder.orderNumber.split("-")[1] || "0") + 1 : 1;
    const newOrderNumber = `AU-${String(nextOrderNum).padStart(5, "0")}`;

    await tx.order.create({
      data: {
        orderNumber: newOrderNumber,
        customerId: newCustomer.id,
        title: contactRequest.subject,
        description: contactRequest.message,
        status: "REQUEST_RECEIVED",
        createdByUserId: session.user!.id,
      },
    });

    await tx.contactRequest.update({
      where: { id },
      data: { status: "CONVERTED", convertedToCustomerId: newCustomer.id },
    });

    return { customer: newCustomer, orderNumber: newOrderNumber };
  });

  const host = req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;
  const inviteLink = `${baseUrl}/register?token=${rawToken}`;
  const emailTo = customerEmail || contactRequest.contact;

  if (emailTo.includes("@")) {
    sendEmail({
      to: emailTo,
      subject: "Dein Zugang zum Dukart Systems Kundenportal",
      html: customerApprovedEmail({
        customerName: `${firstName} ${lastName}`,
        inviteLink,
      }),
    }).catch((err) => console.error("[EMAIL] Einladungs-E-Mail fehlgeschlagen:", err));
  }

  return NextResponse.json({
    success: true,
    customerId: customer.id,
    customerNumber: customer.customerNumber,
    inviteLink,
  });
}
