import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// GET: Alle Bewertungen (nur für Admin/Supervisor) oder nur freigegebene (public)
export async function GET(req: NextRequest) {
  const isAdmin = req.nextUrl.searchParams.get("admin") === "1";

  if (isAdmin) {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session || (role !== "ADMIN" && role !== "SUPERVISOR")) {
      return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
    }
    const reviews = await prisma.review.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(reviews);
  }

  // Nur freigegebene für die öffentliche Webseite
  const reviews = await prisma.review.findMany({
    where: { isApproved: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, rating: true, text: true, createdAt: true },
  });
  return NextResponse.json(reviews);
}

// POST: Neue Bewertung einreichen (öffentlich)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, rating, text } = body;

    if (!name || !text || !rating) {
      return NextResponse.json({ error: "Pflichtfelder fehlen." }, { status: 400 });
    }

    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return NextResponse.json({ error: "Ungültige Bewertung." }, { status: 400 });
    }

    await prisma.review.create({
      data: { name, email: email || null, rating: r, text },
    });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const stars = "★".repeat(r) + "☆".repeat(5 - r);
      sendEmail({
        to: adminEmail,
        subject: `Neue Bewertung von ${name} (${r}/5 Sterne)`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:16px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#f59e0b,#fcd34d);padding:24px 32px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#0f172a;opacity:.7;">Dukart Systems</p>
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#0f172a;">Neue Bewertung eingegangen</h1>
            </div>
            <div style="padding:28px 32px;">
              <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:20px;">
                <p style="margin:0 0 8px;font-size:22px;color:#fbbf24;letter-spacing:2px;">${stars}</p>
                <p style="margin:0 0 4px;font-size:18px;font-weight:700;">${r} von 5 Sternen</p>
                <p style="margin:8px 0 0;color:#64748b;font-size:13px;">von <strong style="color:#e2e8f0;">${name}</strong>${email ? ` &lt;${email}&gt;` : ""}</p>
              </div>
              <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;">
                <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Bewertungstext</p>
                <p style="margin:0;font-size:15px;line-height:1.7;color:#cbd5e1;">${text.replace(/\n/g, "<br>")}</p>
              </div>
              <p style="color:#64748b;font-size:13px;text-align:center;">Die Bewertung muss noch freigegeben werden, bevor sie auf der Webseite erscheint.</p>
            </div>
            <div style="background:#020617;padding:16px 32px;text-align:center;">
              <p style="margin:0;color:#334155;font-size:12px;">Dukart Systems &bull; kontakt@dukartsystems.de</p>
            </div>
          </div>
        `,
      }).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Interner Fehler." }, { status: 500 });
  }
}
