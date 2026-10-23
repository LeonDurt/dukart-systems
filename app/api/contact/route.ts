import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, newContactRequestEmail, contactConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, contact, phone, subject, message, website } = body;

    if (website) return NextResponse.json({ success: true });

    if (!name || !contact || !subject || !message) {
      return NextResponse.json({ error: "Pflichtfelder fehlen." }, { status: 400 });
    }

    const request = await prisma.contactRequest.create({
      data: { name, contact, phone: phone || null, subject, message },
    });

    // E-Mail separat - Fehler hier dürfen die Speicherung nicht blockieren
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const host = req.headers.get("host") || "localhost:3000";
      const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      const baseUrl = `${proto}://${host}`;
      sendEmail({
        to: adminEmail,
        subject: `Neue Anfrage von ${name}: ${subject}`,
        html: newContactRequestEmail({
          name,
          contact,
          phone: phone || undefined,
          subject,
          message,
          requestId: request.id,
          baseUrl,
        }),
      }).catch((err) => console.error("[EMAIL] Admin-Benachrichtigung fehlgeschlagen:", err));
    }

    // Bestätigungs-E-Mail an den Kunden (wenn E-Mail angegeben)
    if (contact.includes("@")) {
      sendEmail({
        to: contact,
        subject: "Wir haben deine Anfrage erhalten – Dukart Systems",
        html: contactConfirmationEmail({ name, subject }),
      }).catch((err) => console.error("[EMAIL] Bestätigungs-E-Mail fehlgeschlagen:", err));
    }

    return NextResponse.json({ success: true, id: request.id });
  } catch (err) {
    console.error("[POST /api/contact]", err);
    return NextResponse.json({ error: "Interner Fehler." }, { status: 500 });
  }
}
