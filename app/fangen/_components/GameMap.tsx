"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, Maximize2 } from "lucide-react";
import type { LatLng } from "@/lib/fangen/geo";
import type { Fix } from "./useGeolocation";
import { cx, formatAgo } from "./ui";

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  kind: "catcher" | "catcher-novest" | "signal";
  at: number;
};

export type MapBox = { label: string; lat: number; lng: number };

type Props = {
  zone: LatLng[];
  boxes: MapBox[];
  me: Fix | null;
  meKind: "runner" | "catcher" | "neutral";
  pins?: MapPin[];
  /** Index der Kiste, zu der der Spieler laufen soll. */
  targetBox?: number | null;
  now?: number;
  edit?: "zone" | "boxes" | null;
  onZoneChange?: (zone: LatLng[]) => void;
  onBoxesChange?: (boxes: MapBox[]) => void;
  maxBoxes?: number;
  maxZonePoints?: number;
  className?: string;
};

const GERMANY: LatLng = [51.16, 10.45];
// Einmal um die Welt: Außenkante für die Abdunklung außerhalb der Zone.
const WORLD: LatLng[] = [
  [-85, -180],
  [-85, 180],
  [85, 180],
  [85, -180],
];

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function icon(html: string, size: [number, number], anchor?: [number, number]) {
  return L.divIcon({
    className: "fg-marker",
    html,
    iconSize: size,
    iconAnchor: anchor ?? [size[0] / 2, size[1] / 2],
  });
}

