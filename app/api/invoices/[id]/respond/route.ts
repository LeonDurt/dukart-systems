import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { id } = await params;
  const { decision } = await req.json();

  if (decision !== "ACCEPTED" && decision !== "REJECTED") {
    return NextResponse.json({ error: "Ungültige Entscheidung" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { order: { include: { customer: true } } },
  });

  if (!invoice) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  if (invoice.type !== "QUOTE") return NextResponse.json({ error: "Kein Angebot" }, { status: 400 });
  if (!invoice.isSentToCustomer) return NextResponse.json({ error: "Nicht freigegeben" }, { status: 403 });
  if (invoice.quoteStatus !== "OPEN") return NextResponse.json({ error: "Bereits beantwortet" }, { status: 409 });

  // Verify this customer owns the order
  const customer = await prisma.customer.findFirst({ where: { userId: session.user!.id } });
  if (!customer || invoice.order.customerId !== customer.id) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: { quoteStatus: decision },
  });

  // Notify admin
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const label = decision === "ACCEPTED" ? "angenommen" : "abgelehnt";
    const color = decision === "ACCEPTED" ? "#22c55e" : "#ef4444";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://portal.dukartsystems.de";
    sendEmail({
      to: adminEmail,
      subject: `Angebot ${invoice.number} wurde ${label} – ${customer.firstName} ${customer.lastName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#0ea5e9,#67e8f9);padding:24px 32px;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#0f172a;opacity:.7;">Dukart Systems</p>
            <h1 style="margin:0;font-size:20px;font-weight:700;color:#0f172a;">Angebot ${label}</h1>
          </div>
          <div style="padding:28px 32px;">
            <div style="background:#1e293b;border-radius:12px;padding:20px;border-left:4px solid ${color};margin-bottom:20px;">
              <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Status</p>
              <p style="margin:0;font-size:20px;font-weight:700;color:${color};">${decision === "ACCEPTED" ? "✓ Angenommen" : "✗ Abgelehnt"}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;background:#1e293b;border-radius:12px;overflow:hidden;">
              <tr style="border-bottom:1px solid #334155;">
                <td style="padding:12px 16px;color:#64748b;font-size:13px;">Kunde</td>
                <td style="padding:12px 16px;font-weight:600;">${customer.firstName} ${customer.lastName}</td>
              </tr>
              <tr style="border-bottom:1px solid #334155;">
                <td style="padding:12px 16px;color:#64748b;font-size:13px;">Angebot-Nr.</td>
                <td style="padding:12px 16px;font-family:monospace;font-weight:600;">${invoice.number}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;color:#64748b;font-size:13px;">Auftrag</td>
                <td style="padding:12px 16px;">${invoice.order.title}</td>
              </tr>
            </table>
            <div style="text-align:center;margin-top:24px;">
              <a href="${baseUrl}/admin/orders/${invoice.orderId}" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#67e8f9);color:#0f172a;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
                Auftrag im Admin-Panel &rarr;
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

  return NextResponse.json(updated);
}
