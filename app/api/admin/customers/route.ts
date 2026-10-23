import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR" && role !== "STAFF") {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const customers = await prisma.customer.findMany({
    include: {
      user: { select: { id: true, email: true, isActive: true, lastLoginAt: true } },
      orders: { select: { id: true, isCompleted: true, isArchived: true } },
      invitations: { select: { id: true, usedAt: true, expiresAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(customers);
}
