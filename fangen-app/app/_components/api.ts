// Kleiner Client für die Fangen API plus Speicher für das Geräte-Token.

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T = { ok: true }>(
  path: string,
  options: { method?: "GET" | "POST" | "PATCH"; token?: string | null; body?: unknown } = {}
): Promise<T> {
  const { method = "POST", token, body } = options;
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { "x-fangen-token": token } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Keine Verbindung. Hast du Netz?");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? "Da ist etwas schiefgelaufen.");
  return data as T;
}

/**
 * Zum Ausprobieren allein: Hängt man ?geraet=2 an die Adresse, verhält sich der Tab
 * wie ein eigenes Handy. So lassen sich mehrere Spieler in einem Browser testen.
 */
function scoped(key: string): string {
  try {
    const device = new URLSearchParams(window.location.search).get("geraet");
    return device ? `${key}@${device}` : key;
  } catch {
    return key;
  }
}

function read(rawKey: string): string | null {
  const key = scoped(rawKey);
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(rawKey: string, value: string | null) {
  const key = scoped(rawKey);
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Privater Modus oder voller Speicher: dann gilt das Token eben nur für diese Sitzung.
  }
}

export const store = {
  token: (code: string) => read(`fangen:token:${code}`),
  setToken: (code: string, token: string | null) => write(`fangen:token:${code}`, token),
  name: () => read("fangen:name") ?? "",
  setName: (name: string) => write("fangen:name", name),
  introSeen: () => read("fangen:intro") === "1",
  setIntroSeen: () => write("fangen:intro", "1"),
};
