import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, maintenanceDueEmail } from "@/lib/email";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const role = session.user?.role;
  if (role !== "ADMIN" && role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const in14Days = new Date();
  in14Days.setDate(in14Days.getDate() + 14);

  // Fällige Verträge: nextServiceDate innerhalb der nächsten 14 Tage
  // und entweder noch kein Reminder gesendet oder letzter Reminder > 30 Tage her
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dueContracts = await prisma.maintenanceContract.findMany({
    where: {
      isActive: true,
      nextServiceDate: { lte: in14Days },
      OR: [
        { reminderSentAt: null },
        { reminderSentAt: { lte: thirtyDaysAgo } },
      ],
    },
    include: {
      customer: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  let sent = 0;
  const errors: string[] = [];

  for (const contract of dueContracts) {
    if (!contract.customer.email) continue;
    try {
      const dueDate = new Date(contract.nextServiceDate).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      await sendEmail({
        to: contract.customer.email,
        subject: `Wartungstermin fällig – ${contract.title}`,
        html: maintenanceDueEmail({
          customerName: contract.customer.firstName,
          contractTitle: contract.title,
          dueDate,
          contactEmail: "kontakt@dukartsystems.de",
        }),
      });
      await prisma.maintenanceContract.update({
        where: { id: contract.id },
        data: { reminderSentAt: new Date() },
      });
      sent++;
    } catch (err) {
      errors.push(`${contract.id}: ${String(err)}`);
    }
  }

  return NextResponse.json({ sent, errors, total: dueContracts.length });
}
