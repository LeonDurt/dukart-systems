import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false, error: "Kein Token." }, { status: 400 });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash },
    include: { customer: true },
  });

  if (!invitation) {
    return NextResponse.json({ valid: false, error: "Ungültiger Link." }, { status: 404 });
  }

  if (invitation.usedAt) {
    return NextResponse.json({ valid: false, error: "Link bereits verwendet." }, { status: 400 });
  }

  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, error: "Link abgelaufen." }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    customer: {
      firstName: invitation.customer.firstName,
      lastName: invitation.customer.lastName,
      email: invitation.customer.email,
    },
  });
}
