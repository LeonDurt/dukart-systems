import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// GET: Nachrichten für einen Auftrag
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const { orderId } = await params;

  // Kunden dürfen nur ihren eigenen Auftrag sehen
  if (session.user?.role === "CUSTOMER") {
    const customer = await prisma.customer.findFirst({ where: { userId: session.user.id } });
    if (!customer) return NextResponse.json({ error: "Kein Kundenprofil." }, { status: 403 });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.customerId !== customer.id) {
      return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
    }
  }

  const messages = await prisma.chatMessage.findMany({
    where: { orderId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          staffProfile: { select: { displayName: true } },
          customer: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

// POST: Nachricht senden
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const { orderId } = await params;
  const body = await req.json();
  const { message } = body;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Nachricht darf nicht leer sein." }, { status: 400 });
  }

  // Kunden dürfen nur in ihren eigenen Auftrag schreiben
  let senderIsCustomer = false;
  let customerName = "";
  let orderForNotify: { orderNumber: string; title: string; id: string } | null = null;

  if (session.user?.role === "CUSTOMER") {
    const customer = await prisma.customer.findFirst({ where: { userId: session.user.id } });
    if (!customer) return NextResponse.json({ error: "Kein Kundenprofil." }, { status: 403 });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.customerId !== customer.id) {
      return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
    }
    senderIsCustomer = true;
    customerName = `${customer.firstName} ${customer.lastName}`;
    orderForNotify = { orderNumber: order.orderNumber, title: order.title, id: order.id };
  }

  const msg = await prisma.chatMessage.create({
    data: { orderId, userId: session.user!.id, message: message.trim() },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          staffProfile: { select: { displayName: true } },
          customer: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  // Benachrichtigung: nur wenn Kunde schreibt UND letzte Nachricht war NICHT vom Kunden
  if (senderIsCustomer && orderForNotify) {
    const previousLast = await prisma.chatMessage.findFirst({
      where: { orderId, id: { not: msg.id } },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { role: true } } },
    });

    const lastWasAlsoCustomer = previousLast?.user.role === "CUSTOMER";

    if (!lastWasAlsoCustomer) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://portal.dukartsystems.de";
        sendEmail({
          to: adminEmail,
          subject: `Neue Chat-Nachricht von ${customerName} – Auftrag ${orderForNotify.orderNumber}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:16px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#0ea5e9,#67e8f9);padding:24px 32px;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#0f172a;opacity:.7;">Dukart Systems</p>
                <h1 style="margin:0;font-size:20px;font-weight:700;color:#0f172a;">Neue Nachricht im Chat</h1>
              </div>
              <div style="padding:28px 32px;">
                <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:20px;border-left:4px solid #67e8f9;">
                  <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Nachricht von</p>
                  <p style="margin:0;font-size:16px;font-weight:700;">${customerName}</p>
                  <p style="margin:4px 0 0;color:#64748b;font-size:13px;">Auftrag ${orderForNotify.orderNumber} – ${orderForNotify.title}</p>
                </div>
                <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;">
                  <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Nachricht</p>
                  <p style="margin:0;font-size:15px;line-height:1.7;color:#cbd5e1;">${message.trim().replace(/\n/g, "<br>")}</p>
                </div>
                <div style="text-align:center;">
                  <a href="${baseUrl}/admin/orders/${orderForNotify.id}" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#67e8f9);color:#0f172a;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
                    Chat öffnen &rarr;
                  </a>
                </div>
              </div>
              <div style="background:#020617;padding:16px 32px;text-align:center;">
                <p style="margin:0;color:#334155;font-size:12px;">Dukart Systems &bull; kontakt@dukartsystems.de</p>
              </div>
            </div>
          `,
        }).catch(console.error);
      }
    }
  }

  return NextResponse.json(msg);
}
