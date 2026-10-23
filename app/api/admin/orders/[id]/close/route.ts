import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, reviewRequestEmail } from "@/lib/email";
import { calendarOrderCompleted } from "@/lib/calendar";


export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR" && role !== "STAFF") {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!order) return NextResponse.json({ error: "Auftrag nicht gefunden." }, { status: 404 });

  await prisma.order.update({
    where: { id },
    data: { isCompleted: true, completedAt: new Date(), status: "COMPLETED" },
  });

  // Bewertungs-E-Mail an Kunden senden
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://dukartsystems.de";
  const reviewUrl = `${baseUrl}/#bewertung-abgeben`;

  try {
    if (!order.customer.email) throw new Error("Keine E-Mail-Adresse beim Kunden");
    await sendEmail({
      to: order.customer.email,
      subject: "Wie war deine Erfahrung? – Dukart Systems",
      html: reviewRequestEmail({
        customerName: order.customer.firstName,
        orderTitle: order.title,
        reviewUrl,
      }),
    });
  } catch (err) {
    console.error("[CLOSE ORDER] Bewertungs-E-Mail konnte nicht gesendet werden:", err);
    // Kein Fehler zurückgeben – Auftrag ist trotzdem geschlossen
  }

  calendarOrderCompleted(order.id);

  return NextResponse.json({ success: true });
}
