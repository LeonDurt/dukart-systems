// Geo Helfer für das Fangen Spiel. Läuft auf Server und Client, keine Abhängigkeiten.

export type LatLng = [number, number];

const EARTH_RADIUS = 6371000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Luftlinie in Metern (Haversine). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Ray Casting. Reicht für Zonen in Stadtgrösse völlig aus. */
export function pointInPolygon(p: LatLng, polygon: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    const crosses =
      yi > p[0] !== yj > p[0] &&
      p[1] < ((xj - xi) * (p[0] - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

/** Kürzester Abstand eines Punktes zum Rand des Polygons in Metern. */
export function distanceToPolygonEdge(p: LatLng, polygon: LatLng[]): number {
  if (polygon.length === 0) return Infinity;
  // Lokale flache Projektion rund um den Punkt, auf Zonen dieser Größe genau genug.
  const cos = Math.cos(toRad(p[0]));
  const project = (q: LatLng): [number, number] => [
    toRad(q[1] - p[1]) * cos * EARTH_RADIUS,
    toRad(q[0] - p[0]) * EARTH_RADIUS,
  ];
  let best = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const [ax, ay] = project(polygon[i]);
    const [bx, by] = project(polygon[(i + 1) % polygon.length]);
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
  }
  return best;
}

/** Puffer, damit ungenaues GPS am Zonenrand keinen Fehlalarm auslöst. */
export const ZONE_TOLERANCE_METERS = 20;

/**
 * Außerhalb gilt erst, wer deutlich draußen ist: weiter vom Rand entfernt
 * als die GPS Ungenauigkeit plus Puffer.
 */
export function isOutsideZone(p: LatLng, zone: LatLng[], accuracy = 0): boolean {
  if (zone.length < 3) return false;
  if (pointInPolygon(p, zone)) return false;
  const slack = Math.min(Math.max(accuracy, 0), 100) + ZONE_TOLERANCE_METERS;
  return distanceToPolygonEdge(p, zone) > slack;
}

export function nearestBox<T extends { lat: number; lng: number }>(
  p: LatLng,
  boxes: T[]
): { box: T; distance: number } | null {
  let best: { box: T; distance: number } | null = null;
  for (const box of boxes) {
    const distance = distanceMeters(p, [box.lat, box.lng]);
    if (!best || distance < best.distance) best = { box, distance };
  }
  return best;
}

/** Fläche in Quadratmetern (für die Anzeige in der Lobby). */
export function polygonAreaSqm(polygon: LatLng[]): number {
  if (polygon.length < 3) return 0;
  const lat0 = polygon.reduce((s, q) => s + q[0], 0) / polygon.length;
  const cos = Math.cos(toRad(lat0));
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const ax = toRad(a[1]) * cos * EARTH_RADIUS;
    const ay = toRad(a[0]) * EARTH_RADIUS;
    const bx = toRad(b[1]) * cos * EARTH_RADIUS;
    const by = toRad(b[0]) * EARTH_RADIUS;
    sum += ax * by - bx * ay;
  }
  return Math.abs(sum) / 2;
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return "?";
  if (meters < 1000) return `${Math.round(meters / 5) * 5} m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}
