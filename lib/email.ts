import { Resend } from "resend";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[EMAIL] Kein RESEND_API_KEY konfiguriert. E-Mail würde gesendet an:", to);
    console.log("[EMAIL] Betreff:", subject);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM || "Dukart Systems <noreply@dukart-systems.de>",
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`[EMAIL] Resend Fehler: ${error.message}`);
  }

  console.log(`[EMAIL] Gesendet an ${to} | ID: ${data?.id}`);
}

export function contactConfirmationEmail(data: { name: string; subject: string }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 16px;">
      <h2 style="color: #67e8f9; margin-top: 0;">Deine Anfrage ist angekommen!</h2>
      <p>Hallo ${data.name},</p>
      <p style="color: #94a3b8;">wir haben deine Anfrage zum Thema <strong style="color: #e2e8f0;">${data.subject}</strong> erhalten und melden uns so schnell wie möglich bei dir.</p>
      <p style="color: #94a3b8;">Du musst nichts weiter tun – wir kommen auf dich zu.</p>
      <hr style="border: 1px solid #1e293b; margin: 24px 0;" />
      <p style="color: #64748b; font-size: 12px;">Dukart Systems – kontakt@dukartsystems.de</p>
    </div>
  `;
}

export function newContactRequestEmail(data: {
  name: string;
  contact: string;
  subject: string;
  message: string;
  requestId: string;
  phone?: string;
  baseUrl?: string;
}) {
  const adminUrl = `${data.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/admin/requests`;
  const now = new Date().toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
    <div style="font-family: sans-serif; max-width: 620px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 16px; overflow: hidden;">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #67e8f9 100%); padding: 28px 32px;">
        <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #0f172a; opacity: 0.7;">Dukart Systems</p>
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #0f172a;">Neue Kundenanfrage eingegangen</h1>
        <p style="margin: 8px 0 0 0; font-size: 13px; color: #0f172a; opacity: 0.65;">${now} Uhr</p>
      </div>

      <!-- Body -->
      <div style="padding: 32px;">
        <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 15px;">
          Eine neue Anfrage ist über die Webseite eingegangen. Hier sind alle Details auf einen Blick:
        </p>

        <!-- Info-Karten -->
        <div style="background: #1e293b; border-radius: 12px; overflow: hidden; margin-bottom: 16px;">
          <div style="padding: 14px 20px; border-bottom: 1px solid #334155; display: flex;">
            <span style="color: #64748b; font-size: 13px; width: 120px; flex-shrink: 0;">Name</span>
            <span style="font-weight: 600; font-size: 15px;">${data.name}</span>
          </div>
          <div style="padding: 14px 20px; border-bottom: 1px solid #334155; display: flex;">
            <span style="color: #64748b; font-size: 13px; width: 120px; flex-shrink: 0;">E-Mail / Kontakt</span>
            <span style="font-size: 15px; color: #67e8f9;">${data.contact}</span>
          </div>
          ${data.phone ? `
          <div style="padding: 14px 20px; border-bottom: 1px solid #334155; display: flex;">
            <span style="color: #64748b; font-size: 13px; width: 120px; flex-shrink: 0;">Telefon</span>
            <span style="font-size: 15px;">${data.phone}</span>
          </div>` : ""}
          <div style="padding: 14px 20px;">
            <span style="color: #64748b; font-size: 13px; width: 120px; flex-shrink: 0;">Betreff</span>
            <span style="display: block; margin-top: 6px; font-weight: 600; font-size: 15px; color: #f1f5f9;">${data.subject}</span>
          </div>
        </div>

        <!-- Nachricht -->
        <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
          <p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Nachricht</p>
          <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #cbd5e1;">${data.message.replace(/\n/g, "<br>")}</p>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${adminUrl}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #67e8f9); color: #0f172a; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px;">
            Jetzt im Admin-Panel öffnen &rarr;
          </a>
        </div>

        <!-- Anfrage-ID -->
        <p style="text-align: center; color: #475569; font-size: 12px; margin: 0;">
          Anfrage-ID: <code style="background: #1e293b; padding: 2px 8px; border-radius: 6px; font-size: 11px;">${data.requestId}</code>
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #020617; padding: 20px 32px; text-align: center;">
        <p style="margin: 0; color: #334155; font-size: 12px;">
          Dukart Systems &bull; <a href="mailto:kontakt@dukartsystems.de" style="color: #475569; text-decoration: none;">kontakt@dukartsystems.de</a>
        </p>
      </div>
    </div>
  `;
}

export function customerApprovedEmail(data: {
  customerName: string;
  inviteLink: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 16px;">
      <h2 style="color: #67e8f9; margin-top: 0;">Willkommen bei Dukart Systems!</h2>
      <p>Hallo ${data.customerName},</p>
      <p style="color: #94a3b8;">Deine Anfrage wurde bearbeitet. Du kannst jetzt deinen Account einrichten und auf dein persönliches Kundenportal zugreifen.</p>
      <p style="color: #94a3b8;">Klicke auf den Button unten, um dein Passwort zu setzen und dich anzumelden. Der Link ist <strong style="color: #e2e8f0;">48 Stunden</strong> gültig.</p>
      <a href="${data.inviteLink}" style="display: inline-block; background: #67e8f9; color: #0f172a; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; margin: 24px 0; font-size: 16px;">
        Jetzt Account einrichten
      </a>
      <p style="color: #64748b; font-size: 13px;">Falls der Button nicht funktioniert, kopiere diesen Link: ${data.inviteLink}</p>
      <hr style="border: 1px solid #1e293b; margin: 24px 0;" />
      <p style="color: #64748b; font-size: 12px;">Dukart Systems – kontakt@dukartsystems.de</p>
    </div>
  `;
}

export function reviewRequestEmail(data: {
  customerName: string;
  orderTitle: string;
  reviewUrl: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 16px;">
      <h2 style="color: #67e8f9; margin-top: 0;">Wie war deine Erfahrung mit uns?</h2>
      <p>Hallo ${data.customerName},</p>
      <p style="color: #94a3b8;">
        dein Auftrag <strong style="color: #e2e8f0;">„${data.orderTitle}"</strong> wurde abgeschlossen.
        Wir hoffen, du bist mit dem Ergebnis zufrieden!
      </p>
      <p style="color: #94a3b8;">
        Falls du einen Moment Zeit hast, würden wir uns sehr über eine kurze Bewertung freuen –
        das hilft uns, noch besser zu werden und anderen Kunden bei ihrer Entscheidung.
      </p>
      <a href="${data.reviewUrl}" style="display: inline-block; background: #67e8f9; color: #0f172a; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; margin: 24px 0; font-size: 15px;">
        ⭐ Jetzt Bewertung abgeben
      </a>
      <p style="color: #64748b; font-size: 13px;">
        Es dauert nur eine Minute. Natürlich ist die Bewertung freiwillig.<br />
        Bei Fragen erreichst du uns unter <a href="mailto:kontakt@dukartsystems.de" style="color: #67e8f9;">kontakt@dukartsystems.de</a>
      </p>
      <hr style="border: 1px solid #1e293b; margin: 24px 0;" />
      <p style="color: #64748b; font-size: 12px;">Dukart Systems – kontakt@dukartsystems.de</p>
    </div>
  `;
}

export function orderStatusUpdateEmail(data: {
  customerName: string;
  orderTitle: string;
  orderNumber: string;
  newStatus: string;
  statusLabel: string;
  portalUrl: string;
  message?: string;
}) {
  const statusColors: Record<string, string> = {
    CONSULTATION: "#67e8f9",
    PARTS_SELECTION: "#a78bfa",
    AWAITING_CUSTOMER_CONFIRMATION: "#fb923c",
    PARTS_ORDERED: "#67e8f9",
    PARTS_ARRIVED: "#34d399",
    ASSEMBLY: "#a78bfa",
    WINDOWS_DRIVERS_TESTS: "#60a5fa",
    COMPLETED: "#34d399",
    PICKED_UP: "#34d399",
    DELIVERED: "#34d399",
    PAUSED: "#f87171",
  };
  const color = statusColors[data.newStatus] ?? "#67e8f9";

  return `
    <div style="font-family: sans-serif; max-width: 620px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 16px; overflow: hidden;">

      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #67e8f9 100%); padding: 28px 32px;">
        <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #0f172a; opacity: 0.7;">Dukart Systems</p>
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #0f172a;">Update zu deinem Auftrag</h1>
        <p style="margin: 8px 0 0 0; font-size: 13px; color: #0f172a; opacity: 0.65;">Auftrag ${data.orderNumber}</p>
      </div>

      <div style="padding: 32px;">
        <p style="margin: 0 0 24px 0; color: #94a3b8; font-size: 15px;">
          Hallo ${data.customerName},<br /><br />
          es gibt ein Update zu deinem Auftrag <strong style="color: #f1f5f9;">${data.orderTitle}</strong>.
        </p>

        <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid ${color};">
          <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Neuer Status</p>
          <p style="margin: 0; font-size: 20px; font-weight: 700; color: ${color};">${data.statusLabel}</p>
        </div>

        ${data.message ? `
        <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 10px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Nachricht</p>
          <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #cbd5e1;">${data.message.replace(/\n/g, "<br>")}</p>
        </div>` : ""}

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${data.portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #67e8f9); color: #0f172a; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px;">
            Auftrag im Portal ansehen &rarr;
          </a>
        </div>

        <p style="text-align: center; color: #475569; font-size: 12px; margin: 0;">
          Bei Fragen erreichst du uns unter <a href="mailto:kontakt@dukartsystems.de" style="color: #67e8f9;">kontakt@dukartsystems.de</a>
        </p>
      </div>

      <div style="background: #020617; padding: 20px 32px; text-align: center;">
        <p style="margin: 0; color: #334155; font-size: 12px;">
          Dukart Systems &bull; <a href="mailto:kontakt@dukartsystems.de" style="color: #475569; text-decoration: none;">kontakt@dukartsystems.de</a>
        </p>
      </div>
    </div>
  `;
}

export function maintenanceDueEmail(data: {
  customerName: string;
  contractTitle: string;
  dueDate: string;
  contactEmail: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 620px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 16px; overflow: hidden;">

      <div style="background: linear-gradient(135deg, #f59e0b 0%, #fcd34d 100%); padding: 28px 32px;">
        <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #0f172a; opacity: 0.7;">Dukart Systems</p>
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #0f172a;">Wartungstermin fällig</h1>
      </div>

      <div style="padding: 32px;">
        <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 15px;">
          Hallo ${data.customerName},<br /><br />
          dein Wartungsvertrag <strong style="color: #f1f5f9;">${data.contractTitle}</strong> ist fällig.
        </p>

        <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Fälligkeitsdatum</p>
          <p style="margin: 0; font-size: 20px; font-weight: 700; color: #fcd34d;">${data.dueDate}</p>
        </div>

        <p style="color: #94a3b8; font-size: 14px;">
          Melde dich gerne bei uns, um einen Termin zu vereinbaren.
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="mailto:${data.contactEmail}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #fcd34d); color: #0f172a; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px;">
            Jetzt Termin anfragen
          </a>
        </div>
      </div>

      <div style="background: #020617; padding: 20px 32px; text-align: center;">
        <p style="margin: 0; color: #334155; font-size: 12px;">
          Dukart Systems &bull; <a href="mailto:kontakt@dukartsystems.de" style="color: #475569; text-decoration: none;">kontakt@dukartsystems.de</a>
        </p>
      </div>
    </div>
  `;
}

export function invoiceEmail(data: {
  customerName: string;
  docLabel: string;
  docNumber: string;
  total: string;
  orderTitle: string;
  dueDate?: string;
  expiresAt?: string;
  invoiceUrl: string;
}) {
  const extraRow = data.dueDate
    ? `<tr><td style="color:#64748b;font-size:13px;padding-right:16px;">Fällig am:</td><td style="font-size:14px;color:#ef4444;font-weight:600;">${data.dueDate}</td></tr>`
    : data.expiresAt
    ? `<tr><td style="color:#64748b;font-size:13px;padding-right:16px;">Gültig bis:</td><td style="font-size:14px;font-weight:600;">${data.expiresAt}</td></tr>`
    : "";

  return `
    <div style="font-family:sans-serif;max-width:620px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#0ea5e9 0%,#67e8f9 100%);padding:28px 32px;">
        <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#0f172a;opacity:0.7;">Dukart Systems</p>
        <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f172a;">Dein ${data.docLabel} von Dukart Systems</h1>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 20px 0;color:#94a3b8;font-size:15px;">
          Hallo ${data.customerName},<br /><br />
          anbei findest du dein ${data.docLabel} für den Auftrag <strong style="color:#f1f5f9;">${data.orderTitle}</strong>.
        </p>
        <div style="background:#1e293b;border-radius:12px;overflow:hidden;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr style="border-bottom:1px solid #334155;">
              <td style="color:#64748b;font-size:13px;padding:12px 20px;padding-right:16px;">Dokument-Nr.</td>
              <td style="font-size:14px;padding:12px 20px;font-family:monospace;font-weight:600;">${data.docNumber}</td>
            </tr>
            <tr style="border-bottom:1px solid #334155;">
              <td style="color:#64748b;font-size:13px;padding:12px 20px;padding-right:16px;">Betrag</td>
              <td style="font-size:18px;padding:12px 20px;font-weight:700;color:#67e8f9;">${data.total} €</td>
            </tr>
            ${extraRow}
          </table>
        </div>
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${data.invoiceUrl}" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#67e8f9);color:#0f172a;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
            ${data.docLabel} öffnen &amp; drucken &rarr;
          </a>
        </div>
        <p style="color:#64748b;font-size:13px;text-align:center;">
          Bei Fragen erreichst du uns unter <a href="mailto:kontakt@dukartsystems.de" style="color:#67e8f9;">kontakt@dukartsystems.de</a>
        </p>
      </div>
      <div style="background:#020617;padding:20px 32px;text-align:center;">
        <p style="margin:0;color:#334155;font-size:12px;">
          Dukart Systems &bull; <a href="mailto:kontakt@dukartsystems.de" style="color:#475569;text-decoration:none;">kontakt@dukartsystems.de</a>
        </p>
      </div>
    </div>
  `;
}

export function customerRejectedEmail(data: { customerName: string }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 16px;">
      <h2 style="color: #67e8f9; margin-top: 0;">Update zu deiner Anfrage</h2>
      <p>Hallo ${data.customerName},</p>
      <p style="color: #94a3b8;">Vielen Dank für deine Anfrage bei Dukart Systems. Leider können wir deine Anfrage aktuell nicht bearbeiten.</p>
      <p style="color: #94a3b8;">Bei Fragen kannst du uns jederzeit erneut kontaktieren: <a href="mailto:kontakt@dukartsystems.de" style="color: #67e8f9;">kontakt@dukartsystems.de</a></p>
      <hr style="border: 1px solid #1e293b; margin: 24px 0;" />
      <p style="color: #64748b; font-size: 12px;">Dukart Systems – kontakt@dukartsystems.de</p>
    </div>
  `;
}
