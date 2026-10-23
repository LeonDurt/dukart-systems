import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "E-Mail erforderlich." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Immer success zurückgeben (kein Hinweis ob E-Mail existiert)
  if (!user || !user.isActive) {
    return NextResponse.json({ success: true });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2h

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const host = req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const resetLink = `${proto}://${host}/reset-password?token=${rawToken}`;

  sendEmail({
    to: email,
    subject: "Passwort zurücksetzen – Dukart Systems",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 16px;">
        <h2 style="color: #67e8f9; margin-top: 0;">Passwort zurücksetzen</h2>
        <p>Hallo,</p>
        <p style="color: #94a3b8;">Du hast eine Passwortzurücksetzung angefordert. Klicke auf den Button, um dein Passwort zu ändern. Der Link ist <strong style="color: #e2e8f0;">2 Stunden</strong> gültig.</p>
        <a href="${resetLink}" style="display: inline-block; background: #67e8f9; color: #0f172a; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; margin: 24px 0; font-size: 16px;">
          Passwort zurücksetzen
        </a>
        <p style="color: #64748b; font-size: 13px;">Falls du das nicht angefordert hast, kannst du diese E-Mail ignorieren.</p>
        <hr style="border: 1px solid #1e293b; margin: 24px 0;" />
        <p style="color: #64748b; font-size: 12px;">Dukart Systems – kontakt@dukartsystems.de</p>
      </div>
    `,
  }).catch((err) => console.error("[EMAIL] Passwort-Reset fehlgeschlagen:", err));

  return NextResponse.json({ success: true });
}
