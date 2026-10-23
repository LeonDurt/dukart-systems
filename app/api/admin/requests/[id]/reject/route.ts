import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, customerRejectedEmail } from "@/lib/email";

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

  const contactRequest = await prisma.contactRequest.findUnique({ where: { id } });
  if (!contactRequest) {
    return NextResponse.json({ error: "Anfrage nicht gefunden." }, { status: 404 });
  }

  if (contactRequest.status === "CONVERTED") {
    return NextResponse.json({ error: "Anfrage bereits freigeschalten." }, { status: 400 });
  }

  await prisma.contactRequest.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  // Ablehnungs-Email wenn es eine E-Mail-Adresse ist
  const emailTo = contactRequest.contact;
  if (emailTo.includes("@")) {
    sendEmail({
      to: emailTo,
      subject: "Update zu deiner Anfrage bei Dukart Systems",
      html: customerRejectedEmail({ customerName: contactRequest.name }),
    }).catch((err) => console.error("[EMAIL] Ablehnungs-E-Mail fehlgeschlagen:", err));
  }

  return NextResponse.json({ success: true });
}
