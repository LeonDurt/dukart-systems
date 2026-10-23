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
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) return NextResponse.json({ error: "Kunde nicht gefunden." }, { status: 404 });

  if (customer.userId) {
    return NextResponse.json({ error: "Kunde hat bereits einen Account." }, { status: 400 });
  }

  const emailTo = customer.email || "";
  if (!emailTo.includes("@")) {
    return NextResponse.json({ error: "Keine gültige E-Mail-Adresse für diesen Kunden." }, { status: 400 });
  }

  // Alten Token invalidieren, neuen erstellen
  await prisma.invitation.updateMany({
    where: { customerId: id, usedAt: null },
    data: { expiresAt: new Date() }, // sofort ablaufen lassen
  });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  await prisma.invitation.create({
    data: {
      customerId: id,
      email: emailTo,
      tokenHash,
      expiresAt,
      createdByUserId: session.user!.id,
    },
  });

  const host = req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const inviteLink = `${proto}://${host}/register?token=${rawToken}`;

  sendEmail({
    to: emailTo,
    subject: "Dein Zugang zum Dukart Systems Kundenportal",
    html: customerApprovedEmail({
      customerName: `${customer.firstName} ${customer.lastName}`,
      inviteLink,
    }),
  }).catch((err) => console.error("[EMAIL] Resend invite fehlgeschlagen:", err));

  return NextResponse.json({ success: true, inviteLink });
}
