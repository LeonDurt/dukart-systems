import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, invoiceEmail } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR" && role !== "STAFF") {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { order: { include: { customer: true } } },
  });
  if (!invoice) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  const customer = invoice.order.customer;
  const isInvoice = invoice.type === "INVOICE";
  const docLabel = isInvoice ? "Rechnung" : "Angebot";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://portal.dukartsystems.de";

  if (customer.email) {
    try {
      await sendEmail({
        to: customer.email,
        subject: `Dein ${docLabel} von Dukart Systems – ${invoice.number}`,
        html: invoiceEmail({
          customerName: `${customer.firstName} ${customer.lastName}`,
          docLabel,
          docNumber: invoice.number,
          total: Number(invoice.total).toFixed(2),
          orderTitle: invoice.order.title,
          dueDate: isInvoice && invoice.dueDate
            ? new Date(invoice.dueDate).toLocaleDateString("de-DE")
            : undefined,
          expiresAt: !isInvoice && invoice.expiresAt
            ? new Date(invoice.expiresAt).toLocaleDateString("de-DE")
            : undefined,
          invoiceUrl: `${baseUrl}/invoice/${id}`,
        }),
      });
    } catch (err) {
      console.error("[INVOICE SEND] E-Mail fehlgeschlagen:", err);
    }
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: { isSentToCustomer: true, sentAt: new Date() },
  });

  return NextResponse.json(updated);
}