export default function GameMap(props: Props) {
  const {
    zone,
    boxes,
    me,
    meKind,
    pins,
    targetBox = null,
    now = 0,
    edit = null,
    className,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{ zone: L.LayerGroup; boxes: L.LayerGroup; people: L.LayerGroup; me: L.LayerGroup } | null>(null);
  const didFitRef = useRef(false);
  // Klick Handler lesen immer den aktuellen Stand, ohne die Karte neu aufzubauen.
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });

  // Karte einmal aufbauen
  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, {
      center: GERMANY,
      zoom: 6,
      zoomControl: false,
      attributionControl: true,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    layersRef.current = {
      zone: L.layerGroup().addTo(map),
      boxes: L.layerGroup().addTo(map),
      people: L.layerGroup().addTo(map),
      me: L.layerGroup().addTo(map),
    };

    map.on("click", (e) => {
      const p = latest.current;
      const point: LatLng = [e.latlng.lat, e.latlng.lng];
      if (p.edit === "zone" && p.zone.length < (p.maxZonePoints ?? 40)) {
        p.onZoneChange?.([...p.zone, point]);
      } else if (p.edit === "boxes" && p.boxes.length < (p.maxBoxes ?? 6)) {
        p.onBoxesChange?.([
          ...p.boxes,
          { label: `Kiste ${p.boxes.length + 1}`, lat: point[0], lng: point[1] },
        ]);
      }
    });

    mapRef.current = map;
    // Der Container bekommt seine Höhe teils erst nach dem ersten Layout.
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layersRef.current = null;
      didFitRef.current = false;
    };
  }, []);

  // Erste Ausrichtung: auf die Zone, sonst auf den eigenen Standort
  useEffect(() => {
    const map = mapRef.current;
    if (!map || didFitRef.current) return;
    if (zone.length >= 3) {
      map.fitBounds(L.latLngBounds(zone), { padding: [24, 24] });
      didFitRef.current = true;
    } else if (me) {
      map.setView([me.lat, me.lng], 16);
      didFitRef.current = true;
    }
  }, [zone, me]);

  // Zone
  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;
    layers.zone.clearLayers();
    if (zone.length >= 3) {
      L.polygon([WORLD, zone], {
        stroke: false,
        fillColor: "#09090b",
        fillOpacity: 0.45,
        interactive: false,
      }).addTo(layers.zone);
    }
    if (zone.length >= 2) {
      const outline = zone.length >= 3 ? L.polygon(zone, { fill: false }) : L.polyline(zone);
      outline
        .setStyle({ color: "#09090b", weight: 4, dashArray: edit === "zone" ? "8 8" : undefined, interactive: false })
        .addTo(layers.zone);
    }
    if (edit === "zone") {
      zone.forEach((point, index) => {
        const marker = L.marker(point, {
          icon: icon('<div class="fg-vertex"></div>', [20, 20]),
          draggable: true,
          keyboard: false,
        });
        marker.on("dragend", () => {
          const { lat, lng } = marker.getLatLng();
          const next = latest.current.zone.slice();
          next[index] = [lat, lng];
          latest.current.onZoneChange?.(next);
        });
        marker.addTo(layers.zone);
      });
    }
  }, [zone, edit]);

  // Kisten und Laufweg zur Zielkiste
  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;
    layers.boxes.clearLayers();
    boxes.forEach((box, index) => {
      const isTarget = targetBox === index;
      const marker = L.marker([box.lat, box.lng], {
        icon: icon(`<div class="fg-box${isTarget ? " target" : ""}">${index + 1}</div>`, [34, 34]),
        draggable: edit === "boxes",
        keyboard: false,
        title: box.label,
        zIndexOffset: isTarget ? 500 : 0,
      });
      if (edit === "boxes") {
        // Antippen entfernt die Kiste, Ziehen verschiebt sie.
        marker.on("click", () => {
          const next = latest.current.boxes
            .filter((_, i) => i !== index)
            .map((b, i) => ({ ...b, label: `Kiste ${i + 1}` }));
          latest.current.onBoxesChange?.(next);
        });
        marker.on("dragend", () => {
          const { lat, lng } = marker.getLatLng();
          const next = latest.current.boxes.slice();
          next[index] = { ...next[index], lat, lng };
          latest.current.onBoxesChange?.(next);
        });
      }
      marker.addTo(layers.boxes);
    });
    const target = targetBox !== null ? boxes[targetBox] : null;
    if (target && me) {
      L.polyline(
        [
          [me.lat, me.lng],
          [target.lat, target.lng],
        ],
        { color: "#f97316", weight: 5, dashArray: "2 10", lineCap: "round", interactive: false }
      ).addTo(layers.boxes);
    }
  }, [boxes, edit, targetBox, me]);

  // Andere Spieler
  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;
    layers.people.clearLayers();
    for (const pin of pins ?? []) {
      const signal = pin.kind === "signal";
      const cls = signal ? "signal" : pin.kind === "catcher-novest" ? "catcher novest" : "catcher";
      const label = signal
        ? `${escapeHtml(pin.name)} · ${formatAgo(now - pin.at)}`
        : escapeHtml(pin.name);
      L.marker([pin.lat, pin.lng], {
        icon: icon(
          `<div class="fg-pin ${cls}"><div class="fg-pin-dot">${escapeHtml(pin.name.slice(0, 1).toUpperCase())}</div><div class="fg-pin-label">${label}</div></div>`,
          [30, 30],
          [15, 15]
        ),
        interactive: false,
        keyboard: false,
        zIndexOffset: signal ? 800 : 300,
      }).addTo(layers.people);
    }
  }, [pins, now]);

  // Ich
  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;
    layers.me.clearLayers();
    if (!me) return;
    if (me.accuracy > 15) {
      L.circle([me.lat, me.lng], {
        radius: Math.min(me.accuracy, 500),
        stroke: false,
        fillColor: "#2563eb",
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(layers.me);
    }
    L.marker([me.lat, me.lng], {
      icon: icon(`<div class="fg-me ${meKind}"></div>`, [22, 22]),
      interactive: false,
      keyboard: false,
      zIndexOffset: 1000,
    }).addTo(layers.me);
  }, [me, meKind]);

  const controlClass =
    "grid size-11 place-items-center rounded-xl border border-black/10 bg-white text-zinc-900 shadow-lg active:scale-95 disabled:opacity-40";

  return (
    <div className={cx("overflow-hidden", className)}>
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2">
        <button
          type="button"
          aria-label="Auf meinen Standort zentrieren"
          className={controlClass}
          disabled={!me}
          onClick={() => me && mapRef.current?.setView([me.lat, me.lng], Math.max(mapRef.current.getZoom(), 16))}
        >
          <Crosshair className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Ganze Zone zeigen"
          className={controlClass}
          disabled={zone.length < 3}
          onClick={() => mapRef.current?.fitBounds(L.latLngBounds(zone), { padding: [24, 24] })}
        >
          <Maximize2 className="size-5" />
        </button>
      </div>
    </div>
  );
}
