import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { firstName, lastName, email, orderNumber, contractDescription } = body;

  if (!firstName || !lastName || !email || !contractDescription) {
    return NextResponse.json({ error: "Pflichtfelder fehlen." }, { status: 400 });
  }

  const entry = await prisma.widerrufRequest.create({
    data: { firstName, lastName, email, orderNumber: orderNumber || null, contractDescription },
  });

  const now = new Date().toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const customerHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:16px;">
      <h2 style="color:#67e8f9;margin-top:0;">Ihr Widerruf ist eingegangen</h2>
      <p>Wir bestätigen den Eingang Ihrer Widerrufserklärung vom <strong>${now} Uhr</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        <tr><td style="padding:8px 0;color:#94a3b8;width:160px;">Name</td><td style="padding:8px 0;">${firstName} ${lastName}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">E-Mail</td><td style="padding:8px 0;">${email}</td></tr>
        ${orderNumber ? `<tr><td style="padding:8px 0;color:#94a3b8;">Auftragsnummer</td><td style="padding:8px 0;">${orderNumber}</td></tr>` : ""}
        <tr><td style="padding:8px 0;color:#94a3b8;">Vertragsgegenstand</td><td style="padding:8px 0;">${contractDescription}</td></tr>
      </table>
      <p style="color:#94a3b8;font-size:0.9rem;">
        Gemäß § 355 BGB ist Ihr Widerruf wirksam zugegangen. Wir werden uns zeitnah bei Ihnen melden.<br/>
        Bei Fragen erreichen Sie uns unter <a href="mailto:kontakt@dukartsystems.de" style="color:#67e8f9;">kontakt@dukartsystems.de</a>.
      </p>
      <p style="color:#475569;font-size:0.8rem;margin-top:32px;">Dukart Systems · Im Sonneneck 12 · 68642 Bürstadt</p>
    </div>
  `;

  const adminHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:16px;">
      <h2 style="color:#f87171;margin-top:0;">Neuer Widerruf eingegangen</h2>
      <p>Eingegangen am: <strong>${now} Uhr</strong></p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        <tr><td style="padding:8px 0;color:#94a3b8;width:160px;">Name</td><td style="padding:8px 0;">${firstName} ${lastName}</td></tr>
        <tr><td style="padding:8px 0;color:#94a3b8;">E-Mail</td><td style="padding:8px 0;">${email}</td></tr>
        ${orderNumber ? `<tr><td style="padding:8px 0;color:#94a3b8;">Auftragsnummer</td><td style="padding:8px 0;">${orderNumber}</td></tr>` : ""}
        <tr><td style="padding:8px 0;color:#94a3b8;">Vertragsgegenstand</td><td style="padding:8px 0;">${contractDescription}</td></tr>
      </table>
    </div>
  `;

  try {
    await Promise.all([
      sendEmail({ to: email, subject: "Widerrufsbestätigung – Dukart Systems", html: customerHtml }),
      sendEmail({ to: process.env.ADMIN_EMAIL!, subject: `Widerruf von ${firstName} ${lastName}`, html: adminHtml }),
    ]);
    await prisma.widerrufRequest.update({ where: { id: entry.id }, data: { emailSentAt: new Date() } });
  } catch (e) {
    console.error("[WIDERRUF] E-Mail Fehler:", e);
  }

  return NextResponse.json({ success: true });
}
