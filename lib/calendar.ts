import { DAVClient } from "tsdav";

interface CalendarEvent {
  uid: string;
  title: string;
  start: Date;
  end?: Date;
  description?: string;
  allDay?: boolean;
}

interface CalendarUser {
  email: string;
  password: string;
  calendarUrl: string;
}

function getUsers(): CalendarUser[] {
  const users: CalendarUser[] = [];
  if (process.env.CALDAV_LEON_EMAIL && process.env.CALDAV_LEON_PASSWORD && process.env.CALDAV_LEON_CALENDAR_URL) {
    users.push({
      email: process.env.CALDAV_LEON_EMAIL,
      password: process.env.CALDAV_LEON_PASSWORD,
      calendarUrl: process.env.CALDAV_LEON_CALENDAR_URL,
    });
  }
  if (process.env.CALDAV_DAVID_EMAIL && process.env.CALDAV_DAVID_PASSWORD && process.env.CALDAV_DAVID_CALENDAR_URL) {
    users.push({
      email: process.env.CALDAV_DAVID_EMAIL,
      password: process.env.CALDAV_DAVID_PASSWORD,
      calendarUrl: process.env.CALDAV_DAVID_CALENDAR_URL,
    });
  }
  return users;
}

function buildICS(event: CalendarEvent): string {
  const now = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  const uid = `${event.uid}@dukartsystems.de`;

  const fmt = (d: Date, allDay: boolean) =>
    allDay ? d.toISOString().slice(0, 10).replace(/-/g, "") : d.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";

  const start = event.allDay ? `DTSTART;VALUE=DATE:${fmt(event.start, true)}` : `DTSTART:${fmt(event.start, false)}`;
  const endDate = event.end ?? new Date(event.start.getTime() + (event.allDay ? 86400000 : 3600000));
  const end = event.allDay ? `DTEND;VALUE=DATE:${fmt(endDate, true)}` : `DTEND:${fmt(endDate, false)}`;

  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0",
    "PRODID:-//Dukart Systems//Calendar//DE", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${now}`, start, end, `SUMMARY:${event.title}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${event.description.replace(/\r?\n/g, "\\n")}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

async function runForUser(user: CalendarUser, fn: (client: DAVClient) => Promise<unknown>) {
  try {
    const client = new DAVClient({
      serverUrl: "https://caldav.icloud.com",
      credentials: { username: user.email, password: user.password },
      authMethod: "Basic",
      defaultAccountType: "caldav",
    });
    await client.login();
    await fn(client);
  } catch (err) {
    console.error(`[Calendar] Fehler für ${user.email}:`, err);
  }
}

export async function createCalendarEvent(event: CalendarEvent): Promise<void> {
  const ics = buildICS(event);
  await Promise.allSettled(
    getUsers().map((user) =>
      runForUser(user, (client) =>
        client.createCalendarObject({
          calendar: { url: user.calendarUrl },
          filename: `${event.uid}.ics`,
          iCalString: ics,
        })
      )
    )
  );
}

export async function deleteCalendarEvent(uid: string): Promise<void> {
  await Promise.allSettled(
    getUsers().map((user) =>
      runForUser(user, async (client) => {
        const objects = await client.fetchCalendarObjects({ calendar: { url: user.calendarUrl } });
        const target = objects.find((o) => o.url.includes(uid));
        if (target) await client.deleteCalendarObject({ calendarObject: target });
      })
    )
  );
}

// ── Automatische Einträge ─────────────────────────────────────────────────────

export async function calendarOrderPartsArrived(order: {
  id: string; orderNumber: string; title: string; customerName: string;
}) {
  await createCalendarEvent({
    uid: `order-parts-arrived-${order.id}`,
    title: `📦 Teile angekommen: ${order.orderNumber} – ${order.customerName}`,
    start: new Date(),
    allDay: true,
    description: `Auftrag: ${order.title}\nTeile sind eingetroffen, Aufbau kann beginnen.`,
  });
}

export async function calendarOrderDeadline(order: {
  id: string; orderNumber: string; title: string; customerName: string;
  estimatedCompletionDate: Date;
}) {
  await Promise.all([
    deleteCalendarEvent(`order-deadline-${order.id}`),
    createCalendarEvent({
      uid: `order-deadline-${order.id}`,
      title: `⏰ Fertigstellung: ${order.orderNumber} – ${order.customerName}`,
      start: order.estimatedCompletionDate,
      allDay: true,
      description: `Auftrag: ${order.title}\nGeplante Fertigstellung`,
    }),
  ]);
}

export async function calendarOrderHandover(order: {
  id: string; orderNumber: string; title: string; customerName: string; type: "Abholung" | "Lieferung";
}) {
  await createCalendarEvent({
    uid: `order-handover-${order.id}`,
    title: `🚗 ${order.type}: ${order.orderNumber} – ${order.customerName}`,
    start: new Date(),
    allDay: true,
    description: `Auftrag: ${order.title}`,
  });
}

export async function calendarOrderCompleted(orderId: string) {
  await deleteCalendarEvent(`order-deadline-${orderId}`);
}

export async function calendarMaintenanceCreated(contract: {
  id: string; title: string; customerName: string; nextServiceDate: Date;
}) {
  await createCalendarEvent({
    uid: `maintenance-due-${contract.id}`,
    title: `🔩 Wartung fällig: ${contract.title} – ${contract.customerName}`,
    start: contract.nextServiceDate,
    allDay: true,
    description: `Wartungsvertrag: ${contract.title}\nKunde: ${contract.customerName}`,
  });
}

export async function calendarMaintenanceRescheduled(contract: {
  id: string; title: string; customerName: string; nextServiceDate: Date;
}) {
  await Promise.all([
    deleteCalendarEvent(`maintenance-due-${contract.id}`),
    createCalendarEvent({
      uid: `maintenance-due-${contract.id}`,
      title: `🔩 Wartung fällig: ${contract.title} – ${contract.customerName}`,
      start: contract.nextServiceDate,
      allDay: true,
      description: `Nächste Fälligkeit: ${contract.nextServiceDate.toLocaleDateString("de-DE")}`,
    }),
  ]);
}

// ── Manuelle Termine ──────────────────────────────────────────────────────────

export async function calendarAppointmentCreate(appt: {
  uid: string; title: string; date: Date; notes?: string; orderNumber: string; customerName: string;
}) {
  await createCalendarEvent({
    uid: appt.uid,
    title: `📅 ${appt.title} – ${appt.orderNumber} (${appt.customerName})`,
    start: appt.date,
    end: new Date(appt.date.getTime() + 3600000),
    description: appt.notes ?? "",
  });
}

export async function calendarAppointmentDelete(uid: string) {
  await deleteCalendarEvent(uid);
}
